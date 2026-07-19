<template>
  <v-dialog v-model="dialog" max-width="640" scrollable>
    <v-card v-if="animal">
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-history</v-icon>
        Historial reproductivo
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <!-- Summary card: "ficha de campo" -->
        <div class="hs-repro-summary mb-4 pa-4">
          <p class="hs-repro-summary__name mb-1">{{ animal.name }}</p>
          <div class="d-flex flex-wrap align-center ga-2">
            <v-chip
              v-for="chip in summaryChips"
              :key="chip.key"
              size="small"
              :color="chip.color"
              :prepend-icon="chip.icon || undefined"
            >
              {{ chip.label }}
            </v-chip>
            <span v-if="repro.open_days !== null && repro.open_days !== undefined" class="text-caption text-medium-emphasis">
              {{ repro.open_days }} días abiertos
            </span>
            <span v-if="repro.expected_due_date" class="text-caption text-medium-emphasis">
              · Parto probable: {{ formatDate(repro.expected_due_date) }}
            </span>
          </div>
        </div>

        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <!-- Events header + add toggle -->
        <div class="d-flex align-center mb-2">
          <p class="hs-overline mb-0">Eventos</p>
          <v-spacer />
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            :prepend-icon="showForm ? 'mdi-close' : 'mdi-plus'"
            @click="showForm = !showForm"
          >
            {{ showForm ? 'Cancelar' : 'Registrar evento' }}
          </v-btn>
        </div>

        <v-expand-transition>
          <div v-if="showForm" class="hs-repro-form mb-4 pa-4">
            <v-form ref="form" @submit.prevent="handleSubmit">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.event_type"
                    label="Tipo de evento *"
                    :items="eventTypeOptions"
                    :rules="[rules.required]"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.date"
                    label="Fecha *"
                    type="date"
                    :max="today"
                    :rules="[rules.required]"
                    class="mb-2"
                  />
                </v-col>
              </v-row>

              <v-autocomplete
                v-if="needsSire"
                v-model="form.sire"
                label="Toro / padre (opcional)"
                :items="sireOptions"
                prepend-inner-icon="mdi-cow"
                clearable
                no-data-text="No hay machos registrados"
                class="mb-2"
              />

              <v-row v-if="isPregnancyCheck" dense>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="form.result"
                    label="Resultado *"
                    :items="resultOptions"
                    :rules="isPregnancyCheck ? [rules.required] : []"
                    class="mb-2"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-if="form.result === 'POSITIVE'"
                    v-model.number="form.gestation_days"
                    label="Días de gestación"
                    type="number"
                    min="1"
                    hint="Estimación del palpador — útil en monta libre"
                    persistent-hint
                    class="mb-2"
                  />
                </v-col>
              </v-row>

              <v-textarea v-model="form.notes" label="Notas (opcional)" rows="2" class="mb-2" />

              <div class="d-flex justify-end">
                <v-btn color="primary" size="small" :loading="saving" @click="handleSubmit">
                  Guardar evento
                </v-btn>
              </div>
            </v-form>
          </div>
        </v-expand-transition>

        <!-- Timeline -->
        <v-skeleton-loader v-if="loading" type="list-item-two-line@3" />
        <p v-else-if="sortedEvents.length === 0" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
          Aún no hay eventos reproductivos registrados.
        </p>
        <v-timeline v-else density="compact" side="end" align="start" truncate-line="both">
          <v-timeline-item
            v-for="event in sortedEvents"
            :key="event.id"
            :dot-color="eventMeta(event).color"
            :icon="eventMeta(event).icon"
            size="small"
          >
            <div class="d-flex align-center ga-2">
              <span class="font-weight-medium">{{ eventLabel(event) }}</span>
              <v-chip
                v-if="event.event_type === 'PREGNANCY_CHECK' && event.result"
                size="x-small"
                :color="event.result === 'POSITIVE' ? 'success' : 'error'"
              >
                {{ event.result === 'POSITIVE' ? 'Positiva' : 'Negativa' }}
              </v-chip>
            </div>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ formatDate(event.date) }}
              <template v-if="event.gestation_days"> · {{ event.gestation_days }} días de gestación</template>
              <template v-if="sireName(event)"> · Toro: {{ sireName(event) }}</template>
              <template v-if="offspringName(event)"> · Cría: {{ offspringName(event) }}</template>
            </p>
            <p v-if="event.notes" class="text-caption mb-0">{{ event.notes }}</p>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { REPRO_EVENT_META, reproChips } from '@/modules/livestock/constants'

const emptyForm = (today) => ({
  event_type: null,
  date: today,
  sire: null,
  result: null,
  gestation_days: null,
  notes: '',
})

export default {
  name: 'ReproductionEventsDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      loading: false,
      saving: false,
      error: '',
      animalId: null,
      events: [],
      showForm: false,
      form: emptyForm(''),
      eventTypeOptions: [
        { title: 'Inseminación', value: 'INSEMINATION' },
        { title: 'Monta natural', value: 'NATURAL_MATING' },
        { title: 'Chequeo de preñez', value: 'PREGNANCY_CHECK' },
        { title: 'Aborto', value: 'ABORTION' },
      ],
      resultOptions: [
        { title: 'Positiva', value: 'POSITIVE' },
        { title: 'Negativa', value: 'NEGATIVE' },
      ],
      rules: {
        required: (v) => !!v || 'Campo requerido',
      },
    }
  },
  computed: {
    ...mapGetters('livestock', ['males', 'externalMales', 'animalById']),
    // Resolved from the store so status chips refresh after each new event
    animal() {
      return this.animalId !== null ? this.animalById(this.animalId) : null
    },
    repro() {
      return (this.animal && this.animal.reproduction) || {}
    },
    summaryChips() {
      return reproChips(this.repro)
    },
    today() {
      return new Date().toISOString().slice(0, 10)
    },
    sireOptions() {
      return [
        ...this.males.map((animal) => ({ title: animal.name, value: animal.id })),
        ...this.externalMales.map((animal) => ({ title: `${animal.name} (externo)`, value: animal.id })),
      ]
    },
    needsSire() {
      return ['INSEMINATION', 'NATURAL_MATING'].includes(this.form.event_type)
    },
    isPregnancyCheck() {
      return this.form.event_type === 'PREGNANCY_CHECK'
    },
    sortedEvents() {
      return [...this.events].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id)
    },
  },
  methods: {
    ...mapActions('livestock', ['fetchReproductionEvents', 'createReproductionEvent']),
    // Called from the parent via ref: open(animal)
    open(animal) {
      this.animalId = animal.id
      this.events = []
      this.error = ''
      this.showForm = false
      this.form = emptyForm(this.today)
      this.dialog = true
      this.loadEvents()
    },
    close() {
      this.dialog = false
    },
    async loadEvents() {
      this.loading = true
      try {
        this.events = await this.fetchReproductionEvents(this.animalId)
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo cargar el historial')
      } finally {
        this.loading = false
      }
    },
    eventMeta(event) {
      return REPRO_EVENT_META[event.event_type] || { label: event.event_type, icon: 'mdi-circle-small', color: 'secondary' }
    },
    eventLabel(event) {
      return event.event_type_display || this.eventMeta(event).label
    },
    sireName(event) {
      if (event.sire_name) return event.sire_name
      const sire = event.sire ? this.animalById(event.sire) : null
      return sire ? sire.name : ''
    },
    offspringName(event) {
      if (event.offspring_name) return event.offspring_name
      const offspring = event.offspring ? this.animalById(event.offspring) : null
      return offspring ? offspring.name : ''
    },
    formatDate(date) {
      if (!date) return '—'
      return new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    },
    buildPayload() {
      const payload = { event_type: this.form.event_type, date: this.form.date }
      if (this.form.notes) payload.notes = this.form.notes
      if (this.needsSire && this.form.sire) payload.sire = this.form.sire
      if (this.isPregnancyCheck) {
        payload.result = this.form.result
        if (this.form.result === 'POSITIVE' && this.form.gestation_days) {
          payload.gestation_days = this.form.gestation_days
        }
      }
      return payload
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        await this.createReproductionEvent({ animalId: this.animalId, data: this.buildPayload() })
        this.showForm = false
        this.form = emptyForm(this.today)
        this.$emit('saved')
        await this.loadEvents()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo registrar el evento')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.hs-repro-summary {
  border: 1px dashed rgba(46, 82, 51, 0.35);
  border-radius: 14px;
  background: rgba(46, 125, 50, 0.04);
}
.hs-repro-summary__name {
  font-family: var(--hs-font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 1.15rem;
  color: rgb(var(--v-theme-on-surface));
}
.hs-repro-form {
  border: 1px solid rgba(46, 82, 51, 0.14);
  border-radius: 14px;
  background: rgba(46, 125, 50, 0.03);
}
</style>
