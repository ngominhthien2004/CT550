import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/global.css'
import './assets/styles/avatars.css'
import './assets/styles/buttons.css'
import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(VueKonva)
app.mount('#app')
