<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'health-agenda' }" class="mb-3 rise">
      Agenda
    </v-btn>

    <CatalogList
      title="Protocolos"
      overline="Plantillas clínicas"
      subtitle="Esquemas reutilizables de aplicaciones que se instancian al crear un tratamiento."
      new-label="Nuevo protocolo"
      icon="mdi-clipboard-list-outline"
      :items="treatmentProtocols"
      :loading="loading"
      empty-title="Aún no hay protocolos"
      empty-text="Crea una plantilla (p. ej. un plan antibiótico de 3 días) para aplicarla a tus animales en un clic."
      @new="$refs.protocolFormDialog.open()"
      @edit="$refs.protocolFormDialog.open($event)"
      @delete="askDelete"
    >
      <template #meta="{ item }">
        <v-chip size="small" color="primary" variant="tonal">
          {{ (item.items || []).length }} {{ (item.items || []).length === 1 ? 'aplicación' : 'aplicaciones' }}
        </v-chip>
      </template>
    </CatalogList>

    <ProtocolFormDialog ref="protocolFormDialog" @saved="onSaved" />

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar protocolo?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ itemToDelete && itemToDelete.name }}</strong>. Los tratamientos ya
          creados a partir de él no se modifican.
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
import ProtocolFormDialog from '@/modules/health/components/ProtocolFormDialog.vue'

export default {
  name: 'ProtocolListPage',
  components: { CatalogList, ProtocolFormDialog },
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
    ...mapGetters('health', ['treatmentProtocols']),
  },
  created() {
    this.load()
  },
  methods: {
    ...mapActions('health', ['fetchProtocols']),
    ...mapActions('shared', ['deleteItem']),
    async load() {
      this.loading = true
      try {
        await this.fetchProtocols({ type: 'TREATMENT' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los protocolos'), 'error')
      } finally {
        this.loading = false
      }
    },
    askDelete(protocol) {
      this.itemToDelete = protocol
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'health',
          nameState: 'protocols',
          url: `/health/protocols/${this.itemToDelete.id}/`,
          value: this.itemToDelete.id,
        })
        this.notify('Protocolo eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el protocolo'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Protocolo actualizado' : 'Protocolo creado')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
