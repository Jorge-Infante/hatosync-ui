import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import './styles/main.css'

createApp(App).use(store).use(router).use(vuetify).mount('#app')
