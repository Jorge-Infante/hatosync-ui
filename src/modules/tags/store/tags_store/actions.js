import apiClient from '@/api/client'
import { cleanCode } from '@/modules/tags/checksum'

/**
 * Acciones de DOMINIO de chapetas QR (el CRUD de lotes va por el shared store).
 * Las transiciones de estado son acciones dedicadas del backend (nunca PATCH):
 * ver QR-PLANNING.md del API. Los errores propagan (getErrorMessage en la página).
 */
export default {
  // El endpoint del escáner/buscador: estado de la chapeta + animal (o null).
  async resolveTag(_context, { code }) {
    const { data } = await apiClient.get(`/tags/resolve/${cleanCode(code)}/`)
    return data
  },

  // Idempotente (mismo tag+animal → 200). replace=true repone la chapeta
  // vigente del animal (la actual queda anulada como perdida).
  async assignTag(_context, { code, animal, replace = false }) {
    const { data } = await apiClient.post(`/tags/${cleanCode(code)}/assign/`, { animal, replace })
    return data
  },

  // Por defecto vuelve a DISPONIBLE; con void=true queda anulada (reason:
  // LOST|DAMAGED|OTHER) conservando el animal como historial.
  async unassignTag(_context, { code, void: toVoid = false, reason }) {
    const { data } = await apiClient.post(`/tags/${cleanCode(code)}/unassign/`, {
      void: toVoid,
      reason,
    })
    return data
  },

  // Anular una chapeta sin asignar (dañada/perdida antes de usarse). Admin.
  async voidTag(_context, { code, reason }) {
    const { data } = await apiClient.post(`/tags/${cleanCode(code)}/void/`, { reason })
    return data
  },

  // SVG de UNA chapeta (autenticado) → object URL listo para <img>/<a download>.
  async fetchTagImageUrl(_context, { code, size = 45 }) {
    const { data } = await apiClient.get(`/tags/${cleanCode(code)}/image/`, {
      params: { size },
      responseType: 'text',
    })
    return URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }))
  },

  // Descarga autenticada de un archivo del lote (el <a href> plano no lleva JWT).
  async downloadBatchFile(_context, { batch, kind }) {
    const extensions = { pdf: 'pdf', svg: 'zip', csv: 'csv' }
    const { data } = await apiClient.get(`/tags/batches/${batch.id}/download/`, {
      params: { file: kind },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `chapetas-${String(batch.id).slice(0, 8)}.${extensions[kind]}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
