<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => router.go(-1);

// Load from local storage or default to true
const settings = ref({
    email: localStorage.getItem('notif_email') !== 'false',
    push: localStorage.getItem('notif_push') !== 'false',
    sms: localStorage.getItem('notif_sms') === 'true', // SMS default off
    promos: localStorage.getItem('notif_promos') !== 'false'
});

// Watch and save
watch(settings, (newVal) => {
    localStorage.setItem('notif_email', newVal.email);
    localStorage.setItem('notif_push', newVal.push);
    localStorage.setItem('notif_sms', newVal.sms);
    localStorage.setItem('notif_promos', newVal.promos);
}, { deep: true });

</script>

<template>
<div class="min-h-screen bg-[#F5F5F5] font-sans">
    <header class="p-6 flex items-center bg-[#F5F5F5] sticky top-0 z-10">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="flex-1 text-center text-xl font-bold text-slate-800">Notificaciones</h1>
        <div class="w-8"></div>
    </header>

    <div class="px-6 pb-10 max-w-lg mx-auto">
        <div class="bg-white rounded-3xl overflow-hidden shadow-sm">
            
            <!-- Email -->
            <div class="flex items-center justify-between p-5 border-b border-gray-100">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-lg">
                        <i class="fa-regular fa-envelope"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">Notificaciones por Correo</p>
                        <p class="text-xs text-gray-400">Recibir actualizaciones de pedidos</p>
                    </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="settings.email" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

            <!-- Push -->
            <div class="flex items-center justify-between p-5 border-b border-gray-100">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 text-lg">
                        <i class="fa-regular fa-bell"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">Notificaciones Push</p>
                        <p class="text-xs text-gray-400">Alertas en tiempo real</p>
                    </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="settings.push" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

             <!-- Promos -->
             <div class="flex items-center justify-between p-5">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg">
                        <i class="fa-solid fa-tag"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">Promociones y Ofertas</p>
                        <p class="text-xs text-gray-400">Solo ofertas relevantes</p>
                    </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="settings.promos" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

        </div>
    </div>
</div>
</template>
