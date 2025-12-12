<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../services/api';
import { useRouter } from 'vue-router';

// State
const franchises = ref([]);
const loading = ref(true);
const error = ref(null);
const searchTerm = ref('');
const currentCategory = ref('all');
const router = useRouter();

// Modal State
const isModalOpen = ref(false);
const sortType = ref('sugeridos');
const activeFilters = ref([]);

// const categories = ['Pizza', 'Hamburguesa', 'Bebidas', 'Tacos', 'Criolla', 'Postres'];

const franchiseMetadata = {
    // 1. Starbucks
    "Starbucks Coffee": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1024px-Starbucks_Corporation_Logo_2011.svg.png", category: "Bebidas", rating: 4.8, pickup: true, promo: true },
    
    // 2. McDonald's
    "McDonald's": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png", category: "Hamburguesa", rating: 4.7, pickup: true, promo: false },
    
    // 3. KFC
    "KFC": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/b/bf/KFC_logo.svg/1024px-KFC_logo.svg.png", category: "Pollo", rating: 4.6, pickup: false, promo: true },
    
    // 4. Burger King
    "Burger King": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/85/Burger_King_logo_%281999%29.svg/1024px-Burger_King_logo_%281999%29.svg.png", category: "Hamburguesa", rating: 4.3, pickup: true, promo: true },
    
    // 5. Little Caesars
    "Little Caesars": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/4/43/Little_Caesars_pizza_logo.svg/1200px-Little_Caesars_pizza_logo.svg.png", category: "Pizza", rating: 4.5, pickup: true, promo: false },
    
    // 6. Domino's
    "Domino's Pizza": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/1200px-Domino%27s_pizza_logo.svg.png", category: "Pizza", rating: 4.8, pickup: true, promo: true },
    
    // 7. Pizza Hut
    "Pizza Hut": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/sco/thumb/d/d2/Pizza_Hut_logo.svg/1200px-Pizza_Hut_logo.svg.png", category: "Pizza", rating: 4.6, pickup: false, promo: false },
    
    // 8. Krispy Kreme
    "Krispy Kreme": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/6/66/Krispy_Kreme_logo.svg/1200px-Krispy_Kreme_logo.svg.png", category: "Postres", rating: 4.9, pickup: true, promo: true },
    
    // 9. Rico Hot Dog
    "Rico Hot Dog": { img: "https://images.weserv.nl/?url=seeklogo.com/images/R/rico-hot-dog-logo-272097746D-seeklogo.com.png", category: "Criolla", rating: 4.2, pickup: true, promo: false },
    
    // 10. Pizzarelli
    "Pizzarelli": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/e/e5/Pizzarelli_Logo.png", category: "Pizza", rating: 4.7, pickup: true, promo: true },
    
    // 11. Barra Payán
    "Barra Payán": { img: "https://images.weserv.nl/?url=encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz-hX6x-SAvYyD5XvG-7U5K3qO5zO5Xw5XwA&s", category: "Criolla", rating: 4.9, pickup: true, promo: false },
    
    // 12. Taco Bell
    "Taco Bell": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/b/b3/Taco_Bell_2016.svg/1200px-Taco_Bell_2016.svg.png", category: "Tacos", rating: 4.4, pickup: false, promo: true },
    
    // 13. Helados Bon
    "Helados Bon": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/f/f6/Helados_Bon_Logo.jpg", category: "Postres", rating: 4.8, pickup: true, promo: true },
    
    // 14. Chili's
    "Chili's Grill & Bar": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/1/14/Chili%27s_Grill_%26_Bar_logo.svg/1200px-Chili%27s_Grill_%26_Bar_logo.svg.png", category: "Mexicana", rating: 4.5, pickup: false, promo: false },
    
    // 15. Panda Express
    "Panda Express": { img: "https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/thumb/2/29/Panda_Express_logo.svg/1200px-Panda_Express_logo.svg.png", category: "Asiática", rating: 4.7, pickup: true, promo: true }
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
    alert(`Has seleccionado ${name}`);
    // Here we would navigate to a details page: router.push(`/franchise/${id}`);
}

// onMounted is handled above
</script>

<template>
  <div class="flex flex-col min-h-screen text-slate-800">
    
    <!-- HEADER -->
    <header class="bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-sm sticky top-0 z-50">
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
            <a href="#" class="text-slate-900 border-b-2 border-slate-900">Inicio</a>
            <a href="#" class="hover:text-orange-600 transition">Franquicias</a>
            <a href="#" class="hover:text-orange-600 transition">Contactos</a>
        </nav>

        <router-link to="/login" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-300 transition">
            <i class="fa-solid fa-user"></i>
        </router-link>
    </header>

    <!-- HERO SECTION -->
    <section class="relative h-[300px] md:h-[400px] flex items-center justify-center">
        <div class="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop" class="w-full h-full object-cover brightness-50">
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
    <section class="container mx-auto px-4 md:px-12 py-8">
        <!-- FILTERS BAR -->
        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">
            <button @click="openModal" class="bg-slate-900 hover:bg-slate-700 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg transition">
                <span>Filter</span>
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
    <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="py-4 text-center text-xs text-white/60">
            &copy; 2025 FoodRush Inc.
        </div>
    </footer>

    <!-- MODAL -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center fade-in">
        <div class="bg-white rounded-3xl p-8 w-full max-w-md mx-4 relative shadow-2xl">
            <button @click="closeModal" class="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition"><i class="fa-solid fa-xmark text-2xl"></i></button>
            <h2 class="text-3xl font-bold text-center mb-8 text-slate-800">Filter</h2>
            
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
