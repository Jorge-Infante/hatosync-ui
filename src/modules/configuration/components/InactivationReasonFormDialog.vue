<template>
  <v-dialog v-model="dialog" max-width="460" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-logout-variant' }}</v-icon>
        {{ isEdit ? 'Editar motivo' : 'Nuevo motivo de inactivación' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Nombre *"
            placeholder="Muerte, Venta, Regalo…"
            prepend-inner-icon="mdi-logout-variant"
            :rules="[rules.required]"
            autofocus
            @keyup.enter="handleSubmit"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Crear motivo' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'InactivationReasonFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      form: { name: '' },
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
    // Called from the parent via ref: open() to create, open(reason) to edit
    open(reason = null) {
      this.editId = reason ? reason.id : null
      this.form = { name: reason ? reason.name : '' }
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
        const payload = { name: this.form.name }
        if (this.isEdit) {
          await this.updateItem({
            module: 'configuration',
            nameState: 'inactivationReasons',
            url: `/configuration/inactivation-reasons/${this.editId}/`,
            data: payload,
          })
        } else {
          await this.createItem({
            module: 'configuration',
            nameState: 'inactivationReasons',
            url: '/configuration/inactivation-reasons/',
            data: payload,
          })
        }
        this.$emit('saved', { isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el motivo')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
