<template>
  <v-layout class="fill-height">
    <AppBar @toggle-drawer="drawer = !drawer" />

    <NavigationDrawer v-model="drawer" :items="menuItems" title="Fincas" subtitle="Gestión y miembros" />

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

export default {
  name: 'FarmsLayout',
  components: { AppBar, NavigationDrawer },
  data() {
    return {
      drawer: true,
      menuItems: [
        { title: 'Mis fincas', icon: 'mdi-barn', to: { name: 'farm-list' } },
        { title: 'Miembros', icon: 'mdi-account-group-outline', to: { name: 'farm-members' } },
        { title: 'Animales', icon: 'mdi-cow', to: { name: 'livestock-animals' } },
      ],
    }
  },
  computed: {
    ...mapGetters('auth', ['activeFarmId']),
  },
}
</script>
