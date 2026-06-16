import apiClient from '@/api/client'

// Standard CRUD goes through the shared store; only livestock-domain
// particularities live here. Reproduction is event-sourced server-side:
// every write changes the mother's derived `reproduction` (and a birth also
// creates the calf), so each mutation re-fetches the herd snapshot.
export default {
  async refreshAnimals({ dispatch }) {
    return dispatch(
      'shared/fetchState',
      { module: 'livestock', nameState: 'animals', url: '/livestock/animals/' },
      { root: true }
    )
  },

  // GET event history of one cow (not kept in state: always read fresh)
  async fetchReproductionEvents(context, animalId) {
    const { data } = await apiClient.get(`/livestock/animals/${animalId}/reproduction/`)
    return data
  },

  // Recursive ancestor tree for the genealogy graphic (depth 1..5, default 3)
  async fetchGenealogy(context, { animalId, depth = 3 }) {
    const { data } = await apiClient.get(`/livestock/animals/${animalId}/genealogy/`, {
      params: { depth },
    })
    return data
  },

  // Generic event: INSEMINATION | NATURAL_MATING | PREGNANCY_CHECK | ABORTION ...
  async createReproductionEvent({ dispatch }, { animalId, data }) {
    const res = await apiClient.post(`/livestock/animals/${animalId}/reproduction/`, data)
    await dispatch('refreshAnimals')
    return res.data
  },

  // Registers the parto AND creates the calf (mother/father/birth_date wired) in one call
  async registerBirth({ dispatch }, { animalId, data }) {
    const res = await apiClient.post(`/livestock/animals/${animalId}/reproduction/birth/`, data)
    await dispatch('refreshAnimals')
    return res.data
  },

  async weanCalf({ dispatch }, { animalId, data }) {
    const res = await apiClient.post(`/livestock/animals/${animalId}/reproduction/wean/`, data)
    await dispatch('refreshAnimals')
    return res.data
  },
}
