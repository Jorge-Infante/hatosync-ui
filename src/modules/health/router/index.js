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
    {
      path: 'jornadas',
      name: 'health-jornadas',
      component: () =>
        import(/* webpackChunkName: "health-jornadas" */ '@/modules/health/pages/JornadasPage.vue'),
    },
    {
      path: 'jornadas/pesaje',
      name: 'health-weighing',
      component: () =>
        import(/* webpackChunkName: "health-jornadas" */ '@/modules/health/pages/WeighingSessionPage.vue'),
    },
    {
      path: 'jornadas/protocolo',
      name: 'health-batch',
      component: () =>
        import(/* webpackChunkName: "health-jornadas" */ '@/modules/health/pages/BatchFormPage.vue'),
    },
  ],
}

export default healthRouter
