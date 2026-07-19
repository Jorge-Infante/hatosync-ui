export default {
  allProtocols: (state) => state.protocols,
  // La UI de tratamientos solo ofrece protocolos de tratamiento;
  // los REPRODUCTIVE se reservan para la IATF (fase posterior).
  treatmentProtocols: (state) => state.protocols.filter((p) => p.protocol_type === 'TREATMENT'),
  allApplications: (state) => state.applications,
  // Agenda ordenada por fecha programada: lo más próximo/vencido primero.
  scheduledApplications: (state) =>
    [...state.applications].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)),
  overdueApplications: (state) => state.applications.filter((a) => a.is_overdue),
  // Programados recurrentes ordenados por vencimiento (el más urgente primero).
  allSchedules: (state) =>
    [...state.schedules].sort((a, b) => String(a.next_due).localeCompare(String(b.next_due))),
  allBatches: (state) => state.batches,
}
