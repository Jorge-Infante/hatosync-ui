export default {
  allPaddocks: (state) => state.paddocks,
  activePaddocks: (state) => state.paddocks.filter((paddock) => paddock.is_active),
  allStays: (state) => state.stays,
}
