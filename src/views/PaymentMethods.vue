<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => router.go(-1);

const cards = ref([
    { id: 1, type: 'Visa', number: '•••• •••• •••• 4242', expiry: '12/24', icon: 'fa-brands fa-cc-visa text-blue-800' },
    { id: 2, type: 'Mastercard', number: '•••• •••• •••• 5555', expiry: '10/25', icon: 'fa-brands fa-cc-mastercard text-red-600' }
]);

const removeCard = (id) => {
    cards.value = cards.value.filter(c => c.id !== id);
};

const addNewCard = () => {
    // For now, just a placeholder alert
    alert("Funcionalidad para añadir tarjetas próximamente.");
};
</script>

<template>
<div class="min-h-screen bg-[#F5F5F5] font-sans">
    <!-- Header -->
    <header class="p-6 flex items-center bg-[#F5F5F5] sticky top-0 z-10">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="flex-1 text-center text-xl font-bold text-slate-800">Métodos de Pago</h1>
        <div class="w-8"></div>
    </header>

    <div class="px-6 pb-10 max-w-lg mx-auto">
        <!-- Card List -->
        <TransitionGroup name="list" tag="div" class="space-y-4 mb-8">
            <div v-for="card in cards" :key="card.id" class="bg-white rounded-3xl p-5 shadow-sm flex items-center justify-between group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">
                        <i :class="card.icon"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800">{{ card.type }}</p>
                        <p class="text-sm text-gray-500">{{ card.number }}</p>
                    </div>
                </div>
                <button @click="removeCard(card.id)" class="w-10 h-10 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition flex items-center justify-center">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </TransitionGroup>

        <!-- Empty State -->
        <div v-if="cards.length === 0" class="text-center py-10">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <i class="fa-regular fa-credit-card text-2xl"></i>
            </div>
            <p class="text-gray-500 font-medium">No tienes tarjetas guardadas.</p>
        </div>

        <!-- Add Button -->
        <button @click="addNewCard" class="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition flex items-center justify-center gap-2">
            <i class="fa-solid fa-plus"></i> Añadir Nueva Tarjeta
        </button>
    </div>
</div>
</template>
