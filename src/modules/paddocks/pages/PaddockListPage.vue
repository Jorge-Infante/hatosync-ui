<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">El mapa de tu finca</p>
        <h1 class="text-h5 font-weight-bold">Potreros</h1>
        <p class="text-body-2 text-medium-emphasis">
          Dibuja los potreros, mueve los lotes entre ellos y controla ocupación y descanso.
        </p>
      </div>
      <v-btn
        v-if="isFarmAdmin"
        color="primary"
        prepend-icon="mdi-shape-polygon-plus"
        :to="{ name: 'paddock-new' }"
      >
        Nuevo potrero
      </v-btn>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="list-item-avatar@4" class="border rounded-xl rise rise-d1" />

    <!-- Empty -->
    <v-card v-else-if="paddocks.length === 0" class="pa-10 text-center rise rise-d1">
      <v-icon size="56" color="primary" class="mb-3">mdi-map-outline</v-icon>
      <h2 class="text-h6 font-weight-bold mb-1">Aún no hay potreros</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Busca tu finca en el mapa, dibuja el primer potrero y guárdalo con su nombre y medidas.
      </p>
      <v-btn v-if="isFarmAdmin" color="primary" prepend-icon="mdi-shape-polygon-plus" :to="{ name: 'paddock-new' }">
        Nuevo potrero
      </v-btn>
    </v-card>

    <!-- List -->
    <v-card v-else class="rise rise-d1">
      <v-list class="py-1">
        <template v-for="(paddock, index) in paddocks" :key="paddock.id">
          <v-divider v-if="index > 0" class="mx-4" />
          <v-list-item class="hs-paddock-row px-4 py-2" @click="openHistory(paddock)">
            <template #prepend>
              <div class="mr-3 rounded-lg border pa-1 bg-surface">
                <PaddockThumb :geometry="paddock.geometry" :color="paddock.color" />
              </div>
            </template>

            <v-list-item-title class="font-weight-medium">{{ paddock.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ rotationLine(paddock) }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center ga-2">
                <v-chip
                  size="small"
                  :color="statusColor(paddock)"
                  variant="tonal"
                  :prepend-icon="statusIcon(paddock)"
                >
                  {{ statusLabel(paddock) }}
                </v-chip>
                <v-chip size="small" variant="tonal" prepend-icon="mdi-texture-box" class="d-none d-sm-flex">
                  {{ formatArea(paddock) }}
                </v-chip>
                <template v-if="paddock.rotation">
                  <v-chip
                    v-if="paddock.rotation.avg_occupation_days !== null"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-cow"
                    class="d-none d-md-flex"
                    title="Promedio de días de ocupación"
                  >
                    ⌀ {{ paddock.rotation.avg_occupation_days }} d
                  </v-chip>
                  <v-chip
                    v-if="paddock.rotation.avg_rest_days !== null"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-sprout-outline"
                    class="d-none d-md-flex"
                    title="Promedio de días de descanso"
                  >
                    ⌀ {{ paddock.rotation.avg_rest_days }} d
                  </v-chip>
                </template>

                <v-menu v-if="!isPartner" location="bottom end" :offset="6">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" @click.stop />
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item
                      prepend-icon="mdi-cow"
                      title="Meter / mover lote aquí"
                      @click="$refs.assignDialog.open(paddock)"
                    />
                    <v-list-item
                      v-for="lot in currentLots(paddock)"
                      :key="lot.stay_id"
                      prepend-icon="mdi-exit-run"
                      :title="`Sacar ${lot.name}`"
                      @click="closeStay(paddock, lot)"
                    />
                    <v-list-item
                      prepend-icon="mdi-history"
                      title="Historial de rotación"
                      @click="openHistory(paddock)"
                    />
                    <template v-if="isFarmAdmin">
                      <v-divider class="my-1" />
                      <v-list-item prepend-icon="mdi-pencil-outline" title="Editar en el mapa" @click="edit(paddock)" />
                      <v-list-item
                        prepend-icon="mdi-delete-outline"
                        title="Eliminar"
                        base-color="error"
                        @click="askDelete(paddock)"
                      />
                    </template>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <AssignLotDialog ref="assignDialog" @saved="onRotationChanged('Entrada registrada')" @error="notifyError" />
    <RotationHistoryDialog
      ref="historyDialog"
      :can-manage="!isPartner"
      @changed="onRotationChanged('Registro eliminado')"
      @error="notifyError"
    />

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar potrero?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ itemToDelete && itemToDelete.name }}</strong> del mapa de la finca.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import apiClient from '@/api/client'
import { getErrorMessage } from '@/api/errors'
import PaddockThumb from '@/modules/paddocks/components/PaddockThumb.vue'
import AssignLotDialog from '@/modules/paddocks/components/AssignLotDialog.vue'
import RotationHistoryDialog from '@/modules/paddocks/components/RotationHistoryDialog.vue'

export default {
  name: 'PaddockListPage',
  components: { PaddockThumb, AssignLotDialog, RotationHistoryDialog },
  data() {
    return {
      loading: false,
      deleteDialog: false,
      deleting: false,
      itemToDelete: null,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('auth', ['isFarmAdmin', 'isPartner']),
    ...mapGetters('paddocks', { paddocks: 'allPaddocks' }),
  },
  created() {
    this.load()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async load() {
      this.loading = true
      try {
        await this.fetchState({ module: 'paddocks', nameState: 'paddocks', url: '/farms/paddocks/' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los potreros'), 'error')
      } finally {
        this.loading = false
      }
    },
    // --- rotación ---
    currentLots(paddock) {
      return (paddock.rotation && paddock.rotation.current_lots) || []
    },
    statusLabel(paddock) {
      const rotation = paddock.rotation
      if (!rotation) return ''
      if (rotation.days_in_status === null) return rotation.status_display
      return `${rotation.status_display} · ${rotation.days_in_status} d`
    },
    statusColor(paddock) {
      const status = paddock.rotation && paddock.rotation.status
      return { OCCUPIED: 'primary', RESTING: 'accent', NEVER_USED: 'secondary' }[status]
    },
    statusIcon(paddock) {
      const status = paddock.rotation && paddock.rotation.status
      return { OCCUPIED: 'mdi-cow', RESTING: 'mdi-sprout-outline', NEVER_USED: 'mdi-circle-outline' }[status]
    },
    rotationLine(paddock) {
      const rotation = paddock.rotation
      if (!rotation) return ''
      if (rotation.status === 'OCCUPIED') {
        const lots = rotation.current_lots.map((l) => `${l.name} (${l.days} d)`).join(', ')
        return `Dentro: ${lots}`
      }
      if (rotation.status === 'RESTING') {
        return `Último lote: ${rotation.last_lot_name} · ${rotation.stays_count} estadías`
      }
      return 'Sin movimientos de lotes todavía'
    },
    async closeStay(paddock, lot) {
      try {
        await apiClient.post(`/farms/paddock-stays/${lot.stay_id}/close/`, {})
        this.onRotationChanged(`${lot.name} salió de ${paddock.name}`)
      } catch (e) {
        this.notifyError(getErrorMessage(e, 'No se pudo sacar el lote'))
      }
    },
    openHistory(paddock) {
      this.$refs.historyDialog.open(paddock)
    },
    onRotationChanged(message) {
      this.notify(message)
      // Recarga para refrescar `rotation` (estado y promedios derivados en el server).
      this.load()
    },
    // --- formato ---
    formatArea(paddock) {
      const ha = paddock.area_ha || 0
      if (ha >= 1) return `${ha.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ha`
      return `${Math.round(paddock.area_m2 || 0).toLocaleString('es-CO')} m²`
    },
    // --- CRUD potrero ---
    edit(paddock) {
      this.$router.push({ name: 'paddock-edit', params: { id: paddock.id } })
    },
    askDelete(paddock) {
      this.itemToDelete = paddock
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'paddocks',
          nameState: 'paddocks',
          url: `/farms/paddocks/${this.itemToDelete.id}/`,
          value: this.itemToDelete.id,
        })
        this.notify('Potrero eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el potrero'), 'error')
      } finally {
        this.deleting = false
      }
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
    notifyError(text) {
      this.notify(text, 'error')
    },
  },
}
</script>

<style scoped>
.hs-paddock-row {
  transition: background-color 0.18s ease;
}
.hs-paddock-row:hover {
  background: rgba(46, 125, 50, 0.05);
}
</style>
