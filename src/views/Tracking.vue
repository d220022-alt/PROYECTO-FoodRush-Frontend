<!--
  Guia rapida para presentar:
  Seguimiento del pedido. Mezcla backend, cache local y dataset QA para mostrar estado, mapa y codigo.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';
import { buildTenantHeaders, fetchOperationalDataset, getOrderProgressStep, getStatusLabel, normalizeStatusKey } from '../services/operations';
import { connectRealtime } from '../services/realtime';
import { APP_EVENTS, getCachedOrderById, getSession, saveCachedOrder } from '../services/storage';
import { resolveDeliveryCode } from '../utils/deliveryCode';
import OrderTrackingMap from '../components/OrderTrackingMap.vue';

const route = useRoute();
const router = useRouter();
const session = getSession();

const order = ref(null);
const warnings = ref([]);
const errorMessage = ref('');
const realtimeWarning = ref('');
const isDeliveryCodeConfirmed = ref(false);
const isLoading = ref(true);
const AUTO_REFRESH_INTERVAL_MS = 20000;
const REALTIME_REFRESH_DEBOUNCE_MS = 1500;

const steps = [
    { label: 'Solicitado', icon: 'fa-solid fa-clipboard-check' },
    { label: 'Preparando', icon: 'fa-solid fa-fire-burner' },
    { label: 'En Camino', icon: 'fa-solid fa-motorcycle' },
    { label: 'Entregado', icon: 'fa-solid fa-flag-checkered' },
];

let refreshTimer = null;
let realtimeConnection = null;
let realtimeTenantId = '';
let realtimeRefreshTimer = null;
let fetchOrderPromise = null;

const orderId = computed(() => route.params.id);
const currentUserEmail = computed(() => getSession().userEmail || session.userEmail || localStorage.getItem('user_email') || '');
const safeText = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    const normalized = String(value).trim();
    return normalized || fallback;
};
const toNumber = (value, fallback = 0) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
// Los IDs numericos vienen de la DB; los qa-* o local-* se resuelven en el dataset operativo.
const isBackendOrderId = (value) => /^\d+$/.test(safeText(value));

const rawStatusLabel = computed(() => order.value?.statusLabel || order.value?.estado?.descripcion || 'Pendiente');
const currentStatusKey = computed(() => normalizeStatusKey(rawStatusLabel.value));
const currentStatusLabel = computed(() => {
    const statusKey = currentStatusKey.value;
    const source = String(order.value?.source || '').toLowerCase();

    if (statusKey === 'cancelado') return 'Pedido cancelado';
    if (statusKey === 'entregado') return 'Pedido entregado';
    if (statusKey === 'en camino') return 'Repartidor en camino';
    if (statusKey === 'preparando') return 'Preparando en el local';
    if (source === 'local') return 'Pendiente de sincronizar';
    return 'Pendiente de confirmacion';
});
const currentProgress = computed(() => getOrderProgressStep(rawStatusLabel.value));
const currentStep = computed(() => Math.max(0, currentProgress.value - 1));
const isCancelled = computed(() => String(currentStatusLabel.value || '').toLowerCase().includes('cancelado'));
const overlayIcon = computed(() => (isCancelled.value ? 'fa-solid fa-ban' : steps[currentStep.value]?.icon || steps[0].icon));
const deliverySecurityCode = computed(() => {
    return resolveDeliveryCode(order.value || {}, orderId.value);
});

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
        statusLabel: cachedOrder.statusLabel || cachedOrder.status || cachedOrder.estado?.descripcion || 'Pendiente',
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
        securityCode: resolveDeliveryCode(cachedOrder, cachedOrder.id || orderId.value),
        source: cachedOrder.source || 'local',
    };
};

const normalizeRemoteOrderDetail = (remoteOrder = {}, baseOrder = {}, tenantMeta = {}) => {
    const mergedOrder = { ...baseOrder, ...remoteOrder };
    const id = safeText(remoteOrder.id || baseOrder.id || orderId.value);
    const tenantId = safeText(remoteOrder.tenant_id || remoteOrder.tenantId || baseOrder.tenantId || tenantMeta.id || route.query.tenant);
    const statusId = Number.parseInt(remoteOrder.estado_id ?? remoteOrder.estado?.id ?? baseOrder.statusId, 10) || 1;
    const statusLabel = getStatusLabel({
        ...mergedOrder,
        estado_id: statusId,
        estado: remoteOrder.estado || baseOrder.estado,
        statusLabel: remoteOrder.statusLabel,
    });
    const statusKey = normalizeStatusKey(remoteOrder.estado?.codigo || statusLabel);
    const rawItems = Array.isArray(remoteOrder.items) ? remoteOrder.items : [];
    const itemsDetailed = rawItems.length
        ? rawItems.map((item, index) => {
            const quantity = toNumber(item.cantidad ?? item.qty, 1);
            const unitPrice = toNumber(item.precio_unitario ?? item.price ?? item.producto?.precio ?? item.product?.price, 0);

            return {
                id: safeText(item.id, `${id}-item-${index + 1}`),
                productId: safeText(item.producto_id || item.productoId || item.producto?.id),
                name: safeText(item.nombre || item.name || item.producto?.nombre || item.product?.name, 'Producto'),
                quantity,
                unitPrice,
                subtotal: toNumber(item.subtotal, quantity * unitPrice),
            };
        })
        : baseOrder.itemsDetailed || [];

    return {
        ...mergedOrder,
        id,
        tenantId,
        tenantName: safeText(baseOrder.tenantName || tenantMeta.name || remoteOrder.tenant?.nombre, 'FoodRush'),
        customerName: safeText(remoteOrder.cliente?.nombre || baseOrder.customerName || remoteOrder.user_name, 'Cliente FoodRush'),
        customerPhone: safeText(remoteOrder.cliente?.telefono || baseOrder.customerPhone || remoteOrder.telefono),
        customerEmail: safeText(remoteOrder.cliente?.correo || baseOrder.customerEmail || remoteOrder.user_email),
        address: safeText(remoteOrder.direccion_entrega || baseOrder.address || remoteOrder.address, 'Recogida en tienda'),
        totalValue: toNumber(remoteOrder.total ?? baseOrder.totalValue ?? baseOrder.total),
        createdAt: safeText(remoteOrder.actualizado_en || remoteOrder.creado_en || baseOrder.createdAt, new Date().toISOString()),
        statusId,
        statusLabel,
        statusKey,
        progressStep: getOrderProgressStep(statusLabel),
        securityCode: resolveDeliveryCode(mergedOrder, id),
        driverName: safeText(remoteOrder.repartidor?.nombre || remoteOrder.repartidor_nombre || baseOrder.driverName),
        driverEmail: safeText(remoteOrder.repartidor_email || baseOrder.driverEmail),
        deliveryAssignment: baseOrder.deliveryAssignment,
        driverLocation: baseOrder.driverLocation || null,
        itemsDetailed,
        itemSummary: itemsDetailed.length
            ? itemsDetailed.map((item) => `${item.quantity}x ${item.name}`).join(', ')
            : baseOrder.itemSummary || 'Sin detalle del pedido.',
        source: 'remote',
    };
};

// Carga el pedido sin romper la pantalla: primero cache/dataset, y solo consulta backend si el ID es real.
const fetchOrder = async ({ silent = false } = {}) => {
    if (silent && document.visibilityState === 'hidden') return null;
    if (fetchOrderPromise) return fetchOrderPromise;

    const task = (async () => {
        warnings.value = [];
        if (!silent) errorMessage.value = '';
        const cachedOrder = normalizeCachedOrder(getCachedOrderById(orderId.value, currentUserEmail.value));
        if (cachedOrder) {
            order.value = cachedOrder;
            if (cachedOrder.source === 'local') {
                isLoading.value = false;
                return order.value;
            }
        }

        try {
            if (!silent) isLoading.value = true;
            const requestedOrderId = String(orderId.value || '');
            const selectedTenantId = String(route.query.tenant || cachedOrder?.tenantId || 'Global');

            const dataset = await fetchOperationalDataset({
                selectedTenantId,
                includeSessions: false,
            });

            let resolvedDataset = dataset;
            let remoteOrder = (dataset.orders || []).find((entry) => String(entry.id) === requestedOrderId) || null;

            if (!remoteOrder && !isBackendOrderId(requestedOrderId) && selectedTenantId !== 'Global') {
                resolvedDataset = await fetchOperationalDataset({
                    selectedTenantId: 'Global',
                    includeSessions: false,
                });
                remoteOrder = (resolvedDataset.orders || []).find((entry) => String(entry.id) === requestedOrderId) || null;
            }

            const resolvedTenantId = remoteOrder?.tenantId || remoteOrder?.tenant_id || selectedTenantId;
            const tenantMeta = (resolvedDataset.tenants || []).find((tenant) => String(tenant.id) === String(resolvedTenantId)) || {};
            let authoritativeOrder = remoteOrder;

            if (selectedTenantId && selectedTenantId !== 'Global' && isBackendOrderId(requestedOrderId)) {
                try {
                    const detailResponse = await api.getOrder(requestedOrderId, buildTenantHeaders(selectedTenantId));
                    if (detailResponse?.data) {
                        authoritativeOrder = normalizeRemoteOrderDetail(detailResponse.data, remoteOrder || cachedOrder || {}, tenantMeta);
                    }
                } catch (detailError) {
                    if (!remoteOrder) {
                        throw detailError;
                    }
                    console.warn('No se pudo cargar el detalle autoritativo del pedido', detailError);
                }
            }

            if (authoritativeOrder) {
                const ownerEmail = authoritativeOrder.customerEmail || cachedOrder?.user_email || currentUserEmail.value;
                if (ownerEmail) {
                    saveCachedOrder(
                        {
                            ...authoritativeOrder,
                            tenant_id: authoritativeOrder.tenantId || authoritativeOrder.tenant_id,
                            user_email: ownerEmail,
                            user_name: authoritativeOrder.customerName,
                            source: 'remote',
                        },
                        ownerEmail,
                    );
                }
                order.value = {
                    ...authoritativeOrder,
                    driverLocation: order.value?.driverLocation || null,
                };
                warnings.value = [];
            } else if (!cachedOrder) {
                warnings.value = resolvedDataset.warnings || dataset.warnings || [];
            }
            return order.value;
        } catch (error) {
            console.error('Error fetching order', error);
            if (!order.value) {
                errorMessage.value = error.message || 'No se pudo cargar el pedido.';
            }
            return null;
        } finally {
            if (!order.value) {
                order.value = cachedOrder;
            }

            isLoading.value = false;
            setupRealtimeConnection();
        }
    })();

    fetchOrderPromise = task;
    task.finally(() => {
        if (fetchOrderPromise === task) fetchOrderPromise = null;
    });
    return task;
};

const closeRealtimeConnection = () => {
    realtimeConnection?.close();
    realtimeConnection = null;
    realtimeTenantId = '';
};

const queueRealtimeOrderRefresh = () => {
    if (realtimeRefreshTimer) return;
    realtimeRefreshTimer = window.setTimeout(() => {
        realtimeRefreshTimer = null;
        void fetchOrder({ silent: true });
    }, REALTIME_REFRESH_DEBOUNCE_MS);
};

watch(orderId, () => {
    isDeliveryCodeConfirmed.value = false;
});

const setupRealtimeConnection = () => {
    const tenantId = order.value?.tenantId || route.query.tenant;
    if (!tenantId || String(tenantId) === 'Global' || String(tenantId) === realtimeTenantId) return;

    closeRealtimeConnection();
    realtimeTenantId = String(tenantId);
    realtimeConnection = connectRealtime({
        tenantId,
        onEvent(message) {
            const data = message.data || {};
            const messageOrderId = data.order_id || data.pedido_id || data.orderId || data.assignment?.orderId;
            if (String(messageOrderId) !== String(orderId.value)) return;

            if (message.event === 'driver-location') {
                realtimeWarning.value = '';
                order.value = {
                    ...order.value,
                    driverLocation: {
                        lat: data.lat,
                        lng: data.lng ?? data.lon,
                        stage: data.stage,
                        recordedAt: data.recorded_at,
                    },
                };
                return;
            }

            if (['order-updated', 'order-cancelled', 'delivery-assigned'].includes(message.event)) {
                realtimeWarning.value = '';
                queueRealtimeOrderRefresh();
            }
        },
        onError(error) {
            console.warn('Realtime tracking no disponible', error);
            realtimeWarning.value = 'Actualizacion en vivo no disponible. Seguimos revisando el pedido automaticamente cada 20 segundos.';
        },
    });
};

const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible') {
        void fetchOrder({ silent: true });
    }
};

const refreshFromStorageEvent = () => {
    void fetchOrder({ silent: true });
};

onMounted(async () => {
    await fetchOrder();
    window.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener(APP_EVENTS.ordersChanged, refreshFromStorageEvent);
    refreshTimer = window.setInterval(() => {
        void fetchOrder({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);
});

onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer);
    if (realtimeRefreshTimer) window.clearTimeout(realtimeRefreshTimer);
    window.removeEventListener('visibilitychange', refreshWhenVisible);
    window.removeEventListener('focus', refreshWhenVisible);
    window.removeEventListener(APP_EVENTS.ordersChanged, refreshFromStorageEvent);
    closeRealtimeConnection();
});

const goHome = () => router.push('/');
const goBack = () => router.push('/orders');
</script>

<template>
    <div class="min-h-screen bg-[#fffaf5] font-sans">
        <header class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-white/95 p-4 backdrop-blur sm:p-6">
            <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">FoodRush Tracking</p>
                <h1 class="break-words text-lg font-black text-slate-900 sm:text-xl">Seguimiento #{{ orderId }}</h1>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
                <button @click="goHome" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-700 sm:text-sm">
                    <i class="fa-solid fa-house mr-1"></i>
                    Inicio
                </button>
                <button @click="goBack" class="rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-orange-600 transition hover:bg-orange-100 sm:text-sm">Volver a Pedidos</button>
            </div>
        </header>

        <div v-if="errorMessage" class="mx-auto mt-6 max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {{ errorMessage }}
        </div>

        <div v-if="warnings.length > 0" class="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
            {{ warnings[0] }}
        </div>

        <div v-if="realtimeWarning" class="mx-auto mt-4 flex max-w-lg items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700" role="status" aria-live="polite">
            <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
            <div>
                <p>{{ realtimeWarning }}</p>
                <button type="button" class="mt-2 text-[11px] font-black uppercase text-amber-800 underline" @click="fetchOrder({ silent: false })">
                    Actualizar ahora
                </button>
            </div>
        </div>

        <div v-if="order" class="mx-auto grid max-w-6xl gap-4 p-3 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] lg:p-8">
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

                <div class="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-sm">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p class="text-[11px] font-black uppercase tracking-[0.25em] text-orange-500">Codigo de entrega</p>
                            <p class="mt-2 text-3xl font-black tracking-[0.2em] text-slate-900">{{ deliverySecurityCode }}</p>
                            <p class="mt-2 text-sm font-bold text-slate-500">
                                Comparte este codigo con el repartidor solamente cuando tengas el pedido en tus manos.
                            </p>
                        </div>
                        <button
                            type="button"
                            class="rounded-2xl px-4 py-3 text-xs font-black transition"
                            :class="isDeliveryCodeConfirmed ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-slate-700'"
                            @click="isDeliveryCodeConfirmed = true"
                        >
                            <i class="fa-solid mr-2" :class="isDeliveryCodeConfirmed ? 'fa-circle-check' : 'fa-check'"></i>
                            {{ isDeliveryCodeConfirmed ? 'Codigo confirmado' : 'Confirmar codigo' }}
                        </button>
                    </div>
                </div>
            </div>

            <aside class="space-y-6">
                <div class="tracking-progress-timeline relative space-y-7 rounded-[1.5rem] border border-gray-100 bg-white p-4 pl-9 shadow-sm before:absolute before:left-[27px] before:top-8 before:h-[calc(100%-4rem)] before:w-0.5 before:bg-gray-100 sm:space-y-8 sm:rounded-[1.75rem] sm:p-6 sm:pl-10 sm:before:left-[31px]" role="list" aria-label="Progreso del pedido">
                    <div v-for="(step, index) in steps" :key="step.label" class="relative" role="listitem">
                        <div
                            class="tracking-progress-dot absolute -left-[31px] top-3 z-10 h-4 w-4 rounded-full border-4 border-white shadow-sm transition-all duration-500"
                            :class="index <= currentStep && !isCancelled ? 'bg-green-500 scale-125' : 'bg-gray-200'"
                            :aria-hidden="true"
                        ></div>

                        <div class="flex items-center gap-4 transition-opacity duration-500" :class="index <= currentStep && !isCancelled ? 'opacity-100' : 'opacity-40'">
                            <div
                                class="tracking-progress-icon flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-sm transition-colors duration-500"
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
                <div class="flex items-start justify-between gap-4">
                    <span class="text-gray-500">Local</span>
                    <span class="text-right font-bold text-slate-800">{{ order.tenantName || 'FoodRush' }}</span>
                </div>

                <div class="flex items-start justify-between gap-4">
                    <span class="text-gray-500">Cliente</span>
                    <span class="text-right font-bold text-slate-800">{{ order.customerName || 'Cliente FoodRush' }}</span>
                </div>

                <div class="flex items-start justify-between gap-4">
                    <span class="text-gray-500">Direccion</span>
                    <span class="max-w-[70%] break-words text-right text-sm font-medium text-slate-800">{{ order.address || 'Recogida en tienda' }}</span>
                </div>

                <div class="flex items-start justify-between gap-4">
                    <span class="text-gray-500">Total</span>
                    <span class="text-lg font-bold text-slate-800">{{ formatCurrency(order.totalValue || order.total) }}</span>
                </div>

                <div class="flex items-start justify-between gap-4">
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

<style scoped>
html.foodrush-dark .tracking-progress-timeline::before {
    width: 1px;
    background: linear-gradient(180deg, rgba(34, 197, 94, 0.48), rgba(148, 163, 184, 0.22), rgba(148, 163, 184, 0.08)) !important;
    box-shadow: none;
}

html.foodrush-dark .tracking-progress-dot {
    border-color: #101827 !important;
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.28);
}

html.foodrush-dark .tracking-progress-dot.bg-gray-200 {
    background-color: #334155 !important;
}

html.foodrush-dark .tracking-progress-icon.bg-gray-50 {
    background-color: rgba(15, 23, 42, 0.86) !important;
    color: #64748b !important;
}
</style>
