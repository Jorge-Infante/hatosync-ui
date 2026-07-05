/**
 * Canonical app navigation — single source of truth for the side drawer.
 *
 * Every module layout imports this so the nav is identical app-wide and a
 * section (e.g. Configuración) stays reachable from anywhere. Add new sections
 * here, not in individual layouts. Groups use `children`; the NavigationDrawer
 * renders them as an expandable v-list-group.
 */
export default [
  { title: 'Animales', icon: 'mdi-cow', to: { name: 'livestock-animals' } },
  {
    title: 'Configuración',
    icon: 'mdi-cog-outline',
    children: [
      { title: 'Razas', icon: 'mdi-dna', to: { name: 'config-breeds' } },
      {
        title: 'Identificación',
        icon: 'mdi-tag-multiple-outline',
        to: { name: 'config-identification-types' },
      },
    ],
  },
  { title: 'Mis fincas', icon: 'mdi-barn', to: { name: 'farm-list' } },
  { title: 'Miembros', icon: 'mdi-account-group-outline', to: { name: 'farm-members' } },
]
