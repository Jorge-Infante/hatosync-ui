<template>
  <div>
    <CatalogList
      title="Medicamentos"
      overline="Catálogo de la finca"
      subtitle="Los productos disponibles al armar protocolos y tratamientos."
      new-label="Nuevo medicamento"
      icon="mdi-pill"
      :items="medications"
      :loading="loading"
      empty-title="Aún no hay medicamentos"
      empty-text="Registra los productos que maneja tu finca para usarlos en protocolos y tratamientos."
      @new="$refs.medicationFormDialog.open()"
      @edit="$refs.medicationFormDialog.open($event)"
      @delete="askDelete"
    >
      <template #meta="{ item }">
        <v-chip size="small" color="secondary" variant="tonal">
          {{ item.unit_display || item.unit }}<template v-if="item.concentration"> · {{ item.concentration }}</template>
        </v-chip>
      </template>
    </CatalogList>

    <MedicationFormDialog ref="medicationFormDialog" @saved="onSaved" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar medicamento?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ itemToDelete && itemToDelete.name }}</strong> del catálogo. Los
          protocolos y tratamientos que ya lo usen no se modifican.
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
import MedicationFormDialog from '@/modules/configuration/components/MedicationFormDialog.vue'

export default {
  name: 'MedicationListPage',
  components: { CatalogList, MedicationFormDialog },
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
    ...mapGetters('configuration', { medications: 'allMedications' }),
  },
  created() {
    this.load()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async load() {
      this.loading = true
      try {
        await this.fetchState({ module: 'configuration', nameState: 'medications', url: '/configuration/medications/' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los medicamentos'), 'error')
      } finally {
        this.loading = false
      }
    },
    askDelete(med) {
      this.itemToDelete = med
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'configuration',
          nameState: 'medications',
          url: `/configuration/medications/${this.itemToDelete.id}/`,
          value: this.itemToDelete.id,
        })
        this.notify('Medicamento eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el medicamento'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Medicamento actualizado' : 'Medicamento creado')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
