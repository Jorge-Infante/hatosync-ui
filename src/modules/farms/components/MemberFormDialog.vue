<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-account-edit-outline' : 'mdi-account-plus-outline' }}</v-icon>
        {{ isEdit ? 'Editar miembro' : 'Agregar miembro' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <!-- Add existing user: pick from the user's other farms -->
          <v-autocomplete
            v-if="!isEdit && existingUser"
            v-model="form.user_id"
            label="Usuario *"
            :items="candidates"
            item-title="label"
            item-value="id"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-account-search-outline"
            no-data-text="No hay usuarios disponibles en tus otras fincas"
            hint="Solo usuarios que ya pertenecen a alguna de tus fincas"
            persistent-hint
            class="mb-4"
          />

          <!-- Create new user / edit the member's user -->
          <template v-else>
            <v-text-field
              v-model="form.full_name"
              label="Nombre completo *"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-account-outline"
              class="mb-2"
            />
            <v-text-field
              v-model="form.email"
              label="Correo electrónico *"
              type="email"
              :rules="[rules.required, rules.email]"
              prepend-inner-icon="mdi-email-outline"
              class="mb-2"
            />
            <v-text-field
              v-model="form.phone"
              label="Teléfono"
              prepend-inner-icon="mdi-phone-outline"
              class="mb-2"
            />
            <v-text-field
              v-model="form.password"
              :label="isEdit ? 'Nueva contraseña' : 'Contraseña *'"
              type="password"
              :rules="isEdit ? [rules.passwordOptional] : [rules.required, rules.password]"
              :hint="isEdit ? 'Déjala en blanco para no cambiarla' : 'Mínimo 8 caracteres'"
              persistent-hint
              prepend-inner-icon="mdi-lock-outline"
              class="mb-2"
            />
          </template>

          <v-select v-model="form.role" label="Rol *" :items="roles" :rules="[rules.required]" class="mb-2" />

          <v-checkbox
            v-if="!isEdit"
            v-model="existingUser"
            label="Usuario existente"
            hint="Asociar un usuario que ya pertenece a otra de tus fincas en vez de crear uno nuevo"
            persistent-hint
            density="comfortable"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ isEdit ? 'Guardar' : 'Agregar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'MemberFormDialog',
  props: {
    // Users from the rest of the user's farms not yet in the active one: [{id, label}]
    candidates: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['saved'],
  data() {
    return {
      dialog: false,
      saving: false,
      error: '',
      member: null,
      existingUser: false,
      form: { user_id: null, full_name: '', email: '', phone: '', password: '', role: null },
      roles: [
        { title: 'Administrador', value: 'ADMIN' },
        { title: 'Empleado', value: 'EMPLOYEE' },
        { title: 'Socio', value: 'PARTNER' },
      ],
      rules: {
        required: (v) => !!v || 'Campo requerido',
        email: (v) => /.+@.+\..+/.test(v) || 'Correo inválido',
        password: (v) => (v && v.length >= 8) || 'Mínimo 8 caracteres',
        passwordOptional: (v) => !v || v.length >= 8 || 'Mínimo 8 caracteres',
      },
    }
  },
  computed: {
    isEdit() {
      return this.member !== null
    },
  },
  methods: {
    ...mapActions('shared', ['createItem', 'updateItem']),
    // Called from the parent via ref: open() to add, open(member) to edit user + role
    open(member = null) {
      this.member = member
      this.existingUser = false
      this.form = {
        user_id: null,
        full_name: member ? member.user.full_name : '',
        email: member ? member.user.email : '',
        phone: member ? member.user.phone || '' : '',
        password: '',
        role: member ? member.role : null,
      }
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    buildPayload() {
      if (this.isEdit) {
        const data = {
          full_name: this.form.full_name,
          email: this.form.email,
          phone: this.form.phone || '',
          role: this.form.role,
        }
        if (this.form.password) data.password = this.form.password
        return data
      }
      if (this.existingUser) {
        return { user_id: this.form.user_id, role: this.form.role }
      }
      return {
        email: this.form.email,
        full_name: this.form.full_name,
        phone: this.form.phone || '',
        password: this.form.password,
        role: this.form.role,
      }
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        const payload = { module: 'farms', nameState: 'members' }
        const saved = this.isEdit
          ? await this.updateItem({ ...payload, url: `/farms/members/${this.member.id}/`, data: this.buildPayload() })
          : await this.createItem({ ...payload, url: '/farms/members/', data: this.buildPayload() })
        this.$emit('saved', { member: saved, isEdit: this.isEdit })
        this.close()
      } catch (e) {
        this.error = getErrorMessage(e, 'No se pudo guardar el miembro')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
