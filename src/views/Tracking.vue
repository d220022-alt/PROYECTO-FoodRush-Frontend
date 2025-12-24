<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';

const route = useRoute();
const router = useRouter();
const orderId = route.params.id;

const order = ref(null);
const currentStep = ref(0); // 0: Pendiente, 1: Preparando, 2: En Camino, 3: Entregado
const steps = [
    { label: 'Confirmado', icon: 'fa-solid fa-clipboard-check', statusId: 1 },
    { label: 'Preparando', icon: 'fa-solid fa-fire-burner', statusId: 2 },
    { label: 'En Camino', icon: 'fa-solid fa-motorcycle', statusId: 3 },
    { label: 'Entregado', icon: 'fa-solid fa-flag-checkered', statusId: 4 }
];

// Simulation logic
let simulationInterval = null;

const fetchOrder = async () => {
    try {
        const response = await api.getOrder(orderId);
        if (response.success) {
            order.value = response.data;
            updateStepFromStatus(parseInt(order.value.estado_id));
        }
    } catch (e) {
        console.error("Error fetching order", e);
    }
};

const updateStepFromStatus = (statusId) => {
    // Basic mapping: 1->0, 2->1, 3->2, 4->3
    if (statusId >= 4) currentStep.value = 3;
    else currentStep.value = Math.max(0, statusId - 1);
};

// SIMULATION: Auto-advance status for functionality demo
const advanceSimulation = async () => {
    if (!order.value) return;
    
    // If it's 4, stop
    if (order.value.estado_id >= 4) {
        clearInterval(simulationInterval);
        return;
    }

    let nextStatus = parseInt(order.value.estado_id) + 1;

    try {
        // En un mundo real, el restaurante hace esto. Aquí lo simulamos.
        await api.updateOrder(orderId, { estado_id: nextStatus });
        order.value.estado_id = nextStatus;
        updateStepFromStatus(nextStatus);
    } catch (e) {
        console.error("Simulation error", e);
    }
};

onMounted(async () => {
    await fetchOrder();
    
    // Start simulation: Update every 5 seconds for demo speed
    if (order.value && order.value.estado_id < 4) {
        simulationInterval = setInterval(advanceSimulation, 5000); 
    }
});

onUnmounted(() => {
    if (simulationInterval) clearInterval(simulationInterval);
});

const goHome = () => router.push('/');
</script>

<template>
<div class="min-h-screen bg-white font-sans">
    <header class="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
         <h1 class="text-xl font-bold text-slate-800">Seguimiento #{{ orderId }}</h1>
         <button @click="goHome" class="text-orange-500 font-bold text-sm">Volver al Inicio</button>
    </header>

    <div class="p-8 max-w-lg mx-auto" v-if="order">
        
        <!-- MAPA (Simulado) -->
        <div class="w-full h-64 bg-gray-100 rounded-3xl mb-8 relative overflow-hidden flex items-center justify-center shadow-inner">
            <div class="absolute inset-0 opacity-30 bg-[url('https://img.freepik.com/free-vector/city-map-navigation-interface_23-2148496660.jpg')] bg-cover bg-center"></div>
            
            <!-- Status Overlay -->
            <div class="z-10 text-center bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                <i :class="steps[currentStep].icon" class="text-4xl text-orange-500 mb-2"></i>
                <p class="font-bold text-slate-800 text-lg">{{ steps[currentStep].label }}</p>
                <p class="text-xs text-gray-500">Actualizado hace un momento</p>
            </div>
            
            <!-- Driver Animation if 'En Camino' -->
            <div v-if="currentStep === 2" class="absolute bottom-4 left-4 animate-bounce">
                <i class="fa-solid fa-motorcycle text-3xl text-slate-800"></i>
            </div>
        </div>

        <!-- TIMELINE -->
        <div class="relative pl-8 border-l-2 border-gray-100 space-y-10">
            <div v-for="(step, index) in steps" :key="index" class="relative">
                <!-- Dot -->
                <div class="absolute -left-[41px] w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-500 z-10"
                     :class="index <= currentStep ? 'bg-green-500 scale-125' : 'bg-gray-200'">
                </div>
                
                <!-- Content -->
                <div class="flex items-center gap-4 transition-opacity duration-500" :class="index <= currentStep ? 'opacity-100' : 'opacity-40'">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors duration-500 shadow-sm"
                         :class="index <= currentStep ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'">
                        <i :class="step.icon"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">{{ step.label }}</h3>
                        
                        <!-- Logic for text status -->
                        <div v-if="index === currentStep">
                            <p v-if="index === steps.length - 1" class="text-xs text-green-600 font-bold">¡Disfruta tu comida!</p>
                            <p v-else class="text-xs text-gray-400">En progreso...</p>
                        </div>
                        
                        <p class="text-xs text-green-500 font-bold" v-if="index < currentStep">Completado</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- INFO -->
        <div class="mt-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div class="flex justify-between items-center mb-4">
                <span class="text-gray-500">Tiempo estimado</span>
                <span class="font-bold text-slate-800 text-lg">15-20 min</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500">Repartidor</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs">JP</div>
                    <span class="font-bold text-slate-800">Juan Pérez</span>
                </div>
            </div>
        </div>
        
    </div>
    <div v-else class="p-10 text-center text-gray-500 flex flex-col items-center justify-center min-h-[50vh]">
        <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-orange-500"></i>
        <p class="text-lg">Cargando pedido...</p>
    </div>
</div>
</template>
