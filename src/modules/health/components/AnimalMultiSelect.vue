<template>
  <div>
    <div class="d-flex align-center mb-2">
      <p class="hs-overline mb-0">Animales ({{ modelValue.length }} seleccionados)</p>
      <v-spacer />
      <v-chip size="small" :variant="allSelected ? 'flat' : 'outlined'" color="primary" @click="toggleAll">
        {{ allSelected ? 'Quitar todos' : 'Todos' }}
      </v-chip>
    </div>

    <p v-if="femalesOnly" class="text-caption text-medium-emphasis mb-2">
      Protocolo reproductivo: solo se listan hembras.
    </p>

    <!-- Atajos por lote: "todo el lote X" de un clic -->
    <div v-if="lotChips.length" class="d-flex flex-wrap ga-2 mb-3">
      <v-chip
        v-for="lot in lotChips"
        :key="lot.id"
        size="small"
        prepend-icon="mdi-select-group"
        :variant="lotFullySelected(lot.id) ? 'flat' : 'outlined'"
        color="primary"
        @click="toggleLot(lot.id)"
      >
        {{ lot.name }} ({{ lot.count }})
      </v-chip>
    </div>

    <v-autocomplete
      :model-value="modelValue"
      :items="options"
      label="Buscar y seleccionar animales"
      prepend-inner-icon="mdi-cow"
      multiple
      chips
      closable-chips
      clearable
      :no-data-text="eligible.length ? 'Sin coincidencias' : 'No hay animales elegibles'"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script>
export default {
  name: 'AnimalMultiSelect',
  props: {
    modelValue: { type: Array, default: () => [] }, // ids seleccionados
    animals: { type: Array, default: () => [] },
    lots: { type: Array, default: () => [] },
    femalesOnly: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  computed: {
    eligible() {
      return this.femalesOnly ? this.animals.filter((a) => a.sex === 'FEMALE') : this.animals
    },
    options() {
      return this.eligible.map((a) => ({
        title: a.lot_name ? `${a.name} · ${a.lot_name}` : a.name,
        value: a.id,
      }))
    },
    lotChips() {
      const counts = {}
      this.eligible.forEach((a) => {
        if (a.lot) counts[a.lot] = (counts[a.lot] || 0) + 1
      })
      return this.lots.filter((l) => counts[l.id]).map((l) => ({ ...l, count: counts[l.id] }))
    },
    allSelected() {
      return this.eligible.length > 0 && this.eligible.every((a) => this.modelValue.includes(a.id))
    },
  },
  methods: {
    lotIds(lotId) {
      return this.eligible.filter((a) => String(a.lot) === String(lotId)).map((a) => a.id)
    },
    lotFullySelected(lotId) {
      const ids = this.lotIds(lotId)
      return ids.length > 0 && ids.every((id) => this.modelValue.includes(id))
    },
    toggleLot(lotId) {
      const ids = this.lotIds(lotId)
      if (this.lotFullySelected(lotId)) {
        this.$emit('update:modelValue', this.modelValue.filter((id) => !ids.includes(id)))
      } else {
        this.$emit('update:modelValue', [...new Set([...this.modelValue, ...ids])])
      }
    },
    toggleAll() {
      this.$emit('update:modelValue', this.allSelected ? [] : this.eligible.map((a) => a.id))
    },
  },
}
</script>
