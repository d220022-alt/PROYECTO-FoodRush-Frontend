<!--
  Guia rapida para presentar:
  Favoritos del cliente. Guarda franquicias o productos que quiere repetir rapido.
  Buscar en VS Code: favoritos, localStorage, productos guardados.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import {
    APP_EVENTS,
    addCartItem,
    clearCart,
    getCartRestaurantInfo,
    getFavorites,
    hasCartRestaurantConflict,
    removeFavoriteItem
} from '../services/storage';

const router = useRouter();

const goBack = () => router.go(-1);

// State
const favorites = ref([]);

const loadFavorites = () => {
    favorites.value = getFavorites();
};

const removeFavorite = (id) => {
    favorites.value = removeFavoriteItem(id);
};

const addToCart = async (item) => {
    if (hasCartRestaurantConflict(item)) {
        const currentRestaurant = getCartRestaurantInfo();
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Cambiar restaurante',
            text: `Tu carrito actual es de ${currentRestaurant?.name || 'otra franquicia'}. Si continúas, se reemplazará por este nuevo pedido.`,
            showCancelButton: true,
            confirmButtonText: 'Reemplazar carrito',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        clearCart();
    }

    addCartItem({
        ...item,
        qty: 1,
        details: 'Sin adicionales'
    });

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
    window.addEventListener(APP_EVENTS.favoritesChanged, loadFavorites);
    window.addEventListener(APP_EVENTS.authChanged, loadFavorites);
});

onBeforeUnmount(() => {
    window.removeEventListener(APP_EVENTS.favoritesChanged, loadFavorites);
    window.removeEventListener(APP_EVENTS.authChanged, loadFavorites);
});
</script>

<template>
<div class="min-h-screen bg-[#F9F9F9] font-sans pb-10">
    <!-- Header -->
    <header class="p-6 flex items-center justify-between bg-[#F9F9F9] sticky top-0 z-10">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition" aria-label="Volver">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        </button>
        <h1 class="text-xl font-bold text-slate-800">Mis Favoritos</h1>
        <button class="text-xl text-slate-800 hover:text-orange-500 transition" aria-label="Buscar favoritos">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>
    </header>

    <!-- Grid -->
    <TransitionGroup name="list" tag="div" class="px-6 grid grid-cols-2 gap-4">
        <div v-for="item in favorites" :key="item.id" class="bg-white rounded-3xl p-4 flex flex-col items-center shadow-sm relative group">
            
            <!-- Remove Icon -->
            <button @click="removeFavorite(item.id)" class="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm z-10 hover:bg-red-50 transition" :aria-label="`Eliminar ${item.name} de favoritos`">
                <i class="fa-solid fa-trash-can text-sm" aria-hidden="true"></i>
            </button>

            <!-- Image -->
            <div class="w-24 h-24 rounded-full overflow-hidden mb-3 shadow-md group-hover:scale-105 transition duration-300">
                <img :src="item.img" :alt="`Foto de ${item.name}`" class="w-full h-full object-cover" loading="lazy">
            </div>

            <!-- Content -->
            <div class="text-center w-full mb-3">
                <h3 class="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2 h-9 flex items-center justify-center">{{ item.name }}</h3>
                <p class="text-xs text-gray-400">{{ item.place || 'Starbucks' }}</p>
                <p class="text-xs font-bold text-[#00704A] mt-1">${{ item.price }}</p>
            </div>

            <!-- Add Button -->
            <button @click="addToCart(item)" class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-6 rounded-full w-full flex items-center justify-center gap-2 transition shadow-md" :aria-label="`Añadir ${item.name} al carrito`">
                <i class="fa-solid fa-cart-shopping text-[10px]" aria-hidden="true"></i> Añadir
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
