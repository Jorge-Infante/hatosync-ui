<template>
  <v-layout class="fill-height">
    <AppBar @toggle-drawer="drawer = !drawer" />

    <NavigationDrawer v-model="drawer" :items="menuItems" title="Configuración" subtitle="Catálogos de la finca" />

    <v-main class="bg-background">
      <v-container fluid class="pa-4 pa-md-6">
        <!-- Keyed on the active farm: switching farm remounts pages so they reload scoped data -->
        <router-view :key="activeFarmId" />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'
import AppBar from '@/modules/shared/components/AppBar.vue'
import NavigationDrawer from '@/modules/shared/components/NavigationDrawer.vue'
import menuItems from '@/modules/shared/menuItems'

export default {
  name: 'ConfigurationLayout',
  components: { AppBar, NavigationDrawer },
  data() {
    return {
      drawer: true,
      menuItems,
    }
  },
  computed: {
    ...mapGetters('auth', ['activeFarmId']),
  },
}
</script>
