<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();

const goBack = () => router.go(-1);

// State
const favorites = ref([]);

// Mock fallback if empty, but we prefer real data
// We will store just IDs and minimal data in localStorage for now
// Or full objects. To be simple: Store full objects.

const loadFavorites = () => {
    const stored = localStorage.getItem('foodrush_favorites');
    if (stored) {
        favorites.value = JSON.parse(stored);
    } else {
        favorites.value = []; 
    }
};

const removeFavorite = (id) => {
    favorites.value = favorites.value.filter(item => item.id !== id);
    localStorage.setItem('foodrush_favorites', JSON.stringify(favorites.value));
};

const addToCart = (item) => {
    let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    
    // Check if exists to avoid duplicates or minimal logic
    // For simplicity, we just add as new item with Qty 1
    const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price || 0, // Ensure price exists
        img: item.img,
        qty: 1,
        details: ''
    };

    cart.push(cartItem);
    localStorage.setItem('foodrush_cart', JSON.stringify(cart));

    Swal.fire({
        icon: 'success',
        title: '¡Añadido!',
        text: `Has añadido ${item.name} al carrito.`,
        timer: 1500,
        showConfirmButton: false
    });
};

onMounted(() => {
    loadFavorites();
});
</script>

<template>
<div class="min-h-screen bg-[#F9F9F9] font-sans pb-10">
    <!-- Header -->
    <header class="p-6 flex items-center justify-between bg-[#F9F9F9] sticky top-0 z-10">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="text-xl font-bold text-slate-800">Mis Favoritos</h1>
        <button class="text-xl text-slate-800 hover:text-orange-500 transition">
            <i class="fa-solid fa-magnifying-glass"></i>
        </button>
    </header>

    <!-- Grid -->
    <TransitionGroup name="list" tag="div" class="px-6 grid grid-cols-2 gap-4">
        <div v-for="item in favorites" :key="item.id" class="bg-white rounded-3xl p-4 flex flex-col items-center shadow-sm relative group">
            
            <!-- Remove Icon -->
            <button @click="removeFavorite(item.id)" class="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm z-10 hover:bg-red-50 transition">
                <i class="fa-solid fa-trash-can text-sm"></i>
            </button>

            <!-- Image -->
            <div class="w-24 h-24 rounded-full overflow-hidden mb-3 shadow-md group-hover:scale-105 transition duration-300">
                <img :src="item.img" :alt="item.name" class="w-full h-full object-cover">
            </div>

            <!-- Content -->
            <div class="text-center w-full mb-3">
                <h3 class="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2 h-9 flex items-center justify-center">{{ item.name }}</h3>
                <p class="text-xs text-gray-400">{{ item.place || 'Starbucks' }}</p>
                <p class="text-xs font-bold text-[#00704A] mt-1">${{ item.price }}</p>
            </div>

            <!-- Add Button -->
            <button @click="addToCart(item)" class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-6 rounded-full w-full flex items-center justify-center gap-2 transition shadow-md">
                <i class="fa-solid fa-cart-shopping text-[10px]"></i> Añadir
            </button>
        </div>
    </TransitionGroup>

    <!-- Empty State -->
    <div v-if="favorites.length === 0" class="px-6 text-center py-10 fade-in">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <i class="fa-regular fa-heart text-2xl"></i>
        </div>
        <p class="text-gray-500 font-medium">No tienes favoritos aún.</p>
    </div>
</div>
</template>
