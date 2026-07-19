import apiClient from '@/api/client'

export default {
  // KPIs de producción anual de la finca activa. `from`/`to` acotan el año
  // calendario (el backend compara contra el mismo periodo del año anterior).
  async fetchAnnualProduction({ commit }, { from, to } = {}) {
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await apiClient.get('/farms/dashboard/', { params })
    commit('SET_ANNUAL_PRODUCTION', data.annual_production)
    return data.annual_production
  },
}
