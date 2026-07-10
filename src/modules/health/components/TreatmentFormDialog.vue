<template>
  <v-dialog v-model="dialog" max-width="720" persistent scrollable>
    <v-card v-if="animal">
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-medical-bag</v-icon>
        Nuevo tratamiento
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-caption text-medium-emphasis mb-4">
          Tratamiento para <strong>{{ animal.name }}</strong>. Desde un protocolo las aplicaciones se
          programan solas; en modo manual las defines una a una.
        </p>

        <v-btn-toggle v-model="mode" mandatory divided density="comfortable" color="primary" variant="outlined" class="mb-4">
          <v-btn value="protocol" size="small">Desde protocolo</v-btn>
          <v-btn value="adhoc" size="small">Manual</v-btn>
        </v-btn-toggle>

        <v-form ref="form">
          <!-- MODO PROTOCOLO -->
          <template v-if="mode === 'protocol'">
            <v-alert v-if="!treatmentProtocols.length" type="info" variant="tonal" class="mb-4">
              No hay protocolos de tratamiento.
              <router-link v-if="isFarmAdmin" :to="{ name: 'health-protocols' }" class="font-weight-medium">Crea uno</router-link>
              <span v-else>Pide a un administrador que cree uno</span>
              o usa el modo manual.
            </v-alert>
            <v-select
              v-model="form.protocol"
              label="Protocolo *"
              :items="treatmentProtocols"
              item-title="name"
              item-value="id"
              prepend-inner-icon="mdi-clipboard-list-outline"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-text-field
              v-model="form.start_at"
              label="Inicio del tratamiento *"
              type="datetime-local"
              prepend-inner-icon="mdi-calendar-clock"
              :rules="[rules.required]"
              hint="Las aplicaciones se programan a partir de esta fecha/hora."
              persistent-hint
              class="mb-4"
            />
          </template>

          <!-- MODO AD-HOC -->
          <template v-else>
            <v-text-field
              v-model="form.name"
              label="Nombre del tratamiento *"
              prepend-inner-icon="mdi-medical-bag"
              :rules="[rules.required]"
              class="mb-2"
            />

            <div class="d-flex align-center mb-2 mt-2">
              <p class="hs-overline mb-0">Aplicaciones</p>
              <v-spacer />
              <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" :disabled="!medications.length" @click="addItem">
                Agregar
              </v-btn>
            </div>

            <v-alert v-if="!medications.length" type="info" variant="tonal" class="mb-2">
              Registra medicamentos en
              <router-link :to="{ name: 'config-medications' }" class="font-weight-medium">Configuración → Medicamentos</router-link>.
            </v-alert>

            <p v-else-if="!form.items.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
              Añade al menos una aplicación con su fecha y hora.
            </p>

            <v-card v-for="(item, idx) in form.items" :key="idx" variant="outlined" class="pa-3 mb-3">
              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-medium text-medium-emphasis">Aplicación {{ idx + 1 }}</span>
                <v-spacer />
                <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="error" @click="form.items.splice(idx, 1)" />
              </div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-select v-model="item.medication" label="Medicamento *" :items="medications" item-title="name" item-value="id" :rules="[rules.required]" hide-details="auto" />
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model="item.dose_amount" label="Dosis *" type="number" min="0" step="0.1" :rules="[rules.required, rules.positive]" hide-details="auto" />
                </v-col>
                <v-col cols="6" sm="3">
                  <v-select v-model="item.dose_unit" label="Unidad *" :items="doseUnits" :rules="[rules.required]" hide-details="auto" />
                </v-col>
                <v-col cols="6" sm="6">
                  <v-select v-model="item.route" label="Vía" :items="routes" clearable hide-details="auto" />
                </v-col>
                <v-col cols="6" sm="6">
                  <v-text-field v-model="item.scheduled_at" label="Fecha y hora *" type="datetime-local" :rules="[rules.required]" hide-details="auto" />
                </v-col>
              </v-row>
            </v-card>
          </template>

          <v-text-field
            v-model="form.diagnosis"
            label="Diagnóstico (opcional)"
            prepend-inner-icon="mdi-clipboard-pulse-outline"
            class="mb-2 mt-2"
          />
          <v-textarea v-model="form.notes" label="Notas (opcional)" rows="2" auto-grow prepend-inner-icon="mdi-note-text-outline" />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">Crear tratamiento</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { DOSE_UNITS, ROUTES } from '@/modules/health/constants'

export default {
  name: 'TreatmentFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      animal: null,
      mode: 'protocol',
      doseUnits: DOSE_UNITS,
      routes: ROUTES,
      form: { protocol: null, start_at: '', name: '', diagnosis: '', notes: '', items: [] },
      rules: {
        required: (v) => (v !== null && v !== undefined && v !== '') || 'Campo requerido',
        positive: (v) => Number(v) > 0 || 'Debe ser mayor que cero',
      },
    }
  },
  computed: {
    ...mapGetters('auth', ['isFarmAdmin']),
    ...mapGetters('health', ['treatmentProtocols']),
    ...mapGetters('configuration', ['activeMedications']),
    medications() {
      return this.activeMedications
    },
  },
  methods: {
    ...mapActions('health', ['createTreatment', 'fetchProtocols']),
    ...mapActions('shared', ['fetchState']),
    // Called from the parent via ref: open(animal)
    open(animal) {
      this.animal = animal
      this.mode = 'protocol'
      this.form = { protocol: null, start_at: this.nowLocal(), name: '', diagnosis: '', notes: '', items: [] }
      this.error = ''
      this.dialog = true
      // Cargar catálogos necesarios para ambos modos.
      if (!this.treatmentProtocols.length) {
        this.fetchProtocols({ type: 'TREATMENT' }).catch(() => {})
      }
      if (!this.medications.length) {
        this.fetchState({ module: 'configuration', nameState: 'medications', url: '/configuration/medications/' }).catch(() => {})
      }
    },
    close() {
      this.dialog = false
    },
    nowLocal() {
      const now = new Date()
      const off = now.getTimezoneOffset() * 60000
      return new Date(now - off).toISOString().slice(0, 16)
    },
    addItem() {
      this.form.items.push({
        medication: null,
        dose_amount: '',
        dose_unit: 'ML',
        route: 'IM',
        scheduled_at: this.nowLocal(),
      })
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return
      if (this.mode === 'adhoc' && !this.form.items.length) {
        this.error = 'Agrega al menos una aplicación.'
        return
      }

      this.saving = true
      this.error = ''
      try {
        const data = {}
        if (this.form.diagnosis.trim()) data.diagnosis = this.form.diagnosis.trim()
        if (this.form.notes.trim()) data.notes = this.form.notes.trim()

        if (this.mode === 'protocol') {
          data.protocol = this.form.protocol
          data.start_at = new Date(this.form.start_at).toISOString()
        } else {
          data.name = this.form.name.trim()
          data.applications = this.form.items.map((i) => ({
            medication: i.medication,
            dose_amount: i.dose_amount,
            dose_unit: i.dose_unit,
            route: i.route || null,
            scheduled_at: new Date(i.scheduled_at).toISOString(),
          }))
        }

        const treatment = await this.createTreatment({ animalId: this.animal.id, data })
        this.$emit('saved', { treatment })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo crear el tratamiento')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
