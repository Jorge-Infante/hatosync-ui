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
  ],
}

export default livestockRouter
