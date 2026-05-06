/*
  Guia rapida para presentar:
  Arranque de Vue. Aqui se registran router, estilos y librerias globales antes de montar la app.
  Buscar en VS Code: bootstrap Vue, router, estilos globales, montaje app.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { createApp } from 'vue'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { initializeTheme } from './services/theme'
import {
  CURRENCY_CHANGED_EVENT,
  formatCurrency,
  formatSignedCurrency,
  startCurrencyRateAutoRefresh,
} from './utils/currency'

initializeTheme()
startCurrencyRateAutoRefresh()
const loadUserWayWidget = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (document.querySelector('script[src="https://cdn.userway.org/widget.js"]')) return

  window._userway_config = {
    position: '3',
  }

  const script = document.createElement('script')
  script.src = 'https://cdn.userway.org/widget.js'
  script.async = true
  script.onerror = () => {
    console.warn('No se pudo cargar el widget de accesibilidad UserWay.')
  }
  document.body.appendChild(script)
}

const app = createApp(App)

app.mixin({
  data() {
    return {
      foodrushCurrencyTick: 0,
      foodrushCurrencyListener: null,
    }
  },
  created() {
    this.foodrushCurrencyListener = () => {
      this.foodrushCurrencyTick += 1
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(CURRENCY_CHANGED_EVENT, this.foodrushCurrencyListener)
    }
  },
  beforeUnmount() {
    if (typeof window !== 'undefined' && this.foodrushCurrencyListener) {
      window.removeEventListener(CURRENCY_CHANGED_EVENT, this.foodrushCurrencyListener)
    }
  },
  methods: {
    $money(value, options = {}) {
      this.foodrushCurrencyTick
      return formatCurrency(value, options)
    },
    $moneySigned(value, options = {}) {
      this.foodrushCurrencyTick
      return formatSignedCurrency(value, options)
    },
  },
})

app.use(router).mount('#app')
loadUserWayWidget()
