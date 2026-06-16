import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import authRouter from '@/modules/auth/router'
import farmsRouter from '@/modules/farms/router'
import livestockRouter from '@/modules/livestock/router'
import configurationRouter from '@/modules/configuration/router'

const routes = [
  {
    path: '/',
    redirect: '/livestock',
  },
  {
    path: '/auth',
    ...authRouter,
  },
  {
    path: '/admin',
    ...farmsRouter,
  },
  {
    path: '/livestock',
    ...livestockRouter,
  },
  {
    path: '/configuration',
    ...configurationRouter,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

// Routes are protected by default; opt out with meta: { requiresAuth: false }
router.beforeEach((to) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']

  if (to.meta.requiresAuth !== false && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isAuthenticated) {
    return '/livestock'
  }
})

export default router
