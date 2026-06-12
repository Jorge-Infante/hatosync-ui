<template>
  <v-dialog v-model="dialog" max-width="560" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-plus' }}</v-icon>
        {{ isEdit ? 'Editar animal' : 'Nuevo animal' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p v-if="!isEdit" class="text-caption text-medium-emphasis mb-4">
          Entrada de inventario: compras o carga del hato inicial. Los nacimientos en la finca
          se registrarán desde la madre con el evento de parto.
        </p>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Nombre *"
            prepend-inner-icon="mdi-tag-outline"
            :rules="[rules.required]"
            class="mb-2"
          />
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.sex"
                label="Sexo *"
                :items="sexOptions"
                prepend-inner-icon="mdi-gender-male-female"
                :rules="[rules.required]"
                class="mb-2"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.birth_date"
                label="Fecha de nacimiento"
                type="date"
                :max="today"
                prepend-inner-icon="mdi-calendar-outline"
                hint="Si se omite, se usa la fecha de hoy"
                persistent-hint
                class="mb-2"
              />
            </v-col>
          </v-row>
          <v-autocomplete
            v-model="form.mother"
            label="Madre (opcional)"
            :items="motherOptions"
            prepend-inner-icon="mdi-cow"
            clearable
            no-data-text="No hay hembras registradas"
            class="mb-2"
          />
          <v-autocomplete
            v-model="form.father"
            label="Padre (opcional)"
            :items="fatherOptions"
            prepend-inner-icon="mdi-cow"
            clearable
            no-data-text="No hay machos registrados"
            class="mb-2"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Registrar animal' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

const emptyForm = () => ({
  name: '',
  sex: null,
  birth_date: '',
  mother: null,
  father: null,
})

export default {
  name: 'AnimalFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      form: emptyForm(),
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
    ...mapGetters('livestock', ['females', 'males']),
    isEdit() {
      return this.editId !== null
    },
    today() {
      return new Date().toISOString().slice(0, 10)
    },
    motherOptions() {
      return this.toOptions(this.females)
    },
    fatherOptions() {
      return this.toOptions(this.males)
    },
  },
  methods: {
    ...mapActions('shared', ['createItem', 'updateItem']),
    toOptions(animals) {
      return animals
        .filter((animal) => animal.id !== this.editId)
        .map((animal) => ({ title: animal.name, value: animal.id }))
    },
    // Called from the parent via ref: open() to create, open(animal) to edit
    open(animal = null) {
      this.editId = animal ? animal.id : null
      this.form = animal
        ? {
            name: animal.name || '',
            sex: animal.sex || null,
            birth_date: animal.birth_date || '',
            mother: animal.mother || null,
            father: animal.father || null,
          }
        : emptyForm()
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    buildPayload() {
      const payload = {
        name: this.form.name,
        sex: this.form.sex,
        mother: this.form.mother,
        father: this.form.father,
      }
      if (this.form.birth_date) payload.birth_date = this.form.birth_date
      if (!this.isEdit) {
        // On create, omit empty optionals (birth_date defaults to today server-side)
        if (payload.mother === null) delete payload.mother
        if (payload.father === null) delete payload.father
      }
      return payload
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        let animal
        if (this.isEdit) {
          animal = await this.updateItem({
            module: 'livestock',
            nameState: 'animals',
            url: `/livestock/animals/${this.editId}/`,
            data: this.buildPayload(),
          })
        } else {
          animal = await this.createItem({
            module: 'livestock',
            nameState: 'animals',
            url: '/livestock/animals/',
            data: this.buildPayload(),
          })
        }
        this.$emit('saved', { animal, isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el animal')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
