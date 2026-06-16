<template>
  <div>
    <CatalogList
      title="Tipos de identificación"
      overline="Catálogo de la finca"
      subtitle="Cómo identificas a tus animales: chapeta, hierro, tatuaje…"
      new-label="Nuevo tipo"
      icon="mdi-tag-multiple-outline"
      :items="identificationTypes"
      :loading="loading"
      empty-title="Aún no hay tipos de identificación"
      empty-text="Define los identificadores que usa tu finca para etiquetar a los animales."
      @new="$refs.typeFormDialog.open()"
      @edit="$refs.typeFormDialog.open($event)"
      @delete="askDelete"
    >
      <template #meta="{ item }">
        <v-chip
          size="small"
          :color="item.is_unique ? 'accent' : 'secondary'"
          :prepend-icon="item.is_unique ? 'mdi-fingerprint' : 'mdi-tag-multiple'"
        >
          {{ item.is_unique ? 'Único' : 'Repetible' }}
        </v-chip>
      </template>
    </CatalogList>

    <IdentificationTypeFormDialog ref="typeFormDialog" @saved="onSaved" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar tipo de identificación?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ itemToDelete && itemToDelete.name }}</strong> del catálogo. Los
          animales que ya lo tengan registrado no se modifican.
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
import IdentificationTypeFormDialog from '@/modules/configuration/components/IdentificationTypeFormDialog.vue'

export default {
  name: 'IdentificationTypeListPage',
  components: { CatalogList, IdentificationTypeFormDialog },
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
    ...mapGetters('configuration', { identificationTypes: 'allIdentificationTypes' }),
  },
  created() {
    this.loadTypes()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async loadTypes() {
      this.loading = true
      try {
        await this.fetchState({
          module: 'configuration',
          nameState: 'identificationTypes',
          url: '/configuration/identification-types/',
        })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los tipos de identificación'), 'error')
      } finally {
        this.loading = false
      }
    },
    askDelete(type) {
      this.itemToDelete = type
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'configuration',
          nameState: 'identificationTypes',
          url: `/configuration/identification-types/${this.itemToDelete.id}/`,
          value: this.itemToDelete.id,
        })
        this.notify('Tipo de identificación eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el tipo de identificación'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Tipo actualizado' : 'Tipo creado')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
