<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchOperationalDataset, getOrderProgressStep } from '../services/operations';
import { getCachedOrderById, getSession } from '../services/storage';
import OrderTrackingMap from '../components/OrderTrackingMap.vue';

const route = useRoute();
const router = useRouter();
const session = getSession();

const order = ref(null);
const warnings = ref([]);
const errorMessage = ref('');
const isLoading = ref(true);

const steps = [
    { label: 'Solicitado', icon: 'fa-solid fa-clipboard-check' },
    { label: 'Preparando', icon: 'fa-solid fa-fire-burner' },
    { label: 'En Camino', icon: 'fa-solid fa-motorcycle' },
    { label: 'Entregado', icon: 'fa-solid fa-flag-checkered' },
];

let refreshTimer = null;

const orderId = computed(() => route.params.id);
const currentUserEmail = computed(() => session.userEmail || '');

const rawStatusLabel = computed(() => order.value?.statusLabel || order.value?.estado?.descripcion || 'Pendiente');
const currentStatusLabel = computed(() => {
    const label = String(rawStatusLabel.value || '').toLowerCase();
    const source = String(order.value?.source || '').toLowerCase();

    if (label.includes('cancel')) return 'Pedido cancelado';
    if (label.includes('entreg')) return 'Pedido entregado';
    if (label.includes('camino')) return 'Repartidor en camino';
    if (label.includes('prepar')) return 'Preparando en el local';
    if (source === 'local') return 'Pendiente de sincronizar';
    return 'Pendiente de confirmacion';
});
const currentProgress = computed(() => getOrderProgressStep(rawStatusLabel.value));
const currentStep = computed(() => Math.max(0, currentProgress.value - 1));
const isCancelled = computed(() => String(currentStatusLabel.value || '').toLowerCase().includes('cancelado'));
const overlayIcon = computed(() => (isCancelled.value ? 'fa-solid fa-ban' : steps[currentStep.value]?.icon || steps[0].icon));

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return 'Sin fecha';
    return parsedDate.toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });
};

const normalizeCachedOrder = (cachedOrder) => {
    if (!cachedOrder) return null;

    return {
        ...cachedOrder,
        statusLabel: cachedOrder.estado?.descripcion || 'Pendiente',
        totalValue: cachedOrder.total,
        address: cachedOrder.direccion_entrega,
        createdAt: cachedOrder.creado_en,
        customerName: cachedOrder.user_name || 'Cliente FoodRush',
        customerPhone: cachedOrder.telefono || '',
        itemSummary: Array.isArray(cachedOrder.items)
            ? cachedOrder.items.map((item) => `${item.qty || item.cantidad || 1}x ${item.name || item.nombre || 'Producto'}`).join(', ')
            : '',
        itemsDetailed: Array.isArray(cachedOrder.items)
            ? cachedOrder.items.map((item, index) => ({
                id: item.id || `cached-item-${index + 1}`,
                name: item.name || item.nombre || 'Producto',
                quantity: Number(item.qty || item.cantidad || 1),
                unitPrice: Number(item.price || item.precio || 0),
                subtotal: Number(item.subtotal || (Number(item.qty || item.cantidad || 1) * Number(item.price || item.precio || 0))),
            }))
            : [],
        tenantId: cachedOrder.tenantId || cachedOrder.tenant_id || cachedOrder.items?.[0]?.tenantId || cachedOrder.items?.[0]?.tenant_id || '',
        tenantName: cachedOrder.tenantName || 'FoodRush',
        driverName: cachedOrder.repartidor_nombre || '',
        source: cachedOrder.source || 'local',
    };
};

const fetchOrder = async () => {
    warnings.value = [];
    errorMessage.value = '';
    const cachedOrder = normalizeCachedOrder(getCachedOrderById(orderId.value, currentUserEmail.value));
    if (cachedOrder) {
        order.value = cachedOrder;
        if (cachedOrder.source === 'local') {
            isLoading.value = false;
            return;
        }
    }

    try {
        isLoading.value = true;
        const selectedTenantId = String(route.query.tenant || cachedOrder?.tenantId || 'Global');

        const dataset = await fetchOperationalDataset({
            selectedTenantId,
            includeSessions: false,
        });

        const remoteOrder = (dataset.orders || []).find((entry) => String(entry.id) === String(orderId.value)) || null;
        if (remoteOrder) {
            order.value = remoteOrder;
            warnings.value = [];
        } else if (!cachedOrder) {
            warnings.value = dataset.warnings || [];
        }
    } catch (error) {
        console.error('Error fetching order', error);
        if (!order.value) {
            errorMessage.value = error.message || 'No se pudo cargar el pedido.';
        }
    } finally {
        if (!order.value) {
            order.value = cachedOrder;
        }

        isLoading.value = false;
    }
};

onMounted(async () => {
    await fetchOrder();
    refreshTimer = window.setInterval(() => {
        void fetchOrder();
    }, 15000);
});

onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer);
});

const goBack = () => router.push('/orders');
</script>

<template>
    <div class="min-h-screen bg-[#fffaf5] font-sans">
        <header class="sticky top-0 z-10 flex items-center justify-between border-b border-red-100 bg-white/95 p-4 backdrop-blur sm:p-6">
            <div>
                <p class="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">FoodRush Tracking</p>
                <h1 class="text-lg font-black text-slate-900 sm:text-xl">Seguimiento #{{ orderId }}</h1>
            </div>
            <button @click="goBack" class="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-600 transition hover:bg-orange-100 sm:text-sm">Volver a Pedidos</button>
        </header>

        <div v-if="errorMessage" class="mx-auto mt-6 max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {{ errorMessage }}
        </div>

        <div v-if="warnings.length > 0" class="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
            {{ warnings[0] }}
        </div>

        <div v-if="order" class="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] lg:p-8">
            <div class="space-y-6">
                <OrderTrackingMap :order="order" :status-label="rawStatusLabel" />

                <div class="rounded-[1.75rem] border border-red-100 bg-white p-5 shadow-sm" role="status" aria-live="polite">
                    <div class="flex items-start gap-4">
                        <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-2xl text-orange-500">
                            <i :class="overlayIcon" aria-hidden="true"></i>
                        </div>
                        <div>
                            <p class="text-xl font-black text-slate-900">{{ currentStatusLabel }}</p>
                            <p class="mt-1 text-sm font-medium text-gray-500">Ultima actualizacion: {{ formatDate(order.createdAt) }}</p>
                            <p v-if="order.source === 'local'" class="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                                Este pedido esta guardado localmente. Todavia no esta confirmado por el servidor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <aside class="space-y-6">
                <div class="relative space-y-8 rounded-[1.75rem] border border-gray-100 bg-white p-6 pl-10 shadow-sm before:absolute before:left-[31px] before:top-8 before:h-[calc(100%-4rem)] before:w-0.5 before:bg-gray-100" role="list" aria-label="Progreso del pedido">
                    <div v-for="(step, index) in steps" :key="step.label" class="relative" role="listitem">
                        <div
                            class="absolute -left-[31px] top-3 z-10 h-4 w-4 rounded-full border-4 border-white shadow-sm transition-all duration-500"
                            :class="index <= currentStep && !isCancelled ? 'bg-green-500 scale-125' : 'bg-gray-200'"
                            :aria-hidden="true"
                        ></div>

                        <div class="flex items-center gap-4 transition-opacity duration-500" :class="index <= currentStep && !isCancelled ? 'opacity-100' : 'opacity-40'">
                            <div
                                class="flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-sm transition-colors duration-500"
                                :class="index <= currentStep && !isCancelled ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'"
                                :aria-hidden="true"
                            >
                                <i :class="step.icon"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-800">{{ step.label }}</h3>
                                <p v-if="isCancelled && index === 0" class="text-xs font-bold text-red-500">Pedido cancelado</p>
                                <p v-else-if="index === currentStep && !isCancelled" class="text-xs text-gray-400">{{ index === 0 ? 'Esperando respuesta del local' : index === steps.length - 1 ? 'Pedido completado' : 'En progreso...' }}</p>
                                <p v-else-if="index < currentStep && !isCancelled" class="text-xs font-bold text-green-500">Completado</p>
                            </div>
                        </div>
                    </div>
                </div>

            <div class="space-y-4 rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-gray-500">Local</span>
                    <span class="text-right font-bold text-slate-800">{{ order.tenantName || 'FoodRush' }}</span>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-gray-500">Cliente</span>
                    <span class="text-right font-bold text-slate-800">{{ order.customerName || 'Cliente FoodRush' }}</span>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-gray-500">Direccion</span>
                    <span class="w-1/2 text-right text-sm font-medium text-slate-800">{{ order.address || 'Recogida en tienda' }}</span>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-gray-500">Total</span>
                    <span class="text-lg font-bold text-slate-800">{{ formatCurrency(order.totalValue || order.total) }}</span>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-gray-500">Repartidor</span>
                    <span class="text-right font-bold text-slate-800">{{ order.driverName || 'Pendiente de asignacion' }}</span>
                </div>
            </div>

            <div class="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
                <h2 class="text-sm font-bold uppercase tracking-wide text-slate-500">Lo que pediste</h2>
                <div class="mt-4 space-y-3">
                    <div v-for="item in order.itemsDetailed" :key="item.id" class="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div>
                            <p class="font-bold text-slate-800">{{ item.quantity }}x {{ item.name }}</p>
                            <p class="text-xs text-gray-500">Unidad {{ formatCurrency(item.unitPrice) }}</p>
                        </div>
                        <span class="font-bold text-slate-800">{{ formatCurrency(item.subtotal) }}</span>
                    </div>
                    <p v-if="order.itemsDetailed?.length === 0" class="text-sm font-bold text-gray-500">{{ order.itemSummary || 'Sin detalle del pedido.' }}</p>
                </div>
            </div>
            </aside>
        </div>

        <div v-else class="flex min-h-[50vh] flex-col items-center justify-center p-10 text-center text-gray-500">
            <i :class="isLoading ? 'fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-orange-500' : 'fa-solid fa-receipt text-4xl mb-4 text-gray-300'"></i>
            <p class="text-lg">{{ isLoading ? 'Cargando pedido...' : 'No se encontro la informacion del pedido.' }}</p>
        </div>
    </div>
</template>
