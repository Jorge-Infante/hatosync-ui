<template>
  <v-dialog v-model="dialog" max-width="640" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-pencil-outline' : 'mdi-plus' }}</v-icon>
        {{ isEdit ? 'Editar finca' : 'Nueva finca' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <p class="text-subtitle-2 font-weight-medium mb-3">Datos de la finca</p>
          <v-text-field v-model="form.name" label="Nombre *" :rules="[rules.required]" class="mb-2" />
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.department" label="Departamento *" :rules="[rules.required]" class="mb-2" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.city" label="Ciudad *" :rules="[rules.required]" class="mb-2" />
            </v-col>
          </v-row>
          <v-text-field v-model="form.address" label="Dirección *" :rules="[rules.required]" class="mb-2" />
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.phone" label="Teléfono *" type="tel" :rules="[rules.required]" class="mb-2" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.email" label="Correo (opcional)" type="email" :rules="[rules.optionalEmail]" class="mb-2" />
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.legal_name" label="Razón social (opcional)" class="mb-2" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.tax_id" label="NIT (opcional)" class="mb-2" />
            </v-col>
          </v-row>

          <!-- Members: only on setup; the creator becomes OWNER automatically -->
          <template v-if="!isEdit">
            <p class="text-subtitle-2 font-weight-medium mt-4 mb-1">Miembros (opcional)</p>
            <p class="text-caption text-medium-emphasis mb-3">
              Tú quedarás como propietario automáticamente. Cada miembro se crea como usuario nuevo.
            </p>

            <v-sheet v-for="(member, index) in members" :key="index" border rounded="lg" class="pa-4 mb-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-body-2 font-weight-medium">Miembro {{ index + 1 }}</span>
                <v-btn icon="mdi-close" variant="text" size="x-small" @click="removeMember(index)" />
              </div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="member.full_name" label="Nombre completo *" :rules="[rules.required]" class="mb-2" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="member.email" label="Correo *" type="email" :rules="[rules.required, rules.email]" class="mb-2" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="member.password" label="Contraseña *" type="password" :rules="[rules.required, rules.minPassword]" class="mb-2" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select v-model="member.role" label="Rol *" :items="roles" :rules="[rules.required]" class="mb-2" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="member.phone" label="Teléfono (opcional)" type="tel" />
                </v-col>
              </v-row>
            </v-sheet>

            <v-btn block variant="tonal" color="primary" prepend-icon="mdi-account-plus-outline" class="mb-2" @click="addMember">
              Agregar miembro
            </v-btn>
          </template>

          <!-- Existing members: read-only here; they are managed via /farms/members/ -->
          <template v-else>
            <p class="text-subtitle-2 font-weight-medium mt-4 mb-1">Miembros</p>
            <p class="text-caption text-medium-emphasis mb-2">
              La gestión de miembros (roles, retiros, nuevos) tendrá su propia pantalla.
            </p>
            <v-list density="compact" class="pa-0 bg-transparent">
              <v-list-item
                v-for="member in existingMembers"
                :key="member.id"
                :title="member.user.full_name"
                :subtitle="member.user.email"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="36">
                    <v-icon size="20">mdi-account-outline</v-icon>
                  </v-avatar>
                </template>
                <template #append>
                  <v-chip size="small" color="secondary">{{ member.role_display }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </template>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar cambios' : 'Crear finca' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

const emptyForm = () => ({
  name: '',
  legal_name: '',
  tax_id: '',
  phone: '',
  email: '',
  address: '',
  department: '',
  city: '',
})

const emptyMember = () => ({
  email: '',
  full_name: '',
  phone: '',
  password: '',
  role: null,
})

// The setup serializer rejects explicit empty strings on optional fields — omit them
const withoutEmptyFields = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== '' && value !== null))

export default {
  name: 'FarmFormDialog',
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      editId: null,
      form: emptyForm(),
      members: [],
      existingMembers: [],
      roles: [
        { title: 'Administrador', value: 'ADMIN' },
        { title: 'Empleado', value: 'EMPLOYEE' },
        { title: 'Socio', value: 'PARTNER' },
      ],
      rules: {
        required: (v) => !!v || 'Campo requerido',
        email: (v) => /.+@.+\..+/.test(v) || 'Correo inválido',
        optionalEmail: (v) => !v || /.+@.+\..+/.test(v) || 'Correo inválido',
        minPassword: (v) => (v && v.length >= 8) || 'Mínimo 8 caracteres',
      },
    }
  },
  computed: {
    isEdit() {
      return this.editId !== null
    },
  },
  methods: {
    ...mapActions('shared', ['createItem', 'updateItem']),
    // Called from the parent via ref: open() to create (setup), open(farm) to edit
    open(farm = null) {
      this.editId = farm ? farm.id : null
      this.form = farm
        ? {
            name: farm.name || '',
            legal_name: farm.legal_name || '',
            tax_id: farm.tax_id || '',
            phone: farm.phone || '',
            email: farm.email || '',
            address: farm.address || '',
            department: farm.department || '',
            city: farm.city || '',
          }
        : emptyForm()
      this.members = []
      this.existingMembers = farm ? farm.members || [] : []
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    addMember() {
      this.members.push(emptyMember())
    },
    removeMember(index) {
      this.members.splice(index, 1)
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        let farm
        if (this.isEdit) {
          farm = await this.updateItem({
            module: 'farms',
            nameState: 'farms',
            url: `/farms/${this.editId}/`,
            data: this.form,
          })
        } else {
          const data = withoutEmptyFields(this.form)
          if (this.members.length) {
            data.members = this.members.map(withoutEmptyFields)
          }
          farm = await this.createItem({
            module: 'farms',
            nameState: 'farms',
            url: '/farms/setup/',
            data,
          })
        }
        this.$emit('saved', { farm, isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar la finca')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
