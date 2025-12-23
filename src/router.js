import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Login from './views/Login.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    // Franchise Routes
    { path: '/franchise/starbucks', component: () => import('./views/Starbucks.vue') },
    { path: '/franchise/mcdonalds', component: () => import('./views/McDonalds.vue') },
    // User Routes
    { path: '/cart', component: () => import('./views/Cart.vue') },
    { path: '/checkout', component: () => import('./views/Checkout.vue') },
    { path: '/orders', component: () => import('./views/Orders.vue') },
    { path: '/profile', component: () => import('./views/Profile.vue') },
    { path: '/favorites', component: () => import('./views/Favorites.vue') },
    { path: '/payment-methods', component: () => import('./views/PaymentMethods.vue') },
    // Config Routes
    { path: '/change-password', component: () => import('./views/ChangePassword.vue') },
    { path: '/notifications', component: () => import('./views/Notifications.vue') },
    { path: '/support', component: () => import('./views/Support.vue') }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
