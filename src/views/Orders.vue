<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';

const router = useRouter();
const orders = ref([]);
const isLoading = ref(true);
const goBack = () => router.go(-1);

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'pendiente': return 'text-yellow-600 bg-yellow-50';
        case 'confirmado': return 'text-blue-600 bg-blue-50';
        case 'en camino': return 'text-orange-600 bg-orange-50';
        case 'entregado': return 'text-green-600 bg-green-50';
        case 'cancelado': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
    }
};

const fetchOrders = async () => {
    try {
        isLoading.value = true;
        
        // Resolve logic to get current Client ID.
        // We might store 'client_id' in localStorage on Checkout or login. 
        // For now, let's try to lookup by email again if we don't have ID.
        // Or assume Checkout saved it? 
        
        // Simpler approach: Checkout saves 'last_client_id'. 
        // Or we lookup by email.
        
        const email = localStorage.getItem('user_email');
        if (!email) {
            isLoading.value = false;
            return;
        }

        const clientsRes = await api.getClients({ correo: email });
        if (clientsRes.success && clientsRes.data.length > 0) {
            const clientId = clientsRes.data[0].id; // Assuming first match is correct
            
            const ordersRes = await api.getOrders({ cliente_id: clientId });
            if (ordersRes.success) {
                orders.value = ordersRes.data;
            }
        }

    } catch (e) {
        console.error("Error loading orders", e);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchOrders();
});
</script>

<template>
<div class="min-h-screen bg-[#F9F9F9] font-sans pb-10">
    <!-- Header -->
    <header class="p-6 flex items-center bg-[#F9F9F9] sticky top-0 z-10 border-b border-gray-200">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition mr-4">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="text-2xl font-bold text-slate-800">Mis Pedidos</h1>
    </header>

    <div class="p-6 max-w-2xl mx-auto">
        
        <div v-if="isLoading" class="flex justify-center py-20">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-orange-500"></i>
        </div>

        <div v-else-if="orders.length === 0" class="text-center py-20 bg-white rounded-3xl shadow-sm">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-3xl">
                <i class="fa-solid fa-receipt"></i>
            </div>
            <h3 class="font-bold text-slate-800 text-lg mb-2">No tienes pedidos aún</h3>
            <p class="text-gray-500 text-sm mb-6 max-w-xs mx-auto">¡Es hora de pedir algo delicioso! Explora nuestros restaurantes.</p>
            <button @click="router.push('/')" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition shadow-lg">
                Ir a Inicio
            </button>
        </div>

        <div v-else class="space-y-6">
            <div v-for="order in orders" :key="order.id" class="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
                <!-- Header -->
                <div class="p-4 border-b border-gray-50 flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-slate-800 text-lg">Pedido #{{ order.id }}</h3>
                        <p class="text-xs text-gray-400 mt-1">{{ formatDate(order.creado_en) }}</p>
                    </div>
                    <span :class="['px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide', getStatusColor(order.estado?.descripcion)]">
                        {{ order.estado?.descripcion || 'Desconocido' }}
                    </span>
                </div>
                
                <!-- Body -->
                <div class="p-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-500 text-sm">Total</span>
                        <span class="font-bold text-slate-800 text-xl">${{ parseFloat(order.total).toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-gray-500 text-sm">Dirección</span>
                        <span class="text-slate-800 text-sm font-medium text-right truncate w-1/2" :title="order.direccion_entrega">{{ order.direccion_entrega || 'Recogida en tienda' }}</span>
                    </div>

                    <button @click="router.push('/tracking/' + order.id)" class="w-full border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2">
                         Ver Detalles <i class="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>
        </div>

    </div>
</div>
</template>
