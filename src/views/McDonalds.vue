<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';

const router = useRouter();

// Assets & Data (Red & Yellow branding)
const bgBrand = '#DB0007'; // McDonald's Red
const textBrand = '#FFC72C'; // McDonald's Yellow

const products = ref([]);
const isLoading = ref(true);
const fetchError = ref(false);

// State
const currentCategory = ref('Hamburguesas');
const searchTerm = ref('');
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
        Swal.fire({ title: 'Eliminado de favoritos', icon: 'info', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } else {
        // Add
        favorites.push({
            id: selectedProduct.value.id,
            name: selectedProduct.value.name,
            img: selectedProduct.value.img,
            price: selectedProduct.value.price,
            place: "McDonald's"
        });
        isFavorite.value = true;
        Swal.fire({ title: 'Añadido a favoritos', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }
    
    localStorage.setItem('foodrush_favorites', JSON.stringify(favorites));
};

// Detail View State
const selectedProduct = ref(null);
const currentQty = ref(1);

// Customization for burgers/fries
const extraCheese = ref(false);
const noPickles = ref(false);
const largeFries = ref(false);
const isCombo = ref(false); // New Business Logic: McCombo

// Fetch Real Data
const fetchProducts = async () => {
    try {
        isLoading.value = true;
        fetchError.value = false;
        
        let tenantId = 2; // McDonald's
        
        const response = await api.getProducts({ limit: 100 }, { 'X-Tenant-ID': tenantId });
        
        if (response.success) {
            products.value = response.data.map(p => {
                const parts = p.descripcion ? p.descripcion.split(' - ') : ['General', p.descripcion];
                const cat = parts.length > 1 ? parts[0] : 'General';
                const desc = parts.length > 1 ? parts[1] : parts[0];

                // Robust Image Matcher Function
                const getImageForProduct = (name, category) => {
                    const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const c = category ? category.toLowerCase() : '';
                    
                    // 1. Exact Matches (Unsplash - High Reliability)
                    if (n.includes('cuarto') || n.includes('pounder')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'; // Cheeseburger
                    if (n.includes('cola') || n.includes('coke') || n.includes('refresco')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'; // Coke Glass
                    if (n.includes('flurry') || n.includes('oreo')) return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80'; // Oreo Ice Cream
                    
                    // 2. Fuzzy Matches (Wikimedia - Branded & Specific)
                    if (n.includes('big mac')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Big_Mac_hamburger.jpg/800px-Big_Mac_hamburger.jpg'; // Featured Picture
                    if (n.includes('nugget')) return 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Chicken_McNuggets.jpg'; // 20-piece box (Branded)
                    if (n.includes('papa') || n.includes('frie')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/McDonald%27s_French_Fries_%282024%29.jpg/800px-McDonald%27s_French_Fries_%282024%29.jpg'; // Red Box (Branded 2024)
                    if (n.includes('cajita')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/McDonalds-Happy-Meal.jpg/640px-McDonalds-Happy-Meal.jpg'; 

                    // 3. Category Fallbacks
                    if (c.includes('hamburguesa')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Burger_King_Double_Whopper_with_cheese.jpg/800px-Burger_King_Double_Whopper_with_cheese.jpg';
                    if (c.includes('bebida')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'; 
                    if (c.includes('postre')) return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80';

                    return 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg';
                };

                return {
                    id: p.id,
                    name: p.nombre,
                    category: cat,
                    price: parseFloat(p.precio),
                    img: getImageForProduct(p.nombre, cat),
                    description: desc
                };
            });
        }
    } catch (e) {
        console.error("Error fetching products", e);
        fetchError.value = true;
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
    return result;
});

const setCategory = (cat) => {
    currentCategory.value = cat;
};

// Detail View Logic
const openProductDetail = (product) => {
    selectedProduct.value = product;
    currentQty.value = 1;
    // Reset modifiers
    extraCheese.value = false;
    noPickles.value = false;
    largeFries.value = false;
    isCombo.value = false;
    checkFavorite();
    window.scrollTo(0,0);
};

const closeDetail = () => {
    selectedProduct.value = null;
};

const changeQty = (amount) => {
    if (currentQty.value + amount >= 1) currentQty.value += amount;
};

// Calculate Total Price with modifiers
const totalPrice = computed(() => {
    let base = selectedProduct.value ? selectedProduct.value.price : 0;
    
    // Logic: Extra cheese cost
    if (extraCheese.value) base += 50;
    
    // Logic: McCombo (Price depends on base, usually +150 for soda and fries)
    if (isCombo.value) base += 200; 

    // Logic: Large fries only relevant if not combo (standalone) or upgrade? 
    // Let's assume for simplicity large fries is an upgrade to the standalone item OR combo.
    if (largeFries.value) base += 50;

    return base * currentQty.value;
});

// Cart Logic
const updateCartBadge = () => {
    const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    cartCount.value = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
};

const createCartItem = () => {
    let details = [];
    if (isCombo.value) details.push('McCombo (Papas y Refresco)');
    if (extraCheese.value) details.push('Extra Queso');
    if (noPickles.value) details.push('Sin Pepinillos');
    if (largeFries.value) details.push('Grande');

    return {
        id: selectedProduct.value.id,
        name: selectedProduct.value.name + (isCombo.value ? ' (Combo)' : ''),
        price: totalPrice.value / currentQty.value, 
        img: selectedProduct.value.img,
        qty: currentQty.value,
        details: details.join(', ')
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
        title: '¡Me encanta!',
        text: `Has añadido ${selectedProduct.value.name} al carrito.`,
        showCancelButton: true,
        confirmButtonColor: '#DB0007',
        cancelButtonColor: '#333',
        confirmButtonText: 'Ir al Carrito',
        cancelButtonText: 'Seguir pidiendo'
    }).then((result) => {
        if (result.isConfirmed) {
            router.push('/cart');
        } else {
            closeDetail();
        }
    });
};

const buyNow = () => {
    addToCart();
    setTimeout(() => router.push('/checkout'), 500);
};

const userName = ref('');
const goBackHome = () => router.push('/');

onMounted(() => {
    updateCartBadge();
    const storedName = localStorage.getItem('user_name');
    if (storedName) userName.value = storedName;
    fetchProducts();
});
</script>

<template>
<div class="font-poppins bg-[#f8f8f8] min-h-screen">
    <!-- HEADER -->
    <header class="bg-[#DB0007] text-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <!-- Brand -->
            <button @click="goBackHome" aria-label="Volver al inicio" class="flex items-center gap-2 cursor-pointer hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-[#FFC72C] rounded-lg p-1">
                <div class="bg-[#FFC72C] w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#DB0007] text-2xl shadow-sm">
                    M
                </div>
                <span class="font-bold text-xl tracking-tight text-white hidden sm:block">McDonald's</span>
            </button>
            
            <div class="flex items-center gap-6">
                 <!-- Search -->
                 <div class="hidden md:flex items-center bg-white/20 rounded-full px-4 py-1.5 w-64 focus-within:bg-white/90 transition group">
                    <i class="fa-solid fa-magnifying-glass text-white/70 mr-3 group-focus-within:text-[#DB0007]"></i>
                    <input v-model="searchTerm" type="text" placeholder="Buscar..." aria-label="Buscar productos" class="bg-transparent outline-none w-full text-sm text-white placeholder-white/70 group-focus-within:text-slate-800">
                </div>

                <!-- Cart -->
                <button @click="router.push('/cart')" aria-label="Ver carrito" class="relative hover:text-[#FFC72C] transition focus:outline-none focus:ring-2 focus:ring-[#FFC72C] rounded-full p-1">
                    <i class="fa-solid fa-burger text-xl" aria-hidden="true"></i>
                    <span v-if="cartCount > 0" class="absolute -top-2 -right-2 bg-[#FFC72C] text-[#DB0007] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm" aria-live="polite">{{ cartCount }}</span>
                </button>

                 <!-- User Profile -->
                 <button v-if="userName" @click="router.push('/profile')" aria-label="Ver perfil" class="flex items-center gap-2 hover:bg-white/10 rounded-full px-3 py-1 transition focus:outline-none focus:ring-2 focus:ring-[#FFC72C]">
                     <div class="w-8 h-8 rounded-full bg-white text-[#DB0007] flex items-center justify-center font-bold text-sm">
                        {{ userName.charAt(0).toUpperCase() }}
                     </div>
                </button>
            </div>
        </div>
    </header>

    <!-- BANNER -->
    <div v-if="!selectedProduct" class="fade-in">
        <section class="w-full h-[250px] bg-yellow-400 relative overflow-hidden flex items-center justify-center">
             <div class="absolute inset-0 bg-[url('https://cdn.pixabay.com/photo/2022/11/14/15/28/mcdonalds-7591605_1280.jpg')] bg-cover bg-center opacity-40 mix-blend-multiply"></div>
             <div class="z-10 text-center animate-slide-up px-4">
                 <h2 class="text-4xl md:text-5xl font-black text-[#DB0007] drop-shadow-sm uppercase tracking-tighter">Me encanta</h2>
                 <p class="text-white font-bold text-lg md:text-xl drop-shadow-md mt-2">Tus favoritos de siempre</p>
             </div>
        </section>

        <!-- CATEGORIES -->
        <nav class="sticky top-[72px] z-40 bg-white shadow-sm border-b py-4" aria-label="Categorías">
             <div class="container mx-auto px-6 flex justify-start md:justify-center gap-4 overflow-x-auto scrollbar-hide pb-2 md:pb-0" role="tablist">
                <button v-for="cat in ['Hamburguesas', 'Complementos', 'Bebidas', 'Postres']" :key="cat"
                        @click="setCategory(cat)"
                        role="tab"
                        :aria-selected="currentCategory === cat"
                        :class="['px-6 py-2 rounded-full font-bold text-sm transition shadow-sm border whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#DB0007]', currentCategory === cat ? 'bg-[#DB0007] text-white border-[#DB0007] scale-105' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100']">
                    {{ cat }}
                </button>
             </div>
        </nav>

        <!-- GRID -->
        <main class="container mx-auto px-6 py-10 min-h-[50vh]">
             <!-- Loading State -->
             <div v-if="isLoading" class="flex justify-center items-center py-20 text-[#DB0007]">
                 <i class="fa-solid fa-circle-notch fa-spin text-4xl"></i>
             </div>

             <!-- Error State -->
             <div v-else-if="fetchError" class="text-center py-20 text-gray-500">
                 <i class="fa-solid fa-triangle-exclamation text-4xl mb-4 text-[#DB0007]"></i>
                 <p>Hubo un problema cargando el menú. Intenta recargar.</p>
             </div>

             <!-- Empty State -->
             <div v-else-if="filteredProducts.length === 0" class="text-center py-20 text-gray-400">
                <i class="fa-regular fa-face-frown text-4xl mb-4"></i>
                <p>No encontramos productos en esta categoría.</p>
            </div>
            
            <!-- Products Grid -->
            <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <!-- Product Card -->
                <article v-for="product in filteredProducts" :key="product.id"
                     @click="openProductDetail(product)"
                     @keydown.enter="openProductDetail(product)"
                     tabindex="0"
                     class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-transparent hover:border-[#FFC72C] group focus:outline-none focus:ring-4 focus:ring-[#FFC72C]/50 flex flex-col h-full">
                    
                    <div class="w-full h-48 flex items-center justify-center mb-4 bg-gray-100 rounded-xl relative overflow-hidden">
                        <img :src="product.img" 
                             @error="$event.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/600px-No_image_available.svg.png'"
                             class="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
                             :alt="`Imagen de ${product.name}`" loading="lazy">
                    </div>

                    <h3 class="font-bold text-slate-800 leading-tight mb-2 group-hover:text-[#DB0007] line-clamp-2">{{ product.name }}</h3>
                    <div class="flex justify-between items-center mt-auto pt-2">
                        <span class="font-bold text-[#DB0007]">${{ product.price }}</span>
                        <div class="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-[#FFC72C] group-hover:text-[#DB0007] transition shadow-sm">
                            <i class="fa-solid fa-plus font-bold text-sm"></i>
                        </div>
                    </div>
                </article>
            </div>
        </main>
    </div>

    <!-- DETAIL VIEW -->
    <div v-else class="fade-in container mx-auto px-6 py-8 flex justify-center items-start min-h-screen">
        <div class="bg-white rounded-3xl p-6 md:p-10 shadow-2xl max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 relative animate-slide-up">
            
            <button @click="closeDetail" aria-label="Cerrar detalles" class="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-slate-800 transition focus:outline-none focus:ring-2 focus:ring-[#DB0007] rounded-full p-1 z-10">
                <i class="fa-solid fa-xmark text-2xl"></i>
            </button>

            <!-- Image -->
            <div class="flex items-center justify-center bg-[#FFF8E1] rounded-2xl p-8 relative">
                <!-- Simple Favorite Toggle -->
                <button @click="toggleFavorite" class="absolute top-4 left-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition z-20"
                        :class="isFavorite ? 'text-red-500' : 'text-gray-300 hover:text-red-400'"
                        :aria-label="isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'">
                     <i :class="isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" aria-hidden="true"></i>
                </button>
                <img :src="selectedProduct.img" :alt="selectedProduct.name" class="w-full max-w-[280px] drop-shadow-2xl hover:scale-105 transition duration-500 object-contain">
            </div>

            <!-- Content -->
            <div class="flex flex-col h-full">
                <div>
                     <span class="text-[#FFC72C] font-bold text-xs tracking-wide uppercase mb-1 block bg-gray-900 w-fit px-2 py-0.5 rounded">{{ selectedProduct.category }}</span>
                     <h1 class="text-3xl md:text-4xl font-black text-slate-800 mb-2 leading-tight">{{ selectedProduct.name }}</h1>
                     <p class="text-gray-500 text-sm mb-6 leading-relaxed">{{ selectedProduct.description }}</p>
                </div>

                <!-- Customization Options -->
                <div class="mb-6 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 overflow-y-auto max-h-[300px]">
                    <p class="font-bold text-sm text-slate-700 mb-2 border-b pb-1">Personaliza tu orden</p>
                    
                    <!-- McCombo Toggle -->
                    <div class="flex items-center justify-between hover:bg-gray-100 p-2 rounded transition group">
                        <label for="mccombo-toggle" class="flex flex-col cursor-pointer">
                            <span class="text-sm font-bold text-slate-800 group-hover:text-[#DB0007] transition">Hacer McCombo (+$200)</span>
                            <span class="text-xs text-gray-500">Incluye Papas Medianas y Refresco</span>
                        </label>
                        <div class="relative">
                             <input id="mccombo-toggle" type="checkbox" v-model="isCombo" class="sr-only peer">
                             <div @click="isCombo = !isCombo" class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DB0007] cursor-pointer"></div>
                        </div>
                    </div>

                    <div v-if="selectedProduct.category === 'Hamburguesas'" class="flex items-center justify-between hover:bg-gray-100 p-2 rounded transition">
                        <label for="cheese-toggle" class="text-sm text-gray-600 cursor-pointer">Extra Queso (+$50)</label>
                        <div class="relative">
                            <input id="cheese-toggle" type="checkbox" v-model="extraCheese" class="sr-only peer">
                            <div @click="extraCheese = !extraCheese" class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC72C] cursor-pointer"></div>
                        </div>
                    </div>

                    <div v-if="selectedProduct.category === 'Hamburguesas'" class="flex items-center justify-between hover:bg-gray-100 p-2 rounded transition">
                        <label for="pickles-toggle" class="text-sm text-gray-600 cursor-pointer">Sin Pepinillos</label>
                        <div class="relative">
                            <input id="pickles-toggle" type="checkbox" v-model="noPickles" class="sr-only peer">
                            <div @click="noPickles = !noPickles" class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 cursor-pointer"></div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between hover:bg-gray-100 p-2 rounded transition">
                        <label for="large-toggle" class="text-sm text-gray-600 cursor-pointer">Agrandar (+$50)</label>
                        <div class="relative">
                            <input id="large-toggle" type="checkbox" v-model="largeFries" class="sr-only peer">
                            <div @click="largeFries = !largeFries" class="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC72C] cursor-pointer"></div>
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="mt-auto border-t pt-6 bg-white sticky bottom-0">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center border rounded-lg bg-gray-50">
                            <button @click="changeQty(-1)" aria-label="Disminuir cantidad" class="px-4 py-2 hover:bg-gray-200 text-gray-500 font-bold rounded-l-lg transition">-</button>
                            <span class="px-3 py-1 font-bold text-slate-800 min-w-[40px] text-center text-lg" aria-live="polite" aria-atomic="true">{{ currentQty }}</span>
                            <button @click="changeQty(1)" aria-label="Aumentar cantidad" class="px-4 py-2 hover:bg-gray-200 text-gray-500 font-bold rounded-r-lg transition">+</button>
                        </div>
                        <div class="text-right">
                             <span class="block text-xs text-gray-400 font-bold uppercase">Total</span>
                             <span class="text-4xl font-black text-[#DB0007]" aria-live="polite" aria-atomic="true">${{ totalPrice }}</span>
                        </div>
                    </div>
                    <button @click="addToCart" class="w-full bg-[#FFC72C] hover:bg-[#ffb700] text-[#DB0007] font-black py-4 rounded-xl shadow-lg transition transform active:scale-[0.98] text-lg uppercase tracking-wide flex items-center justify-center gap-2">
                        <i class="fa-solid fa-basket-shopping"></i> Añadir {{ currentQty > 1 ? `(${currentQty})` : '' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;700;900&display=swap');
.font-poppins { font-family: 'Poppins', sans-serif; }
.fade-in { animation: fadeIn 0.4s ease-out; }
.animate-slide-up { animation: slideUp 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
