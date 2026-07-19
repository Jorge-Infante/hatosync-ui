<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">Trabajo masivo</p>
        <h1 class="text-h5 font-weight-bold">Jornadas</h1>
        <p class="text-body-2 text-medium-emphasis">
          Registra en serie lo que haces con muchos animales a la vez.
        </p>
      </div>
    </div>

    <!-- Acciones -->
    <v-row v-if="!isPartner" dense class="rise rise-d1 mb-4">
      <v-col cols="12" sm="6">
        <v-card class="jornada-card pa-4" @click="$router.push({ name: 'health-weighing' })">
          <div class="d-flex align-center ga-3">
            <v-avatar size="46" color="primary" variant="tonal"><v-icon>mdi-scale</v-icon></v-avatar>
            <div class="flex-grow-1">
              <p class="font-weight-medium mb-0">Jornada de pesaje</p>
              <p class="text-caption text-medium-emphasis mb-0">Animal + kg, en serie</p>
            </div>
            <v-icon class="text-medium-emphasis">mdi-chevron-right</v-icon>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card class="jornada-card pa-4" @click="$router.push({ name: 'health-batch' })">
          <div class="d-flex align-center ga-3">
            <v-avatar size="46" color="secondary" variant="tonal"><v-icon>mdi-needle</v-icon></v-avatar>
            <div class="flex-grow-1">
              <p class="font-weight-medium mb-0">Jornada de protocolo</p>
              <p class="text-caption text-medium-emphasis mb-0">IATF, desparasitación…</p>
            </div>
            <v-icon class="text-medium-emphasis">mdi-chevron-right</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Programados -->
    <div class="d-flex align-center mb-3 rise rise-d2">
      <p class="hs-overline mb-0">Programados</p>
      <v-spacer />
      <v-btn v-if="!isPartner" size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="$refs.scheduleDialog.open()">
        Nuevo
      </v-btn>
    </div>

    <v-skeleton-loader v-if="loading && !schedules.length" type="list-item-avatar@3" class="border rounded-xl rise rise-d2" />

    <v-card v-else-if="!schedules.length" class="pa-8 text-center rise rise-d2">
      <v-icon size="48" color="primary" class="mb-2">mdi-calendar-sync</v-icon>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Sin programados. Crea uno (ej. desparasitación cada 90 días) y la app avisará cuando toque.
      </p>
    </v-card>

    <v-card v-else class="rise rise-d2">
      <v-list class="py-1">
        <template v-for="(item, index) in schedules" :key="item.id">
          <v-divider v-if="index > 0" class="mx-4" />
          <v-list-item class="px-4 py-3">
            <template #prepend>
              <v-avatar size="42" :color="isDue(item) ? 'error' : 'primary'" variant="tonal" class="mr-3">
                <v-icon size="20">mdi-calendar-sync</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium d-flex align-center flex-wrap ga-2">
              {{ item.protocol_name }}
              <v-chip v-if="isDue(item)" size="x-small" color="error" variant="flat">
                {{ daysLate(item) > 0 ? `Vencido hace ${daysLate(item)} día(s)` : 'Vence HOY' }}
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="mt-1">
              {{ item.lot_name || `${(item.animals || []).length} animales fijos` }} · cada {{ item.every_days }} días
              <template v-if="!isDue(item)"> · próxima: {{ formatDate(item.next_due) }}</template>
            </v-list-item-subtitle>

            <template #append>
              <div v-if="!isPartner" class="d-flex align-center ga-1">
                <v-btn
                  v-if="isDue(item)"
                  size="small"
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-play"
                  @click="execute(item)"
                >
                  Ejecutar
                </v-btn>
                <v-menu v-else location="bottom end" :offset="6">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item prepend-icon="mdi-play" title="Ejecutar ahora" @click="execute(item)" />
                    <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" @click="$refs.scheduleDialog.open(item)" />
                    <v-list-item prepend-icon="mdi-delete-outline" title="Eliminar" base-color="error" @click="askDelete(item)" />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <ScheduleFormDialog ref="scheduleDialog" @saved="onSaved" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar programado?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ toDelete && toDelete.protocol_name }}</strong>. Las jornadas ya
          ejecutadas no se modifican.
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
import { getErrorMessage } from '@/api/errors'
import ScheduleFormDialog from '@/modules/health/components/ScheduleFormDialog.vue'

export default {
  name: 'JornadasPage',
  components: { ScheduleFormDialog },
  data() {
    return {
      loading: false,
      deleteDialog: false,
      deleting: false,
      toDelete: null,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('auth', ['isPartner']),
    ...mapGetters('health', { schedules: 'allSchedules' }),
    today() {
      return new Date().toISOString().slice(0, 10)
    },
  },
  created() {
    this.load()
  },
  methods: {
    ...mapActions('health', ['fetchSchedules', 'fetchProtocols']),
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async load() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchSchedules(),
          this.fetchProtocols().catch(() => {}),
          this.fetchState({ module: 'configuration', nameState: 'lots', url: '/configuration/lots/' }).catch(() => {}),
        ])
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los programados'), 'error')
      } finally {
        this.loading = false
      }
    },
    isDue(item) {
      return String(item.next_due) <= this.today
    },
    daysLate(item) {
      return Math.round(
        (new Date(`${this.today}T00:00:00`) - new Date(`${item.next_due}T00:00:00`)) / 86400000
      )
    },
    execute(item) {
      this.$router.push({ name: 'health-batch', query: { schedule: item.id } })
    },
    askDelete(item) {
      this.toDelete = item
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'health',
          nameState: 'schedules',
          url: `/health/schedules/${this.toDelete.id}/`,
          value: this.toDelete.id,
        })
        this.notify('Programado eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Programado actualizado' : 'Programado creado')
    },
    formatDate(date) {
      if (!date) return '—'
      return new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>

<style scoped>
.jornada-card {
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}
.jornada-card:hover {
  border-color: rgba(46, 125, 50, 0.5);
  background: rgba(46, 125, 50, 0.04);
}
</style>
