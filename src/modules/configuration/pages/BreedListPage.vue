<template>
  <div>
    <CatalogList
      title="Razas"
      overline="Catálogo de la finca"
      subtitle="Las razas disponibles al registrar animales en esta finca."
      new-label="Nueva raza"
      icon="mdi-dna"
      :items="breeds"
      :loading="loading"
      empty-title="Aún no hay razas"
      empty-text="Crea las razas que maneja tu finca para poder asignarlas a los animales."
      @new="$refs.breedFormDialog.open()"
      @edit="$refs.breedFormDialog.open($event)"
      @delete="askDelete"
    />

    <BreedFormDialog ref="breedFormDialog" @saved="onSaved" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar raza?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ itemToDelete && itemToDelete.name }}</strong> del catálogo. Los
          animales que ya la tengan asignada no se modifican.
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
import BreedFormDialog from '@/modules/configuration/components/BreedFormDialog.vue'

export default {
  name: 'BreedListPage',
  components: { CatalogList, BreedFormDialog },
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
    ...mapGetters('configuration', { breeds: 'allBreeds' }),
  },
  created() {
    this.loadBreeds()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async loadBreeds() {
      this.loading = true
      try {
        await this.fetchState({ module: 'configuration', nameState: 'breeds', url: '/configuration/breeds/' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar las razas'), 'error')
      } finally {
        this.loading = false
      }
    },
    askDelete(breed) {
      this.itemToDelete = breed
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'configuration',
          nameState: 'breeds',
          url: `/configuration/breeds/${this.itemToDelete.id}/`,
          value: this.itemToDelete.id,
        })
        this.notify('Raza eliminada')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar la raza'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Raza actualizada' : 'Raza creada')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
