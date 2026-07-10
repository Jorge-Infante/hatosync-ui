const healthRouter = {
  component: () =>
    import(/* webpackChunkName: "health-layout" */ '@/modules/health/layouts/HealthLayout.vue'),
  redirect: { name: 'health-agenda' },
  children: [
    {
      path: 'agenda',
      name: 'health-agenda',
      component: () =>
        import(/* webpackChunkName: "health-agenda" */ '@/modules/health/pages/HealthAgendaPage.vue'),
    },
    {
      path: 'protocols',
      name: 'health-protocols',
      // Las plantillas son configuración clínica de la finca: solo administradores.
      meta: { roles: ['OWNER', 'ADMIN'] },
      component: () =>
        import(/* webpackChunkName: "health-protocols" */ '@/modules/health/pages/ProtocolListPage.vue'),
    },
  ],
}

export default healthRouter
