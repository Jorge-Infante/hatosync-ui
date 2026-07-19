const paddocksRouter = {
  component: () =>
    import(
      /* webpackChunkName: "paddocks-layout" */ '@/modules/paddocks/layouts/PaddocksLayout.vue'
    ),
  redirect: { name: 'paddock-list' },
  children: [
    {
      path: '',
      name: 'paddock-list',
      component: () =>
        import(
          /* webpackChunkName: "paddock-list" */ '@/modules/paddocks/pages/PaddockListPage.vue'
        ),
    },
    // Dibujar/editar potreros es gestión de la finca: solo administradores.
    {
      path: 'new',
      name: 'paddock-new',
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(
          /* webpackChunkName: "paddock-editor" */ '@/modules/paddocks/pages/PaddockEditorPage.vue'
        ),
    },
    {
      path: ':id/edit',
      name: 'paddock-edit',
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(
          /* webpackChunkName: "paddock-editor" */ '@/modules/paddocks/pages/PaddockEditorPage.vue'
        ),
    },
  ],
}

export default paddocksRouter
