<template>
  <div>
    <div class="d-flex align-center mb-3">
      <p class="hs-overline mb-0">Historial clínico</p>
      <v-spacer />
      <v-btn
        v-if="canWrite"
        size="small"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-plus"
        @click="$refs.treatmentDialog.open(animal)"
      >
        Nuevo tratamiento
      </v-btn>
    </div>

    <p v-if="!treatments.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
      Sin tratamientos registrados.
    </p>

    <v-expansion-panels v-else v-model="open" variant="accordion" multiple>
      <v-expansion-panel v-for="t in treatments" :key="t.id" :value="t.id">
        <v-expansion-panel-title>
          <div class="d-flex align-center flex-wrap ga-2 flex-grow-1 pr-2">
            <v-icon size="18" :color="statusMeta(t.status).color">mdi-medical-bag</v-icon>
            <span class="font-weight-medium">{{ t.name || t.protocol_name }}</span>
            <v-chip size="x-small" :color="statusMeta(t.status).color" variant="tonal">{{ t.status_display || statusMeta(t.status).label }}</v-chip>
            <v-chip v-if="overdueIn(t)" size="x-small" color="error" variant="flat">{{ overdueIn(t) }} vencida(s)</v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">{{ formatDateTime(t.start_at) }}</span>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <p v-if="t.diagnosis" class="text-body-2 mb-1"><strong>Diagnóstico:</strong> {{ t.diagnosis }}</p>
          <p v-if="t.notes" class="text-caption text-medium-emphasis mb-3">{{ t.notes }}</p>

          <v-timeline density="compact" side="end" align="start" truncate-line="both">
            <v-timeline-item
              v-for="app in sortedApplications(t)"
              :key="app.id"
              :dot-color="app.is_overdue ? 'error' : statusMeta(app.status).color"
              :icon="appIcon(app)"
              size="small"
            >
              <div class="d-flex align-center flex-wrap ga-2">
                <span class="font-weight-medium">{{ app.medication_name }}</span>
                <span class="text-caption text-medium-emphasis">{{ doseLabel(app) }}<template v-if="app.route_display"> · {{ app.route_display }}</template></span>
                <v-chip size="x-small" :color="app.is_overdue ? 'error' : statusMeta(app.status).color" variant="tonal">
                  {{ app.is_overdue ? 'Vencida' : (app.status_display || statusMeta(app.status).label) }}
                </v-chip>
                <v-spacer />
                <div v-if="canWrite && app.status === 'PENDING'" class="d-flex ga-1">
                  <v-btn icon variant="tonal" color="success" size="x-small" @click="$refs.resolver.open(app, 'apply')">
                    <v-icon>mdi-check</v-icon>
                    <v-tooltip activator="parent" location="top">Aplicar</v-tooltip>
                  </v-btn>
                  <v-btn icon variant="text" size="x-small" @click="$refs.resolver.open(app, 'skip')">
                    <v-icon>mdi-close</v-icon>
                    <v-tooltip activator="parent" location="top">Omitir</v-tooltip>
                  </v-btn>
                </div>
              </div>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ formatDateTime(app.scheduled_at) }}
                <template v-if="app.applied_by_name"> · Registró: {{ app.applied_by_name }}</template>
              </p>
              <p v-if="app.notes" class="text-caption mb-0">{{ app.notes }}</p>
            </v-timeline-item>
          </v-timeline>

          <div v-if="canWrite && t.status === 'ACTIVE'" class="d-flex justify-end mt-2">
            <v-btn size="small" variant="text" color="error" prepend-icon="mdi-cancel" @click="askCancel(t)">
              Cancelar tratamiento
            </v-btn>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <TreatmentFormDialog ref="treatmentDialog" @saved="onChanged" />
    <ApplicationResolver ref="resolver" @resolved="onChanged" />

    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Cancelar tratamiento?</v-card-title>
        <v-card-text class="px-6">
          Las aplicaciones pendientes de <strong>{{ toCancel && (toCancel.name || toCancel.protocol_name) }}</strong>
          se marcarán como omitidas.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="cancelling" @click="cancelDialog = false">Volver</v-btn>
          <v-btn color="error" variant="flat" :loading="cancelling" @click="confirmCancel">Cancelar tratamiento</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { HEALTH_STATUS_META, TREATMENT_STATUS_META } from '@/modules/health/constants'
import TreatmentFormDialog from '@/modules/health/components/TreatmentFormDialog.vue'
import ApplicationResolver from '@/modules/health/components/ApplicationResolver.vue'

export default {
  name: 'AnimalHealthTab',
  components: { TreatmentFormDialog, ApplicationResolver },
  props: {
    animal: { type: Object, required: true },
    treatments: { type: Array, default: () => [] },
    canWrite: { type: Boolean, default: false },
  },
  emits: ['changed'],
  data() {
    return {
      open: [],
      cancelDialog: false,
      cancelling: false,
      toCancel: null,
    }
  },
  methods: {
    ...mapActions('health', ['cancelTreatment']),
    statusMeta(status) {
      return TREATMENT_STATUS_META[status] || HEALTH_STATUS_META[status] || { label: status, color: 'secondary' }
    },
    appIcon(app) {
      return (HEALTH_STATUS_META[app.status] || {}).icon || 'mdi-needle'
    },
    sortedApplications(treatment) {
      return [...(treatment.applications || [])].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    },
    overdueIn(treatment) {
      return (treatment.applications || []).filter((a) => a.is_overdue).length
    },
    doseLabel(app) {
      const unit = app.dose_unit_display || app.dose_unit || ''
      return `${app.dose_amount} ${unit}`.trim()
    },
    askCancel(treatment) {
      this.toCancel = treatment
      this.cancelDialog = true
    },
    async confirmCancel() {
      this.cancelling = true
      try {
        await this.cancelTreatment({ animalId: this.animal.id, id: this.toCancel.id })
        this.cancelDialog = false
        this.$emit('changed')
      } catch (e) {
        this.$emit('changed', { error: getErrorMessage(e, 'No se pudo cancelar el tratamiento') })
      } finally {
        this.cancelling = false
      }
    },
    onChanged() {
      this.$emit('changed')
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
