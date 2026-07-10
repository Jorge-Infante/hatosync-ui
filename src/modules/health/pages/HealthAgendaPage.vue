<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">Sanidad de la finca</p>
        <h1 class="text-h5 font-weight-bold">Agenda</h1>
        <p class="text-body-2 text-medium-emphasis">
          Aplicaciones programadas en {{ activeFarmName || 'tu finca' }}. Los tratamientos se crean
          desde la ficha de cada animal.
        </p>
      </div>
      <v-btn v-if="isFarmAdmin" variant="tonal" color="primary" prepend-icon="mdi-clipboard-list-outline" :to="{ name: 'health-protocols' }">
        Protocolos
      </v-btn>
    </div>

    <!-- Toolbar: status filter + overdue counter -->
    <div class="d-flex flex-wrap align-center ga-3 mb-4 rise rise-d1">
      <v-btn-toggle v-model="statusFilter" mandatory density="comfortable" color="primary" variant="outlined" divided>
        <v-btn value="PENDING" size="small">Pendientes</v-btn>
        <v-btn value="ALL" size="small">Todas</v-btn>
      </v-btn-toggle>
      <v-spacer class="d-none d-sm-block" />
      <div class="d-flex ga-2">
        <v-chip color="warning" prepend-icon="mdi-clock-outline">{{ pendingCount }} pendientes</v-chip>
        <v-chip v-if="overdueApplications.length" color="error" prepend-icon="mdi-alert-outline">
          {{ overdueApplications.length }} vencidas
        </v-chip>
      </div>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="list-item-avatar@6" class="border rounded-xl rise rise-d2" />

    <!-- Empty -->
    <v-card v-else-if="scheduledApplications.length === 0" class="pa-10 text-center rise rise-d2">
      <v-icon size="56" color="primary" class="mb-3">mdi-calendar-check-outline</v-icon>
      <h2 class="text-h6 font-weight-bold mb-1">
        {{ statusFilter === 'PENDING' ? 'Nada pendiente por aplicar' : 'Sin aplicaciones registradas' }}
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Abre un animal y usa <strong>Nuevo tratamiento</strong> en la pestaña Sanidad para programar
        sus aplicaciones; aparecerán aquí.
      </p>
    </v-card>

    <!-- Pendientes → calendario -->
    <HealthCalendar
      v-else-if="statusFilter === 'PENDING'"
      class="rise rise-d2"
      :applications="scheduledApplications"
      :can-resolve="canResolve"
      @resolve="openResolver"
    />

    <!-- Todas → lista -->
    <v-card v-else class="rise rise-d2">
      <v-list class="py-1">
        <template v-for="(app, index) in scheduledApplications" :key="app.id">
          <v-divider v-if="index > 0" class="mx-4" />
          <v-list-item class="hs-agenda-row px-4 py-3">
            <template #prepend>
              <v-avatar size="42" :color="app.is_overdue ? 'error' : statusColor(app.status)" variant="tonal" class="mr-3">
                <v-icon size="20">{{ statusIcon(app.status) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium d-flex align-center flex-wrap ga-2">
              {{ app.medication_name }}
              <v-chip v-if="app.is_overdue" size="x-small" color="error" variant="flat">Vencida</v-chip>
              <v-chip v-else-if="app.status !== 'PENDING'" size="x-small" :color="statusColor(app.status)" variant="tonal">
                {{ app.status_display }}
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="mt-1">
              <router-link :to="{ name: 'livestock-animal-detail', params: { id: app.animal_id } }" class="hs-agenda-animal">
                {{ app.animal_name }}
              </router-link>
              · {{ doseLabel(app) }}
              <span v-if="app.route_display"> · {{ app.route_display }}</span>
            </v-list-item-subtitle>
            <v-list-item-subtitle class="mt-1">
              <v-icon size="14" class="mr-1">mdi-calendar-clock</v-icon>{{ formatDateTime(app.scheduled_at) }}
            </v-list-item-subtitle>

            <template #append>
              <div v-if="canResolve && app.status === 'PENDING'" class="d-flex align-center ga-1">
                <v-btn icon variant="tonal" color="success" size="small" @click="openResolver(app, 'apply')">
                  <v-icon>mdi-check</v-icon>
                  <v-tooltip activator="parent" location="top">Aplicar</v-tooltip>
                </v-btn>
                <v-btn icon variant="text" size="small" @click="openResolver(app, 'skip')">
                  <v-icon>mdi-close</v-icon>
                  <v-tooltip activator="parent" location="top">Omitir</v-tooltip>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <ApplicationResolver ref="resolver" @resolved="onResolved" />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { HEALTH_STATUS_META } from '@/modules/health/constants'
import ApplicationResolver from '@/modules/health/components/ApplicationResolver.vue'
import HealthCalendar from '@/modules/health/components/HealthCalendar.vue'

export default {
  name: 'HealthAgendaPage',
  components: { ApplicationResolver, HealthCalendar },
  data() {
    return {
      loading: false,
      statusFilter: 'PENDING',
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('auth', ['activeFarmName', 'isFarmAdmin', 'isPartner']),
    ...mapGetters('health', ['scheduledApplications', 'overdueApplications', 'allApplications']),
    // El socio ve su agenda pero no resuelve aplicaciones.
    canResolve() {
      return !this.isPartner
    },
    pendingCount() {
      return this.allApplications.filter((a) => a.status === 'PENDING').length
    },
  },
  watch: {
    statusFilter() {
      this.loadAgenda()
    },
  },
  created() {
    this.loadAgenda()
  },
  methods: {
    ...mapActions('health', ['fetchApplications']),
    async loadAgenda() {
      this.loading = true
      try {
        const params = this.statusFilter === 'PENDING' ? { status: 'PENDING' } : {}
        await this.fetchApplications(params)
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo cargar la agenda'), 'error')
      } finally {
        this.loading = false
      }
    },
    openResolver(app, action) {
      this.$refs.resolver.open(app, action)
    },
    onResolved({ action }) {
      this.notify(action === 'apply' ? 'Aplicación registrada' : 'Aplicación omitida')
      this.loadAgenda()
    },
    statusColor(status) {
      return (HEALTH_STATUS_META[status] || {}).color || 'secondary'
    },
    statusIcon(status) {
      return (HEALTH_STATUS_META[status] || {}).icon || 'mdi-needle'
    },
    doseLabel(app) {
      const unit = app.dose_unit_display || app.dose_unit || ''
      return `${app.dose_amount} ${unit}`.trim()
    },
    formatDateTime(dt) {
      if (!dt) return '—'
      return new Date(dt).toLocaleString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>

<style scoped>
.hs-agenda-row {
  transition: background-color 0.18s ease;
}
.hs-agenda-row:hover {
  background: rgba(46, 125, 50, 0.05);
}
.hs-agenda-animal {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  text-decoration: none;
}
.hs-agenda-animal:hover {
  text-decoration: underline;
}
</style>
