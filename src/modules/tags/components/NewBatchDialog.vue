<template>
  <v-dialog v-model="dialog" max-width="520" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-qrcode-plus</v-icon>
        Nuevo lote de chapetas
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model.number="form.quantity"
            label="Cantidad de chapetas *"
            type="number"
            min="1"
            max="5000"
            prepend-inner-icon="mdi-counter"
            :rules="[rules.quantity]"
            autofocus
          />
          <v-text-field
            v-model="form.label"
            label="Etiqueta del lote"
            hint="Referencia para ubicarlo después, p. ej. 'Pedido imprenta julio'"
            prepend-inner-icon="mdi-tag-text-outline"
          />
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="form.tag_size_mm"
                label="Tamaño del QR"
                :items="sizeOptions"
                prepend-inner-icon="mdi-ruler"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.page_format"
                label="Página del pliego"
                :items="pageOptions"
                prepend-inner-icon="mdi-file-outline"
              />
            </v-col>
          </v-row>
        </v-form>

        <v-alert type="info" variant="tonal" density="compact" class="mt-1">
          Se generan {{ form.quantity || 'N' }} códigos únicos con corrección de errores máxima
          (leen aunque se dañe hasta ~30% del QR) y los archivos vectoriales para la imprenta:
          pliego PDF a escala real, SVGs individuales y manifiesto CSV.
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">Generar lote</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'NewBatchDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      form: this.defaultForm(),
      sizeOptions: [
        { title: '35 mm (chapeta pequeña)', value: 35 },
        { title: '45 mm (recomendado)', value: 45 },
        { title: '55 mm (chapeta grande)', value: 55 },
      ],
      pageOptions: [
        { title: 'A4', value: 'A4' },
        { title: 'Carta', value: 'LETTER' },
      ],
      rules: {
        quantity: (v) =>
          (Number.isInteger(v) && v >= 1 && v <= 5000) || 'Entre 1 y 5000 chapetas por lote',
      },
    }
  },
  methods: {
    ...mapActions('shared', ['createItem']),
    defaultForm() {
      return { quantity: 100, label: '', tag_size_mm: 45, page_format: 'A4' }
    },
    open() {
      this.form = this.defaultForm()
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        await this.createItem({
          module: 'tags',
          nameState: 'batches',
          url: '/tags/batches/',
          data: { ...this.form, label: this.form.label || '' },
        })
        this.$emit('saved')
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo crear el lote')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
