const farmsRouter = {
  component: () =>
    import(/* webpackChunkName: "farms-layout" */ '@/modules/farms/layouts/FarmsLayout.vue'),
  redirect: { name: 'farm-list' },
  children: [
    {
      path: 'list',
      name: 'farm-list',
      // `null` cubre al usuario sin membresía todavía (necesita crear su primera finca).
      meta: { roles: ['OWNER', 'ADMIN', 'EMPLOYEE', null] },
      component: () =>
        import(/* webpackChunkName: "farm-list" */ '@/modules/farms/pages/FarmListPage.vue'),
    },
    {
      path: 'members',
      name: 'farm-members',
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(/* webpackChunkName: "farm-members" */ '@/modules/farms/pages/FarmMembersPage.vue'),
    },
  ],
}

export default farmsRouter
