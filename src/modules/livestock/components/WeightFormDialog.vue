<template>
  <v-dialog v-model="dialog" max-width="440" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-scale</v-icon>
        Registrar peso
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-caption text-medium-emphasis mb-4">
          Nuevo pesaje de <strong>{{ animal && animal.name }}</strong>. La comparativa contra el
          pesaje anterior se calcula automáticamente.
        </p>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.date"
            label="Fecha *"
            type="date"
            :max="today"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-calendar-outline"
            class="mb-2"
          />
          <v-text-field
            v-model="form.weight_kg"
            label="Peso (kg) *"
            type="number"
            min="0"
            step="0.5"
            :rules="[rules.required, rules.positive]"
            prepend-inner-icon="mdi-scale"
            class="mb-2"
          />
          <v-textarea
            v-model="form.notes"
            label="Notas (opcional)"
            rows="2"
            auto-grow
            prepend-inner-icon="mdi-note-text-outline"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">Registrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'WeightFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      animal: null,
      form: { date: '', weight_kg: '', notes: '' },
      rules: {
        required: (v) => !!v || 'Campo requerido',
        positive: (v) => Number(v) > 0 || 'Debe ser mayor que cero',
      },
    }
  },
  computed: {
    today() {
      return new Date().toISOString().slice(0, 10)
    },
  },
  methods: {
    ...mapActions('livestock', ['createWeight']),
    // Called from the parent via ref: open(animal)
    open(animal) {
      this.animal = animal
      this.form = { date: this.today, weight_kg: '', notes: '' }
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
        const data = { date: this.form.date, weight_kg: this.form.weight_kg }
        if (this.form.notes.trim()) data.notes = this.form.notes.trim()
        const record = await this.createWeight({ animalId: this.animal.id, data })
        this.$emit('saved', { animal: this.animal, record })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo registrar el peso')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
