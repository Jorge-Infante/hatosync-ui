import apiClient from '@/api/client'
import tokenStorage from '@/api/tokenStorage'

export default {
  // POST /auth/login/ {email, password} → {user, tokens: {access, refresh}}
  async login({ commit }, { email, password }) {
    const { data } = await apiClient.post('/auth/login/', { email, password })
    tokenStorage.setTokens(data.tokens)
    commit('SET_USER', data.user)
    commit('SET_AUTHENTICATED', true)
    return data.user
  },

  // GET /auth/me/ — restores the profile when a session token already exists
  async fetchProfile({ commit }) {
    const { data } = await apiClient.get('/auth/me/')
    commit('SET_USER', data)
    return data
  },

  logout({ commit }) {
    tokenStorage.clear()
    commit('CLEAR_AUTH')
  },
}
