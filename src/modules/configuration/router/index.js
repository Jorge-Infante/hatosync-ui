const configurationRouter = {
  component: () =>
    import(
      /* webpackChunkName: "configuration-layout" */ '@/modules/configuration/layouts/ConfigurationLayout.vue'
    ),
  redirect: { name: 'config-breeds' },
  // Los catálogos son configuración de la finca: solo administradores.
  meta: { roles: ['OWNER', 'ADMIN'] },
  children: [
    {
      path: 'breeds',
      name: 'config-breeds',
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(
          /* webpackChunkName: "config-breeds" */ '@/modules/configuration/pages/BreedListPage.vue'
        ),
    },
    {
      path: 'identification-types',
      name: 'config-identification-types',
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(
          /* webpackChunkName: "config-id-types" */ '@/modules/configuration/pages/IdentificationTypeListPage.vue'
        ),
    },
    {
      path: 'medications',
      name: 'config-medications',
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(
          /* webpackChunkName: "config-medications" */ '@/modules/configuration/pages/MedicationListPage.vue'
        ),
    },
  ],
}

export default configurationRouter
