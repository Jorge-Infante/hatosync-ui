import { createStore } from 'vuex'
import sharedStore from '@/modules/shared/store/shared_store'
import authStore from '@/modules/auth/store/auth_store'
import farmsStore from '@/modules/farms/store/farms_store'
import livestockStore from '@/modules/livestock/store/livestock_store'

export default createStore({
  modules: {
    shared: sharedStore,
    auth: authStore,
    farms: farmsStore,
    livestock: livestockStore,
  },
})
