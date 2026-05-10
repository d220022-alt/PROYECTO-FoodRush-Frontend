/*
  Guia rápida para presentar:
  Mapa de navegacion del frontend. Define que vista abre cada URL y cuales requieren sesion.
  Buscar en VS Code: rutas, protectedRoutes, auth guard, portales, login.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import { getSession } from './services/storage'
import { getPortalRouteByEmail } from './utils/portalRouting'

const TermsView = () => import('./views/terminos_condiciones.vue')

// Para presentar: aqui empieza el mapa de URLs; si preguntan por una pantalla, busca su path en este arreglo.
const routes = [
    { path: '/', component: () => import('./views/Home.vue') },
    { path: '/login', component: Login },
    // Franquicias: cada ruta carga su vista bajo demanda para no inflar el primer bundle.
    { path: '/franchise/starbucks', component: () => import('./views/Starbucks.vue') },
    { path: '/franchise/mcdonalds', component: () => import('./views/McDonalds.vue') },
    { path: '/franchise/kfc', component: () => import('./views/KFC.vue') },
    { path: '/franchise/burger-king', component: () => import('./views/BurgerKing.vue') },
    { path: '/franchise/little-caesars', component: () => import('./views/LittleCaesars.vue') },
    { path: '/franchise/dominos-pizza', component: () => import('./views/DominosPizza.vue') },
    { path: '/franchise/pizza-hut', component: () => import('./views/PizzaHut.vue') },
    { path: '/franchise/taco-bell', component: () => import('./views/TacoBell.vue') },
    { path: '/franchise/krispy-kreme', component: () => import('./views/KrispyKreme.vue') },
    { path: '/franchise/helados-bon', component: () => import('./views/HeladosBon.vue') },
    { path: '/franchise/barra-payan', component: () => import('./views/BarraPayan.vue') },
    { path: '/franchise/pizzarelli', component: () => import('./views/Pizzarelli.vue') },
    { path: '/franchise/rico-hot-dog', component: () => import('./views/RicoHotDog.vue') },
    { path: '/franchise/chilis', component: () => import('./views/Chilis.vue') },
    { path: '/franchise/panda-express', component: () => import('./views/PandaExpress.vue') },
    // Cliente: carrito, checkout, pedidos, perfil y metodos de pago.
    { path: '/cart', component: () => import('./views/Cart.vue') },
    { path: '/checkout', component: () => import('./views/Checkout.vue') },
    { path: '/orders', component: () => import('./views/Orders.vue') },
    { path: '/profile', component: () => import('./views/Profile.vue') },
    { path: '/favorites', component: () => import('./views/Favorites.vue') },
    { path: '/payment-methods', component: () => import('./views/PaymentMethods.vue') },
    // Soporte y paneles internos: tracking, administracion y delivery viven fuera del flujo normal de compra.
    { path: '/tracking/:id', component: () => import('./views/Tracking.vue') },
    { path: '/change-password', component: () => import('./views/ChangePassword.vue') },
    { path: '/notifications', component: () => import('./views/Notifications.vue') },
    { path: '/support', component: () => import('./views/Support.vue') },
    { path: '/about', component: () => import('./views/about.vue') },
    { path: '/administracion', component: () => import('./views/administracion.vue') },
    { path: '/delivery', component: () => import('./views/delivery.vue') },
    { path: '/terms', component: TermsView },
    { path: '/terminos', component: TermsView },
    { path: '/terminos-condiciones', component: TermsView },
    { path: '/terms-and-conditions', component: TermsView },
    { path: '/affiliate', component: () => import('./views/principal.vue') }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition

        if (to.hash) {
            return {
                el: to.hash,
                top: 96,
                behavior: 'smooth'
            }
        }

        return { left: 0, top: 0 }
    },
})

// Guardia central. Si el usuario no tiene sesion, protege pantallas con datos personales u operativos.
// Para presentar: esta guardia decide si una ruta necesita sesion y a que portal debe ir cada usuario.
router.beforeEach((to) => {
    const session = getSession()
    if (!session.isAuthenticated) {
        if (to.path === '/') return '/login'

        const protectedRoutes = ['/administracion', '/delivery', '/checkout', '/orders', '/profile', '/favorites', '/payment-methods', '/notifications', '/tracking']
        if (protectedRoutes.some((route) => to.path === route || to.path.startsWith(`${route}/`))) {
            return '/login'
        }

        return true
    }

    // Los correos operativos redirigen a su portal para evitar que entren al home de clientes por accidente.
    const portalRoute = getPortalRouteByEmail(session.userEmail)

    if (to.path === '/login') {
        return portalRoute
    }

    if (portalRoute !== '/' && to.path === '/') {
        return portalRoute
    }

    return true
})

export default router
