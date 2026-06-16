export default {
  allBreeds: (state) => state.breeds,
  allIdentificationTypes: (state) => state.identificationTypes,
  // Active-only views used by the animal form to render fields
  activeBreeds: (state) => state.breeds.filter((breed) => breed.is_active),
  activeIdentificationTypes: (state) =>
    state.identificationTypes.filter((type) => type.is_active),
}
