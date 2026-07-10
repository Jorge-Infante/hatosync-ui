/**
 * Canonical app navigation — single source of truth for the side drawer.
 *
 * Every module layout imports this so the nav is identical app-wide and a
 * section (e.g. Configuración) stays reachable from anywhere. Add new sections
 * here, not in individual layouts. Groups use `children`; the NavigationDrawer
 * renders them as an expandable v-list-group.
 *
 * `roles` restringe la entrada a esos roles de la finca activa (matriz
 * PLANNING §3.2.3): sin `roles` la ve cualquiera. `null` en la lista cubre al
 * usuario sin membresía todavía (necesita "Mis fincas" para crear la primera).
 * Los layouts filtran con `visibleMenuItems(role)`.
 */
const ADMIN_ROLES = ['OWNER', 'ADMIN']

const menuItems = [
  { title: 'Animales', icon: 'mdi-cow', to: { name: 'livestock-animals' } },
  {
    title: 'Sanidad',
    icon: 'mdi-hospital-box',
    children: [
      { title: 'Agenda', icon: 'mdi-calendar-clock', to: { name: 'health-agenda' } },
      { title: 'Protocolos', icon: 'mdi-clipboard-list-outline', roles: ADMIN_ROLES, to: { name: 'health-protocols' } },
    ],
  },
  {
    title: 'Configuración',
    icon: 'mdi-cog-outline',
    roles: ADMIN_ROLES,
    children: [
      { title: 'Razas', icon: 'mdi-dna', to: { name: 'config-breeds' } },
      {
        title: 'Identificación',
        icon: 'mdi-tag-multiple-outline',
        to: { name: 'config-identification-types' },
      },
      { title: 'Medicamentos', icon: 'mdi-pill', to: { name: 'config-medications' } },
    ],
  },
  { title: 'Mis fincas', icon: 'mdi-barn', roles: [...ADMIN_ROLES, 'EMPLOYEE', null], to: { name: 'farm-list' } },
  { title: 'Miembros', icon: 'mdi-account-group-outline', roles: ADMIN_ROLES, to: { name: 'farm-members' } },
]

export function visibleMenuItems(role) {
  const allowed = (item) => !item.roles || item.roles.includes(role)
  return menuItems.filter(allowed).map((item) => {
    if (!item.children) return item
    // Filtra también los hijos por rol (p. ej. Protocolos = solo admins, aunque
    // el grupo Sanidad lo vea cualquiera).
    return { ...item, children: item.children.filter(allowed) }
  })
}

export default menuItems
