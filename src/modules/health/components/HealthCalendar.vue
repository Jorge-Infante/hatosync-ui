<template>
  <div>
    <!-- Month navigation -->
    <div class="d-flex align-center ga-2 mb-3">
      <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="shiftMonth(-1)" />
      <div class="text-body-1 font-weight-medium hs-cal-title">{{ monthLabel }}</div>
      <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="shiftMonth(1)" />
      <v-spacer />
      <v-btn size="small" variant="tonal" color="primary" @click="goToday">Hoy</v-btn>
    </div>

    <!-- Grid -->
    <div class="hs-cal">
      <div v-for="wd in weekdays" :key="wd" class="hs-cal__wd">{{ wd }}</div>

      <div
        v-for="cell in cells"
        :key="cell.key"
        class="hs-cal__cell"
        :class="{
          'hs-cal__cell--out': !cell.inMonth,
          'hs-cal__cell--today': cell.isToday,
        }"
        @click="onCellClick(cell)"
      >
        <div class="hs-cal__num-row">
          <span class="hs-cal__num" :class="{ 'hs-cal__num--today': cell.isToday }">{{ cell.day }}</span>
        </div>

        <div class="hs-cal__events">
          <v-menu
            v-for="app in cell.apps.slice(0, maxChips)"
            :key="app.id"
            location="bottom center"
            :close-on-content-click="false"
            offset="4"
          >
            <template #activator="{ props: menuProps }">
              <button
                v-bind="menuProps"
                type="button"
                class="hs-cal__event"
                :class="{ 'hs-cal__event--overdue': app.is_overdue, 'hs-cal__event--done': app.status !== 'PENDING' }"
                @click.stop
              >
                <span class="hs-cal__event-dot" />
                <span class="hs-cal__event-text">{{ timeLabel(app.scheduled_at) }} · {{ app.medication_name }}</span>
              </button>
            </template>

            <!-- Event bubble (Google-style) -->
            <v-card min-width="280" max-width="340" class="hs-bubble" elevation="0">
              <div class="hs-bubble__bar" :class="{ 'hs-bubble__bar--overdue': app.is_overdue }" />
              <div class="px-4 pt-3 pb-2">
                <div class="d-flex align-center flex-wrap ga-2 mb-1">
                  <span class="text-body-1 font-weight-medium">{{ app.medication_name }}</span>
                  <v-chip v-if="app.is_overdue" size="x-small" color="error" variant="flat">Vencida</v-chip>
                  <v-chip v-else size="x-small" :color="statusColor(app.status)" variant="tonal">{{ app.status_display }}</v-chip>
                </div>
                <div class="d-flex align-center ga-2 text-body-2 mb-1">
                  <v-icon size="16" class="text-medium-emphasis">mdi-cow</v-icon>
                  <router-link :to="{ name: 'livestock-animal-detail', params: { id: app.animal_id } }" class="hs-bubble__link">
                    {{ app.animal_name }}
                  </router-link>
                </div>
                <div class="d-flex align-center ga-2 text-body-2 text-medium-emphasis mb-1">
                  <v-icon size="16">mdi-needle</v-icon>{{ doseLabel(app) }}<template v-if="app.route_display"> · {{ app.route_display }}</template>
                </div>
                <div class="d-flex align-center ga-2 text-body-2 text-medium-emphasis">
                  <v-icon size="16">mdi-calendar-clock</v-icon>{{ fullDateTime(app.scheduled_at) }}
                </div>
                <p v-if="app.notes" class="text-caption mt-2 mb-0">{{ app.notes }}</p>
                <p v-if="app.applied_by_name" class="text-caption text-medium-emphasis mt-1 mb-0">
                  Registró: {{ app.applied_by_name }}
                </p>
              </div>
              <template v-if="canResolve && app.status === 'PENDING'">
                <v-divider />
                <div class="d-flex ga-2 pa-3">
                  <v-btn size="small" color="success" variant="flat" prepend-icon="mdi-check" @click="$emit('resolve', app, 'apply')">
                    Aplicar
                  </v-btn>
                  <v-btn size="small" variant="text" prepend-icon="mdi-close" @click="$emit('resolve', app, 'skip')">
                    Omitir
                  </v-btn>
                </div>
              </template>
            </v-card>
          </v-menu>

          <button
            v-if="cell.apps.length > maxChips"
            type="button"
            class="hs-cal__more"
            @click.stop="openDay(cell)"
          >
            +{{ cell.apps.length - maxChips }} más
          </button>
        </div>
      </div>
    </div>

    <!-- Day dialog: todas las aplicaciones de un día -->
    <v-dialog v-model="dayDialog" max-width="480" scrollable>
      <v-card>
        <v-card-title class="pt-4 px-6 hs-cal-title">{{ dayDialogLabel }}</v-card-title>
        <v-divider />
        <v-list class="py-1">
          <template v-for="(app, index) in dayDialogApps" :key="app.id">
            <v-divider v-if="index > 0" class="mx-4" />
            <v-list-item class="px-4 py-2">
              <template #prepend>
                <v-avatar size="38" :color="app.is_overdue ? 'error' : statusColor(app.status)" variant="tonal" class="mr-3">
                  <v-icon size="18">mdi-needle</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium d-flex align-center flex-wrap ga-2">
                {{ app.medication_name }}
                <v-chip v-if="app.is_overdue" size="x-small" color="error" variant="flat">Vencida</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="mt-1">
                {{ app.animal_name }} · {{ doseLabel(app) }} · {{ timeLabel(app.scheduled_at) }}
              </v-list-item-subtitle>
              <template #append>
                <div v-if="canResolve && app.status === 'PENDING'" class="d-flex ga-1">
                  <v-btn icon variant="tonal" color="success" size="small" @click="$emit('resolve', app, 'apply')">
                    <v-icon>mdi-check</v-icon>
                    <v-tooltip activator="parent" location="top">Aplicar</v-tooltip>
                  </v-btn>
                  <v-btn icon variant="text" size="small" @click="$emit('resolve', app, 'skip')">
                    <v-icon>mdi-close</v-icon>
                    <v-tooltip activator="parent" location="top">Omitir</v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-list>
        <v-divider />
        <v-card-actions class="px-4 pb-3">
          <v-spacer />
          <v-btn variant="text" @click="dayDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { HEALTH_STATUS_META } from '@/modules/health/constants'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Clave de día en hora local (YYYY-MM-DD). A nivel de módulo para poder usarla
// en data() sin depender del orden de inicialización de los métodos.
function dayKeyOf(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default {
  name: 'HealthCalendar',
  props: {
    applications: { type: Array, default: () => [] },
    canResolve: { type: Boolean, default: false },
  },
  emits: ['resolve'],
  data() {
    const now = new Date()
    return {
      weekdays: WEEKDAYS,
      cursorYear: now.getFullYear(),
      cursorMonth: now.getMonth(),
      todayKey: dayKeyOf(now),
      maxChips: 3,
      dayDialog: false,
      dayDialogKey: null,
    }
  },
  computed: {
    // Aplicaciones agrupadas por día local (YYYY-MM-DD).
    appsByDay() {
      const map = {}
      this.applications.forEach((app) => {
        const key = dayKeyOf(new Date(app.scheduled_at))
        if (!map[key]) map[key] = []
        map[key].push(app)
      })
      Object.values(map).forEach((list) => list.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)))
      return map
    },
    monthLabel() {
      return `${MONTHS[this.cursorMonth]} ${this.cursorYear}`
    },
    // 6 semanas × 7 días, empezando en lunes.
    cells() {
      const first = new Date(this.cursorYear, this.cursorMonth, 1)
      const startOffset = (first.getDay() + 6) % 7 // lunes = 0
      const start = new Date(this.cursorYear, this.cursorMonth, 1 - startOffset)
      const out = []
      for (let i = 0; i < 42; i += 1) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
        const key = dayKeyOf(d)
        out.push({
          key,
          day: d.getDate(),
          inMonth: d.getMonth() === this.cursorMonth,
          isToday: key === this.todayKey,
          apps: this.appsByDay[key] || [],
        })
      }
      return out
    },
    dayDialogApps() {
      return this.dayDialogKey ? this.appsByDay[this.dayDialogKey] || [] : []
    },
    dayDialogLabel() {
      if (!this.dayDialogKey) return ''
      const [y, m, d] = this.dayDialogKey.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    },
  },
  watch: {
    // Enfocar el mes de la aplicación más próxima si el mes actual no tiene
    // ninguna (útil si todas están por venir o vencidas).
    applications: {
      immediate: true,
      handler(apps) {
        if (!apps || !apps.length) return
        const hasThisMonth = apps.some((a) => {
          const ad = new Date(a.scheduled_at)
          return ad.getFullYear() === this.cursorYear && ad.getMonth() === this.cursorMonth
        })
        if (!hasThisMonth) {
          const earliest = apps.reduce((min, a) => (new Date(a.scheduled_at) < new Date(min.scheduled_at) ? a : min))
          const d = new Date(earliest.scheduled_at)
          this.cursorYear = d.getFullYear()
          this.cursorMonth = d.getMonth()
        }
      },
    },
  },
  methods: {
    shiftMonth(delta) {
      const d = new Date(this.cursorYear, this.cursorMonth + delta, 1)
      this.cursorYear = d.getFullYear()
      this.cursorMonth = d.getMonth()
    },
    goToday() {
      const now = new Date()
      this.cursorYear = now.getFullYear()
      this.cursorMonth = now.getMonth()
    },
    onCellClick(cell) {
      // Tocar el día (fuera de un evento) abre el detalle del día si tiene más
      // de los que se muestran o si es cómodo verlos todos.
      if (cell.apps.length) this.openDay(cell)
    },
    openDay(cell) {
      this.dayDialogKey = cell.key
      this.dayDialog = true
    },
    statusColor(status) {
      return (HEALTH_STATUS_META[status] || {}).color || 'secondary'
    },
    doseLabel(app) {
      const unit = app.dose_unit_display || app.dose_unit || ''
      return `${app.dose_amount} ${unit}`.trim()
    },
    timeLabel(dt) {
      return new Date(dt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    },
    fullDateTime(dt) {
      return new Date(dt).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    },
  },
}
</script>

<style scoped>
.hs-cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.hs-cal__wd {
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(34, 43, 35, 0.55);
  padding-bottom: 2px;
}
.hs-cal__cell {
  min-height: 104px;
  border: 1px solid rgba(46, 82, 51, 0.12);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  padding: 5px 5px 6px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  overflow: hidden;
}
.hs-cal__cell:hover {
  border-color: rgba(46, 125, 50, 0.45);
}
.hs-cal__cell--out {
  opacity: 0.5;
}
.hs-cal__cell--today {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(46, 125, 50, 0.04);
}
.hs-cal__num-row {
  display: flex;
  justify-content: flex-end;
}
.hs-cal__num {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(34, 43, 35, 0.75);
  line-height: 1.4;
  padding: 0 3px;
}
.hs-cal__num--today {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-radius: 999px;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.hs-cal__events {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 2px;
}
.hs-cal__event {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  text-align: left;
  border: none;
  border-radius: 6px;
  padding: 2px 6px;
  cursor: pointer;
  background: rgba(46, 125, 50, 0.12);
  transition: background-color 0.15s ease;
}
.hs-cal__event:hover {
  background: rgba(46, 125, 50, 0.22);
}
.hs-cal__event--overdue {
  background: rgba(179, 64, 47, 0.14);
}
.hs-cal__event--overdue:hover {
  background: rgba(179, 64, 47, 0.24);
}
.hs-cal__event--done {
  opacity: 0.6;
}
.hs-cal__event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}
.hs-cal__event--overdue .hs-cal__event-dot {
  background: rgb(var(--v-theme-error));
}
.hs-cal__event-text {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-cal__more {
  border: none;
  background: transparent;
  font-size: 0.66rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  text-align: left;
  padding: 1px 6px;
}
.hs-cal__more:hover {
  text-decoration: underline;
}
.hs-cal-title {
  text-transform: capitalize;
}

.hs-bubble {
  border: 1px solid rgba(46, 82, 51, 0.18);
  border-radius: 14px !important;
  overflow: hidden;
  box-shadow: 0 14px 32px -16px rgba(27, 43, 29, 0.3) !important;
}
.hs-bubble__bar {
  height: 4px;
  background: rgb(var(--v-theme-primary));
}
.hs-bubble__bar--overdue {
  background: rgb(var(--v-theme-error));
}
.hs-bubble__link {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  text-decoration: none;
}
.hs-bubble__link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .hs-cal {
    gap: 3px;
  }
  .hs-cal__cell {
    min-height: 76px;
    border-radius: 9px;
    padding: 3px;
  }
  .hs-cal__event {
    padding: 2px 4px;
  }
  .hs-cal__event-dot {
    display: none;
  }
  .hs-cal__event-text {
    font-size: 0.62rem;
  }
}
</style>
