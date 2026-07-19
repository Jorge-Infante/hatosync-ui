<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="accent" class="mr-2">mdi-qrcode-remove</v-icon>
        Quitar chapeta
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-body-2 mb-4">
          Se quitará la chapeta
          <strong style="font-family: monospace">{{ formatCode(animal && animal.tag_code) }}</strong>
          de <strong>{{ animal && animal.name }}</strong>. ¿Qué pasó con la chapeta física?
        </p>

        <v-radio-group v-model="outcome" hide-details>
          <v-radio value="AVAILABLE">
            <template #label>
              <div>
                <div>Está intacta — queda <strong>disponible</strong> para reutilizarla</div>
              </div>
            </template>
          </v-radio>
          <v-radio value="LOST" label="Se perdió — queda anulada" />
          <v-radio value="DAMAGED" label="Se dañó — queda anulada" />
        </v-radio-group>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="accent" variant="flat" :loading="saving" @click="handleSubmit">Quitar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { formatCode } from '@/modules/tags/checksum'

export default {
  name: 'TagUnassignDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      animal: null,
      outcome: 'AVAILABLE',
    }
  },
  methods: {
    ...mapActions('tags', ['unassignTag']),
    formatCode,
    open(animal) {
      this.animal = animal
      this.outcome = 'AVAILABLE'
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    async handleSubmit() {
      this.saving = true
      this.error = ''
      try {
        await this.unassignTag({
          code: this.animal.tag_code,
          void: this.outcome !== 'AVAILABLE',
          reason: this.outcome !== 'AVAILABLE' ? this.outcome : undefined,
        })
        this.$emit('saved')
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo quitar la chapeta')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
