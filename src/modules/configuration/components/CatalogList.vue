<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">{{ overline }}</p>
        <h1 class="text-h5 font-weight-bold">{{ title }}</h1>
        <p class="text-body-2 text-medium-emphasis">{{ subtitle }}</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$emit('new')">{{ newLabel }}</v-btn>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="list-item-avatar@4" class="border rounded-xl rise rise-d1" />

    <!-- Empty -->
    <v-card v-else-if="items.length === 0" class="pa-10 text-center rise rise-d1">
      <v-icon size="56" color="primary" class="mb-3">{{ icon }}</v-icon>
      <h2 class="text-h6 font-weight-bold mb-1">{{ emptyTitle }}</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ emptyText }}</p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$emit('new')">{{ newLabel }}</v-btn>
    </v-card>

    <!-- List -->
    <v-card v-else class="rise rise-d1">
      <v-list class="py-1">
        <template v-for="(item, index) in items" :key="item.id">
          <v-divider v-if="index > 0" class="mx-4" />
          <v-list-item class="hs-catalog-row px-4 py-2">
            <template #prepend>
              <v-avatar size="40" color="primary" variant="tonal" class="mr-3">
                <v-icon size="20">{{ icon }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">{{ item.name }}</v-list-item-title>

            <template #append>
              <div class="d-flex align-center ga-2">
                <slot name="meta" :item="item" />
                <v-menu location="bottom end" :offset="6">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" @click="$emit('edit', item)" />
                    <v-list-item prepend-icon="mdi-delete-outline" title="Eliminar" base-color="error" @click="$emit('delete', item)" />
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'CatalogList',
  props: {
    title: { type: String, required: true },
    overline: { type: String, default: 'Catálogo de la finca' },
    subtitle: { type: String, default: '' },
    newLabel: { type: String, default: 'Nuevo' },
    icon: { type: String, default: 'mdi-shape-outline' },
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    emptyTitle: { type: String, default: 'Catálogo vacío' },
    emptyText: { type: String, default: '' },
  },
  emits: ['new', 'edit', 'delete'],
}
</script>

<style scoped>
.hs-catalog-row {
  transition: background-color 0.18s ease;
}
.hs-catalog-row:hover {
  background: rgba(46, 125, 50, 0.05);
}
</style>
