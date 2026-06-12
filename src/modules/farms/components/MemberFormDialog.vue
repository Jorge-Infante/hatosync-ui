<template>
  <v-dialog v-model="dialog" max-width="480" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pt-4 px-6">
        <v-icon color="primary" class="mr-2">{{ isEdit ? 'mdi-shield-account-outline' : 'mdi-account-plus-outline' }}</v-icon>
        {{ isEdit ? 'Cambiar rol' : 'Agregar miembro' }}
      </v-card-title>

      <v-card-text class="px-6">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <!-- Edit: the user is fixed, only the role changes -->
        <v-list-item v-if="isEdit && member" class="px-0 mb-4">
          <template #prepend>
            <v-avatar color="primary" variant="tonal">
              <v-icon>mdi-account-outline</v-icon>
            </v-avatar>
          </template>
          <v-list-item-title>{{ member.user.full_name }}</v-list-item-title>
          <v-list-item-subtitle>{{ member.user.email }}</v-list-item-subtitle>
        </v-list-item>

        <v-form ref="form" @submit.prevent="handleSubmit">
          <v-autocomplete
            v-if="!isEdit"
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
          <v-select v-model="form.role" label="Rol *" :items="roles" :rules="[rules.required]" />
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
      form: { user_id: null, role: null },
      roles: [
        { title: 'Administrador', value: 'ADMIN' },
        { title: 'Empleado', value: 'EMPLOYEE' },
        { title: 'Socio', value: 'PARTNER' },
      ],
      rules: {
        required: (v) => !!v || 'Campo requerido',
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
    // Called from the parent via ref: open() to add, open(member) to change role
    open(member = null) {
      this.member = member
      this.form = {
        user_id: null,
        role: member ? member.role : null,
      }
      this.error = ''
      this.dialog = true
    },
    close() {
      this.dialog = false
    },
    async handleSubmit() {
      const { valid } = await this.$refs.form.validate()
      if (!valid) return

      this.saving = true
      this.error = ''
      try {
        const payload = { module: 'farms', nameState: 'members' }
        const saved = this.isEdit
          ? await this.updateItem({ ...payload, url: `/farms/members/${this.member.id}/`, data: { role: this.form.role } })
          : await this.createItem({ ...payload, url: '/farms/members/', data: this.form })
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
