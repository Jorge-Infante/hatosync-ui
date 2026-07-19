<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">mdi-qrcode-plus</v-icon>
        {{ isReplace ? 'Reponer chapeta' : 'Asociar chapeta QR' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-body-2 mb-4">
          Animal: <strong>{{ animal && animal.name }}</strong>
        </p>

        <v-alert v-if="isReplace" type="warning" variant="tonal" density="compact" class="mb-4">
          Este animal ya tiene la chapeta
          <strong style="font-family: monospace">{{ formatCode(animal.tag_code) }}</strong>. Al
          guardar, esa quedará <strong>anulada como perdida</strong> y se asociará la nueva.
        </v-alert>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="code"
            label="Código de la chapeta *"
            hint="Los 9 caracteres impresos bajo el QR (con o sin guiones)"
            placeholder="7Q4K-M2XN-C"
            prepend-inner-icon="mdi-qrcode"
            :rules="[rules.required, rules.code]"
            autofocus
            @keyup.enter="handleSubmit"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isReplace ? 'Reponer' : 'Asociar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { formatCode, isValidCode } from '@/modules/tags/checksum'

export default {
  name: 'TagAssignDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      animal: null,
      code: '',
      rules: {
        required: (v) => !!v || 'Campo requerido',
        code: (v) => !v || isValidCode(v) || 'Código inválido (verifica los 9 caracteres)',
      },
    }
  },
  computed: {
    // Si el animal ya tiene chapeta, asociar una nueva ES una reposición:
    // el backend anula la vigente (LOST) con replace=true.
    isReplace() {
      return Boolean(this.animal && this.animal.tag_code)
    },
  },
  methods: {
    ...mapActions('tags', ['assignTag']),
    formatCode,
    open(animal) {
      this.animal = animal
      this.code = ''
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
        const tag = await this.assignTag({
          code: this.code,
          animal: this.animal.id,
          replace: this.isReplace,
        })
        this.$emit('saved', { tag })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo asociar la chapeta')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
