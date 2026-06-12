import apiClient from '@/api/client'

// Standard CRUD goes through the shared store; only farm-domain
// particularities live here.
export default {
  // POST /auth/me/active-farm/ → switches the user's active farm and returns
  // the updated user. Scoped data loaded from the previous farm must be
  // reloaded by the caller afterwards.
  async switchActiveFarm({ commit }, farmId) {
    const { data } = await apiClient.post('/auth/me/active-farm/', { farm_id: farmId })
    commit('auth/SET_USER', data, { root: true })
    return data
  },
}
