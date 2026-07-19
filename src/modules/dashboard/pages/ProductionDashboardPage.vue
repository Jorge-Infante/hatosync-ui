<template>
  <div>
    <!-- Header + selector de año -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">Producción anual</p>
        <h1 class="text-h5 font-weight-bold">Panel de la finca</h1>
        <p class="text-body-2 text-medium-emphasis">
          Partos, destetes y servicios de {{ activeFarmName || 'tu finca' }}, comparados con el
          mismo periodo del año anterior.
        </p>
      </div>
      <div class="d-flex align-center ga-1">
        <v-btn icon="mdi-chevron-left" variant="text" size="small" aria-label="Año anterior" @click="changeYear(-1)" />
        <span class="year-label px-2">{{ year }}</span>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          size="small"
          aria-label="Año siguiente"
          :disabled="year >= currentYear"
          @click="changeYear(1)"
        />
      </div>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- Loading -->
    <template v-if="loading">
      <v-row class="mb-1">
        <v-col v-for="i in 4" :key="i" cols="12" sm="6" lg="3">
          <v-skeleton-loader type="article" class="border rounded-xl" />
        </v-col>
      </v-row>
      <v-skeleton-loader type="image" class="border rounded-xl" />
    </template>

    <template v-else-if="production">
      <!-- KPI cards -->
      <v-row class="mb-1 rise rise-d1">
        <v-col cols="12" sm="6" lg="3">
          <KpiCard
            label="Partos"
            :value="births.current"
            icon="mdi-baby-bottle-outline"
            :delta-pct="births.delta_pct"
            :caption="comparisonCaption(births)"
          >
            <p class="text-caption text-medium-emphasis mb-0">
              {{ births.calves_current }} {{ births.calves_current === 1 ? 'cría nacida' : 'crías nacidas' }}
            </p>
          </KpiCard>
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <KpiCard
            label="Destetes"
            :value="weanings.current"
            icon="mdi-link-variant-off"
            :delta-pct="weanings.delta_pct"
            :caption="comparisonCaption(weanings)"
          >
            <p v-if="weanings.cohort_rate_pct !== null" class="text-caption text-medium-emphasis mb-0">
              Tasa de destete (cohorte): {{ weanings.cohort_rate_pct }}%
            </p>
          </KpiCard>
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <KpiCard
            label="Servicios"
            :value="services.current"
            icon="mdi-heart-outline"
            :delta-pct="services.delta_pct"
            :caption="comparisonCaption(services)"
          >
            <p class="text-caption text-medium-emphasis mb-0">
              {{ services.served_females }} {{ services.served_females === 1 ? 'hembra servida' : 'hembras servidas' }}
              <template v-if="services.per_conception !== null"> · S/C: {{ services.per_conception }}</template>
            </p>
          </KpiCard>
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <KpiCard
            label="Reproducción hoy"
            :value="projection.pregnant_count"
            icon="mdi-stethoscope"
            :caption="`${projection.pregnant_count === 1 ? 'preñada confirmada' : 'preñadas confirmadas'} · ${projection.served_unchecked} sin chequeo`"
            icon-color="secondary"
          >
            <v-chip
              v-if="projection.cows_to_check"
              size="small"
              color="warning"
              variant="tonal"
              prepend-icon="mdi-alert-circle-outline"
              class="mt-1"
            >
              {{ projection.cows_to_check }} por palpar
            </v-chip>
            <p v-else class="text-caption text-medium-emphasis mb-0">Chequeos al día</p>
          </KpiCard>
        </v-col>
      </v-row>

      <!-- Sin datos del año: guía en vez de gráficas vacías -->
      <v-card v-if="yearIsEmpty" class="pa-10 text-center rise rise-d2">
        <v-icon size="56" color="primary" class="mb-3">mdi-chart-bar</v-icon>
        <h2 class="text-h6 font-weight-bold mb-1">Sin eventos en {{ year }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Registra partos, destetes y servicios desde la ficha de cada animal y este panel se
          construye solo.
        </p>
      </v-card>

      <template v-else>
        <!-- Partos por mes -->
        <v-card class="pa-4 pa-md-6 mb-6 rise rise-d2">
          <div class="mb-2">
            <p class="hs-overline mb-1">Distribución</p>
            <h2 class="text-h6 font-weight-bold">Partos por mes</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ year }} en columnas; {{ year - 1 }} como línea de referencia.
            </p>
          </div>
          <BirthsByMonthChart
            :year="year"
            :current-year="birthsByMonth.current_year"
            :previous-year="birthsByMonth.previous_year"
          />
        </v-card>

        <!-- Proyección (solo el año en curso: se calcula desde hoy) -->
        <v-card v-if="year === currentYear" class="pa-4 pa-md-6 mb-6 rise rise-d3">
          <div class="mb-2">
            <p class="hs-overline mb-1">Proyección</p>
            <h2 class="text-h6 font-weight-bold">Partos del año: reales y esperados</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              Confirmados = preñadas con fecha probable. Probables = servidas sin chequeo,
              ponderadas por la tasa de concepción
              ({{ Math.round(projection.conception_rate * 100) }}%
              {{ projection.conception_rate_source === 'FARM_HISTORY' ? 'según la historia de la finca' : 'estimada, aún sin chequeos registrados' }}).
            </p>
          </div>
          <BirthsProjectionChart
            :real="projectionSeries.real"
            :confirmed="projectionSeries.confirmed"
            :probable="projectionSeries.probable"
          />
          <p v-if="nextYearProjected" class="text-caption text-medium-emphasis mb-0 mt-1">
            <v-icon size="14" class="mr-1">mdi-calendar-arrow-right</v-icon>
            {{ nextYearProjected }} {{ nextYearProjected === 1 ? 'parto esperado cae' : 'partos esperados caen' }}
            en {{ year + 1 }}.
          </p>
        </v-card>
      </template>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import KpiCard from '@/modules/dashboard/components/KpiCard.vue'
import BirthsByMonthChart from '@/modules/dashboard/components/BirthsByMonthChart.vue'
import BirthsProjectionChart from '@/modules/dashboard/components/BirthsProjectionChart.vue'

export default {
  name: 'ProductionDashboardPage',
  components: { KpiCard, BirthsByMonthChart, BirthsProjectionChart },
  data() {
    return {
      loading: false,
      error: '',
      year: new Date().getFullYear(),
    }
  },
  computed: {
    ...mapGetters('auth', ['activeFarmName']),
    ...mapGetters('dashboard', { production: 'annualProduction' }),
    currentYear() {
      return new Date().getFullYear()
    },
    births() {
      return this.production.births
    },
    weanings() {
      return this.production.weanings
    },
    services() {
      return this.production.services
    },
    birthsByMonth() {
      return this.production.births_by_month
    },
    projection() {
      return this.production.projection
    },
    yearIsEmpty() {
      return (
        this.births.current === 0 &&
        this.births.previous_total === 0 &&
        this.weanings.current === 0 &&
        this.services.current === 0
      )
    },
    // Series ene..dic del año seleccionado: reales del histórico + esperados
    // de la proyección (llaves 'YYYY-MM' desde hoy hacia adelante).
    projectionSeries() {
      const real = this.birthsByMonth.current_year
      const confirmed = Array(12).fill(0)
      const probable = Array(12).fill(0)
      for (const [key, val] of Object.entries(this.projection.months)) {
        const [y, m] = key.split('-').map(Number)
        if (y !== this.year) continue
        confirmed[m - 1] = val.confirmed
        probable[m - 1] = val.probable
      }
      return { real, confirmed, probable }
    },
    // Preñeces/servicios cuya fecha probable ya cae en el año siguiente.
    nextYearProjected() {
      let total = 0
      for (const [key, val] of Object.entries(this.projection.months)) {
        const y = Number(key.split('-')[0])
        if (y > this.year) total += val.confirmed + val.probable
      }
      return Math.round(total)
    },
  },
  created() {
    this.load()
  },
  methods: {
    ...mapActions('dashboard', ['fetchAnnualProduction']),
    comparisonCaption(block) {
      return `${this.year - 1} a esta fecha: ${block.previous_same_period} · total: ${block.previous_total}`
    },
    changeYear(step) {
      this.year += step
      this.load()
    },
    async load() {
      this.loading = true
      this.error = ''
      try {
        const from = `${this.year}-01-01`
        const to =
          this.year === this.currentYear
            ? new Date().toISOString().slice(0, 10)
            : `${this.year}-12-31`
        await this.fetchAnnualProduction({ from, to })
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo cargar el panel de producción')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.year-label {
  font-family: var(--hs-font-display);
  font-weight: 600;
  font-size: 1.35rem;
  min-width: 4ch;
  text-align: center;
}
</style>
