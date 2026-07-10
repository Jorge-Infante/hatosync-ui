import apiClient from '@/api/client'

// Las marcas de lectura son OPTIMISTAS (commit antes del POST): la campanita
// responde al instante y un fallo de red se corrige en el próximo fetch.
export default {
  async fetchNotifications({ commit }) {
    const { data } = await apiClient.get('/notifications/')
    commit('SET_NOTIFICATIONS', data)
    return data
  },

  async fetchUnreadCount({ commit }) {
    const { data } = await apiClient.get('/notifications/unread-count/')
    commit('SET_UNREAD_COUNT', data.count)
    return data.count
  },

  async markRead({ commit }, id) {
    commit('MARK_READ', id)
    await apiClient.post(`/notifications/${id}/read/`)
  },

  async markAllRead({ commit }) {
    commit('MARK_ALL_READ')
    await apiClient.post('/notifications/read-all/')
  },

  // Abrir el app desde una push la marca leída (el payload trae event_id).
  async markReadByEvent({ commit }, eventId) {
    commit('MARK_READ_BY_EVENT', eventId)
    await apiClient.post('/notifications/read-by-event/', { event_id: eventId })
  },
}
