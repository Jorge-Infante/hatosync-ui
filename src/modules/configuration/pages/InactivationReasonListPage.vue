<template>
  <div>
    <CatalogList
      title="Motivos de inactivación"
      overline="Catálogo de la finca"
      subtitle="Las causas de salida del hato: muerte, venta, regalo… Se piden al inactivar un animal."
      new-label="Nuevo motivo"
      icon="mdi-logout-variant"
      :items="reasons"
      :loading="loading"
      empty-title="Aún no hay motivos"
      empty-text="Crea los motivos de salida (muerte, venta, regalo…) para poder inactivar animales con su causa y fecha."
      @new="$refs.reasonFormDialog.open()"
      @edit="$refs.reasonFormDialog.open($event)"
      @delete="askDelete"
    />

    <InactivationReasonFormDialog ref="reasonFormDialog" @saved="onSaved" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar motivo?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ itemToDelete && itemToDelete.name }}</strong> del catálogo. Las
          salidas ya registradas con este motivo no se modifican.
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
import CatalogList from '@/modules/configuration/components/CatalogList.vue'
import InactivationReasonFormDialog from '@/modules/configuration/components/InactivationReasonFormDialog.vue'

export default {
  name: 'InactivationReasonListPage',
  components: { CatalogList, InactivationReasonFormDialog },
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
    ...mapGetters('configuration', { reasons: 'allInactivationReasons' }),
  },
  created() {
    this.loadReasons()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async loadReasons() {
      this.loading = true
      try {
        await this.fetchState({
          module: 'configuration',
          nameState: 'inactivationReasons',
          url: '/configuration/inactivation-reasons/',
        })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los motivos'), 'error')
      } finally {
        this.loading = false
      }
    },
    askDelete(reason) {
      this.itemToDelete = reason
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'configuration',
          nameState: 'inactivationReasons',
          url: `/configuration/inactivation-reasons/${this.itemToDelete.id}/`,
          value: this.itemToDelete.id,
        })
        this.notify('Motivo eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el motivo'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Motivo actualizado' : 'Motivo creado')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
