<template>
  <v-card class="kpi-card pa-4 fill-height">
    <div class="d-flex align-center justify-space-between mb-2">
      <p class="hs-overline mb-0">{{ label }}</p>
      <v-icon size="18" :color="iconColor">{{ icon }}</v-icon>
    </div>

    <div class="d-flex align-baseline ga-2 flex-wrap">
      <span class="kpi-card__value">{{ value }}</span>
      <v-chip
        v-if="deltaPct !== null && deltaPct !== undefined"
        size="x-small"
        :color="deltaColor"
        variant="tonal"
        class="font-weight-medium"
      >
        <v-icon start size="12">{{ deltaIcon }}</v-icon>
        {{ Math.abs(deltaPct) }}%
      </v-chip>
    </div>

    <p v-if="caption" class="kpi-card__caption mb-0">{{ caption }}</p>
    <slot />
  </v-card>
</template>

<script>
/**
 * Card de indicador anual: número grande (serif de marca) + variación contra
 * el mismo periodo del año anterior + caption de contexto. El delta usa
 * success/error (más producción = bueno); sin año anterior no muestra chip.
 */
export default {
  name: 'KpiCard',
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    icon: { type: String, required: true },
    iconColor: { type: String, default: 'primary' },
    deltaPct: { type: Number, default: null },
    caption: { type: String, default: '' },
  },
  computed: {
    deltaIcon() {
      if (this.deltaPct > 0) return 'mdi-arrow-up-thin'
      if (this.deltaPct < 0) return 'mdi-arrow-down-thin'
      return 'mdi-equal'
    },
    deltaColor() {
      if (this.deltaPct > 0) return 'success'
      if (this.deltaPct < 0) return 'error'
      return 'secondary'
    },
  },
}
</script>

<style scoped>
.kpi-card__value {
  font-family: var(--hs-font-display);
  font-weight: 600;
  font-size: 2.1rem;
  line-height: 1.1;
  color: rgb(var(--v-theme-on-surface));
}
.kpi-card__caption {
  font-size: 0.75rem;
  color: rgba(34, 43, 35, 0.6);
  margin-top: 6px;
}
</style>
