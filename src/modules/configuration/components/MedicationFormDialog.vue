<template>
  <v-dialog v-model="dialog" max-width="520" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-pill' }}</v-icon>
        {{ isEdit ? 'Editar medicamento' : 'Nuevo medicamento' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Nombre *"
            placeholder="Oxitetraciclina, Ivermectina…"
            prepend-inner-icon="mdi-pill"
            :rules="[rules.required]"
            autofocus
            class="mb-2"
          />

          <v-row dense>
            <v-col cols="6">
              <v-select v-model="form.unit" label="Unidad de dosis *" :items="doseUnits" :rules="[rules.required]" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.concentration" label="Concentración" placeholder="200 mg/ml" />
            </v-col>
          </v-row>

          <p class="hs-overline mb-1 mt-2">Días de retiro</p>
          <p class="text-caption text-medium-emphasis mb-2">
            Días que deben pasar tras la última aplicación antes de aprovechar el producto.
          </p>
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model.number="form.withdrawal_days_meat" label="Carne (días)" type="number" min="0" prepend-inner-icon="mdi-food-steak" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="form.withdrawal_days_milk" label="Leche (días)" type="number" min="0" prepend-inner-icon="mdi-cup-water" />
            </v-col>
          </v-row>

          <v-textarea v-model="form.notes" label="Notas (opcional)" rows="2" auto-grow prepend-inner-icon="mdi-note-text-outline" class="mt-2" />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Crear medicamento' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { DOSE_UNITS } from '@/modules/health/constants'

export default {
  name: 'MedicationFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      doseUnits: DOSE_UNITS,
      form: { name: '', unit: 'ML', concentration: '', withdrawal_days_meat: 0, withdrawal_days_milk: 0, notes: '' },
      rules: {
        required: (v) => (v !== null && v !== undefined && v !== '') || 'Campo requerido',
      },
    }
  },
  computed: {
    isEdit() {
      return this.editId !== null
    },
  },
  methods: {
    ...mapActions('shared', ['createItem', 'updateItem']),
    // Called from the parent via ref: open() to create, open(medication) to edit
    open(med = null) {
      this.editId = med ? med.id : null
      this.form = {
        name: med ? med.name : '',
        unit: med ? med.unit : 'ML',
        concentration: med ? med.concentration || '' : '',
        withdrawal_days_meat: med ? med.withdrawal_days_meat : 0,
        withdrawal_days_milk: med ? med.withdrawal_days_milk : 0,
        notes: med ? med.notes || '' : '',
      }
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
        const payload = {
          name: this.form.name,
          unit: this.form.unit,
          concentration: this.form.concentration || '',
          withdrawal_days_meat: this.form.withdrawal_days_meat || 0,
          withdrawal_days_milk: this.form.withdrawal_days_milk || 0,
          notes: this.form.notes || '',
        }
        if (this.isEdit) {
          await this.updateItem({
            module: 'configuration',
            nameState: 'medications',
            url: `/configuration/medications/${this.editId}/`,
            data: payload,
          })
        } else {
          await this.createItem({
            module: 'configuration',
            nameState: 'medications',
            url: '/configuration/medications/',
            data: payload,
          })
        }
        this.$emit('saved', { isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el medicamento')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
