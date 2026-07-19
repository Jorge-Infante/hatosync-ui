<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="hs-paddock-thumb">
    <polygon
      v-if="points"
      :points="points"
      :fill="fillColor"
      :stroke="strokeColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script>
/**
 * Miniatura SVG de la silueta del potrero — dibuja el anillo exterior del
 * GeoJSON normalizado al viewBox, sin cargar un mapa por fila.
 */
export default {
  name: 'PaddockThumb',
  props: {
    geometry: { type: Object, default: null },
    color: { type: String, default: '' },
    width: { type: Number, default: 72 },
    height: { type: Number, default: 48 },
  },
  computed: {
    strokeColor() {
      return this.color || '#2E7D32'
    },
    fillColor() {
      return `${this.strokeColor}33` // ~20% alpha
    },
    points() {
      const ring = this.geometry && this.geometry.coordinates && this.geometry.coordinates[0]
      if (!ring || ring.length < 4) return ''
      const lons = ring.map((p) => p[0])
      const lats = ring.map((p) => p[1])
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const pad = 4
      const spanLon = maxLon - minLon || 1e-9
      const spanLat = maxLat - minLat || 1e-9
      // Escala uniforme (conserva la forma) centrada en el viewBox; la Y del
      // SVG crece hacia abajo, así que la latitud se invierte.
      const scale = Math.min((this.width - pad * 2) / spanLon, (this.height - pad * 2) / spanLat)
      const offsetX = (this.width - spanLon * scale) / 2
      const offsetY = (this.height - spanLat * scale) / 2
      return ring
        .map((p) => {
          const x = offsetX + (p[0] - minLon) * scale
          const y = offsetY + (maxLat - p[1]) * scale
          return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
    },
  },
}
</script>

<style scoped>
.hs-paddock-thumb {
  display: block;
}
</style>
