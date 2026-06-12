import axios from 'axios'
import tokenStorage from './tokenStorage'

// Backend origin (needed to prefix relative /media/... URLs)
export const API_ORIGIN = (process.env.VUE_APP_BASE_API || 'http://127.0.0.1:8000/').replace(/\/+$/, '')

const baseURL = `${API_ORIGIN}/api/v1`

const apiClient = axios.create({ baseURL })

apiClient.interceptors.request.use((config) => {
  const access = tokenStorage.getAccessToken()
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

// Single shared refresh: concurrent 401s wait on the same request
let refreshPromise = null

function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh/`, { refresh: tokenStorage.getRefreshToken() })
      .then(({ data }) => {
        tokenStorage.setTokens(data)
        return data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function forceLogout() {
  // Lazy imports to avoid a circular dependency at module load (store → actions → client)
  const { default: store } = await import('@/store')
  const { default: router } = await import('@/router')
  store.dispatch('auth/logout')
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login' })
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response && error.response.status

    const isLoginRequest = original && original.url && original.url.includes('/auth/login')

    if (status === 401 && original && !original._retried && !isLoginRequest && tokenStorage.getRefreshToken()) {
      original._retried = true
      try {
        const access = await refreshTokens()
        original.headers.Authorization = `Bearer ${access}`
        return apiClient(original)
      } catch {
        await forceLogout()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
