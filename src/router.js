import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Login from './views/Login.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    // Franchise Routes
    { path: '/franchise/starbucks', component: () => import('./views/Starbucks.vue') },
    { path: '/franchise/mcdonalds', component: () => import('./views/FranchiseUnified.vue'), props: { slug: 'mcdonalds' } },
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
    // User Routes
    { path: '/cart', component: () => import('./views/Cart.vue') },
    { path: '/checkout', component: () => import('./views/Checkout.vue') },
    { path: '/orders', component: () => import('./views/Orders.vue') },
    { path: '/profile', component: () => import('./views/Profile.vue') },
    { path: '/favorites', component: () => import('./views/Favorites.vue') },
    { path: '/payment-methods', component: () => import('./views/PaymentMethods.vue') },
    // Config Routes
    { path: '/tracking/:id', component: () => import('./views/Tracking.vue') },
    { path: '/change-password', component: () => import('./views/ChangePassword.vue') },
    { path: '/notifications', component: () => import('./views/Notifications.vue') },
    { path: '/support', component: () => import('./views/Support.vue') },
    { path: '/about', component: () => import('./views/about.vue') },
    { path: '/terms', component: () => import('./views/terminos_condiciones.vue') },
    { path: '/affiliate', component: () => import('./views/principal.vue') }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
