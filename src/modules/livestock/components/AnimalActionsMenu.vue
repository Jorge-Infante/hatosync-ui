<template>
  <v-menu location="bottom end" :offset="6">
    <template #activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
    </template>

    <v-card min-width="248" class="hs-actions" elevation="0">
      <!-- Field-notebook header: serif name over a dashed hairline -->
      <div class="hs-actions__header px-4 pt-3 pb-2">
        <p class="hs-actions__name">{{ animal.name }}</p>
        <p class="hs-actions__meta">{{ headerMeta }}</p>
      </div>

      <v-list density="compact" slim bg-color="transparent" class="py-1">
        <v-list-item class="hs-actions__item" @click="$emit('detail', animal)">
          <template #prepend>
            <v-icon size="18" class="hs-actions__icon">mdi-card-account-details-outline</v-icon>
          </template>
          <v-list-item-title>Ver detalle</v-list-item-title>
        </v-list-item>

        <v-divider class="my-1 mx-4" />

        <template v-if="isFemale">
          <p class="hs-actions__label">Reproducción</p>

          <v-list-item class="hs-actions__item" @click="$emit('birth', animal)">
            <template #prepend>
              <v-icon size="18" class="hs-actions__icon">mdi-baby-bottle-outline</v-icon>
            </template>
            <v-list-item-title>Registrar parto</v-list-item-title>
          </v-list-item>

          <v-list-item class="hs-actions__item" :disabled="!hasCalfAtSide" @click="$emit('wean', animal)">
            <template #prepend>
              <v-icon size="18" class="hs-actions__icon">mdi-link-variant-off</v-icon>
            </template>
            <v-list-item-title>Destetar cría</v-list-item-title>
            <v-list-item-subtitle v-if="!hasCalfAtSide">Sin cría al pie</v-list-item-subtitle>
          </v-list-item>

          <v-list-item class="hs-actions__item" @click="$emit('events', animal)">
            <template #prepend>
              <v-icon size="18" class="hs-actions__icon">mdi-history</v-icon>
            </template>
            <v-list-item-title>Historial y eventos</v-list-item-title>
          </v-list-item>

          <v-divider class="my-1 mx-4" />
        </template>

        <p class="hs-actions__label">Gestión</p>

        <v-list-item class="hs-actions__item" @click="$emit('treatment', animal)">
          <template #prepend>
            <v-icon size="18" class="hs-actions__icon">mdi-medical-bag</v-icon>
          </template>
          <v-list-item-title>Nuevo tratamiento</v-list-item-title>
        </v-list-item>

        <v-list-item class="hs-actions__item" @click="$emit('weight', animal)">
          <template #prepend>
            <v-icon size="18" class="hs-actions__icon">mdi-scale</v-icon>
          </template>
          <v-list-item-title>Registrar peso</v-list-item-title>
        </v-list-item>

        <v-list-item class="hs-actions__item" @click="$emit('genealogy', animal)">
          <template #prepend>
            <v-icon size="18" class="hs-actions__icon">mdi-family-tree</v-icon>
          </template>
          <v-list-item-title>Genealogía</v-list-item-title>
        </v-list-item>

        <v-list-item class="hs-actions__item" @click="$emit('edit', animal)">
          <template #prepend>
            <v-icon size="18" class="hs-actions__icon">mdi-pencil-outline</v-icon>
          </template>
          <v-list-item-title>Editar</v-list-item-title>
        </v-list-item>

        <v-list-item class="hs-actions__item" @click="$emit('inactivate', animal)">
          <template #prepend>
            <v-icon size="18" class="hs-actions__icon">mdi-logout-variant</v-icon>
          </template>
          <v-list-item-title>Sacar del hato</v-list-item-title>
        </v-list-item>

        <v-list-item class="hs-actions__item hs-actions__item--danger" @click="$emit('delete', animal)">
          <template #prepend>
            <v-icon size="18" class="hs-actions__icon">mdi-delete-outline</v-icon>
          </template>
          <v-list-item-title>Eliminar</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  name: 'AnimalActionsMenu',
  props: {
    animal: {
      type: Object,
      required: true,
    },
  },
  emits: ['detail', 'edit', 'delete', 'birth', 'wean', 'events', 'genealogy', 'weight', 'treatment', 'inactivate'],
  computed: {
    isFemale() {
      return this.animal.sex === 'FEMALE'
    },
    hasCalfAtSide() {
      return Boolean(this.animal.reproduction && this.animal.reproduction.calf_at_side)
    },
    headerMeta() {
      const repro = this.animal.reproduction || {}
      const parts = [this.animal.sex_display]
      // Parida es independiente del ciclo (Vacía/Servida/Preñada); "Vacía" se
      // omite mientras está parida — mismas reglas que reproChips().
      if (repro.calf_at_side) parts.push('Parida')
      if (repro.status_display && !(repro.status === 'OPEN' && repro.calf_at_side)) {
        parts.push(repro.status_display)
      }
      if (repro.open_days !== null && repro.open_days !== undefined) {
        parts.push(`${repro.open_days} días abiertos`)
      }
      return parts.filter(Boolean).join(' · ')
    },
  },
}
</script>

<style scoped>
.hs-actions {
  border: 1px solid rgba(46, 82, 51, 0.18);
  border-radius: 16px !important;
  background: rgb(var(--v-theme-surface));
  /* Floating menus need separation from the table; keep it soft and green-tinted */
  box-shadow: 0 14px 32px -16px rgba(27, 43, 29, 0.28) !important;
  overflow: hidden;
}

.hs-actions__header {
  border-bottom: 1px dashed rgba(46, 82, 51, 0.3);
  background: linear-gradient(180deg, rgba(46, 125, 50, 0.05), transparent);
}
.hs-actions__name {
  font-family: var(--hs-font-display);
  font-style: italic;
  font-weight: 600;
  font-size: 1.02rem;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}
.hs-actions__meta {
  font-size: 0.72rem;
  color: rgba(34, 43, 35, 0.6);
  margin: 2px 0 0;
}

.hs-actions__label {
  font-family: var(--hs-font-body);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(46, 125, 50, 0.85);
  padding: 8px 16px 2px;
  margin: 0;
}

.hs-actions__item {
  min-height: 36px;
  margin: 0 6px;
  border-radius: 10px;
  transition: background-color 0.18s ease;
}
.hs-actions__item :deep(.v-list-item-title) {
  font-size: 0.875rem;
}
.hs-actions__icon {
  color: rgba(34, 43, 35, 0.5);
  transition: color 0.18s ease, transform 0.18s ease;
}
.hs-actions__item:hover {
  background: rgba(46, 125, 50, 0.07);
}
.hs-actions__item:hover .hs-actions__icon {
  color: rgb(var(--v-theme-primary));
  transform: translateX(1px);
}

.hs-actions__item--danger :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-error));
}
.hs-actions__item--danger .hs-actions__icon {
  color: rgba(179, 64, 47, 0.7);
}
.hs-actions__item--danger:hover {
  background: rgba(179, 64, 47, 0.08);
}
.hs-actions__item--danger:hover .hs-actions__icon {
  color: rgb(var(--v-theme-error));
}
</style>
