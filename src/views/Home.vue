<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { api } from '../services/api';
import { useRouter } from 'vue-router';
import { APP_EVENTS, clearSession, getCartCount, getSession } from '../services/storage';

// Image Imports
import heroBg from '@/assets/images/hero-bg.png';
import logoStarbucks from '@/assets/images/logo-starbucks.png';
import logoMcDonalds from '@/assets/images/logo-mcdonalds.png';
import logoKFC from '@/assets/images/logo-kfc.png';
import logoBurgerKing from '@/assets/images/logo-burgerking.png';
import logoLittleCaesars from '@/assets/images/logo-littlecaesars.png';
import logoDominos from '@/assets/images/logo-dominos.png';
import logoPizzaHut from '@/assets/images/logo-pizzahut.png';
import logoKrispyKreme from '@/assets/images/logo-krispykreme.png';
import logoRicoHotDog from '@/assets/images/logo-ricohotdog.png';
import logoPizzarelli from '@/assets/images/logo-pizzarelli.png';
import logoBarraPayan from '@/assets/images/logo-barrapayan.png';
import logoTacoBell from '@/assets/images/logo-tacobell.png';
import logoHeladosBon from '@/assets/images/logo-heladosbon.png';
import logoChilis from '@/assets/images/logo-chilis.png';
import logoPandaExpress from '@/assets/images/logo-pandaexpress.png';

// State
const franchises = ref([]);
const loading = ref(true);
const error = ref(null);
const searchTerm = ref('');
const currentCategory = ref('all');

const router = useRouter();
const userName = ref(getSession().userName || '');

// Cart State
const cartCount = ref(0);
const updateCartCount = () => {
    cartCount.value = getCartCount();
};
const syncSessionState = () => {
    userName.value = getSession().userName || '';
    updateCartCount();
};

// Carousel
const currentSlide = ref(0);
let carouselInterval = null;
const heroSlides = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1470&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1470&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1374&auto=format&fit=crop'
];
const startCarousel = () => {
    carouselInterval = setInterval(() => {
        currentSlide.value = (currentSlide.value + 1) % heroSlides.length;
    }, 4000);
};

// Modal State
const showFilters = ref(false);
const sortType = ref('sugeridos');
const activeFilters = ref([]);
const handleLogout = () => {
    clearSession();
    userName.value = '';
    window.location.reload();
};

const franchiseMetadata = {
    "Starbucks Coffee": { img: logoStarbucks, category: "Bebidas", rating: 4.8, pickup: true, promo: true },
    "McDonald's": { img: logoMcDonalds, category: "Hamburguesa", rating: 4.7, pickup: true, promo: false },
    "KFC": { img: logoKFC, category: "Pollo", rating: 4.6, pickup: false, promo: true },
    "Burger King": { img: logoBurgerKing, category: "Hamburguesa", rating: 4.3, pickup: true, promo: true },
    "Little Caesars": { img: logoLittleCaesars, category: "Pizza", rating: 4.5, pickup: true, promo: false },
    "Domino's Pizza": { img: logoDominos, category: "Pizza", rating: 4.8, pickup: true, promo: true },
    "Pizza Hut": { img: logoPizzaHut, category: "Pizza", rating: 4.6, pickup: false, promo: false },
    "Krispy Kreme": { img: logoKrispyKreme, category: "Postres", rating: 4.9, pickup: true, promo: true },
    "Rico Hot Dog": { img: logoRicoHotDog, category: "Criolla", rating: 4.2, pickup: true, promo: false },
    "Pizzarelli": { img: logoPizzarelli, category: "Pizza", rating: 4.7, pickup: true, promo: true },
    "Barra Payán": { img: logoBarraPayan, category: "Criolla", rating: 4.9, pickup: true, promo: false },
    "Taco Bell": { img: logoTacoBell, category: "Tacos", rating: 4.4, pickup: false, promo: true },
    "Helados Bon": { img: logoHeladosBon, category: "Postres", rating: 4.8, pickup: true, promo: true },
    "Chili's Grill & Bar": { img: logoChilis, category: "Mexicana", rating: 4.5, pickup: false, promo: false },
    "Panda Express": { img: logoPandaExpress, category: "Asiática", rating: 4.7, pickup: true, promo: true }
};

const buildFallbackFranchises = () =>
    Object.entries(franchiseMetadata).map(([name, meta], index) => ({
        id: index + 1,
        name,
        category: meta.category || 'General',
        rating: meta.rating || 4,
        img: meta.img || "https://via.placeholder.com/150",
        pickup: meta.pickup !== undefined ? meta.pickup : true,
        promo: meta.promo !== undefined ? meta.promo : false
    }));

const fetchFranchises = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await api.getFranchises();
        const rawData = response.data || [];
        const mappedFranchises = rawData
            .filter(tenant => franchiseMetadata[tenant.nombre])
            .map(tenant => {
                const meta = franchiseMetadata[tenant.nombre];
                return {
                    id: tenant.id,
                    name: tenant.nombre,
                    category: meta.category || 'General',
                    rating: meta.rating || 4.0,
                    img: meta.img || "https://via.placeholder.com/150",
                    pickup: meta.pickup !== undefined ? meta.pickup : true,
                    promo: meta.promo !== undefined ? meta.promo : false
                };
            });

        franchises.value = mappedFranchises.length > 0 ? mappedFranchises : buildFallbackFranchises();
    } catch (err) {
        console.warn('Falling back to local franchises list', err);
        franchises.value = buildFallbackFranchises();
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    syncSessionState();
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener(APP_EVENTS.cartChanged, updateCartCount);
    window.addEventListener(APP_EVENTS.authChanged, syncSessionState);

    await fetchFranchises();
    startCarousel();
});

onBeforeUnmount(() => {
    clearInterval(carouselInterval);
    window.removeEventListener('storage', updateCartCount);
    window.removeEventListener(APP_EVENTS.cartChanged, updateCartCount);
    window.removeEventListener(APP_EVENTS.authChanged, syncSessionState);
});

const setCategory = (category) => {
    currentCategory.value = category;
};

const filteredFranchises = computed(() => {
    let result = [...franchises.value];

    if (currentCategory.value !== 'all') {
        result = result.filter(item => item.category === currentCategory.value);
    }
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        result = result.filter(item => 
            item.name.toLowerCase().includes(term) || 
            item.category.toLowerCase().includes(term)
        );
    }
    if (activeFilters.value.includes('pickup')) {
        result = result.filter(item => item.pickup);
    }
    if (activeFilters.value.includes('descuentos') || activeFilters.value.includes('cupones')) {
        result = result.filter(item => item.promo);
    }
    if (sortType.value === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
    } else if (sortType.value === 'sugeridos') {
        result.sort((a, b) => a.id - b.id);
    }
    return result;
});

const toggleModalFilter = (filter) => {
    if (activeFilters.value.includes(filter)) {
        activeFilters.value = activeFilters.value.filter(f => f !== filter);
    } else {
        activeFilters.value.push(filter);
    }
};

const franchiseRoutes = {
    "Starbucks Coffee": "/franchise/starbucks",
    "McDonald's": "/franchise/mcdonalds",
    "KFC": "/franchise/kfc",
    "Burger King": "/franchise/burger-king",
    "Little Caesars": "/franchise/little-caesars",
    "Domino's Pizza": "/franchise/dominos-pizza",
    "Pizza Hut": "/franchise/pizza-hut",
    "Krispy Kreme": "/franchise/krispy-kreme",
    "Rico Hot Dog": "/franchise/rico-hot-dog",
    "Pizzarelli": "/franchise/pizzarelli",
    "Barra Payán": "/franchise/barra-payan",
    "Taco Bell": "/franchise/taco-bell",
    "Helados Bon": "/franchise/helados-bon",
    "Chili's Grill & Bar": "/franchise/chilis",
    "Panda Express": "/franchise/panda-express"
};

const goToFranchise = (id, name) => {
    const route = franchiseRoutes[name];
    if (route) {
        router.push(route);
    } else {
        alert(`La página de ${name} está en construcción. Próximamente.`);
    }
};

const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
};
</script>

<template>
<div class="font-sans antialiased bg-cream overflow-x-hidden flex flex-col min-h-screen">
    <div class="bg-dark text-white text-center py-2 text-xs font-bold tracking-widest uppercase relative z-50">
        <span class="text-accent">⚡</span> ¡Tu Gusto Nuestra Felicidad! <span class="text-accent">⚡</span>
    </div>
    <nav class="bg-white shadow-sm py-3 md:py-4 sticky top-0 z-50 transition-all border-b border-gray-100">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 md:px-12">
            <a href="#" @click.prevent="scrollToSection('top')" class="flex items-center space-x-2 group">
                <i class="fas fa-bolt text-2xl md:text-3xl text-primary electric-blink transform group-hover:scale-110 transition-transform"></i>
                <span class="self-center text-2xl font-extrabold whitespace-nowrap text-dark tracking-tighter font-sans">
                    FOOD<span class="text-primary">RUSH</span>
                </span>
            </a>

            <nav class="hidden md:flex gap-8 font-medium">
                <a href="#" @click.prevent="scrollToSection('top')" class="text-primary font-bold border-b-2 border-primary pb-1">Inicio</a>
                <a href="#" @click.prevent="scrollToSection('franchises')" class="text-gray-500 hover:text-primary transition font-medium">Categorías</a>
                <a href="#" @click.prevent="scrollToSection('contact')" class="text-gray-500 hover:text-primary transition font-medium">Ofertas</a>
            </nav>

            <div class="flex items-center gap-5">
                <button class="md:hidden text-gray-600 text-xl"><i class="fa-solid fa-magnifying-glass"></i></button>

                <div v-if="userName" class="flex items-center gap-5">
                    <div class="flex items-center gap-4 mr-2">
                        <button class="relative text-gray-400 hover:text-slate-800 transition" aria-label="Notificaciones">
                            <i class="fa-regular fa-bell text-xl"></i>
                            <span class="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">2</span>
                        </button>
                        <button @click="router.push('/cart')" class="relative text-gray-400 hover:text-slate-800 transition" aria-label="Carrito de compras">
                            <i class="fa-solid fa-cart-shopping text-xl"></i>
                            <span v-if="cartCount > 0" class="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[10px] w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full font-bold border-2 border-white">{{ cartCount }}</span>
                        </button>
                    </div>

                    <div class="h-8 w-px bg-gray-200"></div>

                    <div class="flex items-center gap-3">
                        <div class="flex flex-col items-end">
                            <span class="font-bold text-slate-700 text-sm">{{ userName.split(' ')[0] }}</span>
                            <button @click="handleLogout" class="text-[11px] text-red-500 font-bold hover:underline">Cerrar sesión</button>
                        </div>
                        <div @click="router.push('/profile')" class="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-accent cursor-pointer hover:bg-orange-100 transition border border-orange-100 shadow-sm">
                            <i class="fa-regular fa-user"></i>
                        </div>
                    </div>
                </div>

                <button v-else @click="router.push('/login')" class="bg-primary text-white px-5 py-2 rounded-full font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-sm text-sm">
                    <i class="fa-solid fa-user text-xs"></i> Iniciar Sesión
                </button>
            </div>
        </div>
    </nav>

    <div id="top" class="relative w-full h-[320px] md:h-[380px] overflow-hidden">
        <div class="relative h-full">
            <div v-for="(slide, idx) in heroSlides" :key="idx"
                 class="carousel-slide" :class="{ active: currentSlide === idx }">
                <img :src="slide" class="w-full h-full object-cover brightness-[0.65]" :alt="'Slide ' + (idx + 1)">
            </div>
        </div>

        <div class="absolute inset-0 z-30 flex flex-col items-center justify-center px-4">
            <div class="relative z-10 w-full max-w-2xl px-4 animate-[fadeIn_0.8s_ease-out]">
                <h2 class="text-white text-center font-display text-2xl md:text-4xl mb-6 drop-shadow-md">¿Qué se te antoja hoy?</h2>
                <div class="clean-search">
                    <div class="search-icon">
                        <i class="fa-solid fa-magnifying-glass text-accent"></i>
                    </div>
                    <input type="text" v-model="searchTerm" placeholder="Buscar franquicia o comida...">
                    <button>Buscar</button>
                </div>
            </div>
        </div>

        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
            <div v-for="(_, idx) in heroSlides" :key="idx"
                 class="w-2.5 h-2.5 rounded-full cursor-pointer transition-all"
                 :class="currentSlide === idx ? 'bg-white scale-110' : 'bg-white/50'"
                 @click="currentSlide = idx"></div>
        </div>
    </div>

    <section id="franchises" class="container mx-auto px-4 md:px-12 py-8 md:py-12">
        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">
            <button @click="showFilters = true" class="bg-dark hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition flex-shrink-0">
                <i class="fa-solid fa-sliders"></i>
                <span>Filtros</span>
            </button>

            <div class="w-full overflow-x-auto no-scrollbar pb-2">
                <div class="flex flex-wrap md:flex-nowrap gap-3 min-w-max">
                    <button @click="setCategory('all')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'all' ? 'active' : '']">Todos</button>
                    <button @click="setCategory('Hamburguesa')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Hamburguesa' ? 'active' : '']"><i class="fa-solid fa-burger mr-1"></i> Hamburguesas</button>
                    <button @click="setCategory('Pizza')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Pizza' ? 'active' : '']"><i class="fa-solid fa-pizza-slice mr-1"></i> Pizza</button>
                    <button @click="setCategory('Pollo')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Pollo' ? 'active' : '']"><i class="fa-solid fa-drumstick-bite mr-1"></i> Pollo</button>
                    <button @click="setCategory('Bebidas')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Bebidas' ? 'active' : '']"><i class="fa-solid fa-mug-hot mr-1"></i> Bebidas</button>
                    <button @click="setCategory('Tacos')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Tacos' ? 'active' : '']"><i class="fa-solid fa-pepper-hot mr-1"></i> Tacos</button>
                    <button @click="setCategory('Postres')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Postres' ? 'active' : '']"><i class="fa-solid fa-ice-cream mr-1"></i> Postres</button>
                    <button @click="setCategory('Criolla')" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Criolla' ? 'active' : '']"><i class="fa-solid fa-utensils mr-1"></i> Criolla</button>
                </div>
            </div>
        </div>

        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <div v-for="i in 8" :key="i" class="bg-white rounded-2xl p-5 shadow-sm space-y-4 animate-pulse border border-gray-100 flex flex-col items-center justify-center h-[230px]">
                <div class="w-24 h-24 bg-gray-200 rounded-full mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>

        <div v-else-if="error" class="text-center py-16">
            <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
            <p class="text-gray-500 font-medium">{{ error }}</p>
            <button @click="fetchFranchises" class="mt-4 bg-dark text-white px-6 py-2 rounded-xl text-sm hover:bg-gray-800 transition font-bold">Reintentar</button>
        </div>

        <div v-else-if="filteredFranchises.length === 0" class="col-span-full flex flex-col items-center justify-center py-20 text-center fade-in">
            <div class="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300 border border-gray-100">
                <i class="fa-solid fa-burger text-5xl opacity-50"></i>
            </div>
            <h3 class="text-2xl font-bold text-slate-800 mb-2 font-display">Ups, no hay resultados</h3>
            <p class="text-gray-500 max-w-md mx-auto mb-6">No encontramos restaurantes que coincidan con tu búsqueda. Intenta con otros términos o quita los filtros activos.</p>
            <button @click="searchTerm = ''; currentCategory = 'all'; activeFilters = []" class="bg-orange-50 text-orange-600 px-6 py-2.5 rounded-full font-bold border border-orange-200 hover:bg-orange-100 transition shadow-sm">
                Limpiar Filtros
            </button>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <div v-for="(item, idx) in filteredFranchises" :key="item.id"
                 class="card-franchise flex flex-col items-center justify-center text-center p-5 cursor-pointer group fade-in"
                 :style="{ animationDelay: `${Math.min(idx, 10) * 55}ms` }"
                 @click="goToFranchise(item.id, item.name)">
                
                <span v-if="item.promo" class="absolute top-3 right-3 bg-accent text-white text-[10px] uppercase tracking-wide px-2 py-1 rounded-md font-bold shadow-sm z-10">Promo</span>

                <div class="w-28 h-28 mb-4 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-110">
                    <img :src="item.img" :alt="item.name" class="max-w-full max-h-full object-contain drop-shadow-sm" loading="lazy">
                </div>

                <h3 class="font-bold text-lg text-dark mb-1 group-hover:text-primary transition line-clamp-1">{{ item.name }}</h3>

                <div class="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                    <div class="flex items-center text-accent"><i class="fa-solid fa-star text-xs mr-1"></i>{{ item.rating }}</div>
                    <span class="text-gray-300">|</span>
                    <span class="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{{ item.category }}</span>
                </div>

                <div v-if="item.pickup" class="w-full mt-2 pt-2 border-t border-gray-50 text-[11px] text-green-600 font-bold flex items-center justify-center gap-1">
                    <i class="fa-solid fa-bag-shopping"></i> Pickup
                </div>
                <div v-else class="w-full mt-2 pt-2 border-t border-transparent text-[11px] text-transparent">.</div>
            </div>
        </div>
    </section>

    <footer id="contact" class="bg-dark text-white mt-auto border-t-4 border-primary">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-1">
                    <span class="text-accent font-black text-xl italic font-display">Food</span>
                    <span class="text-dark font-black text-xl italic -ml-1 font-display">Rush</span>
                </div>
                <p class="text-gray-400 text-sm mb-6 font-medium max-w-xs leading-relaxed">Conectando tus antojos con las mejores franquicias del mundo.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition duration-300"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition duration-300"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition duration-300"><i class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
            <div class="flex gap-12 md:gap-20 text-sm text-left md:text-right w-full md:w-auto">
                <div>
                    <h4 class="font-bold mb-4 text-lg text-white">Ayuda</h4>
                    <ul class="space-y-3 text-gray-400 font-medium">
                        <li><a @click.prevent="router.push('/support')" class="hover:text-accent transition">Preguntas Frecuentes</a></li>
                        <li><a @click.prevent="router.push('/support')" class="hover:text-accent transition">Soporte Técnico</a></li>
                        <li><a @click.prevent="router.push('/terms')" class="hover:text-accent transition">Términos y Condiciones</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg text-white">Empresa</h4>
                    <ul class="space-y-3 text-gray-400 font-medium">
                        <li><a @click.prevent="router.push('/about')" class="hover:text-accent transition cursor-pointer">Sobre Nosotros</a></li>
                        <li><a href="#" class="hover:text-accent transition">Blog Corporativo</a></li>
                        <li><a @click.prevent="router.push('/affiliate')" class="hover:text-accent transition">Afíliate</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="bg-black text-center py-4 text-xs text-gray-600">
            &copy; 2025 FoodRush Inc. Todos los derechos reservados.
        </div>
    </footer>

    <div v-if="showFilters" class="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center fade-in backdrop-blur-sm" @click.self="showFilters = false">
        <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md mx-4 relative shadow-2xl border-t-8 border-primary">
            <button @click="showFilters = false" class="absolute top-4 right-4 text-gray-400 hover:text-primary transition bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"><i class="fa-solid fa-xmark text-lg"></i></button>
            <h2 class="text-2xl font-bold text-center mb-6 text-dark font-display">Filtrar Búsqueda</h2>

            <div class="space-y-6">
                <div>
                    <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Ordenar Por</h3>
                    <div class="flex flex-wrap gap-2">
                        <button @click="sortType = 'sugeridos'" :class="['modal-chip', sortType === 'sugeridos' ? 'selected' : '']"><i class="fa-solid fa-fire text-xs"></i> Sugeridos</button>
                        <button @click="sortType = 'rating'" :class="['modal-chip', sortType === 'rating' ? 'selected' : '']"><i class="fa-solid fa-star text-xs"></i> Calificación</button>
                        <button @click="sortType = 'rapidos'" :class="['modal-chip', sortType === 'rapidos' ? 'selected' : '']"><i class="fa-solid fa-clock text-xs"></i> Rapidez</button>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Tipo de Servicio</h3>
                    <div class="flex flex-wrap gap-2">
                        <button @click="toggleModalFilter('pickup')" :class="['modal-chip', activeFilters.includes('pickup') ? 'selected' : '']">Pickup (Retiro)</button>
                        <button @click="toggleModalFilter('delivery')" :class="['modal-chip', activeFilters.includes('delivery') ? 'selected' : '']">Delivery FoodRush</button>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Ofertas</h3>
                    <div class="flex flex-wrap gap-2">
                        <button @click="toggleModalFilter('descuentos')" :class="['modal-chip', activeFilters.includes('descuentos') ? 'selected' : '']">Promo Activa</button>
                        <button @click="toggleModalFilter('envio')" :class="['modal-chip', activeFilters.includes('envio') ? 'selected' : '']">Envío Gratis</button>
                    </div>
                </div>
            </div>

            <button @click="showFilters = false" class="w-full bg-dark hover:bg-black text-white font-bold py-3.5 rounded-xl transition shadow-lg text-lg mt-8 flex justify-center items-center gap-2">
                <span>Ver Resultados</span>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    </div>

</div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Titan+One&display=swap');

/* ── Custom Tokens ── */
.bg-cream { background-color: #FAFAF5; }
.bg-dark { background-color: #1a1a2e; }
.text-dark { color: #1a1a2e; }
.text-primary { color: #D90429; }
.bg-primary { background-color: #D90429; }
.border-primary { border-color: #D90429; }
.text-accent { color: #F48C06; }
.bg-accent { background-color: #F48C06; }
.font-display { font-family: 'Titan One', cursive; }

/* ── Bolt Animation ── */
@keyframes electric-blink {
    0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 2px #D90429); }
    50% { opacity: 0.4; transform: scale(1.1); filter: drop-shadow(0 0 8px #F48C06); }
}
.electric-blink { animation: electric-blink 5s infinite ease-in-out; }

/* ── Carousel ── */
.carousel-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
.carousel-slide.active { opacity: 1; }

/* ── Search Bar ── */
.clean-search {
    display: flex; align-items: center; background: white; border-radius: 12px;
    overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.15); width: 100%; height: 55px;
    border: 1px solid rgba(255,255,255,0.2);
}
.clean-search input {
    border: none !important; outline: none !important; box-shadow: none !important;
    height: 100%; flex-grow: 1; padding-left: 15px; font-size: 16px; color: #333;
}
.clean-search button {
    height: 100%; padding: 0 25px; background-color: #F48C06; color: white;
    font-weight: 700; font-size: 15px; border: none; cursor: pointer; transition: background 0.3s;
    text-transform: uppercase; letter-spacing: 0.5px;
}
.clean-search button:hover { background-color: #E85D04; }
.search-icon { padding-left: 20px; color: #9CA3AF; font-size: 18px; }

/* ── Franchise Cards ── */
.card-franchise {
    background: white; border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #f3f4f6; position: relative; overflow: hidden;
}
.card-franchise:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: #F48C06;
}

/* ── Filter Buttons ── */
.filter-btn {
    border: 1px solid #e5e7eb; color: #4b5563;
    background: white; transition: all 0.2s;
}
.filter-btn:hover { border-color: #D90429; color: #D90429; }
.filter-btn.active { background-color: #D90429; color: white; border-color: #D90429; box-shadow: 0 4px 6px rgba(217, 4, 41, 0.2); }

/* ── Modal Chips ── */
.modal-chip {
    padding: 8px 16px; border-radius: 9999px; font-size: 0.85rem;
    font-weight: 500; cursor: pointer; transition: all 0.2s;
    border: 1px solid #e5e7eb; background-color: white; color: #4b5563;
    display: flex; align-items: center; gap: 6px;
}
.modal-chip:hover { border-color: #F48C06; color: #F48C06; }
.modal-chip.selected { background-color: #F48C06; border-color: #F48C06; color: white; font-weight: 600; }
/* ── Animations ── */
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ── Scrollbar Hide ── */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
