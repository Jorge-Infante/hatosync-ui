import { createStore } from 'vuex'
import sharedStore from '@/modules/shared/store/shared_store'
import authStore from '@/modules/auth/store/auth_store'
import farmsStore from '@/modules/farms/store/farms_store'
import livestockStore from '@/modules/livestock/store/livestock_store'
import configurationStore from '@/modules/configuration/store/configuration_store'
import notificationsStore from '@/modules/notifications/store/notifications_store'
import healthStore from '@/modules/health/store/health_store'
import paddocksStore from '@/modules/paddocks/store/paddocks_store'
import dashboardStore from '@/modules/dashboard/store/dashboard_store'
import tagsStore from '@/modules/tags/store/tags_store'

export default createStore({
  modules: {
    shared: sharedStore,
    auth: authStore,
    farms: farmsStore,
    livestock: livestockStore,
    configuration: configurationStore,
    notifications: notificationsStore,
    health: healthStore,
    paddocks: paddocksStore,
    dashboard: dashboardStore,
    tags: tagsStore,
  },
})
