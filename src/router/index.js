import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import authRouter from '@/modules/auth/router'
import farmsRouter from '@/modules/farms/router'
import livestockRouter from '@/modules/livestock/router'
import configurationRouter from '@/modules/configuration/router'
import healthRouter from '@/modules/health/router'

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
  {
    path: '/health',
    ...healthRouter,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

// Routes are protected by default; opt out with meta: { requiresAuth: false }.
// meta.roles restringe la ruta a esos roles de la finca activa (la seguridad
// real la aplica el backend; esto solo evita mostrar pantallas inservibles).
router.beforeEach(async (to) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']

  if (to.meta.requiresAuth !== false && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isAuthenticated) {
    return '/livestock'
  }

  if (to.meta.roles && isAuthenticated) {
    // En un hard-reload el perfil aún no está cargado: esperarlo antes de
    // decidir, o un admin sería redirigido por un rol todavía desconocido.
    if (!store.getters['auth/currentUser']) {
      try {
        await store.dispatch('auth/fetchProfile')
      } catch {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    }
    if (!to.meta.roles.includes(store.getters['auth/activeFarmRole'])) {
      return '/livestock'
    }
  }
})

export default router
