export default {
  isAuthenticated: (state) => state.isAuthenticated,
  currentUser: (state) => state.user,
  userName: (state) => (state.user ? state.user.full_name : ''),
  userEmail: (state) => (state.user ? state.user.email : ''),
  activeFarmId: (state) => (state.user ? state.user.active_farm : null),
  activeFarmName: (state) => (state.user ? state.user.active_farm_name : ''),
}
