<template>
  <v-dialog v-model="dialog" max-width="940" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-btn
          v-if="history.length"
          icon="mdi-arrow-left"
          variant="text"
          size="small"
          class="mr-1"
          @click="goBack"
        />
        <v-icon v-else color="primary" class="mr-2">mdi-family-tree</v-icon>
        Genealogía
        <span v-if="subject" class="hs-gen-title-name ml-2">· {{ subject.name }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text class="px-6 pb-4">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p class="text-caption text-medium-emphasis mb-3">
          Ancestros hasta bisabuelos. Toca cualquier animal del gráfico para ver su genealogía.
        </p>

        <div v-if="loading" class="d-flex justify-center py-12">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="subject" class="hs-gen-scroll">
          <div class="hs-gen-grid" :style="gridStyle">
            <div
              v-for="slot in slots"
              :key="slot.key"
              class="hs-gen-slot"
              :class="slot.classes"
              :style="slot.style"
            >
              <!-- Unknown branch -->
              <div v-if="slot.ghost" class="hs-gen-card hs-gen-card--ghost">
                <p class="hs-gen-card__name">Sin registro</p>
                <p class="hs-gen-card__meta">{{ slot.roleLabel }}</p>
              </div>

              <!-- Animal node -->
              <div
                v-else
                class="hs-gen-card"
                :class="{
                  'hs-gen-card--subject': slot.isSubject,
                  'hs-gen-card--inactive': !slot.node.is_active,
                  'hs-gen-card--link': !slot.isSubject,
                }"
                @click="!slot.isSubject && navigateTo(slot.node)"
              >
                <v-avatar
                  size="30"
                  :color="slot.node.sex === 'FEMALE' ? 'primary' : 'accent'"
                  variant="tonal"
                >
                  <v-img v-if="photoUrl(slot.node)" :src="photoUrl(slot.node)" cover />
                  <v-icon v-else size="16">
                    {{ slot.node.sex === 'FEMALE' ? 'mdi-gender-female' : 'mdi-gender-male' }}
                  </v-icon>
                </v-avatar>
                <div class="hs-gen-card__body">
                  <p class="hs-gen-card__name">{{ slot.node.name }}</p>
                  <p class="hs-gen-card__meta">
                    {{ slot.node.sex_display }}<template v-if="birthYear(slot.node)"> · {{ birthYear(slot.node) }}</template>
                    <template v-if="!slot.node.is_active"> · Inactivo</template>
                    <template v-if="slot.node.has_more_ancestors"> · +ancestros</template>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="d-flex flex-wrap align-center ga-4 mt-4 text-caption text-medium-emphasis">
          <span><span class="hs-gen-dot hs-gen-dot--female" /> Hembra</span>
          <span><span class="hs-gen-dot hs-gen-dot--male" /> Macho</span>
          <span class="hs-gen-legend-ghost">Sin registro</span>
          <span class="hs-gen-legend-inactive">Atenuado: inactivo (vendido / muerto)</span>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { API_ORIGIN } from '@/api/client'

const REQUESTED_DEPTH = 3

export default {
  name: 'GenealogyDialog',
  data() {
    return {
      dialog: false,
      loading: false,
      error: '',
      subject: null, // root node of the fetched tree
      history: [], // ids visited, for the back button
    }
  },
  computed: {
    // Deepest generation that will actually render (nodes + their unknown-parent ghosts)
    effectiveDepth() {
      if (!this.subject) return 1
      const walk = (node, gen) => {
        if (gen >= REQUESTED_DEPTH || node.has_more_ancestors) return gen
        let max = gen + 1 // non-truncated nodes always render parent slots (node or ghost)
        if (node.mother) max = Math.max(max, walk(node.mother, gen + 1))
        if (node.father) max = Math.max(max, walk(node.father, gen + 1))
        return max
      }
      return Math.max(1, walk(this.subject, 0))
    },
    gridStyle() {
      return {
        gridTemplateColumns: `repeat(${this.effectiveDepth + 1}, minmax(158px, 1fr))`,
        gridTemplateRows: `repeat(${2 ** this.effectiveDepth}, 1fr)`,
      }
    },
    slots() {
      if (!this.subject) return []
      const depth = this.effectiveDepth
      const list = []

      const place = (gen, index) => {
        const span = 2 ** (depth - gen)
        return { gridColumn: gen + 1, gridRow: `${index * span + 1} / span ${span}` }
      }
      const connectorClasses = (gen, index) =>
        gen === 0
          ? []
          : ['hs-gen-slot--child', index % 2 === 0 ? 'hs-gen-slot--top' : 'hs-gen-slot--bottom']

      const visit = (node, gen, index) => {
        list.push({
          key: `n-${gen}-${index}`,
          node,
          ghost: false,
          isSubject: gen === 0,
          style: place(gen, index),
          classes: connectorClasses(gen, index),
        })
        if (gen >= depth || node.has_more_ancestors) return
        visitParent(node.mother, gen + 1, index * 2, 'Madre')
        visitParent(node.father, gen + 1, index * 2 + 1, 'Padre')
      }
      const visitParent = (parentNode, gen, index, roleLabel) => {
        if (parentNode) {
          visit(parentNode, gen, index)
        } else {
          list.push({
            key: `g-${gen}-${index}`,
            ghost: true,
            roleLabel,
            style: place(gen, index),
            classes: connectorClasses(gen, index),
          })
        }
      }

      visit(this.subject, 0, 0)
      return list
    },
  },
  methods: {
    ...mapActions('livestock', ['fetchGenealogy']),
    // Called from the parent via ref: open(animal)
    open(animal) {
      this.history = []
      this.subject = null
      this.error = ''
      this.dialog = true
      this.load(animal.id)
    },
    close() {
      this.dialog = false
    },
    async load(animalId) {
      this.loading = true
      this.error = ''
      try {
        this.subject = await this.fetchGenealogy({ animalId, depth: REQUESTED_DEPTH })
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo cargar la genealogía')
      } finally {
        this.loading = false
      }
    },
    navigateTo(node) {
      if (this.subject) this.history.push(this.subject.id)
      this.load(node.id)
    },
    goBack() {
      const previousId = this.history.pop()
      if (previousId) this.load(previousId)
    },
    photoUrl(node) {
      if (!node.photo) return ''
      return node.photo.startsWith('http') ? node.photo : `${API_ORIGIN}${node.photo}`
    },
    birthYear(node) {
      return node.birth_date ? node.birth_date.slice(0, 4) : ''
    },
  },
}
</script>

<style scoped>
.hs-gen-title-name {
  font-family: var(--hs-font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 1.05rem;
  color: rgba(34, 43, 35, 0.75);
}

.hs-gen-scroll {
  overflow-x: auto;
  padding: 4px 0;
}
.hs-gen-grid {
  --hs-gen-line: rgba(46, 82, 51, 0.3);
  display: grid;
  min-width: fit-content;
}

/* Slot = grid cell; the card centers vertically, pseudo-elements draw the bracket */
.hs-gen-slot {
  display: flex;
  align-items: center;
  position: relative;
  padding: 5px 0;
}
.hs-gen-slot--child {
  padding-left: 26px;
}
/* Mother (upper) slot: rounded elbow from her center down to the sibling boundary */
.hs-gen-slot--top::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 50%;
  bottom: 0;
  width: 13px;
  border-top: 1px solid var(--hs-gen-line);
  border-left: 1px solid var(--hs-gen-line);
  border-top-left-radius: 8px;
}
/* Stub from the child's center (the boundary between both parents) to the elbow */
.hs-gen-slot--top::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 13px;
  border-bottom: 1px solid var(--hs-gen-line);
}
/* Father (lower) slot: rounded elbow from the boundary down to his center */
.hs-gen-slot--bottom::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 0;
  bottom: 50%;
  width: 13px;
  border-bottom: 1px solid var(--hs-gen-line);
  border-left: 1px solid var(--hs-gen-line);
  border-bottom-left-radius: 8px;
}

.hs-gen-card {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  margin-right: 12px;
  border: 1px solid rgba(46, 82, 51, 0.18);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  padding: 6px 10px;
  min-width: 140px;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}
.hs-gen-card--link {
  cursor: pointer;
}
.hs-gen-card--link:hover {
  border-color: rgba(46, 125, 50, 0.45);
  background: rgba(46, 125, 50, 0.05);
  transform: translateY(-1px);
}
.hs-gen-card--subject {
  border-color: rgba(46, 125, 50, 0.5);
  background: rgba(46, 125, 50, 0.06);
}
.hs-gen-card--inactive {
  opacity: 0.55;
}
.hs-gen-card--ghost {
  border-style: dashed;
  opacity: 0.6;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.hs-gen-card__body {
  min-width: 0;
}
.hs-gen-card__name {
  font-family: var(--hs-font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 0.85rem;
  line-height: 1.15;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-gen-card__meta {
  font-size: 0.66rem;
  color: rgba(34, 43, 35, 0.6);
  margin: 0;
  white-space: nowrap;
}

/* Legend */
.hs-gen-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
.hs-gen-dot--female {
  background: rgba(46, 125, 50, 0.8);
}
.hs-gen-dot--male {
  background: rgba(201, 138, 45, 0.85);
}
.hs-gen-legend-ghost {
  border: 1px dashed rgba(46, 82, 51, 0.4);
  border-radius: 6px;
  padding: 0 6px;
  opacity: 0.7;
}
.hs-gen-legend-inactive {
  opacity: 0.55;
}
</style>
