import tokenStorage from '@/api/tokenStorage'

export default {
  user: null,
  // A stored refresh token means a restorable session; the profile is fetched on app start
  isAuthenticated: !!tokenStorage.getRefreshToken(),
}
