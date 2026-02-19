<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';

const router = useRouter();

// Assets & Data
const bgStarbucks = '#00704A';
const textStarbucks = '#00704A';

const products = ref([]);
const isLoading = ref(true);

// State
const currentCategory = ref('Bebidas');
const searchTerm = ref('');
const caffeineFilter = ref({ caffeinated: false, decaf: false });
const cartCount = ref(0);
const isFavorite = ref(false);

const checkFavorite = () => {
    if (!selectedProduct.value) return;
    const favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];
    isFavorite.value = favorites.some(f => f.id === selectedProduct.value.id);
};

const toggleFavorite = () => {
    if (!selectedProduct.value) return;
    
    let favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];
    
    if (isFavorite.value) {
        // Remove
        favorites = favorites.filter(f => f.id !== selectedProduct.value.id);
        isFavorite.value = false;
        Swal.fire({ 
            title: 'Eliminado de favoritos', 
            icon: 'info', 
            toast: true, 
            position: 'top-end', 
            timer: 2000, 
            showConfirmButton: false 
        });
    } else {
        // Add
        favorites.push({
            id: selectedProduct.value.id,
            name: selectedProduct.value.name,
            img: selectedProduct.value.img,
            price: selectedProduct.value.price,
            place: 'Starbucks' // Franchise name
        });
        isFavorite.value = true;
        Swal.fire({ 
            title: 'Añadido a favoritos', 
            icon: 'success', 
            toast: true, 
            position: 'top-end', 
            timer: 2000, 
            showConfirmButton: false 
        });
    }
    
    localStorage.setItem('foodrush_favorites', JSON.stringify(favorites));
};

// Detail View State
const selectedProduct = ref(null);
const currentQty = ref(1);
const matchaQty = ref(4);
const syrupQty = ref(4);
const selectedSize = ref('Grande');

// Fetch Real Data
const fetchProducts = async () => {
    try {
        isLoading.value = true;
        
        // 1. Get correct tenant ID for Starbucks
        const franchisesRes = await api.getFranchises();
        let tenantId = 1; // Default fallback
        
        if (franchisesRes.success) {
            const starbucks = franchisesRes.data.find(f => f.nombre === 'Starbucks');
            if (starbucks) {
                tenantId = starbucks.id;
                console.log("Using Tenant ID:", tenantId);
            }
        }

        // 2. Fetch Products with explicit Tenant ID header
        const response = await api.getProducts({ limit: 100 }, { 'X-Tenant-ID': tenantId });
        
        if (response.success) {
            // Map Backend Data to Frontend Schema
            products.value = response.data.map(p => {
                // Parse Description for metadata (Seed format: "Type - Con/Sin Cafeína")
                const parts = p.descripcion ? p.descripcion.split(' - ') : ['General', ''];
                const type = parts[0] || 'General';
                const isCaffeinated = p.descripcion ? p.descripcion.includes('Con Cafeína') : false;

                return {
                    id: p.id, // REAL DB ID here
                    name: p.nombre,
                    category: p.category, // Mapped by controller
                    type: type,
                    price: parseFloat(p.precio),
                    caffeinated: isCaffeinated,
                    img: p.img,
                    description: p.descripcion
                };
            });
        }
    } catch (e) {
        console.error("Error fetching products", e);
        Swal.fire('Error Detallado', e.message || 'Error desconocido', 'error');
    } finally {
        isLoading.value = false;
    }
};

// Filtering
const filteredProducts = computed(() => {
    let result = products.value.filter(p => p.category === currentCategory.value);

    // Search
    if (searchTerm.value) {
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const term = normalize(searchTerm.value);
        result = result.filter(p => normalize(p.name).includes(term));
    }

    // Caffeine Logic
    if (caffeineFilter.value.caffeinated && !caffeineFilter.value.decaf) {
        result = result.filter(p => p.caffeinated === true);
    } else if (!caffeineFilter.value.caffeinated && caffeineFilter.value.decaf) {
        result = result.filter(p => p.caffeinated === false);
    }

    return result;
});

// Category Logic
const setCategory = (cat) => {
    currentCategory.value = cat;
};

// Detail View Logic
const openProductDetail = (product) => {
    selectedProduct.value = product;
    currentQty.value = 1;
    matchaQty.value = 4;
    matchaQty.value = 4;
    syrupQty.value = 4;
    checkFavorite();
    window.scrollTo(0,0);
};

const closeDetail = () => {
    selectedProduct.value = null;
};

const changeQty = (amount) => {
    if (currentQty.value + amount >= 1) currentQty.value += amount;
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

const totalPrice = computed(() => {
    return selectedProduct.value ? selectedProduct.value.price * currentQty.value : 0;
});

// Cart Logic
const updateCartBadge = () => {
    const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    cartCount.value = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
};

// Helper to create item object
const createCartItem = () => {
    return {
        id: selectedProduct.value.id,
        name: selectedProduct.value.name,
        price: selectedProduct.value.price,
        img: selectedProduct.value.img,
        qty: currentQty.value,
        details: selectedProduct.value.category === 'Bebidas' 
            ? `Vaso ${selectedSize.value}, Matcha: ${matchaQty.value}, Syrup: ${syrupQty.value}`
            : ''
    };
};

const addToCart = () => {
    if (!selectedProduct.value) return;

    const cartItem = createCartItem();
    let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    cart.push(cartItem);
    localStorage.setItem('foodrush_cart', JSON.stringify(cart));
    
    updateCartBadge();

    Swal.fire({
        icon: 'success',
        title: '¡Añadido!',
        text: `Has añadido ${selectedProduct.value.name} al carrito.`,
        showCancelButton: true,
        confirmButtonColor: '#00704A',
        cancelButtonColor: '#333',
        confirmButtonText: 'Ir al Carrito',
        cancelButtonText: 'Seguir comprando'
    }).then((result) => {
        if (result.isConfirmed) {
            router.push('/cart');
        } else {
            closeDetail();
        }
    });
};

const buyNow = () => {
    if (!selectedProduct.value) return;
    
    // Logic: Append to cart and go to checkout? Or replace cart? 
    // Standard "Buy Now" usually adds to cart and goes to checkout.
    // If I replace cart, I lose previous items. Better to add.
    
    const cartItem = createCartItem();
    let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    cart.push(cartItem);
    localStorage.setItem('foodrush_cart', JSON.stringify(cart));
    
    updateCartBadge();
    router.push('/checkout');
};

// User State form LocalStorage
const userName = ref('');

const goBackHome = () => {
    router.push('/');
};

onMounted(() => {
    updateCartBadge();
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
        userName.value = storedName;
    }
    fetchProducts();
});
</script>

<template>
<div class="font-poppins bg-white min-h-screen">
    <!-- HEADER -->
    <header class="bg-white border-b sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <div @click="goBackHome" class="flex items-center gap-1 group cursor-pointer">
                <div class="flex flex-col items-center leading-none">
                    <span class="text-orange-500 font-bold text-lg italic tracking-tighter">Food</span>
                    <span class="text-slate-800 font-bold text-lg italic tracking-tighter -mt-1">Rush</span>
                </div>
                <span class="text-gray-400 mx-2">|</span>
                <span class="text-[#00704A] font-bold text-xl tracking-tight">Starbucks</span>
            </div>
            <div class="flex items-center gap-6">
                <!-- Search -->
                <div class="hidden md:flex items-center border rounded-full px-4 py-1.5 w-64 shadow-sm focus-within:border-[#00704A]">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                    <input v-model="searchTerm" type="text" placeholder="Buscar producto" class="outline-none w-full text-sm">
                </div>
                <!-- Cart Icon -->
                <button @click="router.push('/cart')" class="hover:text-[#00704A] transition relative" aria-label="Ver carrito">
                    <i class="fa-solid fa-cart-shopping text-xl" aria-hidden="true"></i>
                    <span v-if="cartCount > 0" class="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center" aria-live="polite">{{ cartCount }}</span>
                </button>
                
                <!-- User Profile -->
                <button v-if="userName" @click="router.push('/profile')" class="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1 transition">
                     <div class="w-8 h-8 rounded-full bg-[#00704A] text-white flex items-center justify-center font-bold text-sm">
                        {{ userName.charAt(0).toUpperCase() }}
                     </div>
                     <span class="text-sm font-medium text-slate-700 hidden lg:block">{{ userName }}</span>
                </button>
                <button v-else @click="router.push('/login')" class="text-sm font-bold text-slate-600 hover:text-[#00704A] transition">
                    Iniciar Sesión
                </button>
            </div>
        </div>
    </header>

    <!-- CATALOG VIEW -->
    <div v-if="!selectedProduct" class="fade-in">
        <!-- Banner -->
        <section class="flex flex-col md:flex-row h-[300px] w-full bg-[#1e3932]">
             <div class="w-full h-full relative overflow-hidden flex items-center justify-center">
                 <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1600&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-80">
                 <div class="relative z-10 text-center">
                    <h1 class="text-white text-5xl font-bold mb-2 drop-shadow-lg">Starbucks</h1>
                    <p class="text-white text-lg font-light tracking-wider">Café y Magia</p>
                 </div>
            </div>
        </section>

        <!-- Filters Bar -->
        <div class="bg-white border-b sticky top-[73px] z-40 shadow-sm">
            <div class="container mx-auto px-6 py-4 flex overflow-x-auto gap-4 scrollbar-hide" role="tablist">
                <button @click="setCategory('Bebidas')" role="tab" :aria-selected="currentCategory === 'Bebidas'" :class="['border px-6 py-2 rounded-full font-semibold transition whitespace-nowrap text-sm focus:ring-2 focus:ring-[#00704A] outline-none', currentCategory === 'Bebidas' ? 'bg-[#00704A] text-white border-[#00704A] shadow-md' : 'border-gray-200 text-gray-600 hover:border-[#00704A] hover:text-[#00704A]']">Bebidas</button>
                <button @click="setCategory('Comida')" role="tab" :aria-selected="currentCategory === 'Comida'" :class="['border px-6 py-2 rounded-full font-semibold transition whitespace-nowrap text-sm focus:ring-2 focus:ring-[#00704A] outline-none', currentCategory === 'Comida' ? 'bg-[#00704A] text-white border-[#00704A] shadow-md' : 'border-gray-200 text-gray-600 hover:border-[#00704A] hover:text-[#00704A]']">Comida</button>
                <button @click="setCategory('Café en Casa')" role="tab" :aria-selected="currentCategory === 'Café en Casa'" :class="['border px-6 py-2 rounded-full font-semibold transition whitespace-nowrap text-sm focus:ring-2 focus:ring-[#00704A] outline-none', currentCategory === 'Café en Casa' ? 'bg-[#00704A] text-white border-[#00704A] shadow-md' : 'border-gray-200 text-gray-600 hover:border-[#00704A] hover:text-[#00704A]']">Café en Casa</button>
            </div>
        </div>

        <div class="container mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Sidebar -->
            <aside class="md:col-span-1 space-y-6 select-none">
                <div class="border-b border-gray-200 pb-4">
                    <h3 class="font-bold text-gray-800 mb-3">Preferencia de Cafeína</h3>
                    <div class="space-y-2">
                        <label class="flex items-center gap-2 cursor-pointer hover:text-[#00704A]">
                            <input type="checkbox" v-model="caffeineFilter.caffeinated" class="accent-[#00704A] w-4 h-4"> 
                            <span class="text-sm text-gray-600">Cafeinado</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer hover:text-[#00704A]">
                            <input type="checkbox" v-model="caffeineFilter.decaf" class="accent-[#00704A] w-4 h-4"> 
                            <span class="text-sm text-gray-600">Descafeinado</span>
                        </label>
                    </div>
                </div>
            </aside>

            <!-- Grid -->
            <main class="md:col-span-3">
                <div v-if="isLoading" class="text-center py-20">
                    <div class="inline-block w-8 h-8 border-4 border-[#00704A] border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-gray-400 mt-4 font-medium">Buscando el mejor café...</p>
                </div>
                <div v-else-if="filteredProducts.length === 0" class="text-center py-10 text-gray-400">
                    No se encontraron productos.
                </div>
                <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div v-for="product in filteredProducts" :key="product.id" 
                         @click="openProductDetail(product)"
                         class="group bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-between h-[300px] hover:shadow-xl hover:border-[#00704A] transition-all duration-300 cursor-pointer relative overflow-hidden">
                        
                        <div class="h-40 w-full flex items-center justify-center mb-2">
                            <img :src="product.img" :alt="`Foto de ${product.name}`" class="h-full object-contain group-hover:scale-110 transition duration-500 drop-shadow-sm" loading="lazy">
                        </div>
                        
                        <div class="text-center w-full relative z-10">
                            <h3 class="font-medium text-slate-800 text-sm mb-2 group-hover:text-[#00704A] group-hover:font-bold line-clamp-2">{{ product.name }}</h3>
                            <div class="flex justify-between items-center w-full px-1">
                                <span class="bg-green-50 text-[#00704A] font-bold px-2 py-1 rounded text-xs">${{ product.price }}</span>
                                <button class="w-8 h-8 rounded-full bg-[#00704A] text-white opacity-0 group-hover:opacity-100 transition shadow-md flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 text-lg" :aria-label="`Ver detalle de ${product.name}`">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- DETAIL VIEW -->
    <div v-else class="fade-in container mx-auto px-6 py-8">
        <button @click="closeDetail" class="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-[#00704A] transition w-fit">
            <i class="fa-solid fa-chevron-left mr-2"></i> Volver al Menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 animate-slide-up">
            <!-- Left: Image -->
            <div>
                <div class="bg-[#f2f0eb] rounded-full aspect-square flex items-center justify-center p-8 mb-8 relative overflow-hidden">
                     <div class="absolute inset-0 bg-[#00704A] opacity-5 rounded-full blur-3xl"></div>
                    <img :src="selectedProduct.img" :alt="selectedProduct.name" class="max-h-[80%] max-w-[80%] object-contain drop-shadow-2xl hover:scale-105 transition duration-700">
                </div>
            </div>

            <!-- Right: Info -->
            <div class="flex flex-col">
                <h1 class="text-4xl font-bold text-slate-900 mb-2">{{ selectedProduct.name }}</h1>
                <div class="flex items-center mb-6 text-sm">
                    <span class="bg-[#00704A] text-white px-2 py-0.5 rounded text-xs font-bold mr-2">{{ selectedProduct.category }}</span>
                    <div class="flex text-yellow-400 text-xs">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <span class="text-gray-400 ml-2">(4.8)</span>
                    
                    <button @click="toggleFavorite" class="ml-auto w-10 h-10 rounded-full flex items-center justify-center transition" :class="isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:text-red-400'" :aria-label="isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'">
                        <i :class="isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" aria-hidden="true"></i>
                    </button>
                </div>

                <p class="text-gray-600 text-sm leading-relaxed mb-8 border-l-4 border-[#00704A] pl-4">
                    Disfruta del sabor único de Starbucks. Preparado al momento con ingredientes de alta calidad.
                </p>

                <!-- Customization (Only for Drinks logic simulation) -->
                <div v-if="selectedProduct.category === 'Bebidas'" class="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h3 class="font-bold text-lg text-gray-800 mb-4">Personalizar</h3>
                    
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm font-medium text-gray-600">Tamaño</span>
                        <div class="flex gap-2">
                             <button v-for="size in ['Alto', 'Grande', 'Venti']" :key="size" 
                                     @click="selectedSize = size"
                                     :class="['px-3 py-1 rounded text-xs font-bold border transition', selectedSize === size ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-500 border-gray-200']">
                                {{ size }}
                             </button>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">Matcha Scoops</span>
                        <div class="flex items-center gap-3">
                            <button @click="updateIngredient('matcha', -1)" class="w-6 h-6 rounded-full bg-gray-200 hover:bg-[#00704A] hover:text-white flex items-center justify-center text-xs transition" aria-label="Menos Matcha">-</button>
                            <span class="font-bold text-gray-700 w-4 text-center">{{ matchaQty }}</span>
                            <button @click="updateIngredient('matcha', 1)" class="w-6 h-6 rounded-full bg-gray-200 hover:bg-[#00704A] hover:text-white flex items-center justify-center text-xs transition" aria-label="Más Matcha">+</button>
                        </div>
                    </div>

                     <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">Bombas de Jarabe</span>
                        <div class="flex items-center gap-3">
                            <button @click="updateIngredient('syrup', -1)" class="w-6 h-6 rounded-full bg-gray-200 hover:bg-[#00704A] hover:text-white flex items-center justify-center text-xs transition" aria-label="Menos Jarabe">-</button>
                            <span class="font-bold text-gray-700 w-4 text-center">{{ syrupQty }}</span>
                            <button @click="updateIngredient('syrup', 1)" class="w-6 h-6 rounded-full bg-gray-200 hover:bg-[#00704A] hover:text-white flex items-center justify-center text-xs transition" aria-label="Más Jarabe">+</button>
                        </div>
                    </div>
                </div>

                <!-- Price and Add -->
                <div class="mt-auto border-t pt-6">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-4">
                            <span class="text-gray-500 font-medium">Cantidad</span>
                             <div class="flex items-center gap-3 border rounded-lg px-2 py-1">
                                <button @click="changeQty(-1)" class="text-gray-400 hover:text-[#00704A] px-2 font-bold text-lg" aria-label="Disminuir cantidad">-</button>
                                <span class="font-bold text-slate-800" aria-live="polite">{{ currentQty }}</span>
                                <button @click="changeQty(1)" class="text-gray-400 hover:text-[#00704A] px-2 font-bold text-lg" aria-label="Aumentar cantidad">+</button>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="block text-xs text-gray-400">Total</span>
                            <span class="text-3xl font-bold text-[#00704A]" aria-live="polite">${{ totalPrice }}</span>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <button @click="addToCart" class="flex-1 bg-[#00704A] hover:bg-[#005c3d] text-white font-bold py-4 rounded-xl shadow-lg text-lg transition transform active:scale-95 flex items-center justify-center gap-2">
                            <i class="fa-solid fa-basket-shopping"></i> Añadir
                        </button>
                        <button @click="buyNow" class="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg text-lg transition transform active:scale-95 flex items-center justify-center gap-2">
                            <i class="fa-solid fa-bolt"></i> Comprar Ahora
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

.font-poppins { font-family: 'Poppins', sans-serif; }



.fade-in { animation: fadeIn 0.4s ease-out; }
.animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Scrollbar hide */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
