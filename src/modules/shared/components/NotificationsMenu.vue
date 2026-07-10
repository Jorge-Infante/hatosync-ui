<template>
  <v-menu v-model="menu" :close-on-content-click="false" location="bottom end" width="400">
    <template #activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" icon class="ml-1" aria-label="Notificaciones">
        <v-badge :content="unreadCount" :model-value="unreadCount > 0" color="error" max="99">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card>
      <v-toolbar density="compact" color="surface">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">Notificaciones</v-toolbar-title>
        <v-spacer />
        <v-btn
          v-if="unreadCount > 0"
          size="small"
          variant="text"
          color="primary"
          @click="handleMarkAll"
        >
          Marcar todas
        </v-btn>
      </v-toolbar>

      <!-- Activar push del navegador (solo si hay soporte y aún no se pidió permiso) -->
      <v-alert v-if="showEnableBanner" type="info" density="compact" class="ma-3">
        <div class="text-body-2">Recibe la actividad de la finca en este navegador.</div>
        <v-btn
          size="small"
          color="primary"
          variant="flat"
          class="mt-2"
          :loading="enabling"
          @click="handleEnable"
        >
          Activar notificaciones
        </v-btn>
      </v-alert>

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-list v-if="notifications.length" density="comfortable" class="py-0 hs-notifications-list">
        <template v-for="(notification, index) in notifications" :key="notification.id">
          <v-divider v-if="index > 0" />
          <v-list-item @click="handleOpen(notification)">
            <v-list-item-title :class="{ 'font-weight-bold': !notification.is_read }">
              {{ notification.title }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-wrap">{{ notification.body }}</v-list-item-subtitle>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ relativeDate(notification.created_at) }}
            </div>
            <template #append>
              <v-icon v-if="!notification.is_read" size="10" color="primary">mdi-circle</v-icon>
            </template>
          </v-list-item>
        </template>
      </v-list>

      <div v-else-if="!loading" class="pa-8 text-center text-medium-emphasis">
        <v-icon size="40" class="mb-2">mdi-bell-off-outline</v-icon>
        <div class="text-body-2">Sin notificaciones por ahora</div>
      </div>
    </v-card>
  </v-menu>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import {
  isPushConfigured,
  isPushSupported,
  pushPermission,
  enableWebPush,
  refreshWebPushIfGranted,
  onForegroundPush,
  onNotificationClickMessage,
} from '@/plugins/push'

/**
 * Campanita del AppBar: badge de no leídas + historial de la finca activa,
 * marcar leída al click (navegando al animal si aplica) y marcar todas.
 *
 * También es el punto de arranque del push web: re-registra el token si el
 * permiso ya está dado, escucha las push en primer plano (refresca el badge),
 * el click en notificaciones del SW (navega + marca leída) y consume el
 * ?notif_event= con el que el SW abre la pestaña en frío.
 */
export default {
  name: 'NotificationsMenu',
  data() {
    return {
      menu: false,
      loading: false,
      enabling: false,
      pushSupported: false,
      permission: pushPermission(),
      snackbar: { show: false, text: '', color: 'success' },
      unsubscribers: [],
    }
  },
  computed: {
    ...mapGetters('auth', ['activeFarmId']),
    ...mapGetters('notifications', ['notifications', 'unreadCount']),
    showEnableBanner() {
      return isPushConfigured() && this.pushSupported && this.permission === 'default'
    },
  },
  watch: {
    menu(open) {
      if (open) this.loadList()
    },
    // Las notificaciones son de la FINCA ACTIVA: al cambiarla, el badge y la
    // lista pertenecen a la finca anterior.
    activeFarmId() {
      this.fetchUnreadCount().catch(() => {})
      if (this.menu) this.loadList()
    },
  },
  created() {
    this.fetchUnreadCount().catch(() => {})
    isPushSupported().then((supported) => {
      this.pushSupported = supported
    })
    refreshWebPushIfGranted()
    this.unsubscribers.push(onForegroundPush((payload) => this.handleForegroundPush(payload)))
    this.unsubscribers.push(onNotificationClickMessage((data) => this.handleNotificationClick(data)))
    this.consumeNotifEventParam()
  },
  beforeUnmount() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe())
  },
  methods: {
    ...mapActions('notifications', [
      'fetchNotifications',
      'fetchUnreadCount',
      'markRead',
      'markAllRead',
      'markReadByEvent',
    ]),
    async loadList() {
      this.loading = true
      try {
        await Promise.all([this.fetchNotifications(), this.fetchUnreadCount()])
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar las notificaciones'), 'error')
      } finally {
        this.loading = false
      }
    },
    handleOpen(notification) {
      if (!notification.is_read) this.markRead(notification.id).catch(() => {})
      this.menu = false
      this.goToAnimal(notification.data && notification.data.animal_id)
    },
    handleMarkAll() {
      this.markAllRead().catch(() => {})
    },
    async handleEnable() {
      this.enabling = true
      try {
        await enableWebPush()
        this.permission = pushPermission()
        this.notify('Notificaciones activadas en este navegador', 'success')
      } catch (e) {
        this.permission = pushPermission()
        this.notify(e.message || 'No se pudieron activar las notificaciones', 'error')
      } finally {
        this.enabling = false
      }
    },
    // Push con la pestaña en primer plano: refrescar badge (y lista si está abierta).
    handleForegroundPush(payload) {
      this.fetchUnreadCount().catch(() => {})
      if (this.menu) this.fetchNotifications().catch(() => {})
      const notification = payload && payload.notification
      if (notification && notification.title) {
        this.notify(`${notification.title} — ${notification.body || ''}`, 'info')
      }
    },
    // Click en una notificación del SW con esta pestaña abierta.
    handleNotificationClick(data) {
      if (data.event_id) this.markReadByEvent(data.event_id).catch(() => {})
      this.goToAnimal(data.animal_id)
    },
    // Pestaña abierta EN FRÍO por el SW: la URL trae ?notif_event= para marcar leída.
    consumeNotifEventParam() {
      const eventId = new URLSearchParams(window.location.search).get('notif_event')
      if (!eventId) return
      this.markReadByEvent(eventId).catch(() => {})
      this.$router.isReady().then(() => {
        const query = { ...this.$route.query }
        delete query.notif_event
        this.$router.replace({ query })
      })
    },
    goToAnimal(animalId) {
      if (!animalId) return
      if (this.$route.name === 'livestock-animal-detail' && this.$route.params.id === animalId) return
      this.$router.push({ name: 'livestock-animal-detail', params: { id: animalId } })
    },
    relativeDate(iso) {
      const diffMs = Date.now() - new Date(iso).getTime()
      const minutes = Math.floor(diffMs / 60000)
      if (minutes < 1) return 'Ahora'
      if (minutes < 60) return `Hace ${minutes} min`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `Hace ${hours} h`
      const days = Math.floor(hours / 24)
      if (days < 7) return days === 1 ? 'Ayer' : `Hace ${days} días`
      return new Date(iso).toLocaleDateString()
    },
    notify(text, color) {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>

<style scoped>
.hs-notifications-list {
  max-height: 420px;
  overflow-y: auto;
}
</style>
