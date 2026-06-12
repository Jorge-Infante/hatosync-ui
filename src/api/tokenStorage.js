const ACCESS_TOKEN_KEY = 'hatosync_access_token'
const REFRESH_TOKEN_KEY = 'hatosync_refresh_token'

export default {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access)
    // Refresh rotates server-side: always overwrite, the old one is blacklisted
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
