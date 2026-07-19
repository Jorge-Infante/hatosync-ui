// Shared reproduction metadata (colors/icons/labels) used by list, menus and dialogs.
export const REPRO_STATUS_COLORS = {
  OPEN: 'warning',
  SERVED: 'info',
  PREGNANT: 'success',
  CALVED: 'secondary',
}

/**
 * Etiquetas reproductivas a mostrar (decidido 2026-07): "Parida" (cría al pie,
 * solo la apaga el destete) es INDEPENDIENTE del ciclo (Vacía/Servida/Preñada)
 * — una vaca puede estar parida Y servida/preñada a la vez, y se muestran ambas.
 * "Vacía" se omite mientras está parida (no aporta y confunde).
 */
export function reproChips(reproduction) {
  if (!reproduction) return []
  const chips = []
  if (reproduction.calf_at_side) {
    chips.push({
      key: 'calf',
      label: 'Parida',
      color: REPRO_STATUS_COLORS.CALVED,
      icon: 'mdi-baby-bottle-outline',
    })
  }
  if (reproduction.status && !(reproduction.status === 'OPEN' && reproduction.calf_at_side)) {
    chips.push({
      key: 'status',
      label: reproduction.status_display,
      color: REPRO_STATUS_COLORS[reproduction.status] || 'secondary',
      icon: null,
    })
  }
  return chips
}

export const REPRO_EVENT_META = {
  BIRTH: { label: 'Parto', icon: 'mdi-baby-bottle-outline', color: 'success' },
  INSEMINATION: { label: 'Inseminación', icon: 'mdi-needle', color: 'info' },
  NATURAL_MATING: { label: 'Monta natural', icon: 'mdi-cow', color: 'accent' },
  PREGNANCY_CHECK: { label: 'Chequeo de preñez', icon: 'mdi-stethoscope', color: 'info' },
  ABORTION: { label: 'Aborto', icon: 'mdi-alert-circle-outline', color: 'error' },
  WEANING: { label: 'Destete', icon: 'mdi-link-variant-off', color: 'secondary' },
}
