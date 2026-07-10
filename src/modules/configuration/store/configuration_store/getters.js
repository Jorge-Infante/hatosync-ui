export default {
  allBreeds: (state) => state.breeds,
  allIdentificationTypes: (state) => state.identificationTypes,
  allMedications: (state) => state.medications,
  // Active-only views used by the animal / treatment forms to render fields
  activeBreeds: (state) => state.breeds.filter((breed) => breed.is_active),
  activeIdentificationTypes: (state) =>
    state.identificationTypes.filter((type) => type.is_active),
  activeMedications: (state) => state.medications.filter((med) => med.is_active),
}
