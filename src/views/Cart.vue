<!--
  Guia rápida para presentar:
  Carrito del cliente. Resume productos agregados antes de pasar al checkout.
  Buscar en VS Code: carrito, cantidades, total, checkout, remove item, updateQty.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
// Asegúrate de que las rutas relativas a tus servicios sean correctas
import { APP_EVENTS, getCart, removeCartItem, updateCartItemQuantity } from '../services/storage';
import { useCurrency } from '../utils/currency';

const router = useRouter();
const goBack = () => router.go(-1);

const cart = ref([]);

const { formatCurrency } = useCurrency();

// Para presentar: carga el carrito desde storage local y recalcula total antes del checkout.
const loadCart = () => {
    // Previene errores si getCart() devuelve null/undefined
    cart.value = getCart() || []; 
};

onMounted(() => {
    loadCart();
    window.addEventListener(APP_EVENTS.cartChanged, loadCart);
    window.addEventListener(APP_EVENTS.authChanged, loadCart);
});

onBeforeUnmount(() => {
    window.removeEventListener(APP_EVENTS.cartChanged, loadCart);
    window.removeEventListener(APP_EVENTS.authChanged, loadCart);
});

// Para presentar: cambia cantidades y vuelve a guardar el carrito en localStorage.
const updateQty = (item, change) => {
    const newQty = item.qty + change;
    if (newQty >= 1) {
        item.qty = newQty; // Actualización optimista
        updateCartItemQuantity(item.lineKey || item.id, newQty);
    }
};

const removeItem = (lineKey) => {
    removeCartItem(lineKey);
    loadCart(); // Reutilizamos loadCart para mantener consistencia
};

const goToCheckout = () => {
    if (cart.value.length > 0) {
        router.push('/checkout');
    }
};

const totalPrice = computed(() => {
    return cart.value.reduce((acc, item) => acc + (item.price * item.qty), 0);
});
</script>

<template>
<div class="min-h-screen bg-white font-sans flex flex-col">
    <header class="p-6 border-b flex items-center gap-4 bg-white sticky top-0 z-10 shadow-sm">
        <button @click="goBack" class="text-xl text-slate-800 hover:text-orange-500 transition-colors" aria-label="Volver">
            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <h1 class="text-2xl font-bold text-slate-800">Mi Carrito</h1>
    </header>

    <div class="flex-1 p-6 overflow-y-auto">
        <div v-if="cart.length === 0" class="text-center py-20 flex flex-col items-center">
            <i class="fa-solid fa-basket-shopping text-6xl text-gray-200 mb-4 font-bold"></i>
            <p class="text-xl text-gray-400 font-bold">Tu carrito está vacío</p>
            <button @click="router.push('/')" class="mt-6 text-orange-500 font-bold hover:text-orange-600 hover:underline transition-all">
                Explorar restaurantes
            </button>
        </div>

        <TransitionGroup v-else name="list" tag="div" class="relative">
            <div v-for="item in cart" :key="item.lineKey || item.id" class="border rounded-xl p-4 mb-6 flex gap-4 items-start shadow-sm bg-white hover:shadow-md transition-shadow">
                
                <div class="cart-image-frame w-24 h-24 rounded-lg flex items-center justify-center p-2 shrink-0">
                    <img :src="item.img" :alt="`Imagen de ${item.name}`" class="cart-product-image w-full h-full object-contain" loading="lazy">
                </div>

                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="font-bold text-slate-800 text-lg truncate">{{ item.name }}</h3>
                    </div>
                    <p v-if="item.place || item.franchiseSlug" class="text-[11px] font-black uppercase tracking-wide text-orange-500 mb-1">
                        {{ item.place || item.franchiseSlug }}
                    </p>
                    <p class="text-xs text-gray-400 mb-4 line-clamp-2">{{ item.details || 'Sin detalles adicionales' }}</p>
                    
                    <div class="flex items-center justify-between">
                         <span class="bg-orange-50 text-orange-600 px-3 py-1 rounded text-sm font-bold" aria-label="Precio unitario">
                             {{ formatCurrency(item.price) }}
                         </span>
                         
                         <div class="flex items-center gap-4">
                             <div class="flex items-center border rounded-lg bg-white">
                                 <button 
                                     @click="updateQty(item, -1)" 
                                     :disabled="item.qty <= 1"
                                     class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black font-bold disabled:opacity-30 disabled:hover:text-gray-500 transition-colors" 
                                     :aria-label="`Disminuir cantidad de ${item.name}`">-</button>
                                 <span class="w-8 text-center text-sm font-bold" aria-live="polite">{{ item.qty }}</span>
                                 <button 
                                     @click="updateQty(item, 1)" 
                                     class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black font-bold transition-colors" 
                                     :aria-label="`Aumentar cantidad de ${item.name}`">+</button>
                             </div>
                         </div>
                    </div>
                    
                    <button 
                        @click="removeItem(item.lineKey || item.id)" 
                        class="text-xs text-red-500 mt-3 hover:text-red-700 hover:underline ml-auto block text-right font-bold transition-colors" 
                        :aria-label="`Eliminar ${item.name} del carrito`">
                        Eliminar
                    </button>
                </div>
            </div>
        </TransitionGroup>
    </div>

    <div v-if="cart.length > 0" class="p-6 pb-12 bg-gray-50 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div class="flex justify-between items-center mb-6 px-2">
            <span class="text-gray-500 font-bold uppercase text-xs tracking-wider">Total del Carrito</span>
            <span class="text-3xl font-black text-slate-900" aria-live="polite">{{ formatCurrency(totalPrice) }}</span>
        </div>
        <button @click="goToCheckout" class="w-full bg-[#333] text-white font-bold py-4 rounded-xl mb-4 hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10">
            Ir a pagar
        </button>
        <button @click="goBack" class="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95">
            Seguir comprando
        </button>
    </div>

    <footer class="bg-[#BD0A0A] text-white p-8">
         <div class="flex items-center gap-2 mb-4">
            <div class="flex flex-col items-center leading-none bg-white p-2 rounded shadow-sm">
                <span class="text-orange-500 font-bold text-sm italic tracking-tighter">Food</span>
                <span class="text-slate-800 font-bold text-sm italic tracking-tighter -mt-1">Rush</span>
            </div>
         </div>
    </footer>
</div>
</template>

<style scoped>
/* Animaciones para el TransitionGroup */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
/* Asegura que los elementos se muevan suavemente cuando uno es eliminado */
.list-move {
  transition: transform 0.4s ease;
}

.cart-image-frame {
  background: #f8fafc;
}

.cart-product-image {
  mix-blend-mode: normal;
}

:global(html.foodrush-dark) .cart-image-frame {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}
</style>
