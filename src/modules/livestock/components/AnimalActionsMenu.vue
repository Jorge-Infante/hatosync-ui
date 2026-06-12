<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
    </template>
    <v-list density="compact" nav>
      <!-- Coming soon: registrar parto, destetar, eventos reproductivos, fotos -->
      <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" @click="$emit('edit', animal)" />
      <v-list-item prepend-icon="mdi-delete-outline" title="Eliminar" base-color="error" @click="$emit('delete', animal)" />
    </v-list>
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
  emits: ['edit', 'delete'],
}
</script>
