/*
  Guia rapida para presentar:
  Arranque de Vue. Aqui se registran router, estilos y librerias globales antes de montar la app.
  Buscar en VS Code: bootstrap Vue, router, estilos globales, montaje app.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { createApp } from 'vue'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import App from './views/delivery.vue'
import router from './router'
import { initializeTheme } from './services/theme'

initializeTheme()
createApp(App).use(router).mount('#app')
