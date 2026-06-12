<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
  },
  methods: {
    ...mapActions('auth', ['fetchProfile']),
  },
  created() {
    if (this.isAuthenticated) {
      // Restore the profile from the stored session; on an invalid/expired
      // refresh token the API client forces logout and redirects to login
      this.fetchProfile().catch(() => {})
    }
  },
}
</script>
