export default {
  SET_USER(state, user) {
    state.user = user
  },
  SET_AUTHENTICATED(state, value) {
    state.isAuthenticated = value
  },
  CLEAR_AUTH(state) {
    state.user = null
    state.isAuthenticated = false
  },
}
