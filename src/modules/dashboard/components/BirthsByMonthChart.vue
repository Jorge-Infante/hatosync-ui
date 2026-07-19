<template>
  <apexchart type="line" height="300" :options="chartOptions" :series="series" />
</template>

<script>
import VueApexCharts from 'vue3-apexcharts'
import { MONTH_LABELS } from '@/modules/dashboard/constants'

/**
 * Distribución de partos por mes: columnas del año seleccionado (verde de
 * marca) + línea del año anterior (ocre). La forma distinta de cada serie es
 * el encoding secundario (paleta validada: verde/ocre pasan CVD; el ocre queda
 * bajo 3:1 sobre papel, por eso además de color lleva línea + marcadores).
 */
export default {
  name: 'BirthsByMonthChart',
  components: { apexchart: VueApexCharts },
  props: {
    year: { type: Number, required: true },
    currentYear: { type: Array, required: true }, // 12 posiciones ene..dic
    previousYear: { type: Array, required: true },
  },
  computed: {
    series() {
      return [
        { name: `Partos ${this.year}`, type: 'column', data: this.currentYear },
        { name: `Partos ${this.year - 1}`, type: 'line', data: this.previousYear },
      ]
    },
    chartOptions() {
      return {
        chart: {
          fontFamily: 'var(--hs-font-body, "Hanken Grotesk", sans-serif)',
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { easing: 'easeinout', speed: 500 },
        },
        colors: ['#2E7D32', '#C98A2D'],
        stroke: { width: [0, 2], curve: 'smooth' },
        plotOptions: {
          bar: { columnWidth: '55%', borderRadius: 3, borderRadiusApplication: 'end' },
        },
        markers: { size: [0, 4], strokeWidth: 2, strokeColors: '#FDFCF8', hover: { size: 6 } },
        dataLabels: { enabled: false },
        grid: { borderColor: 'rgba(46, 82, 51, 0.12)', strokeDashArray: 3 },
        xaxis: {
          categories: MONTH_LABELS,
          labels: { style: { colors: 'rgba(34, 43, 35, 0.6)' } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: 'rgba(34, 43, 35, 0.6)' },
            formatter: (value) => `${Math.round(value)}`,
          },
          forceNiceScale: true,
        },
        legend: {
          position: 'bottom',
          labels: { colors: 'rgba(34, 43, 35, 0.75)' },
          markers: { size: 5 },
        },
        tooltip: {
          shared: true,
          intersect: false,
          y: { formatter: (value) => `${value} ${value === 1 ? 'parto' : 'partos'}` },
        },
      }
    },
  },
}
</script>
