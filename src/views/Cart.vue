<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => router.go(-1);

const cart = ref([]);

onMounted(() => {
    loadCart();
});

const loadCart = () => {
    const stored = localStorage.getItem('foodrush_cart');
    if (stored) {
        cart.value = JSON.parse(stored); // Ensure reactivity
    }
}

const saveCart = () => {
    localStorage.setItem('foodrush_cart', JSON.stringify(cart.value));
}

const updateQty = (item, change) => {
    if (item.qty + change >= 1) {
        item.qty += change;
        saveCart();
    }
};

const removeItem = (id) => {
    cart.value = cart.value.filter(item => item.id !== id);
    saveCart();
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
    <!-- Header -->
    <header class="p-6 border-b flex items-center gap-4 bg-white sticky top-0 z-10">
        <button @click="goBack" class="text-xl text-slate-800 hover:text-orange-500 transition" aria-label="Volver">
            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <h1 class="text-2xl font-bold text-slate-800">Mi Carrito</h1>
    </header>

    <!-- Cart Items -->
    <div class="flex-1 p-6 overflow-y-auto">
        <div v-if="cart.length === 0" class="text-center py-20 flex flex-col items-center">
            <i class="fa-solid fa-basket-shopping text-6xl text-gray-200 mb-4 font-bold"></i>
            <p class="text-xl text-gray-400 font-bold">Tu carrito está vacío</p>
            <button @click="router.push('/')" class="mt-6 text-orange-500 font-bold hover:underline">Explorar restaurantes</button>
        </div>
        <TransitionGroup v-else name="list">
            <div v-for="item in cart" :key="item.id" class="border rounded-xl p-4 mb-6 flex gap-4 items-start shadow-sm bg-white">
                <!-- Image -->
                <div class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center p-2">
                    <img :src="item.img" :alt="`Imagen de ${item.name}`" class="w-full h-full object-contain mix-blend-multiply" loading="lazy">
                </div>

                <!-- Details -->
                <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="font-bold text-slate-800 text-lg">{{ item.name }}</h3>
                    </div>
                    <p class="text-xs text-gray-400 mb-4">{{ item.details || '' }}</p>
                    
                    <div class="flex items-center justify-between">
                         <span class="bg-gray-100 px-3 py-1 rounded text-slate-800 font-bold" aria-label="Precio unitario">${{ item.price }}</span>
                         
                         <div class="flex items-center gap-4">
                             <div class="flex items-center border rounded-lg">
                                 <button @click="updateQty(item, -1)" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black font-bold" :aria-label="`Disminuir cantidad de ${item.name}`">-</button>
                                 <span class="w-8 text-center text-sm font-bold" aria-live="polite">{{ item.qty }}</span>
                                 <button @click="updateQty(item, 1)" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black font-bold" :aria-label="`Aumentar cantidad de ${item.name}`">+</button>
                             </div>
                         </div>
                    </div>
                    <button @click="removeItem(item.id)" class="text-xs text-red-500 mt-2 hover:underline ml-auto block text-right font-bold" :aria-label="`Eliminar ${item.name} del carrito`" >Eliminar</button>
                </div>
            </div>
        </TransitionGroup>
    </div>

    <!-- Actions -->
    <div v-if="cart.length > 0" class="p-6 pb-12 bg-gray-50 border-t">
        <div class="flex justify-between items-center mb-6 px-2">
            <span class="text-gray-500 font-bold uppercase text-xs">Total del Carrito</span>
            <span class="text-3xl font-black text-slate-900" aria-live="polite">${{ totalPrice }}</span>
        </div>
        <button @click="goToCheckout" class="w-full bg-[#333] text-white font-bold py-4 rounded-xl mb-4 hover:bg-black transition active:scale-95">Ir a pagar</button>
        <button @click="goBack" class="w-full bg-white border border-gray-300 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition active:scale-95">Seguir comprando</button>
    </div>

    <!-- Footer -->
    <footer class="bg-[#BD0A0A] text-white p-8">
         <!-- Footer content matches design -->
         <div class="flex items-center gap-2 mb-4">
            <div class="flex flex-col items-center leading-none bg-white p-2 rounded">
                <span class="text-orange-500 font-bold text-sm italic tracking-tighter">Food</span>
                <span class="text-slate-800 font-bold text-sm italic tracking-tighter -mt-1">Rush</span>
            </div>
         </div>
    </footer>
</div>
</template>
