// El dashboard muestra cifras de TODO el hato: el socio (PARTNER) no lo ve
// (el backend también lo bloquea con 403).
const DASHBOARD_ROLES = ['OWNER', 'ADMIN', 'EMPLOYEE']

const dashboardRouter = {
  component: () =>
    import(
      /* webpackChunkName: "dashboard-layout" */ '@/modules/dashboard/layouts/DashboardLayout.vue'
    ),
  redirect: { name: 'dashboard-production' },
  meta: { roles: DASHBOARD_ROLES },
  children: [
    {
      path: '',
      name: 'dashboard-production',
      meta: { roles: DASHBOARD_ROLES },
      component: () =>
        import(
          /* webpackChunkName: "dashboard-production" */ '@/modules/dashboard/pages/ProductionDashboardPage.vue'
        ),
    },
  ],
}

export default dashboardRouter
