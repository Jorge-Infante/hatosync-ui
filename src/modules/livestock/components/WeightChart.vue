<template>
  <apexchart type="area" height="260" :options="chartOptions" :series="series" />
</template>

<script>
import VueApexCharts from 'vue3-apexcharts'

/**
 * Curva de peso del animal (control de peso). Una sola serie — el verde de
 * marca sobre papel, línea de 2px con marcadores y tooltip; sin leyenda (el
 * título del tab la nombra) ni etiquetas en cada punto.
 */
export default {
  name: 'WeightChart',
  components: { apexchart: VueApexCharts },
  props: {
    // weight_records de la API (más reciente primero); se grafican ascendentes
    records: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    points() {
      return [...this.records]
        .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1))
        .map((record) => ({ x: record.date, y: Number(record.weight_kg) }))
    },
    series() {
      return [{ name: 'Peso', data: this.points }]
    },
    chartOptions() {
      return {
        chart: {
          fontFamily: 'var(--hs-font-body, "Hanken Grotesk", sans-serif)',
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { easing: 'easeinout', speed: 500 },
        },
        colors: ['#2E7D32'],
        stroke: { curve: 'smooth', width: 2 },
        markers: { size: 4, strokeWidth: 2, strokeColors: '#FDFCF8', hover: { size: 6 } },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 0.6, opacityFrom: 0.22, opacityTo: 0.02 },
        },
        dataLabels: { enabled: false },
        grid: { borderColor: 'rgba(46, 82, 51, 0.12)', strokeDashArray: 3 },
        xaxis: {
          type: 'datetime',
          labels: {
            datetimeUTC: false,
            style: { colors: 'rgba(34, 43, 35, 0.6)' },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          tooltip: { enabled: false },
        },
        yaxis: {
          labels: {
            style: { colors: 'rgba(34, 43, 35, 0.6)' },
            formatter: (value) => `${Math.round(value)} kg`,
          },
        },
        tooltip: {
          x: { format: 'dd MMM yyyy' },
          y: { formatter: (value) => `${value} kg` },
        },
      }
    },
  },
}
</script>
