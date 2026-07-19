<template>
  <v-dialog v-model="dialog" max-width="460" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="accent" class="mr-2">mdi-logout-variant</v-icon>
        Sacar del hato
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <!-- Cargando el catálogo de motivos -->
        <v-skeleton-loader v-if="loadingReasons" type="list-item-two-line" class="mb-2" />

        <!-- Sin motivos configurados: no se puede inactivar todavía -->
        <template v-else-if="!reasons.length">
          <v-alert type="warning" class="mb-2">
            <p class="font-weight-medium mb-1">No hay motivos de inactivación</p>
            <p class="text-body-2 mb-0">
              Para sacar un animal del hato primero registra los motivos de salida
              (muerte, venta, regalo…) en el catálogo de la finca.
              <template v-if="!isFarmAdmin">Pídele a un administrador que los cree.</template>
            </p>
          </v-alert>
          <v-btn
            v-if="isFarmAdmin"
            color="primary"
            variant="text"
            prepend-icon="mdi-cog-outline"
            :to="{ name: 'config-inactivation-reasons' }"
          >
            Registrar motivos
          </v-btn>
        </template>

        <!-- Formulario de salida -->
        <template v-else>
          <p class="text-caption text-medium-emphasis mb-4">
            <strong>{{ animal && animal.name }}</strong> saldrá del hato activo con su motivo y
            fecha. Su historial (pesajes, reproducción, genealogía) se conserva.
          </p>

          <v-form ref="form" @submit.prevent="handleSubmit">
            <v-select
              v-model="form.reason"
              label="Motivo *"
              :items="reasons"
              item-title="name"
              item-value="id"
              prepend-inner-icon="mdi-logout-variant"
              :rules="[rules.required]"
              class="mb-2"
            />
            <v-text-field
              v-model="form.date"
              label="Fecha de salida *"
              type="date"
              :max="today"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-calendar-outline"
              class="mb-2"
            />
            <v-textarea
              v-model="form.notes"
              label="Notas (opcional)"
              placeholder="Comprador, causa de la muerte, destino…"
              rows="2"
              auto-grow
              prepend-inner-icon="mdi-note-text-outline"
            />
          </v-form>
        </template>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">
          {{ reasons.length ? 'Cancelar' : 'Cerrar' }}
        </v-btn>
        <v-btn
          v-if="reasons.length"
          color="accent"
          variant="flat"
          :loading="saving"
          @click="handleSubmit"
        >
          Sacar del hato
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'InactivateAnimalDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      loadingReasons: false,
      error: '',
      animal: null,
      form: { reason: null, date: '', notes: '' },
      rules: {
        required: (v) => !!v || 'Campo requerido',
      },
    }
  },
  computed: {
    ...mapGetters('auth', ['isFarmAdmin']),
    ...mapGetters('configuration', { reasons: 'activeInactivationReasons' }),
    today() {
      return new Date().toISOString().slice(0, 10)
    },
  },
  methods: {
    ...mapActions('shared', ['fetchState']),
    ...mapActions('livestock', ['inactivateAnimal']),
    // Called from the parent via ref: open(animal)
    open(animal) {
      this.animal = animal
      this.form = { reason: null, date: this.today, notes: '' }
      this.error = ''
      this.dialog = true
      this.loadReasons()
    },
    close() {
      this.dialog = false
    },
    // Siempre re-fetchea al abrir: el catálogo es liviano y así el diálogo ve
    // los motivos recién creados por un admin sin recargar la página.
    async loadReasons() {
      this.loadingReasons = true
      try {
        await this.fetchState({
          module: 'configuration',
          nameState: 'inactivationReasons',
          url: '/configuration/inactivation-reasons/',
        })
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudieron cargar los motivos')
      } finally {
        this.loadingReasons = false
      }
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        const data = { reason: this.form.reason, date: this.form.date }
        if (this.form.notes.trim()) data.notes = this.form.notes.trim()
        const exit = await this.inactivateAnimal({ animalId: this.animal.id, data })
        this.$emit('saved', { animal: this.animal, exit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo sacar el animal del hato')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
