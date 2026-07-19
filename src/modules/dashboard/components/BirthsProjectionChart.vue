<template>
  <apexchart type="bar" height="300" :options="chartOptions" :series="series" />
</template>

<script>
import VueApexCharts from 'vue3-apexcharts'
import { MONTH_LABELS } from '@/modules/dashboard/constants'

/**
 * Partos del año, pasados y por venir, en una sola columna apilada por mes:
 * - Reales (verde pleno): eventos BIRTH ya registrados.
 * - Confirmados (azul): preñadas con fecha probable (chequeo positivo).
 * - Probables (ámbar con trama): servidas sin chequeo, ponderadas por la tasa
 *   de concepción de la finca — la trama refuerza la incertidumbre (encoding
 *   secundario además del color; paleta validada CVD).
 */
export default {
  name: 'BirthsProjectionChart',
  components: { apexchart: VueApexCharts },
  props: {
    real: { type: Array, required: true }, // 12 posiciones ene..dic
    confirmed: { type: Array, required: true },
    probable: { type: Array, required: true },
  },
  computed: {
    series() {
      return [
        { name: 'Reales', data: this.real },
        { name: 'Confirmados', data: this.confirmed },
        { name: 'Probables', data: this.probable },
      ]
    },
    chartOptions() {
      return {
        chart: {
          type: 'bar',
          stacked: true,
          fontFamily: 'var(--hs-font-body, "Hanken Grotesk", sans-serif)',
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: { easing: 'easeinout', speed: 500 },
        },
        colors: ['#2E7D32', '#3273A8', '#B0761F'],
        // Separación de 2px color superficie entre segmentos apilados.
        stroke: { width: 2, colors: ['#FDFCF8'] },
        fill: {
          type: ['solid', 'solid', 'pattern'],
          pattern: { style: 'slantedLines', strokeWidth: 2, width: 6, height: 6 },
        },
        plotOptions: {
          bar: {
            columnWidth: '55%',
            borderRadius: 3,
            borderRadiusApplication: 'end',
            borderRadiusWhenStacked: 'last',
          },
        },
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
          y: {
            formatter: (value, { seriesIndex }) => {
              if (value === null || value === undefined) return ''
              // Los probables son una esperanza (servidas × tasa), no un conteo.
              return seriesIndex === 2 ? `≈ ${value}` : `${value}`
            },
          },
        },
      }
    },
  },
}
</script>
