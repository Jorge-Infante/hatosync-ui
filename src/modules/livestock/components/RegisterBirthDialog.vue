<template>
  <v-dialog v-model="dialog" max-width="560" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-baby-bottle-outline</v-icon>
        Registrar parto
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-caption text-medium-emphasis mb-4">
          Se registrará un parto de <strong>{{ mother && mother.name }}</strong>. Si la cría nació
          viva, también se creará en el inventario con madre, padre y fecha ya enlazados.
        </p>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.date"
                label="Fecha del parto *"
                type="date"
                :max="today"
                prepend-inner-icon="mdi-calendar-outline"
                :rules="[rules.required]"
                class="mb-2"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="form.sire"
                label="Toro / padre (opcional)"
                :items="sireOptions"
                prepend-inner-icon="mdi-cow"
                clearable
                no-data-text="No hay machos registrados"
                class="mb-2"
              />
            </v-col>
          </v-row>

          <v-switch
            v-model="withCalf"
            color="primary"
            label="La cría nació viva"
            hide-details
            class="mb-2"
          />

          <v-expand-transition>
            <v-row v-if="withCalf" dense>
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="form.calfName"
                  label="Nombre de la cría *"
                  prepend-inner-icon="mdi-tag-outline"
                  :rules="withCalf ? [rules.required] : []"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" sm="5">
                <v-select
                  v-model="form.calfSex"
                  label="Sexo *"
                  :items="sexOptions"
                  prepend-inner-icon="mdi-gender-male-female"
                  :rules="withCalf ? [rules.required] : []"
                  class="mb-2"
                />
              </v-col>
            </v-row>
          </v-expand-transition>

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
        <v-btn color="primary" :loading="saving" @click="handleSubmit">Registrar parto</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

const emptyForm = (today) => ({
  date: today,
  sire: null,
  calfName: '',
  calfSex: null,
  notes: '',
})

export default {
  name: 'RegisterBirthDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      mother: null,
      withCalf: true,
      form: emptyForm(''),
      sexOptions: [
        { title: 'Hembra', value: 'FEMALE' },
        { title: 'Macho', value: 'MALE' },
      ],
      rules: {
        required: (v) => !!v || 'Campo requerido',
      },
    }
  },
  computed: {
    ...mapGetters('livestock', ['males']),
    today() {
      return new Date().toISOString().slice(0, 10)
    },
    sireOptions() {
      return this.males.map((animal) => ({ title: animal.name, value: animal.id }))
    },
  },
  methods: {
    ...mapActions('livestock', ['registerBirth']),
    // Called from the parent via ref: open(motherAnimal)
    open(mother) {
      this.mother = mother
      this.withCalf = true
      this.form = emptyForm(this.today)
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    buildPayload() {
      const payload = { date: this.form.date }
      if (this.form.sire) payload.sire = this.form.sire
      if (this.form.notes) payload.notes = this.form.notes
      if (this.withCalf) payload.calf = { name: this.form.calfName, sex: this.form.calfSex }
      return payload
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        await this.registerBirth({ animalId: this.mother.id, data: this.buildPayload() })
        this.$emit('saved', {
          mother: this.mother,
          calfName: this.withCalf ? this.form.calfName : null,
        })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo registrar el parto')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
