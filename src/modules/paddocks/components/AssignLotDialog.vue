<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="pt-4 px-6">Meter lote al potrero</v-card-title>
      <v-card-text class="px-6">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Potrero <strong>{{ paddock && paddock.name }}</strong
          >. Si el lote está en otro potrero, su estadía se cierra automáticamente con la fecha de entrada.
        </p>

        <v-select
          v-model="form.lot"
          label="Lote"
          :items="lotOptions"
          item-title="name"
          item-value="id"
          :loading="loadingLots"
          :hint="moveHint"
          persistent-hint
          class="mb-3"
        />

        <v-text-field v-model="form.entered_on" label="Fecha de entrada" type="date" :max="today" class="mb-2" />

        <v-textarea v-model="form.notes" label="Notas (opcional)" rows="2" auto-grow />
      </v-card-text>
      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" :disabled="!form.lot" @click="save">
          Registrar entrada
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'AssignLotDialog',
  emits: ['saved', 'error'],
  data() {
    return {
      dialog: false,
      paddock: null,
      loadingLots: false,
      saving: false,
      form: { lot: null, entered_on: '', notes: '' },
    }
  },
  computed: {
    ...mapGetters('configuration', { lots: 'activeLots' }),
    today() {
      return new Date().toISOString().slice(0, 10)
    },
    lotOptions() {
      // No ofrecer los lotes que ya están en ESTE potrero.
      const currentIds = (this.paddock?.rotation?.current_lots || []).map((l) => l.id)
      return this.lots.filter((lot) => !currentIds.includes(lot.id))
    },
    moveHint() {
      const lot = this.lots.find((l) => l.id === this.form.lot)
      const current = lot && lot.current_paddock
      if (!current) return ''
      return `${lot.name} está en ${current.name}: se moverá a este potrero.`
    },
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'createItem']),
    async open(paddock) {
      this.paddock = paddock
      this.form = { lot: null, entered_on: this.today, notes: '' }
      this.dialog = true
      this.loadingLots = true
      try {
        // Refresca los lotes para tener su potrero actual al día (moveHint).
        await this.fetchState({ module: 'configuration', nameState: 'lots', url: '/configuration/lots/' })
      } catch {
        // El select puede seguir usando el snapshot que ya hubiera en el store.
      } finally {
        this.loadingLots = false
      }
    },
    close() {
      this.dialog = false
    },
    async save() {
      this.saving = true
      try {
        await this.createItem({
          module: 'paddocks',
          nameState: 'stays',
          url: '/farms/paddock-stays/',
          data: {
            paddock: this.paddock.id,
            lot: this.form.lot,
            entered_on: this.form.entered_on || this.today,
            notes: this.form.notes || '',
          },
        })
        this.dialog = false
        this.$emit('saved')
      } catch (e) {
        this.$emit('error', getErrorMessage(e, 'No se pudo registrar la entrada al potrero'))
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
