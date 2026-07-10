<template>
  <v-dialog v-model="dialog" max-width="460" persistent>
    <v-card v-if="app">
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon :color="isApply ? 'success' : 'secondary'" class="mr-2">
          {{ isApply ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline' }}
        </v-icon>
        {{ isApply ? 'Registrar aplicación' : 'Omitir aplicación' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <div class="hs-app-summary mb-4">
          <p class="font-weight-medium mb-1">{{ app.medication_name }}</p>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ app.animal_name }} · {{ doseLabel }}
            <span v-if="app.route_display"> · {{ app.route_display }}</span>
          </p>
          <p class="text-caption text-medium-emphasis mb-0">
            Programada: {{ formatDateTime(app.scheduled_at) }}
          </p>
        </div>

        <p class="text-body-2 mb-4">
          {{ isApply
            ? '¿Confirmas que esta aplicación se realizó?'
            : 'Se marcará como omitida (no se realizó). Quedará en el historial.' }}
        </p>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-if="isApply"
            v-model="form.applied_at"
            label="Fecha y hora de aplicación"
            type="datetime-local"
            :max="nowLocal"
            prepend-inner-icon="mdi-calendar-clock"
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
        <v-btn :color="isApply ? 'success' : 'primary'" :loading="saving" @click="handleSubmit">
          {{ isApply ? 'Aplicar' : 'Omitir' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'ApplicationResolver',
  emits: ['resolved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      app: null,
      action: 'apply',
      form: { applied_at: '', notes: '' },
    }
  },
  computed: {
    isApply() {
      return this.action === 'apply'
    },
    nowLocal() {
      // datetime-local necesita YYYY-MM-DDTHH:mm en hora local.
      const now = new Date()
      const off = now.getTimezoneOffset() * 60000
      return new Date(now - off).toISOString().slice(0, 16)
    },
    doseLabel() {
      const unit = this.app.dose_unit_display || this.app.dose_unit || ''
      return `${this.app.dose_amount} ${unit}`.trim()
    },
  },
  methods: {
    ...mapActions('health', ['applyApplication', 'skipApplication']),
    // Called from the parent via ref: open(app, 'apply' | 'skip')
    open(app, action = 'apply') {
      this.app = app
      this.action = action
      this.form = { applied_at: this.nowLocal, notes: '' }
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    async handleSubmit() {
      this.saving = true
      this.error = ''
      try {
        const notes = this.form.notes.trim() || undefined
        if (this.isApply) {
          // El input es hora local; enviarlo como ISO para el backend.
          const appliedAt = this.form.applied_at ? new Date(this.form.applied_at).toISOString() : undefined
          await this.applyApplication({ id: this.app.id, applied_at: appliedAt, notes })
        } else {
          await this.skipApplication({ id: this.app.id, notes })
        }
        this.$emit('resolved', { action: this.action, app: this.app })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo resolver la aplicación')
      } finally {
        this.saving = false
      }
    },
    formatDateTime(dt) {
      if (!dt) return '—'
      return new Date(dt).toLocaleString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>

<style scoped>
.hs-app-summary {
  background: rgba(46, 125, 50, 0.05);
  border: 1px solid rgba(46, 82, 51, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
}
</style>
