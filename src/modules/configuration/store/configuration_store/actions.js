// Per-farm catalogs are plain DRF viewsets: all CRUD goes through the shared
// store (fetchState/createItem/updateItem/deleteItem). No domain-specific
// actions yet — kept for parity with the other modules.
export default {}
