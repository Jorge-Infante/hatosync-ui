<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6 rise">
      <div>
        <p class="hs-overline mb-1">Inventario del hato</p>
        <h1 class="text-h5 font-weight-bold">Animales</h1>
        <p class="text-body-2 text-medium-emphasis">
          Compras, hato inicial y todo lo que pasta en {{ activeFarmName || 'tu finca' }}.
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$refs.animalFormDialog.open()">
        Nuevo animal
      </v-btn>
    </div>

    <!-- Toolbar: search + herd counters -->
    <div class="d-flex flex-wrap align-center ga-3 mb-4 rise rise-d1">
      <v-text-field
        v-model="search"
        placeholder="Buscar por nombre, madre o padre…"
        prepend-inner-icon="mdi-magnify"
        hide-details
        clearable
        class="search-field"
      />
      <v-spacer class="d-none d-sm-block" />
      <div class="d-flex ga-2">
        <v-chip color="secondary" prepend-icon="mdi-cow">{{ animals.length }} total</v-chip>
        <v-chip color="primary" prepend-icon="mdi-gender-female">{{ females.length }} hembras</v-chip>
        <v-chip color="accent" prepend-icon="mdi-gender-male">{{ males.length }} machos</v-chip>
      </div>
    </div>

    <!-- Loading -->
    <v-skeleton-loader v-if="loading" type="table-heading, list-item-avatar@6" class="border rounded-xl rise rise-d2" />

    <!-- Empty herd -->
    <v-card v-else-if="animals.length === 0" class="pa-10 text-center rise rise-d2">
      <v-icon size="56" color="primary" class="mb-3">mdi-cow-off</v-icon>
      <h2 class="text-h6 font-weight-bold mb-1">Tu hato está vacío</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Registra tu primer animal para empezar el inventario de esta finca.
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="$refs.animalFormDialog.open()">Nuevo animal</v-btn>
    </v-card>

    <!-- No search matches -->
    <v-card v-else-if="filteredAnimals.length === 0" class="pa-8 text-center rise">
      <v-icon size="40" color="secondary" class="mb-2">mdi-magnify-close</v-icon>
      <p class="text-body-2 text-medium-emphasis">Ningún animal coincide con «{{ search }}».</p>
    </v-card>

    <template v-else>
      <!-- Desktop: table -->
      <v-card class="d-none d-md-block rise rise-d2">
        <v-data-table
          :headers="headers"
          :items="filteredAnimals"
          :items-per-page="-1"
          density="comfortable"
          hover
          hide-default-footer
        >
          <template #[`item.name`]="{ item }">
            <div class="d-flex align-center py-2 animal-cell" @click="goToDetail(item)">
              <v-avatar size="38" color="primary" variant="tonal" class="mr-3">
                <v-img v-if="photoUrl(item)" :src="photoUrl(item)" cover />
                <v-icon v-else size="20">{{ sexIcon(item) }}</v-icon>
              </v-avatar>
              <div>
                <span class="font-weight-medium animal-cell__name">{{ item.name }}</span>
                <p class="text-caption text-medium-emphasis ma-0">{{ formatAge(item.birth_date) }}</p>
              </div>
            </div>
          </template>

          <template #[`item.sex_display`]="{ item }">
            <v-icon size="18" :color="item.sex === 'FEMALE' ? 'primary' : 'accent'" class="mr-1">
              {{ sexIcon(item) }}
            </v-icon>
            {{ item.sex_display }}
          </template>

          <template #[`item.birth_date`]="{ item }">
            {{ formatDate(item.birth_date) }}
          </template>

          <template #[`item.mother_name`]="{ item }">
            {{ item.mother_name || '—' }}
          </template>

          <template #[`item.father_name`]="{ item }">
            {{ item.father_name || '—' }}
          </template>

          <template #[`item.reproduction`]="{ item }">
            <v-chip
              v-if="item.reproduction && item.reproduction.status"
              size="small"
              :color="statusColor(item.reproduction.status)"
            >
              {{ item.reproduction.status_display }}
            </v-chip>
            <span v-else class="text-medium-emphasis">—</span>
          </template>

          <template #[`item.actions`]="{ item }">
            <AnimalActionsMenu
              :animal="item"
              @detail="goToDetail(item)"
              @edit="$refs.animalFormDialog.open(item)"
              @delete="askDelete(item)"
              @birth="$refs.birthDialog.open(item)"
              @wean="$refs.weanDialog.open(item)"
              @events="$refs.reproEventsDialog.open(item)"
              @genealogy="$refs.genealogyDialog.open(item)"
            />
          </template>
        </v-data-table>
      </v-card>

      <!-- Mobile: cards -->
      <div class="d-md-none">
        <v-card v-for="animal in filteredAnimals" :key="animal.id" class="mb-3">
          <v-card-item @click="goToDetail(animal)">
            <template #prepend>
              <v-avatar size="44" color="primary" variant="tonal">
                <v-img v-if="photoUrl(animal)" :src="photoUrl(animal)" cover />
                <v-icon v-else>{{ sexIcon(animal) }}</v-icon>
              </v-avatar>
            </template>
            <v-card-title>{{ animal.name }}</v-card-title>
            <v-card-subtitle>{{ animal.sex_display }} · {{ formatAge(animal.birth_date) }}</v-card-subtitle>
            <template #append>
              <span @click.stop>
                <AnimalActionsMenu
                  :animal="animal"
                  @detail="goToDetail(animal)"
                  @edit="$refs.animalFormDialog.open(animal)"
                  @delete="askDelete(animal)"
                  @birth="$refs.birthDialog.open(animal)"
                  @wean="$refs.weanDialog.open(animal)"
                  @events="$refs.reproEventsDialog.open(animal)"
                  @genealogy="$refs.genealogyDialog.open(animal)"
                />
              </span>
            </template>
          </v-card-item>
          <v-card-text class="d-flex flex-wrap align-center ga-2 pt-0">
            <v-chip
              v-if="animal.reproduction && animal.reproduction.status"
              size="small"
              :color="statusColor(animal.reproduction.status)"
            >
              {{ animal.reproduction.status_display }}
            </v-chip>
            <span v-if="animal.mother_name" class="text-caption text-medium-emphasis">
              Madre: {{ animal.mother_name }}
            </span>
            <span v-if="animal.father_name" class="text-caption text-medium-emphasis">
              Padre: {{ animal.father_name }}
            </span>
          </v-card-text>
        </v-card>
      </div>
    </template>

    <AnimalFormDialog ref="animalFormDialog" @saved="onSaved" />
    <RegisterBirthDialog ref="birthDialog" @saved="onBirthSaved" />
    <WeanDialog ref="weanDialog" @saved="notify('Destete registrado')" />
    <ReproductionEventsDialog ref="reproEventsDialog" @saved="notify('Evento reproductivo registrado')" />
    <GenealogyDialog ref="genealogyDialog" />

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Eliminar animal?</v-card-title>
        <v-card-text class="px-6">
          Se eliminará <strong>{{ animalToDelete && animalToDelete.name }}</strong> del inventario.
          Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { API_ORIGIN } from '@/api/client'
import AnimalFormDialog from '@/modules/livestock/components/AnimalFormDialog.vue'
import AnimalActionsMenu from '@/modules/livestock/components/AnimalActionsMenu.vue'
import RegisterBirthDialog from '@/modules/livestock/components/RegisterBirthDialog.vue'
import WeanDialog from '@/modules/livestock/components/WeanDialog.vue'
import ReproductionEventsDialog from '@/modules/livestock/components/ReproductionEventsDialog.vue'
import GenealogyDialog from '@/modules/livestock/components/GenealogyDialog.vue'
import { REPRO_STATUS_COLORS } from '@/modules/livestock/constants'

export default {
  name: 'AnimalListPage',
  components: {
    AnimalFormDialog,
    AnimalActionsMenu,
    RegisterBirthDialog,
    WeanDialog,
    ReproductionEventsDialog,
    GenealogyDialog,
  },
  data() {
    return {
      loading: false,
      search: '',
      deleteDialog: false,
      deleting: false,
      animalToDelete: null,
      snackbar: { show: false, text: '', color: 'success' },
      headers: [
        { title: 'Animal', key: 'name' },
        { title: 'Sexo', key: 'sex_display' },
        { title: 'Nacimiento', key: 'birth_date' },
        { title: 'Madre', key: 'mother_name' },
        { title: 'Padre', key: 'father_name' },
        { title: 'Reproducción', key: 'reproduction', sortable: false },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
    }
  },
  computed: {
    ...mapGetters('livestock', { animals: 'allAnimals' }),
    ...mapGetters('livestock', ['females', 'males']),
    ...mapGetters('auth', ['activeFarmName']),
    filteredAnimals() {
      const query = (this.search || '').trim().toLowerCase()
      if (!query) return this.animals
      return this.animals.filter((animal) =>
        [animal.name, animal.mother_name, animal.father_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      )
    },
  },
  created() {
    this.loadAnimals()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async loadAnimals() {
      this.loading = true
      try {
        await this.fetchState({ module: 'livestock', nameState: 'animals', url: '/livestock/animals/' })
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los animales'), 'error')
      } finally {
        this.loading = false
      }
    },
    goToDetail(animal) {
      this.$router.push({ name: 'livestock-animal-detail', params: { id: animal.id } })
    },
    photoUrl(animal) {
      // List serializer gives primary_photo (newest photo URL); older shape used photos[]
      const url = animal.primary_photo || (animal.photos && animal.photos[0] && animal.photos[0].image)
      if (!url) return ''
      return url.startsWith('http') ? url : `${API_ORIGIN}${url}`
    },
    sexIcon(animal) {
      return animal.sex === 'FEMALE' ? 'mdi-gender-female' : 'mdi-gender-male'
    },
    statusColor(status) {
      return REPRO_STATUS_COLORS[status] || 'secondary'
    },
    formatDate(date) {
      if (!date) return '—'
      return new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    },
    formatAge(birthDate) {
      if (!birthDate) return 'Edad desconocida'
      const birth = new Date(`${birthDate}T00:00:00`)
      const now = new Date()
      let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
      if (now.getDate() < birth.getDate()) months -= 1
      if (months < 1) return 'Recién nacido'
      if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`
      const years = Math.floor(months / 12)
      const rest = months % 12
      return rest ? `${years} a ${rest} m` : `${years} ${years === 1 ? 'año' : 'años'}`
    },
    askDelete(animal) {
      this.animalToDelete = animal
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'livestock',
          nameState: 'animals',
          url: `/livestock/animals/${this.animalToDelete.id}/`,
          value: this.animalToDelete.id,
        })
        this.notify('Animal eliminado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo eliminar el animal'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Animal actualizado' : 'Animal registrado')
    },
    onBirthSaved({ calfName }) {
      this.notify(calfName ? `Parto registrado · ${calfName} se añadió al hato` : 'Parto registrado')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>

<style scoped>
.search-field {
  max-width: 360px;
  min-width: 240px;
}
.animal-cell {
  cursor: pointer;
}
.animal-cell__name {
  transition: color 0.18s ease;
}
.animal-cell:hover .animal-cell__name {
  color: rgb(var(--v-theme-primary));
}
</style>
