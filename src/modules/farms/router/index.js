const farmsRouter = {
  component: () =>
    import(/* webpackChunkName: "farms-layout" */ '@/modules/farms/layouts/FarmsLayout.vue'),
  redirect: { name: 'farm-list' },
  children: [
    {
      path: 'list',
      name: 'farm-list',
      component: () =>
        import(/* webpackChunkName: "farm-list" */ '@/modules/farms/pages/FarmListPage.vue'),
    },
    {
      path: 'members',
      name: 'farm-members',
      component: () =>
        import(/* webpackChunkName: "farm-members" */ '@/modules/farms/pages/FarmMembersPage.vue'),
    },
  ],
}

export default farmsRouter
