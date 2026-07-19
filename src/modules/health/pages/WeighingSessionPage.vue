<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'health-jornadas' }" class="mb-3 rise">
      Jornadas
    </v-btn>

    <div class="mb-6 rise">
      <p class="hs-overline mb-1">Jornada de pesaje</p>
      <h1 class="text-h5 font-weight-bold">Pesar en serie</h1>
      <p class="text-body-2 text-medium-emphasis">
        Animal + kg, N veces — pensado para el día de báscula.
      </p>
    </div>

    <v-row class="rise rise-d1">
      <!-- Captura -->
      <v-col cols="12" md="5">
        <v-card class="pa-5">
          <v-select
            v-model="lot"
            label="Lote (opcional)"
            :items="lotOptions"
            prepend-inner-icon="mdi-select-group"
            clearable
            class="mb-2"
          />
          <template v-if="lot && byLot.length">
            <v-progress-linear :model-value="(sessionInLot.length / byLot.length) * 100" rounded height="6" color="primary" class="mb-1" />
            <p class="text-caption text-medium-emphasis mb-3">
              {{ sessionInLot.length }} de {{ byLot.length }} del lote pesados
            </p>
          </template>

          <v-autocomplete
            v-model="animalId"
            label="Animal *"
            :items="animalOptions"
            prepend-inner-icon="mdi-cow"
            :no-data-text="lot ? 'Todos los del lote ya están pesados' : 'Sin animales'"
            class="mb-2"
            @update:model-value="focusWeight"
          />
          <v-text-field
            ref="weightField"
            v-model="weight"
            label="Peso (kg) *"
            type="number"
            min="0"
            step="0.5"
            prepend-inner-icon="mdi-scale"
            class="mb-3"
            @keyup.enter="add"
          />
          <v-btn color="primary" prepend-icon="mdi-plus" block :loading="saving" @click="add">
            Agregar a la sesión
          </v-btn>
        </v-card>
      </v-col>

      <!-- Sesión -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-title class="d-flex align-center">
            Sesión ({{ session.length }})
            <v-spacer />
            <v-chip v-if="session.length" size="small" color="secondary" prepend-icon="mdi-scale">
              {{ totalKg }} kg total
            </v-chip>
          </v-card-title>
          <v-divider />
          <p v-if="!session.length" class="text-body-2 text-medium-emphasis text-center py-8 mb-0">
            Los pesajes de esta sesión aparecerán aquí.
          </p>
          <v-list v-else class="py-1">
            <template v-for="(entry, index) in session" :key="entry.key">
              <v-divider v-if="index > 0" class="mx-4" />
              <v-list-item class="px-4 py-2">
                <template #prepend>
                  <v-avatar size="36" color="primary" variant="tonal" class="mr-3">
                    <v-icon size="18">mdi-scale</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">{{ entry.animal.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ Number(entry.record.weight_kg) }} kg</v-list-item-subtitle>
                <template #append>
                  <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="remove(entry)" />
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'WeighingSessionPage',
  data() {
    return {
      lot: null,
      animalId: null,
      weight: '',
      session: [], // { key, animal, record }
      saving: false,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('livestock', { animals: 'allAnimals' }),
    ...mapGetters('configuration', ['activeLots']),
    lotOptions() {
      return this.activeLots.map((l) => ({ title: l.name, value: l.id }))
    },
    byLot() {
      if (!this.lot) return this.animals
      return this.animals.filter((a) => String(a.lot) === String(this.lot))
    },
    weighedIds() {
      return new Set(this.session.map((s) => s.animal.id))
    },
    animalOptions() {
      return this.byLot
        .filter((a) => !this.weighedIds.has(a.id))
        .map((a) => ({ title: a.lot_name ? `${a.name} · ${a.lot_name}` : a.name, value: a.id }))
    },
    sessionInLot() {
      return this.session.filter((s) => String(s.animal.lot) === String(this.lot))
    },
    totalKg() {
      return this.session.reduce((sum, s) => sum + Number(s.record.weight_kg), 0).toFixed(0)
    },
    today() {
      return new Date().toISOString().slice(0, 10)
    },
  },
  created() {
    if (!this.animals.length) {
      this.fetchState({ module: 'livestock', nameState: 'animals', url: '/livestock/animals/' }).catch(() => {})
    }
    if (!this.activeLots.length) {
      this.fetchState({ module: 'configuration', nameState: 'lots', url: '/configuration/lots/' }).catch(() => {})
    }
  },
  methods: {
    ...mapActions('shared', ['fetchState']),
    ...mapActions('livestock', ['createWeight', 'deleteWeight']),
    // Flujo báscula: elegido el animal, el cursor salta directo al peso.
    focusWeight() {
      this.$nextTick(() => {
        const el = this.$refs.weightField && this.$refs.weightField.$el.querySelector('input')
        if (el) el.focus()
      })
    },
    async add() {
      const animal = this.animals.find((a) => a.id === this.animalId)
      if (!animal) return this.notify('Elige un animal', 'error')
      const kg = Number(String(this.weight).replace(',', '.'))
      if (!this.weight || Number.isNaN(kg) || kg <= 0) return this.notify('Peso inválido', 'error')
      this.saving = true
      try {
        const record = await this.createWeight({ animalId: animal.id, data: { date: this.today, weight_kg: String(kg) } })
        this.session.unshift({ key: record.id, animal, record })
        this.animalId = null
        this.weight = ''
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo registrar el peso'), 'error')
      } finally {
        this.saving = false
      }
    },
    async remove(entry) {
      try {
        await this.deleteWeight({ animalId: entry.animal.id, weightId: entry.record.id })
        this.session = this.session.filter((s) => s.key !== entry.key)
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar'), 'error')
      }
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
