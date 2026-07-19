<template>
  <div>
    <CatalogList
      title="Lotes"
      overline="Catálogo de la finca"
      subtitle="Grupos de manejo para agrupar tu hato (Escotero, Paridas, Levante…)."
      new-label="Nuevo lote"
      icon="mdi-select-group"
      :items="lots"
      :loading="loading"
      empty-title="Aún no hay lotes"
      empty-text="Crea los lotes con los que organizas tu finca para asignarlos a los animales."
      @new="$refs.lotFormDialog.open()"
      @edit="$refs.lotFormDialog.open($event)"
      @delete="askDelete"
    />

    <LotFormDialog ref="lotFormDialog" @saved="onSaved" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar lote?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ itemToDelete && itemToDelete.name }}</strong> del catálogo. Los
          animales que lo tengan asignado quedarán sin lote.
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
import LotFormDialog from '@/modules/configuration/components/LotFormDialog.vue'

export default {
  name: 'LotListPage',
  components: { CatalogList, LotFormDialog },
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
    ...mapGetters('configuration', { lots: 'allLots' }),
  },
  created() {
    this.load()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async load() {
      this.loading = true
      try {
        await this.fetchState({ module: 'configuration', nameState: 'lots', url: '/configuration/lots/' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los lotes'), 'error')
      } finally {
        this.loading = false
      }
    },
    askDelete(lot) {
      this.itemToDelete = lot
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'configuration',
          nameState: 'lots',
          url: `/configuration/lots/${this.itemToDelete.id}/`,
          value: this.itemToDelete.id,
        })
        this.notify('Lote eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el lote'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Lote actualizado' : 'Lote creado')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
