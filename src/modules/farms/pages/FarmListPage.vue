<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Mis fincas</h1>
        <p class="text-body-2 text-medium-emphasis">Administra tus fincas y sus miembros.</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$refs.farmFormDialog.open()">
        Nueva finca
      </v-btn>
    </div>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col v-for="n in 3" :key="n" cols="12" sm="6" lg="4">
        <v-skeleton-loader type="list-item-avatar-two-line, actions" class="border rounded-xl" />
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-card v-else-if="farms.length === 0" class="pa-10 text-center">
      <v-icon size="56" color="primary" class="mb-3">mdi-barn</v-icon>
      <h2 class="text-h6 font-weight-bold mb-1">Aún no tienes fincas</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">Crea tu primera finca para empezar a gestionar tu hato.</p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$refs.farmFormDialog.open()">Nueva finca</v-btn>
    </v-card>

    <!-- Farm cards -->
    <v-row v-else>
      <v-col v-for="farm in farms" :key="farm.id" cols="12" sm="6" lg="4">
        <v-card>
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon>mdi-barn</v-icon>
              </v-avatar>
            </template>
            <v-card-title>{{ farm.name }}</v-card-title>
            <v-card-subtitle>{{ farmLocation(farm) }}</v-card-subtitle>
            <template #append>
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                </template>
                <v-list density="compact" nav>
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" @click="$refs.farmFormDialog.open(farm)" />
                  <v-list-item prepend-icon="mdi-delete-outline" title="Eliminar" base-color="error" @click="askDelete(farm)" />
                </v-list>
              </v-menu>
            </template>
          </v-card-item>
          <v-card-text class="d-flex align-center ga-2">
            <v-chip size="small" color="primary" prepend-icon="mdi-account-group-outline">
              {{ farm.members_count }} miembros
            </v-chip>
            <v-chip v-if="farm.id === activeFarmId" size="small" color="success" prepend-icon="mdi-check-circle-outline">
              Activa
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <FarmFormDialog ref="farmFormDialog" @saved="onSaved" />

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar finca?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ farmToDelete && farmToDelete.name }}</strong> y dejarás de ver sus datos. Esta acción no se puede deshacer.
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
import FarmFormDialog from '@/modules/farms/components/FarmFormDialog.vue'

export default {
  name: 'FarmListPage',
  components: { FarmFormDialog },
  data() {
    return {
      loading: false,
      deleteDialog: false,
      deleting: false,
      farmToDelete: null,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('farms', { farms: 'allFarms' }),
    ...mapGetters('auth', ['activeFarmId']),
  },
  created() {
    this.loadFarms()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async loadFarms() {
      this.loading = true
      try {
        await this.fetchState({ module: 'farms', nameState: 'farms', url: '/farms/' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar las fincas'), 'error')
      } finally {
        this.loading = false
      }
    },
    farmLocation(farm) {
      return [farm.city, farm.department].filter(Boolean).join(', ') || 'Sin ubicación'
    },
    askDelete(farm) {
      this.farmToDelete = farm
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'farms',
          nameState: 'farms',
          url: `/farms/${this.farmToDelete.id}/`,
          value: this.farmToDelete.id,
        })
        this.notify('Finca eliminada')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar la finca'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Finca actualizada' : 'Finca creada')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
