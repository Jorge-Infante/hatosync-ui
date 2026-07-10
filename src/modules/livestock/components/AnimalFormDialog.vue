<template>
  <v-dialog v-model="dialog" max-width="600" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-plus' }}</v-icon>
        {{ isEdit ? 'Editar animal' : 'Nuevo animal' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <p v-if="!isEdit" class="text-caption text-medium-emphasis mb-4">
          Entrada de inventario: compras o carga del hato inicial. Los nacimientos en la finca
          se registrarán desde la madre con el evento de parto.
        </p>
        <v-chip v-if="isEdit && external" size="small" color="secondary" variant="tonal" prepend-icon="mdi-dna" class="mb-4">
          Genética externa (no aparece en el hato)
        </v-chip>

        <!-- Photos -->
        <div class="mb-5">
          <p class="hs-overline mb-2">Fotos</p>

          <div
            v-if="!hasPhotos"
            class="photo-dropzone"
            :class="{ 'photo-dropzone--over': dragOver }"
            role="button"
            tabindex="0"
            @click="pickFiles"
            @keydown.enter.prevent="pickFiles"
            @keydown.space.prevent="pickFiles"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <div class="photo-dropzone__icon">
              <v-icon size="26">mdi-camera-plus-outline</v-icon>
            </div>
            <p class="photo-dropzone__title">Agrega fotos del animal</p>
            <p class="photo-dropzone__hint">Arrastra aquí o haz clic · JPG o PNG</p>
          </div>

          <div
            v-else
            class="photo-grid"
            :class="{ 'photo-grid--over': dragOver }"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <div v-for="(photo, i) in allPhotos" :key="photo.key" class="photo-tile">
              <v-img :src="photo.url" cover height="88" width="88" />
              <span v-if="i === 0" class="photo-tile__cover">Portada</span>
              <button type="button" class="photo-tile__remove" aria-label="Quitar foto" @click="removePhoto(photo)">
                <v-icon size="14">mdi-close</v-icon>
              </button>
            </div>

            <button type="button" class="photo-add" aria-label="Agregar foto" @click="pickFiles">
              <v-icon size="22">mdi-plus</v-icon>
            </button>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            class="d-none"
            @change="onFilesChosen"
          />
        </div>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Nombre *"
            prepend-inner-icon="mdi-tag-outline"
            :rules="[rules.required]"
            class="mb-2"
          />
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.sex"
                label="Sexo *"
                :items="sexOptions"
                prepend-inner-icon="mdi-gender-male-female"
                :rules="[rules.required]"
                class="mb-2"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.birth_date"
                label="Fecha de nacimiento"
                type="date"
                :max="today"
                prepend-inner-icon="mdi-calendar-outline"
                hint="Si se omite, se usa la fecha de hoy"
                persistent-hint
                class="mb-2"
              />
            </v-col>
          </v-row>
          <v-autocomplete
            v-model="form.mother"
            label="Madre (opcional)"
            :items="motherOptions"
            prepend-inner-icon="mdi-cow"
            clearable
            no-data-text="No hay hembras registradas"
            class="mb-2"
          />
          <v-autocomplete
            v-model="form.father"
            label="Padre (opcional)"
            :items="fatherOptions"
            prepend-inner-icon="mdi-cow"
            clearable
            no-data-text="No hay machos registrados"
            class="mb-2"
          />

          <!-- Per-farm catalogs: only shown when the farm has set them up -->
          <div v-if="catalogsLoading" class="d-flex align-center ga-2 text-caption text-medium-emphasis py-2">
            <v-progress-circular indeterminate size="16" width="2" color="primary" />
            Cargando catálogos de la finca…
          </div>

          <v-select
            v-if="activeBreeds.length"
            v-model="form.breed"
            label="Raza (opcional)"
            :items="breedOptions"
            prepend-inner-icon="mdi-dna"
            clearable
            class="mb-2"
          />

          <!-- Asignación a un miembro (regla del socio): solo la maneja un admin -->
          <v-select
            v-if="isFarmAdmin && memberOptions.length"
            v-model="form.assigned_to"
            label="Asignado a (opcional)"
            :items="memberOptions"
            prepend-inner-icon="mdi-account-outline"
            hint="Un socio solo podrá consultar los animales asignados a él"
            persistent-hint
            clearable
            class="mb-2"
          />

          <template v-if="activeIdentificationTypes.length">
            <p class="hs-overline mt-3 mb-2">Identificación</p>
            <v-text-field
              v-for="type in activeIdentificationTypes"
              :key="type.id"
              :label="type.name"
              :model-value="idValues[type.id]"
              prepend-inner-icon="mdi-tag-outline"
              inputmode="numeric"
              clearable
              :hint="type.is_unique ? 'Único: no se puede repetir en la finca' : 'Puede repetirse entre animales'"
              persistent-hint
              class="mb-3"
              @update:model-value="setIdValue(type.id, $event)"
            />
          </template>

          <!-- External genetics: referenced in genealogy/events, never part of the herd -->
          <v-checkbox
            v-if="!isEdit"
            v-model="external"
            label="Genética externa"
            hint="Pajilla de semen o toro/vaca que no es tuyo: se puede usar como padre o madre en la genealogía, pero no aparecerá en el hato"
            persistent-hint
            density="comfortable"
            class="mt-2"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Registrar animal' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'
import { API_ORIGIN } from '@/api/client'

const emptyForm = () => ({
  name: '',
  sex: null,
  birth_date: '',
  mother: null,
  father: null,
  breed: null,
  assigned_to: null,
})

export default {
  name: 'AnimalFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      external: false, // create-only; the flag is immutable server-side after create
      form: emptyForm(),
      // Identification values keyed by identification_type id (digit strings)
      idValues: {},
      catalogsLoading: false,
      // Photos — the new File objects and removed existing ids are exposed here
      // for the submit wiring (upload via POST /animals/{id}/photos/).
      photos: [], // { key, file, url }  newly picked images
      existingPhotos: [], // { key, id, url }  from animal.photos on edit
      removedPhotoIds: [], // existing photo ids the user removed
      dragOver: false,
      photoSeq: 0,
      sexOptions: [
        { title: 'Hembra', value: 'FEMALE' },
        { title: 'Macho', value: 'MALE' },
      ],
      rules: {
        required: (v) => !!v || 'Campo requerido',
      },
    }
  },
  computed: {
    ...mapGetters('livestock', ['females', 'males', 'externalFemales', 'externalMales']),
    ...mapGetters('configuration', ['activeBreeds', 'activeIdentificationTypes']),
    ...mapGetters('auth', ['isFarmAdmin', 'activeFarmId']),
    ...mapGetters('farms', ['allFarms', 'allMembers']),
    isEdit() {
      return this.editId !== null
    },
    today() {
      return new Date().toISOString().slice(0, 10)
    },
    motherOptions() {
      return [...this.toOptions(this.females), ...this.toOptions(this.externalFemales, 'externa')]
    },
    fatherOptions() {
      return [...this.toOptions(this.males), ...this.toOptions(this.externalMales, 'externo')]
    },
    breedOptions() {
      return this.activeBreeds.map((breed) => ({ title: breed.name, value: breed.id }))
    },
    // Miembros para "Asignado a": fuente = la lista VIVA de /farms/members/
    // (se refresca al abrir el diálogo); los members embebidos en GET /farms/
    // son solo respaldo — ese snapshot queda viejo al crear/editar miembros.
    memberOptions() {
      const farm = this.allFarms.find((f) => f.id === this.activeFarmId)
      const source = this.allMembers.length ? this.allMembers : (farm && farm.members) || []
      return source.map((member) => ({
        title: `${member.full_name} (${member.role_display})`,
        value: member.id,
      }))
    },
    hasPhotos() {
      return this.existingPhotos.length > 0 || this.photos.length > 0
    },
    // Cover first: existing photos, then newly picked ones
    allPhotos() {
      return [...this.existingPhotos, ...this.photos]
    },
  },
  methods: {
    ...mapActions('shared', ['createItem', 'updateItem']),
    ...mapActions('livestock', ['syncAnimalPhotos']),
    toOptions(animals, externalLabel = '') {
      return animals
        .filter((animal) => animal.id !== this.editId)
        .map((animal) => ({
          title: externalLabel ? `${animal.name} (${externalLabel})` : animal.name,
          value: animal.id,
        }))
    },
    // Called from the parent via ref: open() to create, open(animal) to edit
    open(animal = null) {
      this.editId = animal ? animal.id : null
      this.external = animal ? !!animal.is_external : false
      this.form = animal
        ? {
            name: animal.name || '',
            sex: animal.sex || null,
            birth_date: animal.birth_date || '',
            mother: animal.mother || null,
            father: animal.father || null,
            breed: animal.breed || null,
            assigned_to: animal.assigned_to || null,
          }
        : emptyForm()

      this.idValues = {}
      if (animal && Array.isArray(animal.identifications)) {
        animal.identifications.forEach((id) => {
          this.idValues[id.identification_type] = id.value
        })
      }

      this.resetPhotos()
      if (animal && Array.isArray(animal.photos)) {
        this.existingPhotos = animal.photos.map((photo) => ({
          key: `e${photo.id}`,
          id: photo.id,
          url: photo.image && photo.image.startsWith('http') ? photo.image : `${API_ORIGIN}${photo.image}`,
        }))
      }

      this.error = ''
      this.dialog = true
      this.loadCatalogs()
    },
    close() {
      this.dialog = false
      this.resetPhotos()
    },
    async loadCatalogs() {
      this.catalogsLoading = true
      try {
        const requests = [
          this.$store.dispatch('shared/fetchState', {
            module: 'configuration',
            nameState: 'breeds',
            url: '/configuration/breeds/',
          }),
          this.$store.dispatch('shared/fetchState', {
            module: 'configuration',
            nameState: 'identificationTypes',
            url: '/configuration/identification-types/',
          }),
        ]
        if (this.isFarmAdmin) {
          // Miembros frescos para "Asignado a" (endpoint admin-only); si falla
          // queda el respaldo embebido de GET /farms/.
          requests.push(
            this.$store
              .dispatch('shared/fetchState', { module: 'farms', nameState: 'members', url: '/farms/members/' })
              .catch(() => {})
          )
        }
        await Promise.all(requests)
      } catch (e) {
        // Catalogs are optional; a failure just means no breed/ID fields are shown
        this.error = getErrorMessage(e, 'No se pudieron cargar los catálogos de la finca')
      } finally {
        this.catalogsLoading = false
      }
    },
    setIdValue(typeId, value) {
      // Keep digits only, preserve leading zeros (it's a string like "0001")
      this.idValues[typeId] = (value || '').replace(/\D/g, '')
    },
    // --- Photos ---------------------------------------------------------
    pickFiles() {
      this.$refs.fileInput.click()
    },
    onFilesChosen(event) {
      this.addFiles(event.target.files)
      event.target.value = '' // allow re-picking the same file
    },
    onDrop(event) {
      this.dragOver = false
      this.addFiles(event.dataTransfer.files)
    },
    addFiles(fileList) {
      Array.from(fileList || [])
        .filter((file) => file.type.startsWith('image/'))
        .forEach((file) => {
          this.photos.push({ key: `n${this.photoSeq++}`, file, url: URL.createObjectURL(file) })
        })
    },
    removePhoto(photo) {
      if (photo.id != null) {
        this.removedPhotoIds.push(photo.id)
        this.existingPhotos = this.existingPhotos.filter((p) => p.key !== photo.key)
      } else {
        URL.revokeObjectURL(photo.url)
        this.photos = this.photos.filter((p) => p.key !== photo.key)
      }
    },
    resetPhotos() {
      this.photos.forEach((p) => URL.revokeObjectURL(p.url))
      this.photos = []
      this.existingPhotos = []
      this.removedPhotoIds = []
      this.dragOver = false
    },
    // --------------------------------------------------------------------
    buildPayload() {
      const payload = {
        name: this.form.name,
        sex: this.form.sex,
        mother: this.form.mother,
        father: this.form.father,
      }
      if (this.form.birth_date) payload.birth_date = this.form.birth_date

      if (this.isEdit) {
        // PATCH: send breed (incl. null to clear)
        payload.breed = this.form.breed
      } else {
        if (this.form.breed != null) payload.breed = this.form.breed
        if (payload.mother === null) delete payload.mother
        if (payload.father === null) delete payload.father
        if (this.external) payload.is_external = true
      }

      // Solo un admin puede (des)asignar el animal a un miembro; los demás
      // omiten la clave para que el backend no rechace el guardado.
      if (this.isFarmAdmin) {
        if (this.isEdit) payload.assigned_to = this.form.assigned_to
        else if (this.form.assigned_to != null) payload.assigned_to = this.form.assigned_to
      }

      // identifications: only touch them when the catalog is available, otherwise
      // omit the key so the backend leaves the existing set untouched (PATCH).
      if (this.activeIdentificationTypes.length) {
        const ids = this.activeIdentificationTypes
          .map((type) => ({ identification_type: type.id, value: (this.idValues[type.id] || '').trim() }))
          .filter((entry) => entry.value)
        if (this.isEdit || ids.length) payload.identifications = ids
      }

      return payload
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        // Externals live in their own state slice so they never join the herd list
        const nameState = this.external ? 'externals' : 'animals'
        let animal
        if (this.isEdit) {
          animal = await this.updateItem({
            module: 'livestock',
            nameState,
            url: `/livestock/animals/${this.editId}/`,
            data: this.buildPayload(),
          })
        } else {
          animal = await this.createItem({
            module: 'livestock',
            nameState,
            url: '/livestock/animals/',
            data: this.buildPayload(),
          })
        }

        // Photos use a separate multipart endpoint, so they upload after the
        // animal exists. refreshAnimals (inside the action) updates list avatars.
        if (this.photos.length || this.removedPhotoIds.length) {
          await this.syncAnimalPhotos({
            animalId: animal.id,
            newFiles: this.photos.map((p) => p.file),
            removedIds: this.removedPhotoIds,
          })
        }

        this.$emit('saved', { animal, isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el animal')
      } finally {
        this.saving = false
      }
    },
  },
  beforeUnmount() {
    this.photos.forEach((p) => URL.revokeObjectURL(p.url))
  },
}
</script>

<style scoped>
/* Empty state: a calm, dashed editorial well */
.photo-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 26px 16px;
  border: 1.5px dashed rgba(46, 82, 51, 0.3);
  border-radius: 16px;
  background: rgba(46, 125, 50, 0.03);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.photo-dropzone:hover,
.photo-dropzone:focus-visible,
.photo-dropzone--over {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(46, 125, 50, 0.07);
  outline: none;
}
.photo-dropzone__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(46, 125, 50, 0.1);
  color: rgb(var(--v-theme-primary));
  margin-bottom: 10px;
}
.photo-dropzone__title {
  font-weight: 500;
  font-size: 0.92rem;
  margin: 0;
}
.photo-dropzone__hint {
  font-size: 0.74rem;
  color: rgba(34, 43, 35, 0.55);
  margin: 2px 0 0;
}

/* Filled state: a tidy strip of thumbnails */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(46, 82, 51, 0.16);
  border-radius: 16px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.photo-grid--over {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(46, 125, 50, 0.05);
}

.photo-tile {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(46, 82, 51, 0.16);
}
.photo-tile__cover {
  position: absolute;
  left: 5px;
  bottom: 5px;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 1px 7px;
  border-radius: 999px;
  color: #fff;
  background: rgba(46, 125, 50, 0.92);
}
.photo-tile__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: rgba(27, 43, 29, 0.55);
  opacity: 0;
  transition: opacity 0.18s ease, background-color 0.18s ease;
}
.photo-tile:hover .photo-tile__remove {
  opacity: 1;
}
.photo-tile__remove:hover {
  background: rgb(var(--v-theme-error));
}

.photo-add {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1.5px dashed rgba(46, 82, 51, 0.3);
  color: rgba(46, 125, 50, 0.8);
  background: rgba(46, 125, 50, 0.03);
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}
.photo-add:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(46, 125, 50, 0.07);
  color: rgb(var(--v-theme-primary));
}

@media (prefers-reduced-motion: reduce) {
  .photo-dropzone,
  .photo-grid,
  .photo-tile__remove,
  .photo-add {
    transition: none;
  }
}
</style>
