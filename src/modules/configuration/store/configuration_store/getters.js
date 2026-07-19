export default {
  allBreeds: (state) => state.breeds,
  allIdentificationTypes: (state) => state.identificationTypes,
  allMedications: (state) => state.medications,
  allLots: (state) => state.lots,
  allInactivationReasons: (state) => state.inactivationReasons,
  // Active-only views used by the animal / treatment forms to render fields
  activeBreeds: (state) => state.breeds.filter((breed) => breed.is_active),
  activeIdentificationTypes: (state) =>
    state.identificationTypes.filter((type) => type.is_active),
  activeMedications: (state) => state.medications.filter((med) => med.is_active),
  activeLots: (state) => state.lots.filter((lot) => lot.is_active),
  activeInactivationReasons: (state) =>
    state.inactivationReasons.filter((reason) => reason.is_active),
}
