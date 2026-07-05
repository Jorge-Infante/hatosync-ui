export default {
  allAnimals: (state) => state.animals,
  animalById: (state) => (id) => state.animals.find((animal) => animal.id === id),
  females: (state) => state.animals.filter((animal) => animal.sex === 'FEMALE'),
  males: (state) => state.animals.filter((animal) => animal.sex === 'MALE'),
  externalFemales: (state) => state.externals.filter((animal) => animal.sex === 'FEMALE'),
  externalMales: (state) => state.externals.filter((animal) => animal.sex === 'MALE'),
}
