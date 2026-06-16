// Shared reproduction metadata (colors/icons/labels) used by list, menus and dialogs.
export const REPRO_STATUS_COLORS = {
  OPEN: 'warning',
  SERVED: 'info',
  PREGNANT: 'success',
  CALVED: 'secondary',
}

export const REPRO_EVENT_META = {
  BIRTH: { label: 'Parto', icon: 'mdi-baby-bottle-outline', color: 'success' },
  INSEMINATION: { label: 'Inseminación', icon: 'mdi-needle', color: 'info' },
  NATURAL_MATING: { label: 'Monta natural', icon: 'mdi-cow', color: 'accent' },
  PREGNANCY_CHECK: { label: 'Chequeo de preñez', icon: 'mdi-stethoscope', color: 'info' },
  ABORTION: { label: 'Aborto', icon: 'mdi-alert-circle-outline', color: 'error' },
  WEANING: { label: 'Destete', icon: 'mdi-baby-bottle-off-outline', color: 'secondary' },
}
