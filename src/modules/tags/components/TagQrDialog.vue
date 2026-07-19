<template>
  <v-dialog v-model="dialog" max-width="380">
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-qrcode</v-icon>
        Chapeta {{ formattedCode }}
      </v-card-title>

      <v-card-text class="px-6 text-center">
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
          {{ error }}
        </v-alert>
        <v-progress-circular v-else-if="loading" indeterminate color="primary" class="my-8" />
        <!-- Fondo blanco puro a propósito: el QR exige contraste máximo, nunca
             el papel del tema. La imagen incluye su zona de silencio. -->
        <div v-if="imageUrl" class="hs-qr-frame">
          <img :src="imageUrl" :alt="`QR ${formattedCode}`" class="hs-qr-img" />
        </div>
        <p v-if="imageUrl" class="text-caption text-medium-emphasis mt-2 mb-0">
          SVG vectorial a escala real: sirve para reimprimir esta chapeta.
        </p>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cerrar</v-btn>
        <v-btn v-if="imageUrl" color="primary" prepend-icon="mdi-download" @click="downloadSvg">
          Descargar SVG
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { cleanCode, formatCode } from '@/modules/tags/checksum'

export default {
  name: 'TagQrDialog',
  data() {
    return {
      dialog: false,
      loading: false,
      error: '',
      code: '',
      imageUrl: null,
    }
  },
  computed: {
    formattedCode() {
      return formatCode(this.code)
    },
  },
  watch: {
    dialog(open) {
      if (!open) this.releaseImage()
    },
  },
  beforeUnmount() {
    this.releaseImage()
  },
  methods: {
    ...mapActions('tags', ['fetchTagImageUrl']),
    async open(code) {
      this.code = cleanCode(code)
      this.error = ''
      this.dialog = true
      this.loading = true
      try {
        this.imageUrl = await this.fetchTagImageUrl({ code: this.code })
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo cargar el QR')
      } finally {
        this.loading = false
      }
    },
    downloadSvg() {
      const link = document.createElement('a')
      link.href = this.imageUrl
      link.download = `${this.code}.svg`
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    releaseImage() {
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl)
        this.imageUrl = null
      }
    },
  },
}
</script>

<style scoped>
.hs-qr-frame {
  background: #ffffff;
  border-radius: 12px;
  padding: 8px;
  display: inline-block;
  border: 1px solid rgba(46, 82, 51, 0.15);
}
.hs-qr-img {
  display: block;
  width: 240px;
  max-width: 100%;
}
</style>
