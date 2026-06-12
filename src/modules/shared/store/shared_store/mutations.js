// All mutations operate on the TARGET module's state (resolved by the actions
// from rootState), so any module list can be managed from this single place.
export default {
  SET_STATE(state, { moduleState, nameState, value }) {
    moduleState[nameState] = value
  },
  ADD_ITEM(state, { moduleState, nameState, value }) {
    moduleState[nameState] = [value, ...moduleState[nameState]]
  },
  UPDATE_ITEM(state, { moduleState, nameState, key, value }) {
    const index = moduleState[nameState].findIndex((item) => item[key] === value[key])
    if (index !== -1) moduleState[nameState].splice(index, 1, value)
  },
  REMOVE_ITEM(state, { moduleState, nameState, key, value }) {
    moduleState[nameState] = moduleState[nameState].filter((item) => item[key] !== value)
  },
}
