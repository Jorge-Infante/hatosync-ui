<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-tag-multiple-outline' }}</v-icon>
        {{ isEdit ? 'Editar tipo de identificación' : 'Nuevo tipo de identificación' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Nombre *"
            placeholder="Chapeta, Hierro, Tatuaje…"
            prepend-inner-icon="mdi-tag-outline"
            :rules="[rules.required]"
            autofocus
            class="mb-2"
          />

          <v-switch
            v-model="form.is_unique"
            color="primary"
            label="Valor único en la finca"
            hide-details
            class="mb-1"
          />
          <p class="text-caption text-medium-emphasis ms-1">
            Actívalo cuando el número no se puede repetir entre animales (p. ej. la
            <strong>chapeta</strong>). Déjalo apagado si varios animales pueden compartir el mismo
            valor (p. ej. el <strong>hierro</strong> del lote).
          </p>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Crear tipo' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'IdentificationTypeFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      form: { name: '', is_unique: false },
      rules: {
        required: (v) => !!v || 'Campo requerido',
      },
    }
  },
  computed: {
    isEdit() {
      return this.editId !== null
    },
  },
  methods: {
    ...mapActions('shared', ['createItem', 'updateItem']),
    // Called from the parent via ref: open() to create, open(type) to edit
    open(type = null) {
      this.editId = type ? type.id : null
      this.form = {
        name: type ? type.name : '',
        is_unique: type ? type.is_unique : false,
      }
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
        const payload = { name: this.form.name, is_unique: this.form.is_unique }
        if (this.isEdit) {
          await this.updateItem({
            module: 'configuration',
            nameState: 'identificationTypes',
            url: `/configuration/identification-types/${this.editId}/`,
            data: payload,
          })
        } else {
          await this.createItem({
            module: 'configuration',
            nameState: 'identificationTypes',
            url: '/configuration/identification-types/',
            data: payload,
          })
        }
        this.$emit('saved', { isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el tipo de identificación')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
