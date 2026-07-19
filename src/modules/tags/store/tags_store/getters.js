export default {
  allBatches: (state) => state.batches,
  allTags: (state) => state.tags,
  // Un lote sigue "trabajando" mientras el backend genera: la página lo usa
  // para decidir si debe seguir haciendo polling.
  hasGeneratingBatches: (state) =>
    state.batches.some((batch) => batch.status === 'PENDING' || batch.status === 'GENERATING'),
}
