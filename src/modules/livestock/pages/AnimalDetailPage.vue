<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="{ name: 'livestock-animals' }" class="mb-3 rise">
      Animales
    </v-btn>

    <!-- Loading -->
    <template v-if="loading">
      <v-row>
        <v-col cols="12" md="5"><v-skeleton-loader type="image" class="border rounded-xl" /></v-col>
        <v-col cols="12" md="7"><v-skeleton-loader type="article, actions" class="border rounded-xl" /></v-col>
      </v-row>
    </template>

    <!-- Error -->
    <v-card v-else-if="error" class="pa-8 text-center">
      <v-icon size="48" color="error" class="mb-2">mdi-alert-circle-outline</v-icon>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ error }}</p>
      <v-btn color="primary" variant="tonal" @click="load">Reintentar</v-btn>
    </v-card>

    <template v-else-if="animal">
      <!-- HERO: gallery + identity -->
      <v-row class="rise rise-d1">
        <v-col cols="12" md="5">
          <AnimalGallery :photos="animal.photos || []" :name="animal.name" :fallback-icon="sexIcon" />
        </v-col>

        <v-col cols="12" md="7" class="d-flex flex-column">
          <!-- Title row + condensed actions (speed dial) -->
          <div class="d-flex justify-space-between align-start ga-3">
            <div>
              <p class="hs-overline mb-1">{{ animal.breed_name || 'Ficha del animal' }}</p>
              <div class="d-flex align-center flex-wrap ga-3">
                <h1 class="detail-name">{{ animal.name }}</h1>
                <v-chip v-if="animal.is_external" size="small" color="secondary" variant="tonal" prepend-icon="mdi-dna">
                  Genética externa
                </v-chip>
                <v-chip v-if="!animal.is_active" size="small" color="error" variant="tonal">Inactivo</v-chip>
              </div>
            </div>

            <!-- Socio: solo consulta — únicamente la genealogía, sin acciones de escritura -->
            <v-btn
              v-if="isPartner"
              icon="mdi-family-tree"
              rounded="circle"
              variant="tonal"
              color="primary"
              size="large"
              aria-label="Genealogía"
              class="detail-fab"
              @click="$refs.genealogyDialog.open(animal)"
            />

            <v-speed-dial v-else location="bottom center" transition="fade-transition">
              <template #activator="{ props: activatorProps }">
                <v-btn
                  v-bind="activatorProps"
                  icon="mdi-cog-outline"
                  rounded="circle"
                  variant="tonal"
                  color="primary"
                  size="large"
                  aria-label="Acciones"
                  class="detail-fab"
                />
              </template>

              <v-btn icon rounded="circle" variant="tonal" color="secondary" @click="$refs.editDialog.open(animal)">
                <v-icon>mdi-pencil-outline</v-icon>
                <v-tooltip activator="parent" location="start">Editar</v-tooltip>
              </v-btn>
              <v-btn icon rounded="circle" variant="tonal" color="secondary" @click="$refs.genealogyDialog.open(animal)">
                <v-icon>mdi-family-tree</v-icon>
                <v-tooltip activator="parent" location="start">Genealogía</v-tooltip>
              </v-btn>
              <v-btn v-if="isFemale" icon rounded="circle" variant="tonal" color="secondary" @click="$refs.editDialog.openBirth(animal)">
                <v-icon>mdi-baby-bottle-outline</v-icon>
                <v-tooltip activator="parent" location="start">Registrar parto</v-tooltip>
              </v-btn>
              <v-btn
                v-if="isFemale"
                icon
                rounded="circle"
                variant="tonal"
                color="secondary"
                :disabled="!repro.calf_at_side"
                @click="$refs.weanDialog.open(animal)"
              >
                <v-icon>mdi-link-variant-off</v-icon>
                <v-tooltip activator="parent" location="start">Destetar</v-tooltip>
              </v-btn>
              <v-btn
                v-if="animal.is_active && !animal.is_external"
                icon
                rounded="circle"
                variant="tonal"
                color="accent"
                @click="$refs.inactivateDialog.open(animal)"
              >
                <v-icon>mdi-logout-variant</v-icon>
                <v-tooltip activator="parent" location="start">Sacar del hato</v-tooltip>
              </v-btn>
            </v-speed-dial>
          </div>

          <div class="d-flex flex-wrap ga-2 mt-3 mb-4">
            <v-chip size="small" :color="sexColor" :prepend-icon="sexIcon" variant="tonal">
              {{ animal.sex_display }}
            </v-chip>
            <v-chip
              v-for="chip in reproChips(repro)"
              :key="chip.key"
              size="small"
              :color="chip.color"
              :prepend-icon="chip.icon || undefined"
            >
              {{ chip.label }}
            </v-chip>
            <v-chip
              v-for="id in animal.identifications || []"
              :key="id.id"
              size="small"
              variant="outlined"
              prepend-icon="mdi-tag-outline"
            >
              {{ id.identification_type_name }} {{ id.value }}
            </v-chip>
            <v-chip
              v-if="animal.tag_code"
              size="small"
              variant="outlined"
              prepend-icon="mdi-qrcode"
              @click="$refs.tagQrDialog.open(animal.tag_code)"
            >
              {{ formatTagCode(animal.tag_code) }}
            </v-chip>
          </div>

          <!-- Parents -->
          <div class="d-flex flex-wrap ga-6 mb-5">
            <div>
              <p class="detail-mini-label">Madre</p>
              <a v-if="animal.mother" class="detail-link" @click="goTo(animal.mother)">{{ animal.mother_name || 'Ver madre' }}</a>
              <span v-else class="text-medium-emphasis">—</span>
            </div>
            <div>
              <p class="detail-mini-label">Padre</p>
              <a v-if="animal.father" class="detail-link" @click="goTo(animal.father)">{{ animal.father_name || 'Ver padre' }}</a>
              <span v-else class="text-medium-emphasis">—</span>
            </div>
          </div>

          <v-spacer />

          <!-- Indicators (moved up from below to balance the layout) -->
          <v-row dense>
            <v-col v-for="tile in statTiles" :key="tile.label" cols="6" sm="3">
              <v-card class="detail-stat pa-4">
                <p class="detail-stat__label">{{ tile.label }}</p>
                <p class="detail-stat__value">{{ tile.value }}</p>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- SEGMENTED CONTENT -->
      <v-card class="rise rise-d3 mt-4">
        <v-tabs v-model="tab" color="primary" density="comfortable" class="px-2">
          <v-tab value="ficha">Ficha</v-tab>
          <v-tab v-if="isFemale" value="repro">Reproducción</v-tab>
          <v-tab value="offspring">Descendencia</v-tab>
          <v-tab value="peso">Peso</v-tab>
          <v-tab value="sanidad">Sanidad</v-tab>
        </v-tabs>
        <v-divider />

        <v-window v-model="tab">
          <!-- Ficha -->
          <v-window-item value="ficha">
            <div class="pa-5">
              <dl class="detail-dl">
                <div class="detail-dl__row"><dt>Sexo</dt><dd>{{ animal.sex_display }}</dd></div>
                <div class="detail-dl__row"><dt>Nacimiento</dt><dd>{{ formatDate(animal.birth_date) }}</dd></div>
                <div class="detail-dl__row"><dt>Edad</dt><dd>{{ age }}</dd></div>
                <div class="detail-dl__row"><dt>Raza</dt><dd>{{ animal.breed_name || '—' }}</dd></div>
                <div class="detail-dl__row"><dt>Lote</dt><dd>{{ animal.lot_name || '—' }}</dd></div>
                <div class="detail-dl__row"><dt>Asignado a</dt><dd>{{ animal.assigned_to_name || '—' }}</dd></div>
                <div class="detail-dl__row">
                  <dt>Identificación</dt>
                  <dd>
                    <template v-if="(animal.identifications || []).length">
                      <span v-for="id in animal.identifications" :key="id.id" class="me-3">
                        {{ id.identification_type_name }}: <strong>{{ id.value }}</strong>
                      </span>
                    </template>
                    <span v-else class="text-medium-emphasis">—</span>
                  </dd>
                </div>
                <div class="detail-dl__row">
                  <dt>Chapeta QR</dt>
                  <dd>
                    <template v-if="animal.tag_code">
                      <strong style="font-family: monospace">{{ formatTagCode(animal.tag_code) }}</strong>
                      <v-btn
                        size="x-small"
                        variant="text"
                        color="primary"
                        prepend-icon="mdi-qrcode"
                        class="ms-2"
                        @click="$refs.tagQrDialog.open(animal.tag_code)"
                      >
                        Ver QR
                      </v-btn>
                      <template v-if="!isPartner && animal.is_active && !animal.is_external">
                        <v-btn
                          size="x-small"
                          variant="text"
                          color="accent"
                          prepend-icon="mdi-qrcode-plus"
                          @click="$refs.tagAssignDialog.open(animal)"
                        >
                          Reponer
                        </v-btn>
                        <v-btn
                          size="x-small"
                          variant="text"
                          color="error"
                          prepend-icon="mdi-qrcode-remove"
                          @click="$refs.tagUnassignDialog.open(animal)"
                        >
                          Quitar
                        </v-btn>
                      </template>
                    </template>
                    <template v-else>
                      <span class="text-medium-emphasis me-2">Sin chapeta</span>
                      <v-btn
                        v-if="!isPartner && animal.is_active && !animal.is_external"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        prepend-icon="mdi-qrcode-plus"
                        @click="$refs.tagAssignDialog.open(animal)"
                      >
                        Asociar chapeta
                      </v-btn>
                    </template>
                  </dd>
                </div>
                <div class="detail-dl__row"><dt>Estado</dt><dd>{{ animal.is_active ? 'Activo' : 'Inactivo' }}</dd></div>
              </dl>
            </div>
          </v-window-item>

          <!-- Reproducción -->
          <v-window-item v-if="isFemale" value="repro">
            <div class="pa-5">
              <div class="detail-repro-grid mb-5">
                <div class="detail-repro-cell">
                  <p class="detail-mini-label">Estado</p>
                  <span v-if="reproChips(repro).length" class="d-flex flex-wrap ga-1">
                    <v-chip
                      v-for="chip in reproChips(repro)"
                      :key="chip.key"
                      size="small"
                      :color="chip.color"
                      :prepend-icon="chip.icon || undefined"
                    >
                      {{ chip.label }}
                    </v-chip>
                  </span>
                  <span v-else class="text-medium-emphasis">—</span>
                </div>
                <div class="detail-repro-cell">
                  <p class="detail-mini-label">Días abiertos</p>
                  <span>{{ repro.open_days != null ? repro.open_days : '—' }}</span>
                </div>
                <div class="detail-repro-cell">
                  <p class="detail-mini-label">Concepción</p>
                  <span>{{ formatDate(repro.conception_date) }}</span>
                  <span v-if="repro.conception_source" class="detail-repro-sub">{{ conceptionSource }}</span>
                </div>
                <div class="detail-repro-cell">
                  <p class="detail-mini-label">Parto probable</p>
                  <span>{{ formatDate(repro.expected_due_date) }}</span>
                </div>
              </div>

              <div class="d-flex align-center mb-2">
                <p class="hs-overline mb-0">Historial</p>
                <v-spacer />
                <v-btn
                  v-if="!isPartner"
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="$refs.eventsDialog.open(animal)"
                >
                  Registrar evento
                </v-btn>
              </div>

              <p v-if="!events.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
                Aún no hay eventos reproductivos.
              </p>
              <v-timeline v-else density="compact" side="end" align="start" truncate-line="both">
                <v-timeline-item
                  v-for="event in events"
                  :key="event.id"
                  :dot-color="eventMeta(event).color"
                  :icon="eventMeta(event).icon"
                  size="small"
                >
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-medium">{{ eventLabel(event) }}</span>
                    <v-chip
                      v-if="event.event_type === 'PREGNANCY_CHECK' && event.result"
                      size="x-small"
                      :color="event.result === 'POSITIVE' ? 'success' : 'error'"
                    >
                      {{ event.result === 'POSITIVE' ? 'Positiva' : 'Negativa' }}
                    </v-chip>
                  </div>
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ formatDate(event.date) }}
                    <template v-if="event.gestation_days"> · {{ event.gestation_days }} días de gestación</template>
                    <template v-if="event.sire_name"> · Toro: {{ event.sire_name }}</template>
                    <template v-if="event.offspring_name"> · Cría: {{ event.offspring_name }}</template>
                  </p>
                  <p v-if="event.notes" class="text-caption mb-0">{{ event.notes }}</p>
                </v-timeline-item>
              </v-timeline>
            </div>
          </v-window-item>

          <!-- Descendencia -->
          <v-window-item value="offspring">
            <div class="pa-5">
              <p v-if="!offspring.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
                Sin descendencia registrada.
              </p>
              <v-row v-else dense>
                <v-col v-for="child in offspring" :key="child.id" cols="12" sm="6" lg="4">
                  <v-card class="detail-child pa-3" @click="goTo(child.id)">
                    <div class="d-flex align-center ga-3">
                      <v-avatar size="40" :color="child.sex === 'FEMALE' ? 'primary' : 'accent'" variant="tonal">
                        <v-icon size="20">{{ child.sex === 'FEMALE' ? 'mdi-gender-female' : 'mdi-gender-male' }}</v-icon>
                      </v-avatar>
                      <div class="flex-grow-1">
                        <p class="font-weight-medium mb-0">{{ child.name }}</p>
                        <p class="text-caption text-medium-emphasis mb-0">
                          {{ child.sex_display }} · {{ formatDate(child.birth_date) }}
                        </p>
                      </div>
                      <v-icon size="18" class="text-medium-emphasis">mdi-chevron-right</v-icon>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- Control de peso -->
          <v-window-item value="peso">
            <div class="pa-5">
              <div class="d-flex align-center mb-2">
                <p class="hs-overline mb-0">Control de peso</p>
                <v-spacer />
                <v-btn
                  v-if="!isPartner"
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="$refs.weightDialog.open(animal)"
                >
                  Registrar peso
                </v-btn>
              </div>

              <p v-if="!weights.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
                Aún no hay pesajes registrados.
              </p>
              <!-- Curva de peso: con un solo pesaje no hay tendencia que graficar -->
              <WeightChart v-if="weights.length >= 2" :records="weights" class="mb-4" />
              <v-timeline v-if="weights.length" density="compact" side="end" align="start" truncate-line="both">
                <v-timeline-item
                  v-for="record in weights"
                  :key="record.id"
                  :dot-color="weightDiffMeta(record).color"
                  icon="mdi-scale"
                  size="small"
                >
                  <div class="d-flex align-center flex-wrap ga-2">
                    <span class="font-weight-medium">{{ formatKg(record.weight_kg) }} kg</span>
                    <v-chip
                      size="x-small"
                      :color="weightDiffMeta(record).color"
                      :prepend-icon="weightDiffMeta(record).icon"
                      variant="tonal"
                    >
                      {{ weightDiffMeta(record).label }}
                    </v-chip>
                    <v-spacer />
                    <v-btn
                      v-if="!isPartner"
                      icon="mdi-delete-outline"
                      variant="text"
                      size="x-small"
                      color="error"
                      @click="askDeleteWeight(record)"
                    />
                  </div>
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ formatDate(record.date) }}
                    <template v-if="record.recorded_by_name"> · Registró: {{ record.recorded_by_name }}</template>
                  </p>
                  <p v-if="record.notes" class="text-caption mb-0">{{ record.notes }}</p>
                </v-timeline-item>
              </v-timeline>
            </div>
          </v-window-item>

          <!-- Sanidad -->
          <v-window-item value="sanidad">
            <div class="pa-5">
              <AnimalHealthTab
                :animal="animal"
                :treatments="treatments"
                :can-write="!isPartner"
                @changed="onHealthChanged"
              />
            </div>
          </v-window-item>
        </v-window>
      </v-card>
    </template>

    <!-- Weight record delete confirmation -->
    <v-dialog v-model="deleteWeightDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar pesaje?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará el registro de
          <strong>{{ weightToDelete && formatKg(weightToDelete.weight_kg) }} kg</strong>
          del {{ weightToDelete && formatDate(weightToDelete.date) }}. La comparativa se recalculará.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deletingWeight" @click="deleteWeightDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="deletingWeight" @click="confirmDeleteWeight">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Action dialogs (reused) -->
    <AnimalFormDialog ref="editDialog" @saved="reload" />
    <WeanDialog ref="weanDialog" @saved="onReproChanged" />
    <ReproductionEventsDialog ref="eventsDialog" @saved="reload" />
    <GenealogyDialog ref="genealogyDialog" />
    <WeightFormDialog ref="weightDialog" @saved="onWeightSaved" />
    <InactivateAnimalDialog ref="inactivateDialog" @saved="onInactivated" />
    <TagAssignDialog ref="tagAssignDialog" @saved="onTagChanged" />
    <TagUnassignDialog ref="tagUnassignDialog" @saved="onTagChanged" />
    <TagQrDialog ref="tagQrDialog" />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { REPRO_EVENT_META, reproChips } from '@/modules/livestock/constants'
import AnimalGallery from '@/modules/livestock/components/AnimalGallery.vue'
import AnimalFormDialog from '@/modules/livestock/components/AnimalFormDialog.vue'
import WeanDialog from '@/modules/livestock/components/WeanDialog.vue'
import ReproductionEventsDialog from '@/modules/livestock/components/ReproductionEventsDialog.vue'
import GenealogyDialog from '@/modules/livestock/components/GenealogyDialog.vue'
import WeightFormDialog from '@/modules/livestock/components/WeightFormDialog.vue'
import InactivateAnimalDialog from '@/modules/livestock/components/InactivateAnimalDialog.vue'
import WeightChart from '@/modules/livestock/components/WeightChart.vue'
import AnimalHealthTab from '@/modules/health/components/AnimalHealthTab.vue'
import TagAssignDialog from '@/modules/tags/components/TagAssignDialog.vue'
import TagUnassignDialog from '@/modules/tags/components/TagUnassignDialog.vue'
import TagQrDialog from '@/modules/tags/components/TagQrDialog.vue'
import { formatCode as formatTagCode } from '@/modules/tags/checksum'

export default {
  name: 'AnimalDetailPage',
  components: {
    AnimalGallery,
    AnimalFormDialog,
    WeanDialog,
    ReproductionEventsDialog,
    GenealogyDialog,
    WeightFormDialog,
    InactivateAnimalDialog,
    WeightChart,
    AnimalHealthTab,
    TagAssignDialog,
    TagUnassignDialog,
    TagQrDialog,
  },
  data() {
    return {
      animal: null,
      loading: false,
      error: '',
      tab: 'ficha',
      deleteWeightDialog: false,
      weightToDelete: null,
      deletingWeight: false,
      snackbar: { show: false, text: '', color: 'success' },
    }
  },
  computed: {
    ...mapGetters('livestock', { animals: 'allAnimals' }),
    ...mapGetters('auth', ['isPartner']),
    animalId() {
      // El id del animal es un UUID (string), no un entero.
      return this.$route.params.id
    },
    isFemale() {
      return this.animal && this.animal.sex === 'FEMALE'
    },
    sexIcon() {
      return this.isFemale ? 'mdi-gender-female' : 'mdi-gender-male'
    },
    sexColor() {
      return this.isFemale ? 'primary' : 'accent'
    },
    repro() {
      return (this.animal && this.animal.reproduction) || {}
    },
    events() {
      return (this.animal && this.animal.reproductive_events) || []
    },
    offspring() {
      return (this.animal && this.animal.offspring) || []
    },
    weights() {
      // full/ trae los pesajes con previous_weight_kg/diff_kg ya derivados
      return (this.animal && this.animal.weight_records) || []
    },
    treatments() {
      // full/ embebe treatments[] con sus applications[], más reciente primero
      return (this.animal && this.animal.treatments) || []
    },
    age() {
      return this.formatAge(this.animal && this.animal.birth_date)
    },
    conceptionSource() {
      return this.repro.conception_source === 'SERVICE' ? 'Servicio registrado' : 'Estimado por palpación'
    },
    statTiles() {
      const tiles = [{ label: 'Edad', value: this.age }]
      if (this.isFemale) {
        tiles.push({ label: 'Partos', value: this.animal.births_count ?? 0 })
        if (this.repro.open_days != null) tiles.push({ label: 'Días abiertos', value: this.repro.open_days })
      } else {
        tiles.push({ label: 'Crías', value: this.animal.offspring_count ?? 0 })
      }
      tiles.push({ label: 'Descendientes', value: this.offspring.length })
      return tiles.slice(0, 4)
    },
  },
  watch: {
    animalId() {
      this.tab = 'ficha'
      this.load()
    },
  },
  created() {
    this.load()
    // Reused dialogs (sire/mother autocompletes, animalById) need the herd list
    // and the external genetics for the sire/parent pickers
    if (!this.animals.length) {
      this.fetchState({ module: 'livestock', nameState: 'animals', url: '/livestock/animals/' }).catch(() => {})
    }
    this.fetchState({ module: 'livestock', nameState: 'externals', url: '/livestock/animals/', params: { external: true } }).catch(() => {})
  },
  methods: {
    ...mapActions('livestock', ['fetchAnimalFull', 'deleteWeight']),
    ...mapActions('shared', ['fetchState']),
    formatKg(value) {
      const n = Number(value)
      return Number.isNaN(n) ? value : n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
    },
    // Comparativa contra el pesaje anterior: subió (verde), bajó (rojo), igual o primero
    weightDiffMeta(record) {
      const diff = record.diff_kg == null ? null : Number(record.diff_kg)
      if (diff == null) return { color: 'secondary', icon: 'mdi-flag-outline', label: 'Primer registro' }
      if (diff > 0) return { color: 'success', icon: 'mdi-arrow-up', label: `Subió ${this.formatKg(diff)} kg` }
      if (diff < 0) return { color: 'error', icon: 'mdi-arrow-down', label: `Bajó ${this.formatKg(Math.abs(diff))} kg` }
      return { color: 'secondary', icon: 'mdi-equal', label: 'Sin cambio' }
    },
    askDeleteWeight(record) {
      this.weightToDelete = record
      this.deleteWeightDialog = true
    },
    async confirmDeleteWeight() {
      this.deletingWeight = true
      try {
        await this.deleteWeight({ animalId: this.animalId, weightId: this.weightToDelete.id })
        this.deleteWeightDialog = false
        this.notify('Pesaje eliminado')
        this.load()
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el pesaje'), 'error')
      } finally {
        this.deletingWeight = false
      }
    },
    onWeightSaved({ record }) {
      this.notify(`Peso registrado: ${this.formatKg(record.weight_kg)} kg`)
      this.load()
    },
    onHealthChanged(payload) {
      if (payload && payload.error) {
        this.notify(payload.error, 'error')
        return
      }
      this.notify('Sanidad actualizada')
      this.load()
    },
    async load() {
      this.loading = true
      this.error = ''
      try {
        this.animal = await this.fetchAnimalFull(this.animalId)
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo cargar el detalle del animal')
      } finally {
        this.loading = false
      }
    },
    async reload() {
      await this.load()
    },
    onReproChanged() {
      this.notify('Información reproductiva actualizada')
      this.load()
    },
    onTagChanged() {
      this.notify('Chapeta QR actualizada')
      this.load()
    },
    formatTagCode,
    onInactivated({ animal }) {
      // El animal salió del hato activo: la ficha ya no aplica, volvemos al listado.
      this.notify(`${animal.name} salió del hato`)
      this.$router.push({ name: 'livestock-animals' })
    },
    goTo(id) {
      if (id && id !== this.animalId) {
        this.$router.push({ name: 'livestock-animal-detail', params: { id } })
      }
    },
    reproChips,
    eventMeta(event) {
      return REPRO_EVENT_META[event.event_type] || { icon: 'mdi-circle-small', color: 'secondary', label: event.event_type }
    },
    eventLabel(event) {
      return event.event_type_display || this.eventMeta(event).label
    },
    formatDate(date) {
      if (!date) return '—'
      return new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    formatAge(birthDate) {
      if (!birthDate) return 'Edad desconocida'
      const birth = new Date(`${birthDate}T00:00:00`)
      const now = new Date()
      let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
      if (now.getDate() < birth.getDate()) months -= 1
      if (months < 1) return 'Recién nacido'
      if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`
      const years = Math.floor(months / 12)
      const rest = months % 12
      return rest ? `${years} a ${rest} m` : `${years} ${years === 1 ? 'año' : 'años'}`
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>

<style scoped>
/* Muted, circular actions FAB with the system's hairline ring */
.detail-fab {
  border: 1px solid rgba(46, 82, 51, 0.18);
}

.detail-name {
  font-family: var(--hs-font-display);
  font-variation-settings: 'opsz' 144;
  font-weight: 600;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.detail-mini-label {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(46, 125, 50, 0.8);
  margin: 0 0 3px;
}
.detail-link {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: border-color 0.18s ease;
}
.detail-link:hover {
  border-bottom-color: rgb(var(--v-theme-primary));
}

.detail-stat {
  height: 100%;
}
.detail-stat__label {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(34, 43, 35, 0.5);
  margin: 0 0 4px;
}
.detail-stat__value {
  font-family: var(--hs-font-display);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.1;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.detail-dl {
  margin: 0;
}
.detail-dl__row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(46, 82, 51, 0.1);
}
.detail-dl__row:last-child {
  border-bottom: none;
}
.detail-dl dt {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(34, 43, 35, 0.5);
}
.detail-dl dd {
  margin: 0;
  font-size: 0.95rem;
}

.detail-repro-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.detail-repro-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-repro-sub {
  font-size: 0.72rem;
  color: rgba(34, 43, 35, 0.55);
}

.detail-child {
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}
.detail-child:hover {
  border-color: rgba(46, 125, 50, 0.4);
  background: rgba(46, 125, 50, 0.04);
}

@media (min-width: 600px) {
  .detail-repro-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (prefers-reduced-motion: reduce) {
  .detail-link,
  .detail-child {
    transition: none;
  }
}
</style>
