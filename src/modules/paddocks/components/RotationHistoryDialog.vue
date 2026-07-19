<template>
  <v-dialog v-model="dialog" max-width="560">
    <v-card>
      <v-card-title class="pt-4 px-6 d-flex align-center ga-2">
        <v-icon color="primary">mdi-history</v-icon>
        Rotación de {{ paddock && paddock.name }}
      </v-card-title>

      <v-card-text class="px-6">
        <!-- Métricas derivadas -->
        <div v-if="rotation" class="d-flex flex-wrap ga-2 mb-4">
          <v-chip size="small" :color="statusColor" variant="tonal">
            {{ rotation.status_display }}<template v-if="rotation.days_in_status !== null"> · {{ rotation.days_in_status }} d</template>
          </v-chip>
          <v-chip v-if="rotation.avg_occupation_days !== null" size="small" variant="tonal" prepend-icon="mdi-cow">
            Ocupación prom. {{ rotation.avg_occupation_days }} d
          </v-chip>
          <v-chip v-if="rotation.avg_rest_days !== null" size="small" variant="tonal" prepend-icon="mdi-sprout-outline">
            Descanso prom. {{ rotation.avg_rest_days }} d
          </v-chip>
          <v-chip size="small" variant="tonal" prepend-icon="mdi-swap-horizontal">
            {{ rotation.stays_count }} {{ rotation.stays_count === 1 ? 'estadía' : 'estadías' }}
          </v-chip>
        </div>

        <v-skeleton-loader v-if="loading" type="list-item-two-line@3" />

        <p v-else-if="!stays.length" class="text-body-2 text-medium-emphasis text-center py-6 mb-0">
          Este potrero aún no tiene movimientos de lotes.
        </p>

        <v-list v-else density="comfortable" class="py-0">
          <template v-for="(stay, index) in stays" :key="stay.id">
            <v-divider v-if="index > 0" />
            <v-list-item class="px-0">
              <template #prepend>
                <v-avatar size="34" :color="stay.left_on ? 'secondary' : 'primary'" variant="tonal" class="mr-2">
                  <v-icon size="18">{{ stay.left_on ? 'mdi-check' : 'mdi-cow' }}</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">{{ stay.lot_name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDate(stay.entered_on) }} → {{ stay.left_on ? formatDate(stay.left_on) : 'hoy (dentro)' }}
                <template v-if="stay.notes"> · {{ stay.notes }}</template>
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center ga-1">
                  <v-chip size="x-small" variant="tonal" :color="stay.left_on ? undefined : 'primary'">
                    {{ stay.days }} d
                  </v-chip>
                  <v-btn
                    v-if="canManage"
                    icon="mdi-delete-outline"
                    variant="text"
                    size="x-small"
                    color="error"
                    title="Eliminar registro (corrección)"
                    :loading="deletingId === stay.id"
                    @click="removeStay(stay)"
                  />
                </div>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { getErrorMessage } from '@/api/errors'

export default {
  name: 'RotationHistoryDialog',
  props: {
    canManage: { type: Boolean, default: false },
  },
  emits: ['changed', 'error'],
  data() {
    return {
      dialog: false,
      paddock: null,
      loading: false,
      deletingId: null,
    }
  },
  computed: {
    ...mapGetters('paddocks', { stays: 'allStays' }),
    rotation() {
      return this.paddock && this.paddock.rotation
    },
    statusColor() {
      if (!this.rotation) return undefined
      return { OCCUPIED: 'primary', RESTING: 'accent', NEVER_USED: 'secondary' }[this.rotation.status]
    },
  },
  methods: {
    ...mapActions('shared', ['fetchState', 'deleteItem']),
    async open(paddock) {
      this.paddock = paddock
      this.dialog = true
      this.loading = true
      try {
        await this.fetchState({
          module: 'paddocks',
          nameState: 'stays',
          url: '/farms/paddock-stays/',
          params: { paddock: paddock.id },
        })
      } catch (e) {
        this.$emit('error', getErrorMessage(e, 'No se pudo cargar el historial'))
      } finally {
        this.loading = false
      }
    },
    async removeStay(stay) {
      this.deletingId = stay.id
      try {
        await this.deleteItem({
          module: 'paddocks',
          nameState: 'stays',
          url: `/farms/paddock-stays/${stay.id}/`,
          value: stay.id,
        })
        this.$emit('changed')
      } catch (e) {
        this.$emit('error', getErrorMessage(e, 'No se pudo eliminar el registro'))
      } finally {
        this.deletingId = null
      }
    },
    formatDate(value) {
      if (!value) return '—'
      const [year, month, day] = value.split('-')
      return `${day}/${month}/${year}`
    },
  },
}
</script>
