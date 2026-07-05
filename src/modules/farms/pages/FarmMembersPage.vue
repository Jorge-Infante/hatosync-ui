<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Miembros</h1>
        <p class="text-body-2 text-medium-emphasis">
          Equipo de <strong>{{ activeFarmName || 'tu finca activa' }}</strong>.
        </p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-account-plus-outline" :disabled="!activeFarmId" @click="$refs.memberFormDialog.open()">
        Agregar miembro
      </v-btn>
    </div>

    <!-- Farm filter (switches the active farm) + search -->
    <v-row dense class="mb-4">
      <v-col cols="12" sm="5" md="4">
        <v-select
          :model-value="activeFarmId"
          label="Finca"
          :items="farms"
          item-title="name"
          item-value="id"
          prepend-inner-icon="mdi-barn"
          :loading="switching"
          :disabled="switching"
          hide-details
          @update:model-value="onFarmChange"
        />
      </v-col>
      <v-col cols="12" sm="7" md="5">
        <v-text-field
          v-model="search"
          label="Buscar por nombre o correo"
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
        />
      </v-col>
    </v-row>

    <v-alert v-if="!activeFarmId && !loading" type="info" class="mb-4">
      No tienes una finca activa. Selecciona una finca para gestionar sus miembros.
    </v-alert>

    <v-card v-else>
      <v-data-table
        :headers="headers"
        :items="filteredMembers"
        :loading="loading || switching"
        item-value="id"
        no-data-text="No hay miembros para mostrar"
        loading-text="Cargando miembros..."
      >
        <template #[`item.user`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" variant="tonal" size="36" class="mr-3">
              <span class="text-caption font-weight-medium">{{ initials(item.user.full_name) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.user.full_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.user.email }}</div>
            </div>
          </div>
        </template>

        <template #[`item.phone`]="{ item }">
          {{ item.user.phone || '—' }}
        </template>

        <template #[`item.role`]="{ item }">
          <v-chip size="small" :color="roleColors[item.role] || 'secondary'">
            {{ item.role_display }}
          </v-chip>
        </template>

        <template #[`item.joined_at`]="{ item }">
          {{ formatDate(item.joined_at) }}
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            icon="mdi-pencil-outline"
            variant="text"
            size="small"
            :disabled="item.role === 'OWNER'"
            @click="$refs.memberFormDialog.open(item)"
          />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            color="error"
            :disabled="item.role === 'OWNER'"
            @click="askDelete(item)"
          />
        </template>
      </v-data-table>
    </v-card>

    <MemberFormDialog ref="memberFormDialog" :candidates="candidates" @saved="onSaved" />

    <!-- Remove confirmation -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="pt-4 px-6">¿Retirar miembro?</v-card-title>
        <v-card-text class="px-6">
          <strong>{{ memberToDelete && memberToDelete.user.full_name }}</strong> dejará de tener acceso a
          <strong>{{ activeFarmName }}</strong>.
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deleting" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">Retirar</v-btn>
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
import MemberFormDialog from '@/modules/farms/components/MemberFormDialog.vue'

export default {
  name: 'FarmMembersPage',
  components: { MemberFormDialog },
  data() {
    return {
      loading: false,
      switching: false,
      search: '',
      deleteDialog: false,
      deleting: false,
      memberToDelete: null,
      snackbar: { show: false, text: '', color: 'success' },
      headers: [
        { title: 'Miembro', key: 'user', sortable: false },
        { title: 'Teléfono', key: 'phone', sortable: false },
        { title: 'Rol', key: 'role' },
        { title: 'Miembro desde', key: 'joined_at' },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
      roleColors: {
        OWNER: 'primary',
        ADMIN: 'info',
        EMPLOYEE: 'secondary',
        PARTNER: 'warning',
      },
    }
  },
  computed: {
    ...mapGetters('farms', { farms: 'allFarms', members: 'allMembers' }),
    ...mapGetters('auth', ['activeFarmId', 'activeFarmName']),
    filteredMembers() {
      if (!this.search) return this.members
      const query = this.search.toLowerCase()
      return this.members.filter(
        (member) =>
          member.user.full_name.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)
      )
    },
    // Users from the rest of my farms not yet in the active one (the API has
    // no user search endpoint; brand-new users are created via farm setup)
    candidates() {
      const currentIds = new Set(this.members.map((member) => member.user.id))
      const byId = new Map()
      this.farms.forEach((farm) => {
        (farm.members || []).forEach((member) => {
          if (!currentIds.has(member.user.id) && !byId.has(member.user.id)) {
            byId.set(member.user.id, {
              id: member.user.id,
              label: `${member.user.full_name} (${member.user.email})`,
            })
          }
        })
      })
      return [...byId.values()]
    },
  },
  created() {
    this.initialize()
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    ...mapActions('farms', ['switchActiveFarm']),
    async initialize() {
      this.loading = true
      try {
        if (!this.farms.length) {
          await this.fetchState({ module: 'farms', nameState: 'farms', url: '/farms/' })
        }
        if (this.activeFarmId) {
          await this.loadMembers()
        }
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudieron cargar los miembros'), 'error')
      } finally {
        this.loading = false
      }
    },
    loadMembers() {
      return this.fetchState({ module: 'farms', nameState: 'members', url: '/farms/members/' })
    },
    async onFarmChange(farmId) {
      if (!farmId || farmId === this.activeFarmId) return
      this.switching = true
      try {
        await this.switchActiveFarm(farmId)
        await this.loadMembers()
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo cambiar de finca'), 'error')
      } finally {
        this.switching = false
      }
    },
    initials(fullName) {
      return fullName
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    },
    formatDate(value) {
      if (!value) return '—'
      return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    askDelete(member) {
      this.memberToDelete = member
      this.deleteDialog = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteItem({
          module: 'farms',
          nameState: 'members',
          url: `/farms/members/${this.memberToDelete.id}/`,
          value: this.memberToDelete.id,
        })
        this.notify('Miembro retirado')
        this.deleteDialog = false
      } catch (e) {
        this.notify(getErrorMessage(e, 'No se pudo retirar al miembro'), 'error')
      } finally {
        this.deleting = false
      }
    },
    onSaved({ isEdit }) {
      this.notify(isEdit ? 'Miembro actualizado' : 'Miembro agregado')
    },
    notify(text, color = 'success') {
      this.snackbar = { show: true, text, color }
    },
  },
}
</script>
