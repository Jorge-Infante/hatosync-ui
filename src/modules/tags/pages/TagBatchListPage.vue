<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">Identificación del hato</p>
        <h1 class="text-h5 font-weight-bold">Chapetas QR</h1>
        <p class="text-body-2 text-medium-emphasis">
          Genera lotes de códigos, descárgalos en vectorial para la imprenta y asócialos a los
          animales al ponerles la chapeta.
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$refs.newBatchDialog.open()">Nuevo lote</v-btn>
    </div>

    <!-- Buscar una chapeta por código -->
    <v-card class="pa-4 mb-6 rise rise-d1">
      <p class="hs-overline mb-2">Buscar chapeta</p>
      <v-form @submit.prevent="searchTag">
        <div class="d-flex flex-wrap align-start ga-3">
          <v-text-field
            v-model="searchCode"
            label="Código (p. ej. 7Q4K-M2XN-C)"
            prepend-inner-icon="mdi-qrcode"
            :rules="[rules.codeOrEmpty]"
            class="flex-grow-1"
            style="min-width: 240px"
            hide-details="auto"
            clearable
            @click:clear="searchResult = null"
          />
          <v-btn color="primary" variant="tonal" :loading="searching" type="submit">Buscar</v-btn>
        </div>
      </v-form>

      <v-alert v-if="searchError" type="error" variant="tonal" class="mt-3" density="compact">
        {{ searchError }}
      </v-alert>

      <v-card v-if="searchResult" variant="tonal" class="mt-3 pa-4">
        <div class="d-flex flex-wrap align-center ga-3">
          <v-chip :color="tagStatusColor(searchResult.status)" size="small" variant="flat">
            {{ searchResult.status_display }}
          </v-chip>
          <span class="font-weight-bold" style="font-family: monospace">{{ searchResult.code_display }}</span>
          <span v-if="searchResult.batch_label" class="text-body-2 text-medium-emphasis">
            Lote: {{ searchResult.batch_label }}
          </span>
          <v-spacer />
          <template v-if="searchResult.animal">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              prepend-icon="mdi-cow"
              @click="goToAnimal(searchResult.animal.id)"
            >
              {{ searchResult.animal.name }}
            </v-btn>
          </template>
          <span v-else-if="searchResult.status === 'ASSIGNED'" class="text-body-2 text-medium-emphasis">
            Asignada a un animal de la finca
          </span>
          <v-btn size="small" variant="text" prepend-icon="mdi-qrcode" @click="$refs.qrDialog.open(searchResult.code)">
            Ver QR
          </v-btn>
        </div>
      </v-card>
    </v-card>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading && !batches.length" type="list-item-two-line@3" class="border rounded-xl rise rise-d2" />

    <!-- Empty -->
    <v-card v-else-if="!batches.length" class="pa-10 text-center rise rise-d2">
      <v-icon size="56" color="primary" class="mb-3">mdi-qrcode</v-icon>
      <h2 class="text-h6 font-weight-bold mb-1">Aún no hay lotes de chapetas</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Crea el primer lote: se generan N códigos únicos, resistentes a daño (QR con corrección
        máxima) y listos en PDF/SVG vectorial para mandar a imprimir.
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$refs.newBatchDialog.open()">Nuevo lote</v-btn>
    </v-card>

    <!-- Batch list -->
    <v-card v-else class="rise rise-d2">
      <v-list class="py-1">
        <template v-for="(batch, index) in batches" :key="batch.id">
          <v-divider v-if="index > 0" class="mx-4" />
          <v-list-item class="px-4 py-3">
            <template #prepend>
              <v-avatar size="40" color="primary" variant="tonal" class="mr-3">
                <v-icon size="20">mdi-qrcode</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ batch.label || 'Lote de chapetas' }}
              <span class="text-body-2 text-medium-emphasis ms-1">· {{ batch.quantity }} códigos</span>
            </v-list-item-title>
            <v-list-item-subtitle class="mt-1">
              {{ formatDate(batch.created_at) }} · QR {{ batch.tag_size_mm }} mm ·
              {{ batch.page_format === 'A4' ? 'A4' : 'Carta' }}
              <template v-if="batch.status === 'READY'">
                · {{ batch.available_count }} disp. / {{ batch.assigned_count }} asig.
                <template v-if="batch.void_count"> / {{ batch.void_count }} anul.</template>
              </template>
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center ga-2">
                <v-chip :color="batchStatusColor(batch.status)" size="small" variant="tonal">
                  <v-progress-circular
                    v-if="batch.status === 'GENERATING' || batch.status === 'PENDING'"
                    indeterminate
                    size="12"
                    width="2"
                    class="me-1"
                  />
                  {{ batch.status_display }}
                </v-chip>

                <v-menu v-if="batch.status === 'READY'" location="bottom end" :offset="6">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" variant="tonal" color="primary" size="small" prepend-icon="mdi-download">
                      Descargar
                    </v-btn>
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item prepend-icon="mdi-file-pdf-box" title="Pliego PDF (imprenta)" @click="download(batch, 'pdf')" />
                    <v-list-item prepend-icon="mdi-folder-zip-outline" title="SVGs individuales (ZIP)" @click="download(batch, 'svg')" />
                    <v-list-item prepend-icon="mdi-file-delimited-outline" title="Manifiesto CSV" @click="download(batch, 'csv')" />
                  </v-list>
                </v-menu>

                <v-tooltip v-if="batch.status === 'FAILED'" location="top" :text="batch.error || 'Falló la generación'">
                  <template #activator="{ props: tipProps }">
                    <v-icon v-bind="tipProps" color="error">mdi-alert-circle-outline</v-icon>
                  </template>
                </v-tooltip>

                <v-menu location="bottom end" :offset="6">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item
                      prepend-icon="mdi-delete-outline"
                      title="Anular lote"
                      base-color="error"
                      @click="askDelete(batch)"
                    />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <NewBatchDialog ref="newBatchDialog" @saved="onBatchCreated" />
    <TagQrDialog ref="qrDialog" />

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Anular lote?</v-card-title>
        <v-card-text class="px-6">
          Se anulará <strong>{{ batchToDelete && (batchToDelete.label || 'el lote') }}</strong> y sus
          chapetas sin asignar quedarán inutilizables. Un lote con chapetas puestas en animales no
          se puede anular.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">Anular</v-btn>
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
import { isValidCode } from '@/modules/tags/checksum'
import NewBatchDialog from '@/modules/tags/components/NewBatchDialog.vue'
import TagQrDialog from '@/modules/tags/components/TagQrDialog.vue'

const POLL_INTERVAL_MS = 4000
const BATCH_STATUS_COLORS = {
  PENDING: 'warning',
  GENERATING: 'warning',
  READY: 'success',
  FAILED: 'error',
}
const TAG_STATUS_COLORS = {
  AVAILABLE: 'info',
  ASSIGNED: 'success',
  VOID: 'error',
}

export default {
  name: 'TagBatchListPage',
  components: { NewBatchDialog, TagQrDialog },
  data() {
    return {
      loading: false,
      pollTimer: null,
      searchCode: '',
      searching: false,
      searchError: '',
      searchResult: null,
      deleteDialog: false,
      deleting: false,
      batchToDelete: null,
      snackbar: { show: false, text: '', color: 'success' },
      rules: {
        codeOrEmpty: (v) => !v || isValidCode(v) || 'Código inválido (verifica los 9 caracteres)',
      },
    }
  },
  computed: {
    ...mapGetters('tags', { batches: 'allBatches', hasGeneratingBatches: 'hasGeneratingBatches' }),
  },
  created() {
    this.loadBatches()
  },
  beforeUnmount() {
    this.stopPolling()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    ...mapActions('tags', ['resolveTag', 'downloadBatchFile']),
    async loadBatches(silent = false) {
      if (!silent) this.loading = true
      try {
        await this.fetchState({ module: 'tags', nameState: 'batches', url: '/tags/batches/' })
        this.syncPolling()
      } catch (e) {
        if (!silent) this.notify(getErrorMessage(e, 'No se pudieron cargar los lotes'), 'error')
      } finally {
        this.loading = false
      }
    },
    // Mientras haya lotes generándose, refresca en silencio hasta que terminen.
    syncPolling() {
      if (this.hasGeneratingBatches && !this.pollTimer) {
        this.pollTimer = setInterval(() => this.loadBatches(true), POLL_INTERVAL_MS)
      } else if (!this.hasGeneratingBatches) {
        this.stopPolling()
      }
    },
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
    onBatchCreated() {
      this.notify('Lote creado: la generación tarda unos segundos')
      this.loadBatches(true)
    },
    async download(batch, kind) {
      try {
        await this.downloadBatchFile({ batch, kind })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo descargar el archivo'), 'error')
      }
    },
    async searchTag() {
      if (!this.searchCode || !isValidCode(this.searchCode)) return
      this.searching = true
      this.searchError = ''
      this.searchResult = null
      try {
        this.searchResult = await this.resolveTag({ code: this.searchCode })
      } catch (e) {
        this.searchError = getErrorMessage(e, 'No se encontró la chapeta')
      } finally {
        this.searching = false
      }
    },
    goToAnimal(animalId) {
      this.$router.push({ name: 'livestock-animal-detail', params: { id: animalId } })
    },
    askDelete(batch) {
      this.batchToDelete = batch
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'tags',
          nameState: 'batches',
          url: `/tags/batches/${this.batchToDelete.id}/`,
          value: this.batchToDelete.id,
        })
        this.notify('Lote anulado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo anular el lote'), 'error')
      } finally {
        this.deleting = false
      }
    },
    batchStatusColor(status) {
      return BATCH_STATUS_COLORS[status] || 'secondary'
    },
    tagStatusColor(status) {
      return TAG_STATUS_COLORS[status] || 'secondary'
    },
    formatDate(value) {
      if (!value) return '—'
      return new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
