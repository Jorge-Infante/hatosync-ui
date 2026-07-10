<template>
  <v-dialog v-model="dialog" max-width="760" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-clipboard-list-outline' }}</v-icon>
        {{ isEdit ? 'Editar protocolo' : 'Nuevo protocolo' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <!-- Sin medicamentos: no se puede armar un protocolo -->
        <v-alert v-if="!medications.length" type="info" variant="tonal" class="mb-4">
          Primero registra medicamentos en
          <router-link :to="{ name: 'config-medications' }" class="font-weight-medium">Configuración → Medicamentos</router-link>
          para poder añadirlos al protocolo.
        </v-alert>

        <v-form ref="form">
          <v-text-field
            v-model="form.name"
            label="Nombre del protocolo *"
            prepend-inner-icon="mdi-clipboard-text-outline"
            :rules="[rules.required]"
            class="mb-2"
          />
          <v-textarea
            v-model="form.description"
            label="Descripción (opcional)"
            rows="2"
            auto-grow
            prepend-inner-icon="mdi-note-text-outline"
            class="mb-4"
          />

          <p class="hs-overline mb-1">Calendario de aplicaciones</p>
          <p class="text-caption text-medium-emphasis mb-3">
            El <strong>día</strong> es relativo al inicio del tratamiento: 0 = el día que empieza,
            1 = al día siguiente, 7 = una semana después. Puedes mezclar medicamentos distintos en
            días distintos.
          </p>

          <!-- Generador de pauta repetida -->
          <v-expansion-panels v-if="medications.length" class="mb-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon size="18" class="mr-2">mdi-repeat-variant</v-icon>
                Generar pauta repetida
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <p class="text-caption text-medium-emphasis mb-3">
                  Crea varias aplicaciones del mismo medicamento de una vez
                  (p. ej. «cada 3 días, 4 veces»).
                </p>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-select v-model="gen.medication" label="Medicamento" :items="medications" item-title="name" item-value="id" hide-details="auto" />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field v-model="gen.dose_amount" label="Dosis" type="number" min="0" step="0.1" hide-details="auto" />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-select v-model="gen.dose_unit" label="Unidad" :items="doseUnits" hide-details="auto" />
                  </v-col>
                  <v-col cols="6" sm="6">
                    <v-select v-model="gen.route" label="Vía" :items="routes" clearable hide-details="auto" />
                  </v-col>
                  <v-col cols="6" sm="6">
                    <v-text-field v-model.number="gen.startDay" label="Primer día" type="number" min="0" step="1" hide-details="auto" />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-text-field v-model.number="gen.interval" label="Cada" type="number" min="1" step="1" hide-details="auto" />
                  </v-col>
                  <v-col cols="6" sm="4">
                    <v-select v-model="gen.unit" :items="intervalUnits" hide-details="auto" />
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field v-model.number="gen.count" label="N.º de aplicaciones" type="number" min="1" step="1" hide-details="auto" />
                  </v-col>
                </v-row>
                <div class="d-flex align-center mt-3">
                  <span class="text-caption text-medium-emphasis">{{ genPreview }}</span>
                  <v-spacer />
                  <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="generate">
                    Generar
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div class="d-flex align-center mb-2">
            <span class="text-body-2 font-weight-medium">{{ form.items.length }} aplicación(es)</span>
            <v-spacer />
            <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" :disabled="!medications.length" @click="addItem">
              Agregar una
            </v-btn>
          </div>

          <p v-if="!form.items.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
            Aún no hay aplicaciones. Usa «Generar pauta repetida» o «Agregar una».
          </p>

          <v-card v-for="(item, idx) in form.items" :key="item._k" variant="outlined" class="pa-3 mb-3">
            <div class="d-flex align-center mb-2">
              <v-chip size="small" color="primary" variant="tonal">{{ dayChip(item.day) }}</v-chip>
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
                <v-text-field v-model.number="item.day" label="Día *" type="number" min="0" step="1" :rules="[rules.requiredNum]" hint="0 = al iniciar" persistent-hint hide-details="auto" />
              </v-col>
            </v-row>
          </v-card>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Crear protocolo' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { DOSE_UNITS, ROUTES } from '@/modules/health/constants'

const INTERVAL_UNITS = [
  { value: 'days', title: 'días' },
  { value: 'hours', title: 'horas' },
]

export default {
  name: 'ProtocolFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      seq: 0, // clave estable para el v-for (los índices cambian al borrar)
      doseUnits: DOSE_UNITS,
      routes: ROUTES,
      intervalUnits: INTERVAL_UNITS,
      form: { name: '', description: '', items: [] },
      gen: { medication: null, dose_amount: '', dose_unit: 'ML', route: 'IM', startDay: 0, interval: 1, unit: 'days', count: 3 },
      rules: {
        required: (v) => (v !== null && v !== undefined && v !== '') || 'Campo requerido',
        requiredNum: (v) => (v !== null && v !== undefined && v !== '') || 'Campo requerido',
        positive: (v) => Number(v) > 0 || 'Debe ser mayor que cero',
      },
    }
  },
  computed: {
    ...mapGetters('configuration', ['activeMedications']),
    medications() {
      return this.activeMedications
    },
    isEdit() {
      return this.editId !== null
    },
    // Vista previa de lo que generará la pauta.
    genPreview() {
      const count = Number(this.gen.count) || 0
      if (count < 1) return ''
      const step = this.gen.unit === 'hours' ? `${this.gen.interval} h` : `${this.gen.interval} día(s)`
      const days = this.previewDays()
      return `${count} aplicación(es) · cada ${step} · días: ${days.join(', ')}`
    },
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'createItem', 'updateItem']),
    // Called from the parent via ref: open() to create, open(protocol) to edit
    async open(protocol = null) {
      this.editId = protocol ? protocol.id : null
      this.seq = 0
      this.form = protocol
        ? {
            name: protocol.name,
            description: protocol.description || '',
            items: (protocol.items || []).map((i) => this.wrapItem({
              medication: i.medication,
              dose_amount: i.dose_amount,
              dose_unit: i.dose_unit,
              route: i.route || null,
              day: this.hoursToDay(i.offset_hours),
            })),
          }
        : { name: '', description: '', items: [] }
      this.resetGen()
      this.error = ''
      this.dialog = true
      if (!this.medications.length) {
        this.fetchState({
          module: 'configuration',
          nameState: 'medications',
          url: '/configuration/medications/',
        }).catch(() => {})
      }
    },
    close() {
      this.dialog = false
    },
    // Redondea a día entero si el offset es múltiplo de 24; si no, deja el decimal.
    hoursToDay(hours) {
      const h = Number(hours) || 0
      const d = h / 24
      return Number.isInteger(d) ? d : Math.round(d * 100) / 100
    },
    wrapItem(item) {
      return { ...item, _k: this.seq++ }
    },
    dayChip(day) {
      const d = Number(day) || 0
      if (d === 0) return 'Día 0 · al iniciar'
      return Number.isInteger(d) ? `Día ${d}` : `Día ${d}`
    },
    resetGen() {
      this.gen = { medication: null, dose_amount: '', dose_unit: 'ML', route: 'IM', startDay: 0, interval: 1, unit: 'days', count: 3 }
    },
    previewDays() {
      const count = Math.min(Number(this.gen.count) || 0, 12)
      const start = Number(this.gen.startDay) || 0
      const stepDays = this.gen.unit === 'hours' ? (Number(this.gen.interval) || 0) / 24 : Number(this.gen.interval) || 0
      const out = []
      for (let k = 0; k < count; k += 1) {
        const d = start + k * stepDays
        out.push(Number.isInteger(d) ? d : Math.round(d * 100) / 100)
      }
      return out
    },
    nextDay() {
      if (!this.form.items.length) return 0
      const last = this.form.items[this.form.items.length - 1]
      return (Number(last.day) || 0) + 1
    },
    addItem() {
      this.form.items.push(this.wrapItem({
        medication: null,
        dose_amount: '',
        dose_unit: 'ML',
        route: 'IM',
        day: this.nextDay(),
      }))
    },
    generate() {
      if (!this.gen.medication) {
        this.error = 'Elige el medicamento de la pauta.'
        return
      }
      if (!(Number(this.gen.dose_amount) > 0)) {
        this.error = 'La dosis de la pauta debe ser mayor que cero.'
        return
      }
      const count = Number(this.gen.count) || 0
      if (count < 1) {
        this.error = 'La pauta debe generar al menos una aplicación.'
        return
      }
      this.error = ''
      const start = Number(this.gen.startDay) || 0
      const stepDays = this.gen.unit === 'hours' ? (Number(this.gen.interval) || 0) / 24 : Number(this.gen.interval) || 0
      for (let k = 0; k < count; k += 1) {
        const d = start + k * stepDays
        this.form.items.push(this.wrapItem({
          medication: this.gen.medication,
          dose_amount: this.gen.dose_amount,
          dose_unit: this.gen.dose_unit,
          route: this.gen.route || null,
          day: Number.isInteger(d) ? d : Math.round(d * 100) / 100,
        }))
      }
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return
      if (!this.form.items.length) {
        this.error = 'Agrega al menos una aplicación al protocolo.'
        return
      }

      this.saving = true
      this.error = ''
      try {
        // Ordena por día para que el backend reciba la pauta en orden.
        const items = [...this.form.items]
          .sort((a, b) => Number(a.day) - Number(b.day))
          .map((i) => ({
            medication: i.medication,
            dose_amount: i.dose_amount,
            dose_unit: i.dose_unit,
            route: i.route || null,
            offset_hours: Math.round(Number(i.day) * 24),
          }))
        const payload = {
          name: this.form.name,
          protocol_type: 'TREATMENT',
          description: this.form.description || '',
          items,
        }
        if (this.isEdit) {
          await this.updateItem({
            module: 'health',
            nameState: 'protocols',
            url: `/health/protocols/${this.editId}/`,
            data: payload,
          })
        } else {
          await this.createItem({
            module: 'health',
            nameState: 'protocols',
            url: '/health/protocols/',
            data: payload,
          })
        }
        this.$emit('saved', { isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el protocolo')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
