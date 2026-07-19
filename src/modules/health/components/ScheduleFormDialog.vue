<template>
  <v-dialog v-model="dialog" max-width="640" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-calendar-sync' }}</v-icon>
        {{ isEdit ? 'Editar programado' : 'Nuevo programado' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-caption text-medium-emphasis mb-4">
          El sistema avisa cuando vence; la jornada se ejecuta desde la app y eso reinicia el ciclo.
        </p>

        <v-form ref="form">
          <v-select
            v-model="form.protocol"
            label="Protocolo *"
            :items="protocolOptions"
            prepend-inner-icon="mdi-clipboard-list-outline"
            :rules="[rules.required]"
            class="mb-2"
          />

          <v-btn-toggle v-model="form.targetMode" mandatory divided density="comfortable" color="primary" variant="outlined" class="mb-4">
            <v-btn value="lot" size="small">Por lote</v-btn>
            <v-btn value="animals" size="small">Animales fijos</v-btn>
          </v-btn-toggle>

          <template v-if="form.targetMode === 'lot'">
            <v-select
              v-model="form.lot"
              label="Lote objetivo *"
              :items="lotOptions"
              prepend-inner-icon="mdi-select-group"
              :rules="[rules.required]"
              hint="Al ejecutar, la jornada se prellenará con los animales que estén en el lote ese día."
              persistent-hint
              class="mb-4"
            />
          </template>
          <template v-else>
            <AnimalMultiSelect
              v-model="form.animals"
              :animals="animals"
              :lots="activeLots"
              :females-only="femalesOnly"
              class="mb-2"
            />
          </template>

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.every_days"
                label="Cada cuántos días *"
                type="number"
                min="1"
                prepend-inner-icon="mdi-calendar-sync"
                :rules="[rules.required, rules.positive]"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.next_due"
                label="Primera fecha *"
                type="date"
                prepend-inner-icon="mdi-calendar-outline"
                :rules="[rules.required]"
              />
            </v-col>
          </v-row>
          <v-textarea v-model="form.notes" label="Notas (opcional)" rows="2" prepend-inner-icon="mdi-note-text-outline" class="mt-1" />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Crear programado' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import AnimalMultiSelect from '@/modules/health/components/AnimalMultiSelect.vue'

const emptyForm = (today) => ({
  protocol: null,
  targetMode: 'lot',
  lot: null,
  animals: [],
  every_days: '90',
  next_due: today,
  notes: '',
})

export default {
  name: 'ScheduleFormDialog',
  components: { AnimalMultiSelect },
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      form: emptyForm(''),
      rules: {
        required: (v) => (v !== null && v !== undefined && v !== '') || 'Campo requerido',
        positive: (v) => Number(v) > 0 || 'Debe ser mayor que cero',
      },
    }
  },
  computed: {
    ...mapGetters('health', ['allProtocols']),
    ...mapGetters('configuration', ['activeLots']),
    ...mapGetters('livestock', { animals: 'allAnimals' }),
    isEdit() {
      return this.editId !== null
    },
    today() {
      return new Date().toISOString().slice(0, 10)
    },
    protocolOptions() {
      return this.allProtocols.map((p) => ({
        title: `${p.name} (${p.protocol_type === 'REPRODUCTIVE' ? 'reproductivo' : 'tratamiento'})`,
        value: p.id,
      }))
    },
    lotOptions() {
      return this.activeLots.map((l) => ({ title: l.name, value: l.id }))
    },
    femalesOnly() {
      const proto = this.allProtocols.find((p) => p.id === this.form.protocol)
      return proto && proto.protocol_type === 'REPRODUCTIVE'
    },
  },
  methods: {
    ...mapActions('shared', ['createItem', 'updateItem', 'fetchState']),
    ...mapActions('health', ['fetchProtocols']),
    // Called from the parent via ref: open() to create, open(schedule) to edit
    open(schedule = null) {
      this.editId = schedule ? schedule.id : null
      this.form = schedule
        ? {
            protocol: schedule.protocol,
            targetMode: schedule.lot ? 'lot' : 'animals',
            lot: schedule.lot || null,
            animals: schedule.animals || [],
            every_days: String(schedule.every_days || 90),
            next_due: schedule.next_due || this.today,
            notes: schedule.notes || '',
          }
        : emptyForm(this.today)
      this.error = ''
      this.dialog = true
      if (!this.allProtocols.length) this.fetchProtocols().catch(() => {})
      if (!this.activeLots.length) {
        this.fetchState({ module: 'configuration', nameState: 'lots', url: '/configuration/lots/' }).catch(() => {})
      }
    },
    close() {
      this.dialog = false
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return
      if (this.form.targetMode === 'animals' && !this.form.animals.length) {
        this.error = 'Selecciona al menos un animal.'
        return
      }
      this.saving = true
      this.error = ''
      try {
        const payload = {
          protocol: this.form.protocol,
          every_days: Number(this.form.every_days),
          next_due: this.form.next_due,
          lot: this.form.targetMode === 'lot' ? this.form.lot : null,
          animals: this.form.targetMode === 'animals' ? this.form.animals : [],
          notes: this.form.notes || '',
        }
        if (this.isEdit) {
          await this.updateItem({
            module: 'health',
            nameState: 'schedules',
            url: `/health/schedules/${this.editId}/`,
            data: payload,
          })
        } else {
          await this.createItem({
            module: 'health',
            nameState: 'schedules',
            url: '/health/schedules/',
            data: payload,
          })
        }
        this.$emit('saved', { isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el programado')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
