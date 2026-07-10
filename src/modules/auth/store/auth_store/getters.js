const ADMIN_ROLES = ['OWNER', 'ADMIN']

export default {
  isAuthenticated: (state) => state.isAuthenticated,
  currentUser: (state) => state.user,
  userName: (state) => (state.user ? state.user.full_name : ''),
  userEmail: (state) => (state.user ? state.user.email : ''),
  activeFarmId: (state) => (state.user ? state.user.active_farm : null),
  activeFarmName: (state) => (state.user ? state.user.active_farm_name : ''),
  // Rol del usuario en la finca activa (OWNER/ADMIN/EMPLOYEE/PARTNER), viene en /auth/me/.
  activeFarmRole: (state) => (state.user ? state.user.active_farm_role : null),
  // Administra la finca activa: configuración (catálogos), miembros y datos de la finca.
  isFarmAdmin: (state) => !!state.user && ADMIN_ROLES.includes(state.user.active_farm_role),
  // El socio solo consulta sus animales asignados: toda la UI de escritura se oculta.
  isPartner: (state) => !!state.user && state.user.active_farm_role === 'PARTNER',
}
