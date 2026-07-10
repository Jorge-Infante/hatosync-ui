export default {
  SET_NOTIFICATIONS(state, notifications) {
    state.notifications = notifications
  },

  SET_UNREAD_COUNT(state, count) {
    state.unreadCount = count
  },

  MARK_READ(state, id) {
    const notification = state.notifications.find((n) => n.id === id)
    if (notification && !notification.is_read) {
      notification.is_read = true
      state.unreadCount = Math.max(0, state.unreadCount - 1)
    }
  },

  MARK_ALL_READ(state) {
    state.notifications.forEach((n) => {
      n.is_read = true
    })
    state.unreadCount = 0
  },

  // El mismo hecho (event_id) genera una fila por destinatario; para ESTE
  // usuario a lo sumo hay una en la lista.
  MARK_READ_BY_EVENT(state, eventId) {
    state.notifications.forEach((n) => {
      if (n.event_id === eventId && !n.is_read) {
        n.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    })
  },
}
