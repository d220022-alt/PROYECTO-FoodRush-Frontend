<!--
  Guia rapida para presentar:
  Historial de pedidos del cliente. Desde aqui se vuelve al tracking de cada orden.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchOperationalDataset, getOrderProgressStep } from '../services/operations';
import { getCachedOrders, getSession, saveCachedOrder } from '../services/storage';

const router = useRouter();
const session = getSession();

const orders = ref([]);
const isLoading = ref(true);
const warnings = ref([]);
const errorMessage = ref('');

const goBack = () => router.go(-1);
const normalize = (value = '') => String(value || '').trim().toLowerCase();

const formatDate = (dateString) => {
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return 'Sin fecha';

    return parsedDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getStatusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
    case 'pendiente':
        return 'text-yellow-600 bg-yellow-50';
    case 'confirmado':
    case 'preparando':
        return 'text-blue-600 bg-blue-50';
    case 'en camino':
        return 'text-orange-600 bg-orange-50';
    case 'entregado':
        return 'text-green-600 bg-green-50';
    case 'cancelado':
        return 'text-red-600 bg-red-50';
    default:
        return 'text-gray-600 bg-gray-50';
    }
};

const getProgressStep = (status) => getOrderProgressStep(status);

const fetchOrders = async () => {
    const liveSession = getSession();
    const email = normalize(liveSession.userEmail || session.userEmail || localStorage.getItem('user_email'));
    orders.value = email ? getCachedOrders(email) : [];
    warnings.value = [];
    errorMessage.value = '';

    try {
        isLoading.value = true;

        if (!email) return;

        const dataset = await fetchOperationalDataset({ selectedTenantId: 'Global', includeSessions: false });
        warnings.value = dataset.warnings || [];

        const cachedIds = new Set(orders.value.map((order) => String(order.id)));
        const remoteOrders = (dataset.orders || []).filter((order) => (
            normalize(order.customerEmail) === email || cachedIds.has(String(order.id))
        ));

        remoteOrders.forEach((order) => {
            saveCachedOrder(
                {
                    ...order,
                    tenant_id: order.tenantId || order.tenant_id,
                    user_email: order.customerEmail || email,
                    user_name: order.customerName,
                    source: 'remote',
                },
                email,
            );
        });

        orders.value = getCachedOrders(email);
    } catch (error) {
        console.error('Error loading orders', error);
        errorMessage.value = error.message || 'No se pudo cargar tus pedidos.';
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    void fetchOrders();
});
</script>

<template>
    <div class="min-h-screen bg-[#F9F9F9] pb-10 font-sans">
        <header class="sticky top-0 z-10 flex items-center border-b border-gray-200 bg-[#F9F9F9] p-6">
            <button @click="goBack" class="mr-4 text-2xl text-slate-800 transition hover:text-orange-500" aria-label="Volver">
                <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
            </button>
            <h1 class="text-2xl font-bold text-slate-800">Mis Pedidos</h1>
        </header>

        <div class="mx-auto max-w-2xl p-6">
            <div v-if="isLoading" class="flex justify-center py-20">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-orange-500"></i>
            </div>

            <div v-else-if="orders.length === 0" class="rounded-3xl bg-white py-20 text-center shadow-sm">
                <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-3xl text-gray-400">
                    <i class="fa-solid fa-receipt"></i>
                </div>
                <h3 class="mb-2 text-lg font-bold text-slate-800">No tienes pedidos aun</h3>
                <p class="mx-auto mb-6 max-w-xs text-sm text-gray-500">Es hora de pedir algo delicioso. Explora nuestros restaurantes.</p>
                <button @click="router.push('/')" class="rounded-full bg-orange-500 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-orange-600">
                    Ir a Inicio
                </button>
            </div>

            <div v-else class="space-y-6" role="list" aria-label="Historial de pedidos">
                <div v-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    {{ errorMessage }}
                </div>

                <div v-if="warnings.length > 0" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                    {{ warnings[0] }}
                </div>

                <div v-for="order in orders" :key="`${order.tenantId || 'tenant'}-${order.id}`" role="listitem" class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
                    <div class="flex items-start justify-between border-b border-gray-50 p-4">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">Pedido #{{ order.id }}</h3>
                            <p class="mt-1 text-xs text-gray-400">
                                {{ formatDate(order.createdAt || order.creado_en) }} · {{ order.tenantName || 'FoodRush' }}
                            </p>
                        </div>
                        <span :class="['rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide', getStatusColor(order.statusLabel || order.estado?.descripcion)]">
                            {{ order.statusLabel || order.estado?.descripcion || 'Desconocido' }}
                        </span>
                    </div>

                    <div class="p-4">
                        <div v-if="(order.statusLabel || order.estado?.descripcion || '').toLowerCase() !== 'cancelado'" class="mb-5">
                            <div class="relative mb-2 flex justify-between px-1 text-[10px] font-bold text-gray-400 sm:text-xs">
                                <span :class="getProgressStep(order.statusLabel || order.estado?.descripcion) >= 1 ? 'text-orange-500' : ''">Solicitado</span>
                                <span class="text-center" :class="getProgressStep(order.statusLabel || order.estado?.descripcion) >= 2 ? 'text-orange-500' : ''">Preparando</span>
                                <span class="text-center" :class="getProgressStep(order.statusLabel || order.estado?.descripcion) >= 3 ? 'text-orange-500' : ''">En Camino</span>
                                <span class="text-right" :class="getProgressStep(order.statusLabel || order.estado?.descripcion) >= 4 ? 'text-green-500' : ''">Entregado</span>
                            </div>
                            <div class="relative flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    class="h-full bg-orange-500 transition-all duration-700 ease-out"
                                    :class="getProgressStep(order.statusLabel || order.estado?.descripcion) === 4 ? 'bg-green-500' : ''"
                                    :style="`width: ${(getProgressStep(order.statusLabel || order.estado?.descripcion) / 4) * 100}%`"
                                ></div>
                            </div>
                        </div>

                        <div class="mb-2 flex items-center justify-between">
                            <span class="text-sm text-gray-500">Total</span>
                            <span class="text-xl font-bold text-slate-800">${{ parseFloat(order.totalValue || order.total || 0).toFixed(2) }}</span>
                        </div>

                        <div class="mb-2 flex items-center justify-between">
                            <span class="text-sm text-gray-500">Direccion</span>
                            <span class="w-1/2 truncate text-right text-sm font-medium text-slate-800" :title="order.address || order.direccion_entrega">
                                {{ order.address || order.direccion_entrega || 'Recogida en tienda' }}
                            </span>
                        </div>

                        <p class="mb-4 text-xs font-bold text-gray-500">{{ order.itemSummary || 'Sin detalle del pedido.' }}</p>

                        <button
                            @click="router.push({ path: `/tracking/${order.id}`, query: { tenant: order.tenantId } })"
                            class="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                            :aria-label="`Ver detalles del pedido numero ${order.id}`"
                        >
                            Ver Detalles <i class="fa-solid fa-chevron-right text-xs" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
