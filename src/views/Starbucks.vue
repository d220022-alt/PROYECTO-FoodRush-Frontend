<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';

const router = useRouter();

// ── Colors ──
const bgStarbucks = '#00704A';

// ── State ──
const products = ref([]);
const isLoading = ref(true);
const currentCategory = ref('Bebidas');
const searchTerm = ref('');
const cartCount = ref(0);
const userName = ref('');

// Sidebar filter state
const activeTypeFilters = ref([]);
const activeCaffeineFilter = ref(null);

// Slider state
const currentSlide = ref(0);
let slideInterval = null;
const slides = [
    'https://i.pinimg.com/736x/31/3b/0d/313b0dc5455e06e91cc76c3cc4e5b036.jpg',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1887',
    'https://tb-static.uber.com/prod/image-proc/processed_images/fe123fdb00b05ded4dfc1ec527ba53d1/5283d81c664b43c5f57a3a186d273063.jpeg'
];

// Detail View State
const selectedProduct = ref(null);
const currentQty = ref(1);
const currentSize = ref('Grande');
const matchaQty = ref(4);
const syrupQty = ref(4);
const iceOption = ref('Normal');
const isFavorite = ref(false);
const sizePrices = ref({ Alto: 0, Grande: 0, Venti: 0 });

// ── Slider Logic ──
const startSlideShow = () => {
    slideInterval = setInterval(() => {
        currentSlide.value = (currentSlide.value + 1) % slides.length;
    }, 4000);
};
const goToSlide = (index) => {
    currentSlide.value = index;
    clearInterval(slideInterval);
    startSlideShow();
};

// ── Sidebar Filter Types ──
const sidebarConfig = computed(() => {
    if (currentCategory.value === 'Bebidas') {
        return {
            typeLabel: 'Tipo de Bebida',
            types: [
                { key: 'Coffee', label: 'Café' },
                { key: 'Black Tea', label: 'Té Negro' },
                { key: 'Green Tea', label: 'Té Verde' },
                { key: 'Refresher', label: 'Refreshers' },
                { key: 'Chocolate', label: 'Chocolate' }
            ],
            showCaffeine: true
        };
    } else if (currentCategory.value === 'Comida') {
        return {
            typeLabel: 'Tipo de Comida',
            types: [
                { key: 'Bakery', label: 'Panadería' },
                { key: 'Lunch', label: 'Almuerzo' },
                { key: 'Breakfast', label: 'Desayuno' }
            ],
            showCaffeine: false
        };
    } else {
        return {
            typeLabel: 'Formato',
            types: [
                { key: 'Whole Bean', label: 'Grano Entero' }
            ],
            showCaffeine: false
        };
    }
});

const toggleTypeFilter = (type) => {
    if (activeTypeFilters.value.includes(type)) {
        activeTypeFilters.value = activeTypeFilters.value.filter(t => t !== type);
    } else {
        if (activeTypeFilters.value.length >= 2) activeTypeFilters.value.shift();
        activeTypeFilters.value.push(type);
    }
};

const toggleCaffeineFilter = (val) => {
    activeCaffeineFilter.value = (activeCaffeineFilter.value === val) ? null : val;
};

const resetFilters = () => {
    searchTerm.value = '';
    activeTypeFilters.value = [];
    activeCaffeineFilter.value = null;
};

// ── Favorites ──
const checkFavorite = () => {
    if (!selectedProduct.value) return;
    const favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];
    isFavorite.value = favorites.some(f => f.id === selectedProduct.value.id);
};

const toggleFavorite = () => {
    if (!selectedProduct.value) return;
    let favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];
    if (isFavorite.value) {
        favorites = favorites.filter(f => f.id !== selectedProduct.value.id);
        isFavorite.value = false;
        Swal.fire({ title: 'Eliminado de favoritos', icon: 'info', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } else {
        favorites.push({ id: selectedProduct.value.id, name: selectedProduct.value.name, img: selectedProduct.value.img, price: selectedProduct.value.price, place: 'Starbucks' });
        isFavorite.value = true;
        Swal.fire({ title: 'Añadido a favoritos', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }
    localStorage.setItem('foodrush_favorites', JSON.stringify(favorites));
};

// ── Fetch Real Data ──
const fetchProducts = async () => {
    try {
        isLoading.value = true;
        const franchisesRes = await api.getFranchises();
        let tenantId = 1;
        if (franchisesRes.success !== false) {
            const data = franchisesRes.data || franchisesRes;
            const starbucks = (Array.isArray(data) ? data : []).find(f => f.nombre === 'Starbucks' || f.nombre === 'Starbucks Coffee');
            if (starbucks) tenantId = starbucks.id;
        }

        const response = await api.getProducts({ limit: 100 }, { 'X-Tenant-ID': tenantId });
        if (response.success !== false) {
            const data = response.data || response;
            products.value = (Array.isArray(data) ? data : []).map(p => {
                const parts = p.descripcion ? p.descripcion.split(' - ') : ['General', ''];
                const type = parts[0] || 'General';
                const isCaffeinated = p.descripcion ? p.descripcion.includes('Con Cafeína') : false;
                return {
                    id: p.id,
                    name: p.nombre,
                    category: p.category || p.categoria || 'Bebidas',
                    type: type,
                    price: parseFloat(p.precio),
                    caffeinated: isCaffeinated,
                    img: p.img || `https://globalassets.starbucks.com/assets/f12bc8af498d45ed92c5d6f1dac64062.jpg`,
                    description: p.descripcion
                };
            });
        }
    } catch (e) {
        console.error("Error fetching products", e);
        // Fallback to hardcoded products
        products.value = getDefaultProducts();
    } finally {
        isLoading.value = false;
    }
};

const getDefaultProducts = () => [
    { id: 1, name: "Iced Black Tea", category: "Bebidas", type: "Black Tea", price: 500, caffeinated: true, img: "https://globalassets.starbucks.com/assets/f12bc8af498d45ed92c5d6f1dac64062.jpg", description: "Té negro premium mezclado con hielo. Refrescante y audaz." },
    { id: 2, name: "Hot Chai Tea", category: "Bebidas", type: "Black Tea", price: 100, caffeinated: true, img: "https://globalassets.starbucks.com/assets/2d52f16a22fb40ff898be1815ecc685e.jpg", description: "Té negro infusionado con canela, clavo y otras especias calientes." },
    { id: 3, name: "Cold Brew", category: "Bebidas", type: "Coffee", price: 350, caffeinated: true, img: "https://globalassets.starbucks.com/assets/f6979e7ea81944cb89d7b42c4c78c3b9.jpg", description: "Café preparado lentamente en agua fría durante 20 horas." },
    { id: 4, name: "Caffè Americano", category: "Bebidas", type: "Coffee", price: 280, caffeinated: true, img: "https://globalassets.starbucks.com/assets/05e26719b3314643b090623ce1b08865.jpg", description: "Espresso con agua caliente. Rico y con cuerpo." },
    { id: 5, name: "Bottled Matcha", category: "Bebidas", type: "Green Tea", price: 320, caffeinated: true, img: "https://globalassets.starbucks.com/assets/957e8416688f4d92a00c61830605e55e.jpg", description: "Té verde matcha suave y cremoso." },
    { id: 6, name: "Mocha Frappuccino", category: "Bebidas", type: "Coffee", price: 380, caffeinated: true, img: "https://globalassets.starbucks.com/assets/5c515339667943ce84dc56effdf5fc1b.jpg", description: "Café, salsa de chocolate y hielo, mezclados y coronados con crema batida." },
    { id: 7, name: "Hot Chocolate", category: "Bebidas", type: "Chocolate", price: 290, caffeinated: false, img: "https://globalassets.starbucks.com/assets/f4b14d8eb00c406ba266596a2d98c253.jpg", description: "Leche al vapor con jarabe de chocolate sabor moka y vainilla." },
    { id: 8, name: "Pink Drink", category: "Bebidas", type: "Refresher", price: 350, caffeinated: true, img: "https://globalassets.starbucks.com/assets/05a63c09e3a647d6be209b5550c6d67b.jpg", description: "Refresher de Fresa Acai con leche de coco." },
    { id: 9, name: "Croissant de Jamón", category: "Comida", type: "Bakery", price: 250, caffeinated: false, img: "https://globalassets.starbucks.com/assets/2362e79aa0ab4c37a930956c67ab557a.jpg", description: "Mantequilloso croissant relleno de jamón y queso suizo." },
    { id: 10, name: "Cake Pop", category: "Comida", type: "Bakery", price: 150, caffeinated: false, img: "https://globalassets.starbucks.com/assets/2c9fa55bd9624513a010461b58536968.jpg", description: "Pastel de vainilla en un palito, bañado en glaseado rosa." },
    { id: 11, name: "Sandwich de Pollo", category: "Comida", type: "Lunch", price: 380, caffeinated: false, img: "https://globalassets.starbucks.com/assets/02ea801e3aca42bcad2f6ef33c944899.jpg", description: "Pollo asado, tocino y salsa ranch en pan brioche." },
    { id: 12, name: "Café Veracruz", category: "Café en Casa", type: "Whole Bean", price: 650, caffeinated: true, img: "https://globalassets.starbucks.com/assets/652b1450c265431693e506d8601c2576.jpg", description: "Granos de café de origen único, tostado medio." }
];

// ── Filtering ──
const filteredProducts = computed(() => {
    let result = products.value.filter(p => p.category === currentCategory.value);

    // Search
    if (searchTerm.value) {
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const term = normalize(searchTerm.value);
        result = result.filter(p => normalize(p.name).includes(term));
    }

    // Type filter
    if (activeTypeFilters.value.length > 0) {
        result = result.filter(p => activeTypeFilters.value.includes(p.type));
    }

    // Caffeine filter
    if (currentCategory.value === 'Bebidas' && activeCaffeineFilter.value) {
        if (activeCaffeineFilter.value === 'yes') result = result.filter(p => p.caffeinated === true);
        else if (activeCaffeineFilter.value === 'no') result = result.filter(p => p.caffeinated === false);
    }

    return result;
});

// Category Logic
const setCategory = (cat) => {
    currentCategory.value = cat;
    activeTypeFilters.value = [];
    activeCaffeineFilter.value = null;
};

// ── Detail View Logic ──
const openProductDetail = (product) => {
    selectedProduct.value = product;
    currentQty.value = 1;
    matchaQty.value = 4;
    syrupQty.value = 4;
    iceOption.value = 'Normal';
    const base = product.price;
    sizePrices.value = { Alto: Math.round(base * 0.85), Grande: base, Venti: Math.round(base * 1.25) };
    currentSize.value = 'Grande';
    checkFavorite();
    window.scrollTo(0, 0);
};

const closeDetail = () => {
    selectedProduct.value = null;
};

const changeQty = (amount) => {
    if (currentQty.value + amount >= 1) currentQty.value += amount;
};

const selectSize = (size) => {
    currentSize.value = size;
};

const updateIngredient = (type, amount) => {
    if (type === 'matcha') {
        const newVal = matchaQty.value + amount;
        if (newVal >= 0) matchaQty.value = newVal;
    }
    if (type === 'syrup') {
        const newVal = syrupQty.value + amount;
        if (newVal >= 0) syrupQty.value = newVal;
    }
};

const currentUnitPrice = computed(() => {
    if (!selectedProduct.value) return 0;
    if (selectedProduct.value.category === 'Bebidas') {
        return sizePrices.value[currentSize.value] || selectedProduct.value.price;
    }
    return selectedProduct.value.price;
});

const totalPrice = computed(() => {
    return currentUnitPrice.value * currentQty.value;
});

// ── Cart Logic ──
const updateCartBadge = () => {
    const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    cartCount.value = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
};

const createCartItem = () => {
    return {
        id: selectedProduct.value.id,
        name: selectedProduct.value.name,
        price: currentUnitPrice.value,
        img: selectedProduct.value.img,
        qty: currentQty.value,
        details: selectedProduct.value.category === 'Bebidas'
            ? `Vaso ${currentSize.value}, Hielo: ${iceOption.value}, Matcha: ${matchaQty.value}, Syrup: ${syrupQty.value}`
            : 'Normal'
    };
};

const addToCart = () => {
    if (!selectedProduct.value) return;
    const cartItem = createCartItem();
    let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    const existing = cart.find(i => i.id === cartItem.id && i.details === cartItem.details);
    if (existing) {
        existing.qty += currentQty.value;
    } else {
        cart.push(cartItem);
    }
    localStorage.setItem('foodrush_cart', JSON.stringify(cart));
    updateCartBadge();
    Swal.fire({
        icon: 'success', title: '¡Añadido!',
        showConfirmButton: false, timer: 1000,
        background: '#00704A', color: '#fff',
        toast: true, position: 'top-end'
    });
    closeDetail();
};

const goBackHome = () => {
    router.push('/');
};

onMounted(() => {
    updateCartBadge();
    const storedName = localStorage.getItem('user_name');
    if (storedName) userName.value = storedName;
    fetchProducts();
    startSlideShow();
});

onBeforeUnmount(() => {
    clearInterval(slideInterval);
});
</script>

<template>
<div class="font-sans antialiased bg-[#f9f9f9] min-h-screen text-slate-800">
    <!-- HEADER -->
    <header class="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div class="max-w-screen-xl flex items-center justify-between mx-auto px-4 py-3 md:py-4">
            <div class="flex items-center gap-4">
                <button @click="goBackHome" aria-label="Volver al inicio" class="text-slate-800 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#00704A]">
                    <i class="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div class="flex items-center space-x-2 md:space-x-3 cursor-default">
                    <i class="fas fa-bolt text-2xl md:text-3xl text-[#BD0A0A] animate-pulse transform"></i>
                    <span class="text-xl md:text-2xl font-extrabold whitespace-nowrap text-slate-900 tracking-tight">FOODRUSH</span>
                </div>
            </div>

            <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-[#00704A] focus-within:ring-1 focus-within:ring-[#00704A] transition-all">
                <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                <input v-model="searchTerm" type="text" placeholder="Buscar tu café favorito..." class="outline-none w-full text-sm bg-transparent">
            </div>

            <div class="flex items-center gap-4 md:gap-6">
                <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>
                <button @click="router.push('/cart')" class="hover:text-[#00704A] transition relative text-xl text-gray-600 p-1" aria-label="Ver carrito">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-[#00704A] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{{ cartCount }}</span>
                </button>

                <button v-if="userName" @click="router.push('/profile')" class="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1 transition">
                    <div class="w-8 h-8 rounded-full bg-[#00704A] text-white flex items-center justify-center font-bold text-sm">{{ userName.charAt(0).toUpperCase() }}</div>
                    <span class="text-sm font-medium text-slate-700 hidden lg:block">{{ userName }}</span>
                </button>
                <button v-else @click="router.push('/login')" class="text-sm font-bold text-slate-600 hover:text-[#00704A] transition">Iniciar Sesión</button>

            </div>
        </div>
    </header>

    <!-- ═══ CATALOG VIEW ═══ -->
    <div v-if="!selectedProduct" class="fade-in pb-10">
        <!-- Hero Banner with Carousel -->
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-white border-b border-gray-100">
            <!-- Starbucks Logo Side -->
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-white z-10 order-2 md:order-1">
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png"
                     alt="Starbucks Logo" class="h-32 md:h-64 w-auto object-contain drop-shadow-lg hover:scale-105 transition duration-500">
            </div>
            <!-- Slider Side -->
            <div class="w-full md:w-3/5 relative bg-gray-900 h-64 md:h-auto order-1 md:order-2">
                <div class="slider-container">
                    <div v-for="(slide, idx) in slides" :key="idx"
                         class="slide" :class="{ active: currentSlide === idx }">
                        <img :src="slide" alt="Starbucks Slide" class="w-full h-full object-cover object-center">
                    </div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden"></div>
                <div class="slider-dots">
                    <div v-for="(_, idx) in slides" :key="idx"
                         class="dot" :class="{ active: currentSlide === idx }"
                         @click="goToSlide(idx)">
                    </div>
                </div>
            </div>
        </section>

        <!-- Category Tabs -->
        <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar">
                <button @click="setCategory('Bebidas')"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === 'Bebidas' ? 'active' : 'border-gray-200 text-gray-600']">
                    Bebidas
                </button>
                <button @click="setCategory('Comida')"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === 'Comida' ? 'active' : 'border-gray-200 text-gray-600']">
                    Comida
                </button>
                <button @click="setCategory('Café en Casa')"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === 'Café en Casa' ? 'active' : 'border-gray-200 text-gray-600']">
                    Café en Grano
                </button>
            </div>
        </div>

        <!-- Main Content: Sidebar + Grid -->
        <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <!-- Sidebar Filters -->
            <aside class="md:col-span-1 select-none bg-white p-4 md:p-5 rounded-xl border border-gray-100 h-fit md:sticky md:top-36 shadow-sm">
                <h3 class="font-bold text-lg md:text-xl text-slate-800 mb-4 font-heading flex items-center justify-between">
                    Filtros <i class="fa-solid fa-filter text-[#00704A] text-sm md:hidden"></i>
                </h3>

                <!-- Type Filter -->
                <details open class="group mb-4">
                    <summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-[#00704A] transition text-sm uppercase tracking-wide">
                        {{ sidebarConfig.typeLabel }} <i class="fa-solid fa-chevron-down text-xs transition-transform group-open:rotate-180"></i>
                    </summary>
                    <div class="space-y-1">
                        <p v-for="t in sidebarConfig.types" :key="t.key"
                           @click="toggleTypeFilter(t.key)"
                           :class="['side-filter-btn', { active: activeTypeFilters.includes(t.key) }]">
                            {{ t.label }}
                        </p>
                    </div>
                </details>

                <!-- Caffeine Filter (Drinks only) -->
                <details v-if="sidebarConfig.showCaffeine" open class="group mb-4 border-t border-gray-100 pt-4">
                    <summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-[#00704A] transition text-sm uppercase tracking-wide">
                        Cafeína <i class="fa-solid fa-chevron-down text-xs transition-transform group-open:rotate-180"></i>
                    </summary>
                    <div class="space-y-1">
                        <p @click="toggleCaffeineFilter('yes')"
                           :class="['side-filter-btn', { active: activeCaffeineFilter === 'yes' }]">
                            Con Cafeína
                        </p>
                        <p @click="toggleCaffeineFilter('no')"
                           :class="['side-filter-btn', { active: activeCaffeineFilter === 'no' }]">
                            Descafeinado
                        </p>
                    </div>
                </details>

                <!-- Reset Button -->
                <div class="pt-6 mt-4 border-t border-gray-100">
                    <button @click="resetFilters" class="w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2">
                        <i class="fa-solid fa-rotate-left"></i> Limpiar Filtros
                    </button>
                </div>
            </aside>

            <!-- Product Grid -->
            <main class="md:col-span-3">
                <div v-if="isLoading" class="text-center py-20">
                    <div class="inline-block w-8 h-8 border-4 border-[#00704A] border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-gray-400 mt-4 font-medium">Buscando el mejor café...</p>
                </div>
                <div v-else-if="filteredProducts.length === 0" class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center">
                    <i class="fa-solid fa-mug-hot text-4xl mb-4 text-gray-300"></i>
                    No se encontraron productos.
                </div>
                <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    <div v-for="product in filteredProducts" :key="product.id"
                         @click="openProductDetail(product)"
                         class="fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-[#00704A] transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden">

                        <div class="h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                            <div class="absolute inset-0 bg-[#D4E9E2]/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                            <img :src="product.img" :alt="product.name"
                                 class="w-full h-full object-contain group-hover:scale-105 transition duration-500 drop-shadow-md z-10" loading="lazy">
                        </div>

                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-slate-800 mb-1 group-hover:text-[#00704A] transition line-clamp-1 font-heading">{{ product.name }}</h3>
                            <p class="text-xs text-gray-400 mb-3 md:mb-4">{{ product.type }}</p>
                            <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl group-hover:bg-[#D4E9E2]/30 transition border border-transparent group-hover:border-[#D4E9E2]">
                                <span class="text-slate-800 font-bold px-2 text-lg">${{ product.price }}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-[#00704A] shadow-sm hover:bg-[#00704A] hover:text-white transition flex items-center justify-center border border-gray-100">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- ═══ DETAIL VIEW ═══ -->
    <div v-else class="fade-in container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <button @click="closeDetail" class="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-[#00704A] transition group">
            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 group-hover:bg-[#00704A] group-hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
            </div>
            Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <!-- Left: Image + Size Selector -->
            <div class="flex flex-col gap-6 md:gap-8">
                <div class="relative bg-[#D4E9E2]/30 rounded-3xl flex items-center justify-center p-6 h-72 md:h-[500px] border border-[#D4E9E2] overflow-hidden">
                    <img :src="selectedProduct.img" :alt="selectedProduct.name"
                         class="h-full w-auto object-contain drop-shadow-xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <!-- Size Selector (Drinks only) -->
                <div v-if="selectedProduct.category === 'Bebidas'" class="w-full">
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading border-b border-gray-100 pb-2">Elige el tamaño</h3>
                    <div class="flex gap-3 md:gap-4 justify-center md:justify-start">
                        <div v-for="size in ['Alto', 'Grande', 'Venti']" :key="size"
                             @click="selectSize(size)"
                             class="flex flex-col items-center gap-2 cursor-pointer group">
                            <div :class="['size-card', { selected: currentSize === size }]">
                                <i :class="['fa-solid fa-glass-water', size === 'Alto' ? 'text-2xl' : size === 'Grande' ? 'text-3xl' : 'text-4xl']"></i>
                            </div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">{{ size }}</span>
                                <span class="block text-xs text-gray-500 font-medium">${{ sizePrices[size] }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Info + Customization -->
            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-xs font-bold text-[#00704A] mb-2 tracking-widest uppercase">{{ selectedProduct.category === 'Bebidas' ? 'Bebida' : 'Comida' }}</h2>
                    <h1 class="text-3xl md:text-4xl font-bold text-[#1e3932] mb-3 font-heading leading-tight">{{ selectedProduct.name }}</h1>

                    <div class="flex items-center mb-4 text-sm">
                        <div class="flex text-[#cba258] gap-1 text-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-2 text-xs font-medium">(260 Reviews)</span>

                        <button @click="toggleFavorite" class="ml-auto w-10 h-10 rounded-full flex items-center justify-center transition"
                                :class="isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:text-red-400'">
                            <i :class="isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
                        </button>
                    </div>

                    <p class="text-gray-600 text-sm md:text-base leading-relaxed">{{ selectedProduct.description || 'Disfruta del sabor único de Starbucks. Preparado al momento con ingredientes de alta calidad.' }}</p>
                </div>

                <!-- Price + Qty Bar -->
                <div class="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 font-medium text-xs md:text-sm uppercase tracking-wide">Precio</span>
                        <span class="text-2xl font-bold text-[#1e3932]">${{ currentUnitPrice }}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button @click="changeQty(-1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 font-bold transition">-</button>
                            <span class="w-8 text-center font-bold text-lg text-slate-800">{{ currentQty }}</span>
                            <button @click="changeQty(1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 font-bold transition">+</button>
                        </div>
                    </div>
                </div>

                <!-- Customization (Drinks only) -->
                <div v-if="selectedProduct.category === 'Bebidas'" class="flex-grow">
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-[#00704A]"></i> Personaliza tu pedido
                    </h3>

                    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <!-- Ice Option -->
                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><i class="fa-regular fa-snowflake"></i></div>
                                <span class="text-sm font-bold text-slate-700">Hielo</span>
                            </div>
                            <div class="ice-opt-container">
                                <button v-for="opt in ['Normal', 'Extra', 'Sin']" :key="opt"
                                        @click="iceOption = opt"
                                        :class="['ice-opt', { active: iceOption === opt }]">{{ opt }}</button>
                            </div>
                        </div>

                        <!-- Matcha -->
                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"><i class="fa-solid fa-leaf"></i></div>
                                <span class="text-sm font-bold text-slate-700">Matcha</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <button @click="updateIngredient('matcha', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button>
                                <span class="font-bold text-slate-700 w-4 text-center text-sm">{{ matchaQty }}</span>
                                <button @click="updateIngredient('matcha', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button>
                            </div>
                        </div>

                        <!-- Syrup -->
                        <div class="flex justify-between items-center p-3 md:p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><i class="fa-solid fa-bottle-droplet"></i></div>
                                <span class="text-sm font-bold text-slate-700">Jarabe</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <button @click="updateIngredient('syrup', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button>
                                <span class="font-bold text-slate-700 w-4 text-center text-sm">{{ syrupQty }}</span>
                                <button @click="updateIngredient('syrup', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add to Cart -->
                <div class="mt-8 bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-500 font-medium">Total estimado</span>
                        <span class="text-3xl font-bold text-[#1e3932]">${{ totalPrice }}</span>
                    </div>
                    <button @click="addToCart" class="w-full bg-[#00704A] hover:bg-[#005c3d] text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-green-900/20 text-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                        <span>Añadir al Pedido</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-2">
                    <span class="text-orange-500 font-bold text-xl italic">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-red-600 transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-red-600 transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-red-600 transition"><i class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
            <div class="flex flex-col md:flex-row gap-8 md:gap-16 text-sm text-left md:text-right w-full md:w-auto">
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/30 pb-2 md:border-none inline-block w-full md:w-auto">Ayuda</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="#" class="hover:text-white hover:underline">Preguntas Frecuentes</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Soporte</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/30 pb-2 md:border-none inline-block w-full md:w-auto">Empresa</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="#" class="hover:text-white hover:underline">Sobre Nosotros</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Blog</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Afíliate</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="border-t border-white/20 text-center py-4 text-xs text-white/60">
            &copy; 2025 FoodRush Inc. Todos los derechos reservados.
        </div>
    </footer>
</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap');

body { font-family: 'Inter', sans-serif; }
.font-heading { font-family: 'Sora', sans-serif; }

/* ── Animations ── */
.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ── Slider ── */
.slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
.slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
.slide.active { opacity: 1; }
.slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
.slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
.dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
.dot.active { background-color: white; transform: scale(1.2); }

/* ── Sidebar Filters ── */
.side-filter-btn {
    cursor: pointer; padding: 8px 12px; color: #4b5563;
    border-left: 4px solid transparent; transition: all 0.2s;
    font-size: 0.95rem; display: flex; align-items: center;
    border-radius: 0 4px 4px 0;
}
.side-filter-btn:hover { color: #00704A; background-color: #f2f2f2; }
.side-filter-btn.active { color: #00704A; font-weight: 700; border-left-color: #00704A; background-color: #D4E9E2; }

/* ── Category Tabs ── */
.filter-tab { transition: all 0.3s ease; }
.filter-tab.active { background-color: #00704A; color: white; border-color: #00704A; box-shadow: 0 4px 6px -1px rgba(0, 112, 74, 0.3); }
.filter-tab:not(.active):hover { border-color: #00704A; color: #00704A; background-color: #D4E9E2; }

/* ── Size Cards ── */
.size-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 2px solid #e5e7eb; border-radius: 12px;
    width: 80px; height: 90px;
    cursor: pointer; transition: all 0.2s;
    position: relative; background-color: white;
}
@media (min-width: 768px) { .size-card { width: 90px; height: 100px; } }
.size-card:hover { border-color: #00704A; transform: translateY(-2px); }
.size-card.selected { border-color: #00704A; background-color: #D4E9E2; box-shadow: 0 4px 12px rgba(0, 112, 74, 0.1); }
.size-card i { color: #d1d5db; transition: color 0.2s; }
.size-card.selected i { color: #00704A; }

/* ── Counter Buttons ── */
.counter-btn {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1px solid #e5e7eb; color: #00704A;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; background: white;
}
.counter-btn:hover { border-color: #00704A; background-color: #D4E9E2; }

/* ── Ice Options ── */
.ice-opt-container { background-color: #f3f4f6; padding: 4px; border-radius: 10px; display: flex; gap: 4px; }
.ice-opt {
    padding: 6px 12px; font-size: 0.75rem; font-weight: 600;
    color: #6b7280; border-radius: 8px; transition: all 0.2s ease;
    background-color: transparent; cursor: pointer; flex: 1; border: none;
}
.ice-opt:hover { background-color: #e5e7eb; color: #374151; }
.ice-opt.active { background-color: white; color: #00704A; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-weight: 700; }

/* ── Scrollbar Hide ── */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ── Details Toggle ── */
details > summary { list-style: none; outline: none; }
details > summary::-webkit-details-marker { display: none; }
</style>
