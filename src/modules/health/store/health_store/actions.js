import apiClient from '@/api/client'

// El CRUD estándar (protocolos) va por el shared store; aquí viven solo las
// particularidades del dominio sanitario: la agenda de aplicaciones (con sus
// resoluciones apply/skip) y los tratamientos por animal (que generan las
// aplicaciones y se derivan de ellas).
export default {
  // Catálogo de protocolos (plantillas). ?type=TREATMENT filtra en backend.
  async fetchProtocols({ dispatch }, params) {
    return dispatch(
      'shared/fetchState',
      { module: 'health', nameState: 'protocols', url: '/health/protocols/', params },
      { root: true }
    )
  },

  // Programados recurrentes (avisar-y-ejecutar). CRUD por el shared store.
  async fetchSchedules({ dispatch }) {
    return dispatch(
      'shared/fetchState',
      { module: 'health', nameState: 'schedules', url: '/health/schedules/' },
      { root: true }
    )
  },

  // Jornadas de protocolo ejecutadas (historial).
  async fetchBatches({ dispatch }) {
    return dispatch(
      'shared/fetchState',
      { module: 'health', nameState: 'batches', url: '/reproduction/batches/' },
      { root: true }
    )
  },

  // Agenda sanitaria: aplicaciones filtrables por estado/animal/rango/vencidas.
  async fetchApplications({ dispatch }, params = {}) {
    return dispatch(
      'shared/fetchState',
      { module: 'health', nameState: 'applications', url: '/health/applications/', params },
      { root: true }
    )
  },

  // Resolver una aplicación: marcarla aplicada (guarda quién y cuándo).
  async applyApplication(context, { id, applied_at, notes }) {
    const { data } = await apiClient.post(`/health/applications/${id}/apply/`, { applied_at, notes })
    return data
  },

  // Resolver una aplicación: no se hizo (queda registrada como omitida).
  async skipApplication(context, { id, notes }) {
    const { data } = await apiClient.post(`/health/applications/${id}/skip/`, { notes })
    return data
  },

  // Tratamiento sobre un animal: con `protocol` las aplicaciones se generan
  // solas (start_at + offset_hours); ad-hoc = name + applications[].
  async createTreatment(context, { animalId, data }) {
    const { data: created } = await apiClient.post(`/livestock/animals/${animalId}/treatments/`, data)
    return created
  },

  // Cancelar un tratamiento: sus aplicaciones PENDING pasan a SKIPPED.
  async cancelTreatment(context, { animalId, id }) {
    const { data } = await apiClient.post(`/livestock/animals/${animalId}/treatments/${id}/cancel/`, {})
    return data
  },
}
