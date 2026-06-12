<template>
  <v-app-bar density="comfortable">
    <v-app-bar-nav-icon class="d-md-none" @click.stop="$emit('toggle-drawer')" />

    <span class="hs-stamp ml-3 mr-3">HS</span>
    <v-app-bar-title class="font-weight-bold ml-0 d-none d-sm-flex">
      HatoSync
    </v-app-bar-title>

    <v-spacer />

    <!-- Active farm selector: scoped endpoints filter by this farm -->
    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-barn"
          append-icon="mdi-chevron-down"
          :loading="switching"
        >
          {{ activeFarmName || 'Sin finca' }}
        </v-btn>
      </template>
      <v-list density="compact" nav>
        <v-list-item
          v-for="farm in farms"
          :key="farm.id"
          :title="farm.name"
          :subtitle="farmLocation(farm)"
          prepend-icon="mdi-barn"
          :active="farm.id === activeFarmId"
          @click="handleSwitch(farm)"
        />
        <v-list-item
          v-if="farms.length === 0"
          title="Sin fincas"
          subtitle="Crea una finca para empezar"
          prepend-icon="mdi-plus"
          :to="{ name: 'farm-list' }"
        />
      </v-list>
    </v-menu>

    <!-- User menu -->
    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" icon class="ml-1">
          <v-avatar color="primary" size="36">
            <span class="text-body-2 font-weight-medium">{{ userInitials }}</span>
          </v-avatar>
        </v-btn>
      </template>
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-account-outline" :title="userName || 'Mi perfil'" :subtitle="userEmail" />
        <v-divider class="my-1" />
        <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" @click="handleLogout" />
      </v-list>
    </v-menu>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-app-bar>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

/**
 * Shared app header: brand, active-farm selector and user menu.
 * Switching farm updates auth.user.active_farm — layouts key their
 * <router-view> on activeFarmId so every farm-scoped page reloads.
 */
export default {
  name: 'AppBar',
  emits: ['toggle-drawer'],
  data() {
    return {
      switching: false,
      snackbar: { show: false, text: '', color: 'error' },
    }
  },
  computed: {
    ...mapGetters('farms', { farms: 'allFarms' }),
    ...mapGetters('auth', ['userName', 'userEmail', 'activeFarmId', 'activeFarmName']),
    userInitials() {
      if (!this.userName) return 'U'
      return this.userName
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    },
  },
  created() {
    this.loadFarms()
  },
  methods: {
    ...mapActions('shared', ['fetchState']),
    ...mapActions('farms', ['switchActiveFarm']),
    ...mapActions('auth', ['logout']),
    async loadFarms() {
      try {
        await this.fetchState({ module: 'farms', nameState: 'farms', url: '/farms/' })
      } catch (e) {
        // Header stays usable with just the active farm name from the profile
      }
    },
    farmLocation(farm) {
      return [farm.city, farm.department].filter(Boolean).join(', ') || 'Sin ubicación'
    },
    async handleSwitch(farm) {
      if (farm.id === this.activeFarmId) return
      this.switching = true
      try {
        await this.switchActiveFarm(farm.id)
      } catch (e) {
        this.snackbar = { show: true, text: getErrorMessage(e, 'No se pudo cambiar de finca'), color: 'error' }
      } finally {
        this.switching = false
      }
    },
    handleLogout() {
      this.logout()
      this.$router.push({ name: 'login' })
    },
  },
}
</script>
