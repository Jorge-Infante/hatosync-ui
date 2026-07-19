<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'health-jornadas' }" class="mb-3 rise">
      Jornadas
    </v-btn>

    <div class="mb-6 rise">
      <p class="hs-overline mb-1">Jornada de protocolo</p>
      <h1 class="text-h5 font-weight-bold">
        {{ schedule ? `Ejecutar: ${schedule.protocol_name}` : 'Aplicar protocolo' }}
      </h1>
      <v-chip v-if="schedule" size="small" color="primary" variant="tonal" prepend-icon="mdi-calendar-sync" class="mt-2">
        Programado · cada {{ schedule.every_days }} días{{ schedule.lot_name ? ` · ${schedule.lot_name}` : '' }}
      </v-chip>
      <p v-else class="text-body-2 text-medium-emphasis">
        Un tratamiento por animal; las aplicaciones se programan desde el inicio (IATF: la hora importa).
      </p>
    </div>

    <v-card class="pa-6 rise rise-d1" max-width="760">
      <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <v-select
        v-model="protocol"
        label="Protocolo *"
        :items="protocolOptions"
        prepend-inner-icon="mdi-clipboard-list-outline"
        class="mb-2"
        @update:model-value="onProtocolChange"
      />

      <v-text-field
        v-model="startAt"
        label="Inicio de la jornada *"
        type="datetime-local"
        prepend-inner-icon="mdi-calendar-clock"
        hint="Las aplicaciones de cada animal se programan desde aquí (offset del protocolo)."
        persistent-hint
        class="mb-4"
      />

      <AnimalMultiSelect
        v-model="selected"
        :animals="animals"
        :lots="activeLots"
        :females-only="femalesOnly"
        class="mb-2"
      />

      <v-textarea v-model="notes" label="Notas (opcional)" rows="2" prepend-inner-icon="mdi-note-text-outline" class="mb-4" />

      <v-btn color="primary" prepend-icon="mdi-check" :loading="saving" block @click="submit">
        Crear jornada ({{ selected.length }})
      </v-btn>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import AnimalMultiSelect from '@/modules/health/components/AnimalMultiSelect.vue'

function nowLocal() {
  const now = new Date()
  const off = now.getTimezoneOffset() * 60000
  return new Date(now - off).toISOString().slice(0, 16)
}

export default {
  name: 'BatchFormPage',
  components: { AnimalMultiSelect },
  data() {
    return {
      protocol: null,
      selected: [],
      startAt: nowLocal(),
      notes: '',
      saving: false,
      error: '',
      prefilled: false,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('health', ['allProtocols', 'allSchedules']),
    ...mapGetters('configuration', ['activeLots']),
    ...mapGetters('livestock', { animals: 'allAnimals' }),
    scheduleId() {
      return this.$route.query.schedule || null
    },
    schedule() {
      return this.allSchedules.find((s) => String(s.id) === String(this.scheduleId)) || null
    },
    protocolOptions() {
      return this.allProtocols.map((p) => ({
        title: `${p.name} (${p.protocol_type === 'REPRODUCTIVE' ? 'reproductivo' : 'tratamiento'})`,
        value: p.id,
      }))
    },
    femalesOnly() {
      const proto = this.allProtocols.find((p) => p.id === this.protocol)
      return proto && proto.protocol_type === 'REPRODUCTIVE'
    },
  },
  watch: {
    // Prellenado desde el programado, una vez que hay datos: protocolo +
    // animales del lote AL DÍA DE HOY (o la lista fija).
    schedule: {
      immediate: true,
      handler() {
        this.tryPrefill()
      },
    },
    animals() {
      this.tryPrefill()
    },
  },
  created() {
    this.fetchProtocols().catch(() => {})
    if (this.scheduleId) this.fetchSchedules().catch(() => {})
    if (!this.animals.length) {
      this.fetchState({ module: 'livestock', nameState: 'animals', url: '/livestock/animals/' }).catch(() => {})
    }
    if (!this.activeLots.length) {
      this.fetchState({ module: 'configuration', nameState: 'lots', url: '/configuration/lots/' }).catch(() => {})
    }
  },
  methods: {
    ...mapActions('shared', ['createItem', 'fetchState']),
    ...mapActions('health', ['fetchProtocols', 'fetchSchedules']),
    tryPrefill() {
      if (!this.schedule || this.prefilled || !this.animals.length) return
      this.protocol = this.schedule.protocol
      const proto = this.allProtocols.find((p) => p.id === this.schedule.protocol)
      const onlyF = proto && proto.protocol_type === 'REPRODUCTIVE'
      if (this.schedule.lot) {
        this.selected = this.animals
          .filter((a) => String(a.lot) === String(this.schedule.lot) && (!onlyF || a.sex === 'FEMALE'))
          .map((a) => a.id)
      } else if (Array.isArray(this.schedule.animals)) {
        this.selected = this.schedule.animals
      }
      this.prefilled = true
    },
    onProtocolChange(value) {
      // Cambiar a reproductivo depura machos ya seleccionados.
      const proto = this.allProtocols.find((p) => p.id === value)
      if (proto && proto.protocol_type === 'REPRODUCTIVE') {
        const females = new Set(this.animals.filter((a) => a.sex === 'FEMALE').map((a) => a.id))
        this.selected = this.selected.filter((id) => females.has(id))
      }
    },
    async submit() {
      if (!this.protocol) return (this.error = 'Elige un protocolo.')
      if (!this.selected.length) return (this.error = 'Selecciona al menos un animal.')
      if (!this.startAt) return (this.error = 'Indica fecha y hora de inicio.')
      this.saving = true
      this.error = ''
      try {
        const data = {
          protocol: this.protocol,
          animals: this.selected,
          started_at: new Date(this.startAt).toISOString(),
        }
        if (this.notes.trim()) data.notes = this.notes.trim()
        if (this.scheduleId) data.schedule = this.scheduleId
        await this.createItem({ module: 'health', nameState: 'batches', url: '/reproduction/batches/', data })
        // El server avanza next_due si venía de un programado: refrescar.
        if (this.scheduleId) this.fetchSchedules().catch(() => {})
        this.notify(`Jornada creada: ${this.selected.length} tratamiento(s). Las aplicaciones quedan en la Agenda.`)
        setTimeout(() => this.$router.push({ name: 'health-jornadas' }), 900)
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo crear la jornada')
      } finally {
        this.saving = false
      }
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
