// Metadatos compartidos del módulo de sanidad (colores/iconos/etiquetas y
// opciones de los selects) usados por la agenda, protocolos y tratamientos.

export const HEALTH_STATUS_META = {
  PENDING: { label: 'Pendiente', icon: 'mdi-clock-outline', color: 'warning' },
  APPLIED: { label: 'Aplicada', icon: 'mdi-check-circle-outline', color: 'success' },
  SKIPPED: { label: 'Omitida', icon: 'mdi-close-circle-outline', color: 'secondary' },
}

export const TREATMENT_STATUS_META = {
  ACTIVE: { label: 'Activo', color: 'primary' },
  COMPLETED: { label: 'Completado', color: 'success' },
  CANCELLED: { label: 'Cancelado', color: 'secondary' },
}

// Unidades de dosis (Medication.unit y aplicación).
export const DOSE_UNITS = [
  { value: 'ML', title: 'ml' },
  { value: 'MG', title: 'mg' },
  { value: 'G', title: 'g' },
  { value: 'UI', title: 'UI' },
  { value: 'DOSE', title: 'Dosis' },
  { value: 'TABLET', title: 'Tableta' },
  { value: 'OTHER', title: 'Otra' },
]

// Vías de administración (ProtocolItem.route / Application.route).
export const ROUTES = [
  { value: 'IM', title: 'Intramuscular (IM)' },
  { value: 'SC', title: 'Subcutánea (SC)' },
  { value: 'IV', title: 'Intravenosa (IV)' },
  { value: 'ORAL', title: 'Oral' },
  { value: 'TOPICAL', title: 'Tópica' },
  { value: 'INTRAVAGINAL', title: 'Intravaginal' },
  { value: 'OTHER', title: 'Otra' },
]
