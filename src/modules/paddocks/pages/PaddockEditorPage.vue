<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-4 rise">
      <div class="d-flex align-center ga-3">
        <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'paddock-list' }" />
        <div>
          <p class="hs-overline mb-0">{{ isEdit ? 'Editar potrero' : 'Nuevo potrero' }}</p>
          <h1 class="text-h5 font-weight-bold">{{ form.name || 'Dibuja tu potrero' }}</h1>
        </div>
      </div>
    </div>

    <v-row class="rise rise-d1">
      <!-- Map -->
      <v-col cols="12" md="8" lg="9">
        <v-card class="hs-map-card overflow-hidden pa-0">
          <div ref="mapContainer" class="hs-map"></div>

          <!-- Floating search -->
          <div class="hs-map-search">
            <v-card class="pa-1" color="surface">
              <div class="d-flex align-center ga-1">
                <v-text-field
                  v-model="searchQuery"
                  placeholder="Buscar ubicación (municipio, vereda…)"
                  variant="plain"
                  density="compact"
                  hide-details
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  class="hs-search-field px-2"
                  :loading="searching"
                  @keydown.enter="searchLocation"
                  @click:clear="searchResults = []"
                />
                <v-btn size="small" color="primary" variant="tonal" :loading="searching" @click="searchLocation">
                  Buscar
                </v-btn>
              </div>
              <v-list v-if="searchResults.length" density="compact" class="py-0 mt-1" max-height="220" style="overflow-y: auto">
                <v-list-item
                  v-for="result in searchResults"
                  :key="result.place_id"
                  :title="result.display_name"
                  prepend-icon="mdi-map-marker-outline"
                  @click="goToResult(result)"
                />
              </v-list>
            </v-card>
          </div>

          <!-- Floating map tools -->
          <div class="hs-map-tools d-flex flex-column ga-2">
            <v-btn
              icon="mdi-crosshairs-gps"
              size="small"
              color="surface"
              title="Mi ubicación"
              :loading="locating"
              @click="locateMe"
            />
            <v-btn
              :icon="baseLayer === 'satellite' ? 'mdi-map' : 'mdi-satellite-variant'"
              size="small"
              color="surface"
              :title="baseLayer === 'satellite' ? 'Ver mapa de calles' : 'Ver satélite'"
              @click="toggleBaseLayer"
            />
          </div>
        </v-card>
      </v-col>

      <!-- Side panel -->
      <v-col cols="12" md="4" lg="3">
        <v-card class="pa-4">
          <p class="hs-overline mb-2">Medidas</p>
          <div class="d-flex align-baseline ga-2 mb-1">
            <span class="text-h4 font-weight-bold text-primary">{{ areaHaDisplay }}</span>
            <span class="text-body-2 text-medium-emphasis">ha</span>
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            {{ areaM2Display }} m² · {{ perimeterDisplay }} de perímetro
          </div>

          <v-alert type="info" density="compact" class="mb-4 text-body-2">
            {{ hasPolygon
              ? 'Haz clic en el potrero para seleccionarlo y arrastra sus puntos para ajustarlo.'
              : 'Haz clic en el mapa para marcar cada vértice y cierra con doble clic.' }}
          </v-alert>

          <v-btn
            v-if="hasPolygon"
            block
            variant="tonal"
            color="secondary"
            prepend-icon="mdi-restart"
            class="mb-4"
            @click="restartDrawing"
          >
            Dibujar de nuevo
          </v-btn>

          <v-form @submit.prevent="save">
            <v-text-field
              v-model="form.name"
              label="Nombre del potrero"
              :rules="[(v) => !!(v && v.trim()) || 'El nombre es obligatorio']"
              class="mb-2"
            />

            <p class="text-body-2 text-medium-emphasis mb-2">Color en el mapa</p>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-btn
                v-for="color in colorOptions"
                :key="color"
                :style="{ backgroundColor: color }"
                icon
                size="x-small"
                class="hs-color-dot"
                :class="{ 'hs-color-dot--selected': form.color === color }"
                @click="form.color = color"
              >
                <v-icon v-if="form.color === color" size="14" color="white">mdi-check</v-icon>
              </v-btn>
            </div>

            <v-textarea v-model="form.notes" label="Notas (opcional)" rows="2" auto-grow class="mb-2" />

            <v-btn
              block
              color="primary"
              type="submit"
              prepend-icon="mdi-content-save-outline"
              :loading="saving"
              :disabled="!hasPolygon"
            >
              {{ isEdit ? 'Guardar cambios' : 'Guardar potrero' }}
            </v-btn>
            <p v-if="!hasPolygon" class="text-caption text-medium-emphasis text-center mt-2 mb-0">
              Dibuja el potrero en el mapa para poder guardarlo.
            </p>
          </v-form>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode, ValidateNotSelfIntersecting } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import turfArea from '@turf/area'
import turfLength from '@turf/length'
import turfBbox from '@turf/bbox'
import { mapGetters, mapActions } from 'vuex'
import apiClient from '@/api/client'
import { getErrorMessage } from '@/api/errors'

// Colombia como vista inicial cuando la finca aún no tiene nada georreferenciado.
const FALLBACK_CENTER = [-73.2, 4.6]
const FALLBACK_ZOOM = 5

const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const STREET_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export default {
  name: 'PaddockEditorPage',
  data() {
    return {
      form: { name: '', color: '#2E7D32', notes: '' },
      colorOptions: ['#2E7D32', '#C98A2D', '#3F5847', '#4E7AA3', '#8A4E62', '#7B5E3B', '#5B7F3B', '#A3572E'],
      hasPolygon: false,
      areaM2: 0,
      perimeterM: 0,
      baseLayer: 'satellite',
      searchQuery: '',
      searchResults: [],
      searching: false,
      locating: false,
      saving: false,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('paddocks', ['activePaddocks']),
    isEdit() {
      return !!this.$route.params.id
    },
    paddockId() {
      return this.$route.params.id || null
    },
    areaHaDisplay() {
      return (this.areaM2 / 10000).toLocaleString('es-CO', { maximumFractionDigits: 2 })
    },
    areaM2Display() {
      return Math.round(this.areaM2).toLocaleString('es-CO')
    },
    perimeterDisplay() {
      if (this.perimeterM >= 1000) {
        return `${(this.perimeterM / 1000).toLocaleString('es-CO', { maximumFractionDigits: 2 })} km`
      }
      return `${Math.round(this.perimeterM).toLocaleString('es-CO')} m`
    },
  },
  async mounted() {
    // La lista completa alimenta la capa de referencia (los demás potreros) y
    // el encuadre inicial del mapa.
    try {
      await this.fetchState({ module: 'paddocks', nameState: 'paddocks', url: '/farms/paddocks/' })
    } catch {
      // Sin lista no hay referencia, pero el editor sigue siendo usable.
    }

    let editing = null
    if (this.isEdit) {
      editing = this.activePaddocks.find((p) => p.id === this.paddockId)
      if (!editing) {
        try {
          const { data } = await apiClient.get(`/farms/paddocks/${this.paddockId}/`)
          editing = data
        } catch (e) {
          this.notify(getErrorMessage(e, 'No se pudo cargar el potrero'), 'error')
          this.$router.replace({ name: 'paddock-list' })
          return
        }
      }
      this.form = { name: editing.name, color: editing.color || '#2E7D32', notes: editing.notes || '' }
    }

    this.initMap(editing)
  },
  beforeUnmount() {
    if (this.draw) {
      this.draw.stop()
      this.draw = null
    }
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'createItem', 'updateItem']),

    // --- mapa ---
    initMap(editing) {
      const map = new maplibregl.Map({
        container: this.$refs.mapContainer,
        style: {
          version: 8,
          sources: {
            satellite: {
              type: 'raster',
              tiles: [SATELLITE_TILES],
              tileSize: 256,
              // Más allá de z17 Esri devuelve baldosas "Map data not yet available"
              // en zonas rurales; con maxzoom 17 MapLibre estira la última imagen
              // real (overzoom) y se puede seguir acercando sin huecos grises.
              maxzoom: 17,
              attribution: 'Imágenes © Esri, Maxar, Earthstar Geographics',
            },
            streets: {
              type: 'raster',
              tiles: [STREET_TILES],
              tileSize: 256,
              maxzoom: 19,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [
            { id: 'satellite', type: 'raster', source: 'satellite', layout: { visibility: 'visible' } },
            { id: 'streets', type: 'raster', source: 'streets', layout: { visibility: 'none' } },
          ],
        },
        center: FALLBACK_CENTER,
        zoom: FALLBACK_ZOOM,
        maxZoom: 20,
        attributionControl: { compact: true },
      })
      this.map = map // no-reactivo a propósito (no está en data)

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

      map.on('load', () => {
        this.addReferenceLayer()
        this.initDraw(editing)
        this.fitInitialView(editing)
      })
    },

    addReferenceLayer() {
      // Los demás potreros de la finca, como contexto de solo lectura.
      const others = this.activePaddocks.filter((p) => p.id !== this.paddockId)
      const collection = {
        type: 'FeatureCollection',
        features: others.map((p) => ({
          type: 'Feature',
          geometry: p.geometry,
          properties: { color: p.color || '#C98A2D' },
        })),
      }
      this.map.addSource('paddocks-ref', { type: 'geojson', data: collection })
      this.map.addLayer({
        id: 'paddocks-ref-fill',
        type: 'fill',
        source: 'paddocks-ref',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.18 },
      })
      this.map.addLayer({
        id: 'paddocks-ref-line',
        type: 'line',
        source: 'paddocks-ref',
        paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-dasharray': [2, 1.5] },
      })
    },

    fitInitialView(editing) {
      const features = []
      if (editing) {
        features.push({ type: 'Feature', geometry: editing.geometry, properties: {} })
      } else {
        this.activePaddocks.forEach((p) => features.push({ type: 'Feature', geometry: p.geometry, properties: {} }))
      }
      if (features.length) {
        const [minX, minY, maxX, maxY] = turfBbox({ type: 'FeatureCollection', features })
        this.map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 80, maxZoom: 17, duration: 0 })
      }
    },

    // --- dibujo ---
    initDraw(editing) {
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: this.map }),
        modes: [
          new TerraDrawPolygonMode({
            validation: (feature, { updateType }) => {
              if (updateType === 'finish' || updateType === 'commit') {
                return ValidateNotSelfIntersecting(feature)
              }
              return { valid: true }
            },
            // Amarillo alta-visibilidad (estilo Google Earth): sobre pasto/monte
            // el verde de la marca no se distingue.
            styles: {
              fillColor: '#FFD60A',
              fillOpacity: 0.15,
              outlineColor: '#FFD60A',
              outlineWidth: 3,
              closingPointColor: '#FFFFFF',
              closingPointOutlineColor: '#1B1B1B',
              closingPointWidth: 6,
              closingPointOutlineWidth: 2,
            },
          }),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: false,
                  coordinates: { midpoints: true, draggable: true, deletable: true },
                },
              },
            },
            styles: {
              selectedPolygonColor: '#FFD60A',
              selectedPolygonFillOpacity: 0.2,
              selectedPolygonOutlineColor: '#FFD60A',
              selectedPolygonOutlineWidth: 3,
              selectionPointColor: '#FFFFFF',
              selectionPointOutlineColor: '#1B1B1B',
              selectionPointWidth: 6,
              selectionPointOutlineWidth: 2,
              midPointColor: '#FFD60A',
              midPointOutlineColor: '#1B1B1B',
              midPointWidth: 4,
              midPointOutlineWidth: 1.5,
            },
          }),
        ],
      })
      this.draw = draw
      draw.start()

      draw.on('change', () => this.refreshMeasures())
      draw.on('finish', (id, context) => {
        if (context.action === 'draw') {
          // Polígono cerrado: pasar directo a edición de vértices.
          this.hasPolygon = true
          draw.setMode('select')
          draw.selectFeature(id)
        }
      })

      if (editing) {
        const ring = editing.geometry.coordinates.map((r) =>
          r.map(([lon, lat]) => [Number(lon.toFixed(7)), Number(lat.toFixed(7))]),
        )
        draw.addFeatures([
          {
            id: editing.id,
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: ring },
            properties: { mode: 'polygon' },
          },
        ])
        this.hasPolygon = true
        draw.setMode('select')
        this.refreshMeasures()
      } else {
        draw.setMode('polygon')
      }
    },

    refreshMeasures() {
      const feature = this.currentFeature()
      if (!feature) {
        this.areaM2 = 0
        this.perimeterM = 0
        return
      }
      this.areaM2 = turfArea(feature)
      this.perimeterM = turfLength(feature, { units: 'kilometers' }) * 1000
    },

    currentFeature() {
      if (!this.draw) return null
      return this.draw.getSnapshot().find((f) => f.geometry.type === 'Polygon') || null
    },

    restartDrawing() {
      this.draw.clear()
      this.hasPolygon = false
      this.areaM2 = 0
      this.perimeterM = 0
      this.draw.setMode('polygon')
    },

    // --- búsqueda de ubicación (Nominatim / OpenStreetMap) ---
    async searchLocation() {
      const query = (this.searchQuery || '').trim()
      if (!query) return
      this.searching = true
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&q=${encodeURIComponent(query)}`
        const response = await fetch(url)
        this.searchResults = await response.json()
        if (!this.searchResults.length) this.notify('Sin resultados para esa búsqueda', 'warning')
      } catch {
        this.notify('No se pudo buscar la ubicación (¿sin conexión?)', 'error')
      } finally {
        this.searching = false
      }
    },

    goToResult(result) {
      this.searchResults = []
      this.map.flyTo({ center: [Number(result.lon), Number(result.lat)], zoom: 15 })
    },

    locateMe() {
      if (!navigator.geolocation) {
        this.notify('Este navegador no soporta geolocalización', 'warning')
        return
      }
      this.locating = true
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.locating = false
          this.map.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 16 })
        },
        () => {
          this.locating = false
          this.notify('No se pudo obtener tu ubicación', 'warning')
        },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    },

    toggleBaseLayer() {
      this.baseLayer = this.baseLayer === 'satellite' ? 'streets' : 'satellite'
      this.map.setLayoutProperty('satellite', 'visibility', this.baseLayer === 'satellite' ? 'visible' : 'none')
      this.map.setLayoutProperty('streets', 'visibility', this.baseLayer === 'streets' ? 'visible' : 'none')
    },

    // --- guardar ---
    async save() {
      const name = (this.form.name || '').trim()
      if (!name) {
        this.notify('El nombre del potrero es obligatorio', 'warning')
        return
      }
      const feature = this.currentFeature()
      if (!feature) {
        this.notify('Dibuja el potrero en el mapa antes de guardar', 'warning')
        return
      }
      const geometry = {
        type: 'Polygon',
        coordinates: feature.geometry.coordinates.map((ring) =>
          ring.map(([lon, lat]) => [Number(lon.toFixed(7)), Number(lat.toFixed(7))]),
        ),
      }
      const payload = { name, geometry, color: this.form.color, notes: this.form.notes || '' }

      this.saving = true
      try {
        if (this.isEdit) {
          await this.updateItem({
            module: 'paddocks',
            nameState: 'paddocks',
            url: `/farms/paddocks/${this.paddockId}/`,
            data: payload,
          })
        } else {
          await this.createItem({
            module: 'paddocks',
            nameState: 'paddocks',
            url: '/farms/paddocks/',
            data: payload,
          })
        }
        this.$router.push({ name: 'paddock-list' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo guardar el potrero'), 'error')
      } finally {
        this.saving = false
      }
    },

    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>

<style scoped>
.hs-map-card {
  position: relative;
}
.hs-map {
  height: calc(100vh - 220px);
  min-height: 460px;
}
.hs-map-search {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 340px;
  max-width: calc(100% - 76px);
  z-index: 5;
}
.hs-map-tools {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
}
.hs-color-dot {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
}
.hs-color-dot--selected {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.5);
}
</style>
