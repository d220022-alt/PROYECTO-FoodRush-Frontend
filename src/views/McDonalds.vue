<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => router.push('/');
</script>

<template>
<div class="min-h-screen bg-[#FFC72C] flex items-center justify-center relative overflow-hidden font-sans">
    
    <!-- Background Elements -->
    <div class="absolute top-0 left-0 w-full h-full bg-[url('https://cdn.pixabay.com/photo/2022/01/16/16/34/mcdonalds-6942360_1280.jpg')] opacity-10 bg-cover bg-center"></div>

    <div class="bg-white rounded-3xl p-12 shadow-2xl relative z-10 text-center max-w-lg mx-4">
        <div class="w-24 h-24 bg-[#DB0007] rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
             <i class="fa-solid fa-burger text-white text-4xl"></i>
        </div>
        
        <h1 class="text-4xl font-extrabold text-[#DB0007] mb-2 tracking-tight">McDonald's</h1>
        <p class="text-xl font-bold text-gray-800 mb-6">Próximamente en FoodRush</p>
        
        <p class="text-gray-500 mb-8 leading-relaxed">
            Estamos preparando las mejores hamburguesas y papas fritas para ti. 
            ¡La interfaz completa estará lista muy pronto!
        </p>

        <button @click="goBack" class="bg-[#DB0007] hover:bg-[#b00006] text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105">
            Volver al Inicio
        </button>
    </div>
    
</div>
</template>
