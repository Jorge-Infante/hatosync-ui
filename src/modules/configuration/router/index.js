const configurationRouter = {
  component: () =>
    import(
      /* webpackChunkName: "configuration-layout" */ '@/modules/configuration/layouts/ConfigurationLayout.vue'
    ),
  redirect: { name: 'config-breeds' },
  children: [
    {
      path: 'breeds',
      name: 'config-breeds',
      component: () =>
        import(
          /* webpackChunkName: "config-breeds" */ '@/modules/configuration/pages/BreedListPage.vue'
        ),
    },
    {
      path: 'identification-types',
      name: 'config-identification-types',
      component: () =>
        import(
          /* webpackChunkName: "config-id-types" */ '@/modules/configuration/pages/IdentificationTypeListPage.vue'
        ),
    },
  ],
}

export default configurationRouter
