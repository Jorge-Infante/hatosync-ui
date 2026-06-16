<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-baby-bottle-off-outline</v-icon>
        Destetar cría
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-caption text-medium-emphasis mb-4">
          Se registrará el destete de la cría al pie de
          <strong>{{ mother && mother.name }}</strong>.
        </p>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.date"
            label="Fecha del destete *"
            type="date"
            :max="today"
            prepend-inner-icon="mdi-calendar-outline"
            :rules="[rules.required]"
            class="mb-2"
          />
          <v-textarea
            v-model="form.notes"
            label="Notas (opcional)"
            rows="2"
            prepend-inner-icon="mdi-note-text-outline"
            class="mb-2"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">Registrar destete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'WeanDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      mother: null,
      form: { date: '', notes: '' },
      rules: {
        required: (v) => !!v || 'Campo requerido',
      },
    }
  },
  computed: {
    today() {
      return new Date().toISOString().slice(0, 10)
    },
  },
  methods: {
    ...mapActions('livestock', ['weanCalf']),
    // Called from the parent via ref: open(motherAnimal)
    open(mother) {
      this.mother = mother
      this.form = { date: this.today, notes: '' }
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
        const payload = { date: this.form.date }
        if (this.form.notes) payload.notes = this.form.notes
        await this.weanCalf({ animalId: this.mother.id, data: payload })
        this.$emit('saved', { mother: this.mother })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo registrar el destete')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
