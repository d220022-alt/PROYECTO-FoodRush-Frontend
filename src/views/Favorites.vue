<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();

const goBack = () => router.go(-1);

// Mock Data matching the image
const favorites = ref([
    { id: 1, name: "Hamburguesa Clásica", place: "Burger Queen", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60" },
    { id: 2, name: "Pizza Pepperoni", place: "Pizza Palace", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=60" },
    { id: 3, name: "Sushi Variado", place: "Sushi House", img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=60" },
    { id: 4, name: "Ensalada César", place: "Fresh Greens", img: "https://images.unsplash.com/photo-1550304999-8faf70ef13be?auto=format&fit=crop&w=500&q=60" },
    { id: 5, name: "Tacos al Pastor", place: "La Taquería", img: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=500&q=60" },
    { id: 6, name: "Pasta Boloñesa", place: "Pasta Bella", img: "https://images.unsplash.com/photo-1626844131082-256783844137?auto=format&fit=crop&w=500&q=60" }
]);

const addToCart = (item) => {
    Swal.fire({
        icon: 'success',
        title: '¡Añadido!',
        text: `Has añadido ${item.name} al carrito.`,
        timer: 1500,
        showConfirmButton: false
    });
};
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
    <div class="px-6 grid grid-cols-2 gap-4">
        <div v-for="item in favorites" :key="item.id" class="bg-white rounded-3xl p-4 flex flex-col items-center shadow-sm relative group">
            
            <!-- Heart Icon -->
            <button class="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm z-10">
                <i class="fa-solid fa-heart"></i>
            </button>

            <!-- Image -->
            <div class="w-24 h-24 rounded-full overflow-hidden mb-3 shadow-md group-hover:scale-105 transition duration-300">
                <img :src="item.img" :alt="item.name" class="w-full h-full object-cover">
            </div>

            <!-- Content -->
            <div class="text-center w-full mb-3">
                <h3 class="font-bold text-slate-800 text-sm leading-tight mb-1">{{ item.name }}</h3>
                <p class="text-xs text-gray-400">{{ item.place }}</p>
            </div>

            <!-- Add Button -->
            <button @click="addToCart(item)" class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-6 rounded-full w-full flex items-center justify-center gap-2 transition shadow-md">
                <i class="fa-solid fa-cart-shopping text-[10px]"></i> Añadir
            </button>
        </div>
    </div>
</div>
</template>
