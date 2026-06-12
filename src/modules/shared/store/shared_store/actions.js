import apiClient from '@/api/client'

/**
 * Generic CRUD layer for DRF viewsets — all standard list/create/update/delete
 * traffic goes through here; module stores only implement domain-specific logic.
 *
 * Every payload targets a module's state list by name:
 *   module:    Vuex registration key of the target module (e.g. 'farms')
 *   nameState: property inside that module's state (e.g. 'farms')
 *   url:       endpoint relative to /api/v1 (e.g. '/farms/')
 *   key:       identity field used to match items (default 'id')
 *
 * Usage from a page:
 *   this.$store.dispatch('shared/fetchState', { module: 'farms', nameState: 'farms', url: '/farms/' })
 *
 * Errors are NOT caught here — they propagate so pages can show the DRF
 * message via getErrorMessage().
 */

function resolveModuleState(rootState, moduleName) {
  const moduleState = rootState[moduleName]
  if (!moduleState) {
    throw new Error(`[shared store] Vuex module '${moduleName}' is not registered`)
  }
  return moduleState
}

function buildFormData(data) {
  if (data instanceof FormData) return data
  const formData = new FormData()
  Object.entries(data).forEach(([field, value]) => {
    if (value !== null && value !== undefined) formData.append(field, value)
  })
  return formData
}

export default {
  // GET url → replaces module.nameState with the response (array or object)
  async fetchState({ commit, rootState }, { module, nameState, url, params }) {
    const { data } = await apiClient.get(url, { params })
    commit('SET_STATE', { moduleState: resolveModuleState(rootState, module), nameState, value: data })
    return data
  },

  // POST url → prepends the created item to module.nameState
  async createItem({ commit, rootState }, { module, nameState, url, data }) {
    const res = await apiClient.post(url, data)
    commit('ADD_ITEM', { moduleState: resolveModuleState(rootState, module), nameState, value: res.data })
    return res.data
  },

  // PATCH url (must include the id: '/farms/3/') → replaces the matching item
  async updateItem({ commit, rootState }, { module, nameState, url, data, key = 'id' }) {
    const res = await apiClient.patch(url, data)
    commit('UPDATE_ITEM', { moduleState: resolveModuleState(rootState, module), nameState, key, value: res.data })
    return res.data
  },

  // DELETE url (must include the id) → removes the item whose [key] === value
  async deleteItem({ commit, rootState }, { module, nameState, url, key = 'id', value }) {
    await apiClient.delete(url)
    commit('REMOVE_ITEM', { moduleState: resolveModuleState(rootState, module), nameState, key, value })
  },

  // POST multipart (e.g. animal photos). data: FormData or plain object with File values.
  // Pass module/nameState to prepend the response to a list; omit them to just upload.
  async uploadFile({ commit, rootState }, { module, nameState, url, data }) {
    const res = await apiClient.post(url, buildFormData(data))
    if (module && nameState) {
      commit('ADD_ITEM', { moduleState: resolveModuleState(rootState, module), nameState, value: res.data })
    }
    return res.data
  },
}
