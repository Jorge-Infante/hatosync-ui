const livestockRouter = {
  component: () =>
    import(/* webpackChunkName: "livestock-layout" */ '@/modules/livestock/layouts/LivestockLayout.vue'),
  redirect: { name: 'livestock-animals' },
  children: [
    {
      path: 'animals',
      name: 'livestock-animals',
      component: () =>
        import(/* webpackChunkName: "livestock-animals" */ '@/modules/livestock/pages/AnimalListPage.vue'),
    },
    {
      path: 'animals/:id',
      name: 'livestock-animal-detail',
      component: () =>
        import(/* webpackChunkName: "livestock-animal-detail" */ '@/modules/livestock/pages/AnimalDetailPage.vue'),
    },
    {
      path: 'lots',
      name: 'livestock-lots',
      component: () =>
        import(/* webpackChunkName: "livestock-lots" */ '@/modules/livestock/pages/LotsPage.vue'),
    },
    {
      // Reusa AnimalListPage (misma vista + buscador) filtrada por lote.
      path: 'lots/:lotId',
      name: 'livestock-lot-animals',
      component: () =>
        import(/* webpackChunkName: "livestock-animals" */ '@/modules/livestock/pages/AnimalListPage.vue'),
    },
  ],
}

export default livestockRouter
