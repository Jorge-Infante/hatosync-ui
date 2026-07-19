<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">Hato agrupado</p>
        <h1 class="text-h5 font-weight-bold">Lotes</h1>
        <p class="text-body-2 text-medium-emphasis">
          Tus animales agrupados por lote de manejo en {{ activeFarmName || 'la finca' }}.
        </p>
      </div>
      <v-btn v-if="isFarmAdmin" variant="tonal" color="primary" prepend-icon="mdi-cog-outline" :to="{ name: 'config-lots' }">
        Administrar lotes
      </v-btn>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="image, image, image" class="rise rise-d1" />

    <!-- Empty: no lots -->
    <v-card v-else-if="!lots.length" class="pa-10 text-center rise rise-d1">
      <v-icon size="56" color="primary" class="mb-3">mdi-select-group</v-icon>
      <h2 class="text-h6 font-weight-bold mb-1">Aún no hay lotes</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ isFarmAdmin
          ? 'Crea lotes (Escotero, Paridas…) para agrupar tu hato.'
          : 'Cuando un administrador cree lotes, verás aquí tus animales agrupados.' }}
      </p>
      <v-btn v-if="isFarmAdmin" color="primary" prepend-icon="mdi-plus" :to="{ name: 'config-lots' }">
        Crear lotes
      </v-btn>
    </v-card>

    <!-- Grid of lots -->
    <v-row v-else dense class="rise rise-d1">
      <v-col v-for="group in groups" :key="group.id" cols="12" sm="6" md="4">
        <v-card class="lot-card pa-4" @click="openLot(group)">
          <div class="d-flex align-center ga-3">
            <v-avatar size="46" :color="group.id === 'none' ? 'secondary' : 'primary'" variant="tonal">
              <v-icon>{{ group.id === 'none' ? 'mdi-help-circle-outline' : 'mdi-select-group' }}</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <p class="font-weight-medium mb-0">{{ group.name }}</p>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ group.count }} {{ group.count === 1 ? 'animal' : 'animales' }}
              </p>
              <p v-if="group.paddock" class="text-caption text-primary mb-0">
                <v-icon size="12">mdi-map-outline</v-icon>
                En {{ group.paddock.name }}
              </p>
            </div>
            <v-icon class="text-medium-emphasis">mdi-chevron-right</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'LotsPage',
  data() {
    return {
      loading: false,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('auth', ['activeFarmName', 'isFarmAdmin']),
    ...mapGetters('configuration', { lots: 'activeLots' }),
    ...mapGetters('livestock', { animals: 'allAnimals' }),
    // Conteo por lote calculado del hato ya cargado + grupo "Sin lote".
    groups() {
      const counts = {}
      let sinLote = 0
      this.animals.forEach((a) => {
        if (a.lot) counts[a.lot] = (counts[a.lot] || 0) + 1
        else sinLote += 1
      })
      const out = this.lots.map((lot) => ({
        id: lot.id,
        name: lot.name,
        count: counts[lot.id] || 0,
        // Potrero donde está el lote hoy (rotación de potreros, derivado en el server).
        paddock: lot.current_paddock || null,
      }))
      if (sinLote > 0) out.push({ id: 'none', name: 'Sin lote', count: sinLote })
      return out
    },
  },
  created() {
    this.load()
  },
  methods: {
    ...mapActions('shared', ['fetchState']),
    async load() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchState({ module: 'configuration', nameState: 'lots', url: '/configuration/lots/' }),
          this.animals.length
            ? Promise.resolve()
            : this.fetchState({ module: 'livestock', nameState: 'animals', url: '/livestock/animals/' }),
        ])
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los lotes'), 'error')
      } finally {
        this.loading = false
      }
    },
    openLot(group) {
      this.$router.push({ name: 'livestock-lot-animals', params: { lotId: group.id } })
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>

<style scoped>
.lot-card {
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}
.lot-card:hover {
  border-color: rgba(46, 125, 50, 0.5);
  background: rgba(46, 125, 50, 0.04);
}
</style>
