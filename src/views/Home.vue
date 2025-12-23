<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../services/api';
import { useRouter } from 'vue-router';

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
const userName = ref(localStorage.getItem('user_name') || '');

const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    userName.value = '';
    window.location.reload();
};

// Modal State
const isModalOpen = ref(false);
const sortType = ref('sugeridos');
const activeFilters = ref([]);

// const categories = ['Pizza', 'Hamburguesa', 'Bebidas', 'Tacos', 'Criolla', 'Postres'];

const franchiseMetadata = {
    // 1. Starbucks
    "Starbucks Coffee": { img: logoStarbucks, category: "Bebidas", rating: 4.8, pickup: true, promo: true },
    
    // 2. McDonald's
    "McDonald's": { img: logoMcDonalds, category: "Hamburguesa", rating: 4.7, pickup: true, promo: false },
    
    // 3. KFC
    "KFC": { img: logoKFC, category: "Pollo", rating: 4.6, pickup: false, promo: true },
    
    // 4. Burger King
    "Burger King": { img: logoBurgerKing, category: "Hamburguesa", rating: 4.3, pickup: true, promo: true },
    
    // 5. Little Caesars
    "Little Caesars": { img: logoLittleCaesars, category: "Pizza", rating: 4.5, pickup: true, promo: false },
    
    // 6. Domino's
    "Domino's Pizza": { img: logoDominos, category: "Pizza", rating: 4.8, pickup: true, promo: true },
    
    // 7. Pizza Hut
    "Pizza Hut": { img: logoPizzaHut, category: "Pizza", rating: 4.6, pickup: false, promo: false },
    
    // 8. Krispy Kreme
    "Krispy Kreme": { img: logoKrispyKreme, category: "Postres", rating: 4.9, pickup: true, promo: true },
    
    // 9. Rico Hot Dog
    "Rico Hot Dog": { img: logoRicoHotDog, category: "Criolla", rating: 4.2, pickup: true, promo: false },
    
    // 10. Pizzarelli
    "Pizzarelli": { img: logoPizzarelli, category: "Pizza", rating: 4.7, pickup: true, promo: true },
    
    // 11. Barra Payán
    "Barra Payán": { img: logoBarraPayan, category: "Criolla", rating: 4.9, pickup: true, promo: false },
    
    // 12. Taco Bell
    "Taco Bell": { img: logoTacoBell, category: "Tacos", rating: 4.4, pickup: false, promo: true },
    
    // 13. Helados Bon
    "Helados Bon": { img: logoHeladosBon, category: "Postres", rating: 4.8, pickup: true, promo: true },
    
    // 14. Chili's
    "Chili's Grill & Bar": { img: logoChilis, category: "Mexicana", rating: 4.5, pickup: false, promo: false },
    
    // 15. Panda Express
    "Panda Express": { img: logoPandaExpress, category: "Asiática", rating: 4.7, pickup: true, promo: true }
};

const fetchFranchises = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await api.getFranchises();
        const rawData = response.data || [];
        
        // Mapear datos del backend con la metadata visual
        franchises.value = rawData
            .filter(tenant => franchiseMetadata[tenant.nombre]) // Solo mostrar los que tenemos en metadata
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

    } catch (err) {
        console.error(err);
        error.value = err.message || 'Error al cargar restaurantes';
    } finally {
        loading.value = false;
    }
};

const checkBackend = async () => {
    try {
        await api.request('/api/health');
        return true;
    } catch (e) {
        console.warn('Backend check failed:', e);
        return false;
    }
};

onMounted(async () => {
    // Primero verificamos si el backend respira
    const isOnline = await checkBackend();
    if (!isOnline) {
        error.value = 'No se puede conectar con el servidor. Asegúrate de que el backend esté corriendo en el puerto 3000.';
        loading.value = false;
        return;
    }
    fetchFranchises();
});
const setCategory = (category) => {
    currentCategory.value = category;
};

// Filtering Logic
const filteredFranchises = computed(() => {
    let result = [...franchises.value];

    // Category Filter
    if (currentCategory.value !== 'all') {
        result = result.filter(item => item.category === currentCategory.value);
    }

    // Search Filter
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        result = result.filter(item => 
            item.name.toLowerCase().includes(term) || 
            item.category.toLowerCase().includes(term)
        );
    }

    // Modal Filters
    if (activeFilters.value.includes('pickup')) {
        result = result.filter(item => item.pickup);
    }
    if (activeFilters.value.includes('descuentos') || activeFilters.value.includes('cupones')) {
        result = result.filter(item => item.promo);
    }

    // Sorting
    if (sortType.value === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
    } else if (sortType.value === 'sugeridos') {
        result.sort((a, b) => a.id - b.id);
    }

    return result;
});


// Modal Actions
const openModal = () => isModalOpen.value = true;
const closeModal = () => isModalOpen.value = false;
const toggleFilter = (filter) => {
    if (activeFilters.value.includes(filter)) {
        activeFilters.value = activeFilters.value.filter(f => f !== filter);
    } else {
        activeFilters.value.push(filter);
    }
};
const setSort = (type) => sortType.value = type;

// Navigation
// This replaces the old goToPage function
const goToFranchise = (id, name) => {
    // Normalizar nombre para coincidir con la ruta
    const lowerName = name.toLowerCase();

    if (lowerName.includes('starbucks')) {
        router.push('/franchise/starbucks');
    } else if (lowerName.includes('mcdonald')) {
        router.push('/franchise/mcdonalds');
    } else {
        // Fallback para las que no tienen página aún
        alert(`La página de ${name} está en construcción. Próximamente.`);
    }
}

// onMounted is handled above

const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};
</script>

<template>
  <div class="flex flex-col min-h-screen text-slate-800">
    
    <!-- HEADER -->
    <header id="top" class="bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div class="flex items-center gap-2">
            <div class="flex flex-col items-center leading-none">
                <span class="text-orange-500 font-bold text-xl italic tracking-tighter">Food</span>
                <span class="text-slate-800 font-bold text-xl italic tracking-tighter -mt-1">Rush</span>
            </div>
            <div class="w-10 h-10 ml-2 rounded-full border-2 border-orange-500 flex items-center justify-center p-1">
                <i class="fa-solid fa-utensils text-orange-500"></i>
            </div>
        </div>

        <nav class="hidden md:flex gap-8 font-medium text-slate-600">
            <a href="#" @click.prevent="scrollToSection('top')" class="text-slate-900 border-b-2 border-slate-900">Inicio</a>
            <a href="#" @click.prevent="scrollToSection('franchises')" class="hover:text-orange-600 transition">Franquicias</a>
            <a href="#" @click.prevent="scrollToSection('contact')" class="hover:text-orange-600 transition">Contactos</a>
        </nav>

        <div v-if="userName" class="flex items-center gap-3">
            <div class="flex flex-col items-end">
                <span class="font-bold text-slate-700 text-sm">Hola, {{ userName }}</span>
                <button @click="handleLogout" class="text-xs text-red-500 hover:underline">Cerrar sesión</button>
            </div>
            <div @click="router.push('/profile')" class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border border-orange-200 cursor-pointer hover:bg-orange-200 transition">
                <i class="fa-solid fa-user"></i>
            </div>
        </div>
        <router-link v-else to="/login" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-300 transition" title="Iniciar Sesión">
            <i class="fa-solid fa-user"></i>
        </router-link>
    </header>

    <!-- HERO SECTION -->
    <section class="relative h-[300px] md:h-[400px] flex items-center justify-center">
        <div class="absolute inset-0 z-0">
            <img :src="heroBg" class="w-full h-full object-cover brightness-50">
        </div>
        <div class="relative z-10 w-full max-w-2xl px-4">
            <div class="bg-white rounded-lg flex shadow-2xl overflow-hidden p-1">
                <div class="pl-4 flex items-center text-gray-400">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
                <input v-model="searchTerm" type="text" placeholder="Buscar producto o franquicia..." class="w-full py-3 px-4 outline-none text-slate-700">
                <button class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-bold transition">Buscar</button>
            </div>
        </div>
    </section>

    <!-- CONTENT -->
    <section id="franchises" class="container mx-auto px-4 md:px-12 py-8">
        <!-- FILTERS BAR -->
        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">
            <button @click="openModal" class="bg-slate-900 hover:bg-slate-700 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg transition">
                <span>Filtrar</span>
                <i class="fa-solid fa-filter text-xs"></i>
            </button>

            <div class="flex flex-wrap gap-2" id="filter-container">
                <button 
                    v-for="cat in ['all', 'Pizza', 'Hamburguesa', 'Bebidas', 'Tacos', 'Criolla', 'Postres']" 
                    :key="cat"
                    @click="setCategory(cat)"
                    :class="[
                        'filter-btn border px-4 py-1.5 rounded-lg font-bold text-sm transition',
                        currentCategory === cat 
                            ? 'active bg-red-700 text-white border-red-700' 
                            : 'border-red-700 text-red-700 hover:bg-red-700 hover:text-white'
                    ]"
                >
                    {{ cat === 'all' ? 'Todos' : cat }}
                </button>
            </div>
        </div>

        <!-- GRID -->
        <div v-if="loading" class="text-center py-10 font-bold text-gray-400 animate-pulse">
            Cargando restaurantes...
        </div>

        <div v-else-if="error" class="text-center py-10">
             <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
             <p class="text-gray-500 font-medium">No se pudieron cargar los restaurantes.</p>
             <button @click="fetchFranchises" class="mt-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">Reintentar</button>
        </div>

        <div v-else-if="filteredFranchises.length === 0" class="col-span-full text-center py-10 text-gray-400">
            No se encontraron resultados con estos filtros.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div 
                v-for="item in filteredFranchises" 
                :key="item.id"
                @click="goToFranchise(item.id, item.name)"
                class="bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-transparent hover:border-orange-200 card-hover transition cursor-pointer fade-in group relative overflow-hidden"
            >
                <span v-if="item.promo" class="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Promo</span>
                
                <div class="w-24 h-24 mb-4 flex items-center justify-center relative z-10">
                    <img :src="item.img" :alt="item.name" class="max-w-full max-h-full object-contain">
                </div>
                
                <h3 class="font-bold text-lg text-slate-800 mb-1 group-hover:text-orange-600 transition">{{ item.name }}</h3>
                <div class="flex items-center gap-1 text-sm font-medium text-slate-500">
                    <i class="fa-solid fa-star text-xs text-yellow-500"></i> {{ item.rating }}
                    <span class="mx-2 text-gray-300">|</span>
                    <span class="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{{ item.category }}</span>
                </div>
                <div v-if="item.pickup" class="mt-2 text-[10px] text-green-600 font-bold">
                    <i class="fa-solid fa-store"></i> Retiro disponible
                </div>
            </div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer id="contact" class="bg-[#BD0A0A] text-white mt-auto">
        <div class="py-12 px-6 container mx-auto grid md:grid-cols-3 gap-8 text-sm">
            <div>
                <h3 class="font-bold text-lg mb-4">FoodRush</h3>
                <p class="opacity-80">La mejor comida, de tus franquicias favoritas, directo a tu puerta.</p>
            </div>
            <div>
                <h3 class="font-bold text-lg mb-4">Contactos</h3>
                <p class="opacity-80 mb-2"><i class="fa-solid fa-envelope mr-2"></i> soporte@foodrush.com</p>
                <p class="opacity-80"><i class="fa-solid fa-phone mr-2"></i> +1 (809) 555-0123</p>
            </div>
            <div>
                <h3 class="font-bold text-lg mb-4">Síguenos</h3>
                <div class="flex gap-4 text-xl">
                    <a href="#" class="hover:text-orange-300 transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="hover:text-orange-300 transition"><i class="fa-brands fa-facebook"></i></a>
                    <a href="#" class="hover:text-orange-300 transition"><i class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
        </div>
        <div class="py-4 text-center text-xs text-white/60 border-t border-white/10">
            &copy; 2025 FoodRush Inc.
        </div>
    </footer>

    <!-- MODAL -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center fade-in">
        <div class="bg-white rounded-3xl p-8 w-full max-w-md mx-4 relative shadow-2xl">
            <button @click="closeModal" class="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition"><i class="fa-solid fa-xmark text-2xl"></i></button>
            <h2 class="text-3xl font-bold text-center mb-8 text-slate-800">Filtros</h2>
            
            <div class="mb-6">
                <h3 class="font-bold text-lg text-slate-900 mb-3">Ordenar</h3>
                <div class="flex flex-wrap gap-2">
                    <button @click="setSort('sugeridos')" :class="['modal-chip', sortType === 'sugeridos' ? 'selected' : '']"><i class="fa-solid fa-arrow-down-up-across-line text-xs"></i> Sugeridos</button>
                    <button @click="setSort('rating')" :class="['modal-chip', sortType === 'rating' ? 'selected' : '']"><i class="fa-regular fa-star text-xs"></i> Mejor puntuados</button>
                </div>
            </div>

             <div class="mb-6">
                <h3 class="font-bold text-lg text-slate-900 mb-3">Filtrar</h3>
                <div class="flex flex-wrap gap-2">
                    <button @click="toggleFilter('pickup')" :class="['modal-chip', activeFilters.includes('pickup') ? 'selected' : '']">Retiro en local</button>
                    <button @click="toggleFilter('delivery')" :class="['modal-chip', activeFilters.includes('delivery') ? 'selected' : '']">Entrega FoodRush</button>
                </div>
            </div>

            <button @click="closeModal" class="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl transition shadow-md text-lg">Guardar</button>
        </div>
    </div>

  </div>
</template>

<style scoped>
/* Copiando estilos específicos del archivo HTML anterior */
.card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.modal-chip {
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    background-color: #f3f4f6;
    color: #4b5563;
    display: flex;
    align-items: center;
    gap: 6px;
}
.modal-chip:hover { background-color: #e5e7eb; }
.modal-chip.selected {
    background-color: #fff;
    border-color: #cbd5e1;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    color: #1e293b;
    border: 1px solid #94a3b8;
}
</style>
