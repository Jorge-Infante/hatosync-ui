const authRouter = {
  component: () =>
    import(/* webpackChunkName: "auth-layout" */ '@/modules/auth/layouts/AuthLayout.vue'),
  redirect: { name: 'login' },
  children: [
    {
      path: 'login',
      name: 'login',
      component: () =>
        import(/* webpackChunkName: "login" */ '@/modules/auth/pages/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    // Upcoming auth pages share AuthLayout — add them as siblings of login:
    // { path: 'register', name: 'register', component: () => import('@/modules/auth/pages/RegisterPage.vue') },
    // { path: 'forgot-password', name: 'forgot-password', component: () => import('@/modules/auth/pages/ForgotPasswordPage.vue') },
  ],
}

export default authRouter
