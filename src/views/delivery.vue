<!--
  Guia rápida para presentar:
  App del repartidor. Muestra viajes disponibles, viajes activos, wallet y perfil.
  Buscar en VS Code: delivery, repartidor, nuevos, paginacion, aceptar viaje, mapa, confirmar entrega, wallet.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { api } from '../services/api';
import { getQaOrderStatusPatch, isQaOrder, setQaOrderOverride } from '../data/qaOperationalDataset';
import { ORDER_STATUS_CODES, buildTenantHeaders, fetchOperationalDataset, normalizeStatusKey } from '../services/operations';
import { connectRealtime } from '../services/realtime';
import { APP_EVENTS, clearDeliveryAssignment, clearSession, getSession, setDeliveryAssignment, updateCachedOrderStatus } from '../services/storage';
import { useTheme } from '../services/theme';
import { normalizeDeliveryCodeInput, resolveDeliveryCode } from '../utils/deliveryCode';
import { useCurrency } from '../utils/currency';
import { SANTIAGO_CENTER, buildFallbackRoute, fetchStreetRoute, getCustomerLocation, getPointAlongRoute, getStoreLocation } from '../utils/deliveryMap';

const STORAGE_KEY = 'FoodRush_Delivery_Real_V2';
const TUTORIAL_KEY = 'FoodRush_Tutorial_Final';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const coordsSantiago = [SANTIAGO_CENTER.lat, SANTIAGO_CENTER.lng];
const AUTO_REFRESH_INTERVAL_MS = 20000;
const REALTIME_REFRESH_DEBOUNCE_MS = 1500;
const AVAILABLE_ORDERS_PAGE_SIZE = 8;
const MAX_ACTIVE_DELIVERY_ORDERS = 3;
const FIRST_ORDER_ZONE_RADIUS_KM = 4;
const UNACCEPTED_ORDER_CANCEL_MS = 3 * 60 * 60 * 1000;
const ACCEPTED_FREE_DELIVERY_MS = 60 * 60 * 1000;
const DELIVERY_WALLET_PAYOUT_RATE = 0.3;

const onboardingSteps = [
    { number: 1, badgeClass: 'bg-[#ffedd5] text-[#ea580c]', title: 'Eres tu propio jefe', description: 'El horario es <b>100% flexible</b>. No es obligatorio trabajar en horas específicas. Tú decides cuándo conectarte y hacer dinero.' },
    { number: 2, badgeClass: 'bg-blue-100 text-blue-600', title: 'Iniciar Turno', description: 'Para empezar a recibir viajes, ve a la pestaña <b>Perfil</b> y presiona el botón verde de "INICIAR TURNO".' },
    { number: 3, badgeClass: 'bg-slate-200 text-slate-600', title: 'Días libres y ausencias', description: 'Si pasas un día entero sin trabajar, la app te enviará una notificación preguntando por qué. Es solo para saber que estás bien, <b>no hay penalizaciones</b>.' },
    { number: 4, badgeClass: 'bg-[#eab308] text-white', title: 'Pantalla de Viajes', description: 'Ve a la pestaña de <b>Viajes</b>. Aquí irán apareciendo los pedidos de comida cercanos a ti.' },
    { number: 5, badgeClass: 'bg-[#f97316] text-white', title: 'Aceptar un Pedido', description: 'Revisa cuánto te pagarán y a dónde va el pedido. Si te conviene, presiona <b>"ACEPTAR VIAJE"</b> rápido antes que otro repartidor.' },
    { number: 6, badgeClass: 'bg-slate-800 text-white', title: 'Mapa hacia el Local', description: 'Al aceptar, aparecerá un mapa inteligente. Sigue la ruta naranja hasta el restaurante y al llegar presiona <b>"LLEGUÉ AL LOCAL"</b>.' },
    { number: 7, badgeClass: 'bg-orange-400 text-white', title: 'Recoger Comida', description: 'Dale tu número de orden al cajero. Cuando te entreguen la mochila, presiona <b>"¡RECIBÍ COMIDA!"</b>.' },
    { number: 8, badgeClass: 'bg-green-400 text-white', title: 'Ruta al Cliente', description: 'El mapa cambiará para guiarte a la casa del cliente. Conduce con cuidado siguiendo la ruta verde.' },
    { number: 9, badgeClass: 'bg-purple-500 text-white', title: 'Evidencia Fotográfica', description: 'Al entregar, la app te exigirá abrir tu cámara. <b>Debes tomar una foto</b> del paquete en la puerta del cliente para comprobar la entrega.' },
    { number: 10, badgeClass: 'bg-[#22c55e] text-white', title: 'Recibe tu Pago', description: 'Tan pronto envíes la foto, el costo del viaje y las propinas se sumarán automáticamente a tu cuenta.' },
    { number: 11, badgeClass: 'bg-blue-400 text-white', title: 'Wallet y Retiros', description: 'En la pestaña <b>Wallet</b> verás tu dinero acumulado. Usa el botón "Retirar Dinero" para enviarlo a tu banco cuando quieras.' },
    { number: 12, badgeClass: 'bg-[#ef4444] text-white', title: 'Emergencias (SOS)', description: 'Si tienes un accidente, asalto o duda, ve a tu Perfil y abre el <b>Centro de Ayuda</b> o usa el botón rojo de <b>Emergencia SOS</b>.' },
];

const defaultState = () => ({
    status: 'offline',
    currentShiftStart: null,
    shiftHistory: [],
    lastWorkDate: null,
    absenceReported: false,
    earnings: 0,
    tips: 0,
    trips: 0,
    tenant: 'Global',
    dismissedOrderIds: [],
    activeOrderId: '',
    activeStage: '',
    activeOrder: null,
    activeOrderIds: [],
    activeStagesById: {},
    activeOrders: [],
    availableOrders: [],
    tripHistory: [],
    history: [],
});

const session = getSession();
const router = useRouter();
const { isDarkMode, toggleTheme } = useTheme();
const { formatCurrency } = useCurrency();
const state = reactive(defaultState());

// Dataset operativo recibido desde services/operations: pedidos, franquicias y sesiones conectadas.
const data = ref({ tenants: [], orders: [], warnings: [], connectedUsers: [], sessions: [] });
const currentView = ref('orders');
const currentTab = ref('available');
const availablePage = ref(1);
const activePage = ref('');
const activeModal = ref('');
const onboardingVisible = ref(false);
const toasts = ref([]);
const shiftTimerText = ref('00:00:00');
const withdrawInput = ref('');
const reportId = ref('');
const reportEvidence = ref(null);
const reportFileName = ref('Toca para subir captura de pantalla');
const reportFileLoaded = ref(false);
const deliveryConfirmCode = ref('');
const deliveryProofFile = ref(null);
const deliveryProofFileName = ref('Toca para tomar foto de entrega');
const deliveryProofAccepted = ref(false);
const isWithdrawing = ref(false);
const isSubmittingReport = ref(false);
const isLoading = ref(true);
const isRefreshing = ref(false);
const isAdvancing = ref(false);
const errorMessage = ref('');
const realtimeWarning = ref('');
const lastUpdatedAt = ref('');
const mapEl = ref(null);
const cameraInput = ref(null);
const reportEvidenceInput = ref(null);

let toastId = 0;
let timerInterval = null;
let refreshTimer = null;
let leaflet = null;
let mapInstance = null;
let riderMarker = null;
let routeLayers = [];
let currentRoute = null;
let routeRequestId = 0;
let routeAbortController = null;
let realtimeRefreshTimer = null;
let realtimeConnections = [];
let lastLocationReportKey = '';
let refreshPromise = null;
const scheduledTimeouts = [];

const dedupeMessages = (values = []) => [...new Set(values.filter(Boolean))];
const normalize = (value = '') => String(value || '').trim().toLowerCase();
const orderStatusKey = (order = {}) => normalizeStatusKey(order.statusKey || order.statusLabel || order.estado?.codigo || order.estado?.descripcion);
const toTimestamp = (value) => {
    const timestamp = new Date(value || '').getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
};
const hasDriverAssignment = (order = {}) => Boolean(order.deliveryAssignment?.driverEmail || order.deliveryAssignment?.driverId || order.driverEmail || order.driverName);
const distanceKm = (left, right) => {
    if (!left || !right) return 0;
    const toRadians = (value) => (Number(value) * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latDiff = toRadians(right.lat - left.lat);
    const lngDiff = toRadians(right.lng - left.lng);
    const leftLat = toRadians(left.lat);
    const rightLat = toRadians(right.lat);
    const a = Math.sin(latDiff / 2) ** 2 + Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(lngDiff / 2) ** 2;
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const queueTimeout = (callback, delay) => {
    const timeoutId = window.setTimeout(() => {
        const index = scheduledTimeouts.indexOf(timeoutId);
        if (index >= 0) scheduledTimeouts.splice(index, 1);
        callback();
    }, delay);

    scheduledTimeouts.push(timeoutId);
    return timeoutId;
};

const clearScheduledTimeouts = () => {
    scheduledTimeouts.splice(0).forEach((timeoutId) => window.clearTimeout(timeoutId));
};

const resolveFranchisePresentation = (tenantName = '') => {
    const name = normalize(tenantName);
    if (name.includes('burger')) return { emoji: '🍔', color: 'bg-orange-100 text-orange-600' };
    if (name.includes('pizza') || name.includes('domino') || name.includes('caesar') || name.includes('pizzarelli')) return { emoji: '🍕', color: 'bg-red-100 text-red-600' };
    if (name.includes('starbucks') || name.includes('cafe')) return { emoji: '☕', color: 'bg-emerald-100 text-emerald-700' };
    if (name.includes('kfc') || name.includes('pollo')) return { emoji: '🍗', color: 'bg-rose-100 text-rose-600' };
    if (name.includes('taco')) return { emoji: '🌮', color: 'bg-yellow-100 text-yellow-700' };
    if (name.includes('krispy')) return { emoji: '🍩', color: 'bg-green-100 text-green-600' };
    if (name.includes('helados') || name.includes('bon')) return { emoji: '🍨', color: 'bg-pink-100 text-pink-600' };
    if (name.includes('hot dog')) return { emoji: '🌭', color: 'bg-amber-100 text-amber-700' };
    if (name.includes('chili')) return { emoji: '🌶️', color: 'bg-red-100 text-red-500' };
    if (name.includes('panda')) return { emoji: '🥡', color: 'bg-slate-100 text-slate-700' };
    return { emoji: '🛍️', color: 'bg-slate-100 text-slate-600' };
};

const resolveSecurityCode = (order = {}) => {
    return resolveDeliveryCode(order, order.id);
};

const hasFreeDelivery = (order = {}) => Boolean(order.deliveryFeeWaived || order.envioGratis || order.deliveryAssignment?.deliveryFeeWaived);
const resolveDeliveryGrossPayment = (order = {}) => {
    const deliveryFee = Number(order.deliveryFee ?? order.delivery_fee ?? 0);
    const deliveryTip = Number(order.deliveryTip ?? order.delivery_tip ?? order.driverTip ?? order.driver_tip ?? 0);
    const gross = Math.max(0, deliveryFee) + Math.max(0, deliveryTip);
    return gross > 0 ? gross : Number(order.price || order.totalValue || 0);
};

const driverIdentity = () => ({
    driverName: session.userName || session.userEmail || 'Repartidor FoodRush',
    driverEmail: session.userEmail || '',
});

// Para presentar: enlaza un pedido con un repartidor y guarda la asignacion para que Admin/Tracking la vean.
const syncDeliveryAssignment = async (order, stage, status = stage) => {
    const identity = driverIdentity();
    if (isQaOrder(order)) {
        const assignment = {
            orderId: order.id,
            pedido_id: order.id,
            tenantId: order.tenantId,
            tenant_id: order.tenantId,
            driverId: session.userId || 'qa-delivery-driver',
            repartidor_id: session.userId || 'qa-delivery-driver',
            stage,
            status,
            assignedAt: order.deliveryAssignment?.assignedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deliveryFeeWaived: Boolean(order.deliveryAssignment?.deliveryFeeWaived || order.deliveryFeeWaived),
            deliveryFreeReason: order.deliveryAssignment?.deliveryFreeReason || order.deliveryFreeReason || '',
            deliveryFeeWaivedAt: order.deliveryAssignment?.deliveryFeeWaivedAt || '',
            ...identity,
        };

        setDeliveryAssignment(order.id, assignment);
        setQaOrderOverride(order.id, {
            deliveryAssignment: assignment,
            driverName: identity.driverName,
            driverEmail: identity.driverEmail,
        });
        return assignment;
    }

    const response = await api.upsertDeliveryAssignment({
        orderId: order.id,
        pedido_id: order.id,
        stage,
        status,
        deliveryFeeWaived: Boolean(order.deliveryAssignment?.deliveryFeeWaived || order.deliveryFeeWaived),
        deliveryFreeReason: order.deliveryAssignment?.deliveryFreeReason || order.deliveryFreeReason || '',
        deliveryFeeWaivedAt: order.deliveryAssignment?.deliveryFeeWaivedAt || '',
        ...identity,
    }, buildTenantHeaders(order.tenantId));

    const assignment = response?.data || {};
    setDeliveryAssignment(order.id, {
        ...assignment,
        tenantId: order.tenantId,
        status,
        stage,
        deliveryFeeWaived: Boolean(order.deliveryAssignment?.deliveryFeeWaived || order.deliveryFeeWaived),
        deliveryFreeReason: order.deliveryAssignment?.deliveryFreeReason || order.deliveryFreeReason || '',
        deliveryFeeWaivedAt: order.deliveryAssignment?.deliveryFeeWaivedAt || '',
        ...identity,
    });

    return assignment;
};

const reportDriverLocation = async (point, stage = '') => {
    if (!point || !state.activeOrder) return;

    const key = [
        state.activeOrder.id,
        stage,
        Number(point.lat).toFixed(5),
        Number(point.lng).toFixed(5),
    ].join(':');

    if (key === lastLocationReportKey) return;
    lastLocationReportKey = key;

    if (isQaOrder(state.activeOrder)) return;

    try {
        await api.recordDriverLocation({
            orderId: state.activeOrder.id,
            pedido_id: state.activeOrder.id,
            repartidor_id: state.activeOrder.deliveryAssignment?.driverId || state.activeOrder.deliveryAssignment?.repartidor_id || null,
            lat: point.lat,
            lon: point.lng,
            stage,
        }, buildTenantHeaders(state.activeOrder.tenantId));
    } catch (error) {
        console.warn('No se pudo reportar ubicacion del repartidor', error);
    }
};

const deriveActiveStage = (order = {}) => {
    const orderId = String(order.id || '');
    if (orderId && state.activeStagesById?.[orderId]) return state.activeStagesById[orderId];
    const assignmentStage = normalize(order.deliveryAssignment?.stage || order.deliveryAssignment?.status || order.assignmentStage || order.assignmentStatus);
    if (assignmentStage.includes('arrived_customer') || assignmentStage.includes('arrived customer')) return 'arrived_customer';
    if (assignmentStage.includes('picked') || assignmentStage.includes('en camino')) return 'picked';
    if (assignmentStage.includes('arrived')) return 'arrived';
    return orderStatusKey(order) === 'en camino' ? 'picked' : 'accepted';
};

const buildOrderDescription = (order = {}) => {
    const itemLines = Array.isArray(order.itemsDetailed) && order.itemsDetailed.length > 0
        ? order.itemsDetailed.map((item) => `• ${item.quantity}x ${item.name}`).join('\n')
        : `• ${order.itemSummary || 'Sin detalle del pedido'}`;

    return [`Pedido #${order.id}`, `Local: ${order.tenantName}`, `Cliente: ${order.customerName}`, `Telefono: ${order.customerPhone || 'Sin telefono'}`, 'Artículos:', itemLines].join('\n');
};

// Para presentar: normaliza cada pedido para que la app del repartidor tenga un formato unico.
const buildOrderView = (order = {}, status = 'pending') => {
    const presentation = resolveFranchisePresentation(order.tenantName);
    const backendStatusKey = orderStatusKey(order);
    const compactItems = Array.isArray(order.itemsDetailed) && order.itemsDetailed.length > 0
        ? order.itemsDetailed.slice(0, 2).map((item) => `${item.quantity}x ${item.name}`).join(' • ')
        : order.itemSummary || 'Sin detalle';

    return {
        ...order,
        franchise: { id: order.tenantId, name: order.tenantName, emoji: presentation.emoji, color: presentation.color, items: compactItems },
        pickup: `${order.tenantName} • recoger en local`,
        dropoff: order.address || 'Recogida en tienda',
        price: Number(order.totalValue || 0),
        status,
        backendStatusKey,
        canAccept: ['pendiente', 'preparando'].includes(backendStatusKey),
        deliveryFeeWaived: hasFreeDelivery(order),
        deliveryFee: Number(order.deliveryFee ?? order.delivery_fee ?? 0),
        deliveryTip: Number(order.deliveryTip ?? order.delivery_tip ?? order.driverTip ?? order.driver_tip ?? 0),
        codigoDelivery: resolveSecurityCode(order),
        descripcionDetallada: buildOrderDescription(order),
    };
};

const buildQaOrderWithStatus = (order = {}, nextStatus) => ({
    ...order,
    ...getQaOrderStatusPatch(nextStatus),
});

const tenantOptions = computed(() => [
    { value: 'Global', label: '🍽️ Ver todas las tiendas' },
    ...(data.value.tenants || []).map((tenant) => {
        const presentation = resolveFranchisePresentation(tenant.name);
        return { value: tenant.id, label: `${presentation.emoji} ${tenant.name}` };
    }),
]);

const tenantDisplay = computed(() => {
    if (state.tenant === 'Global') return 'Servidor: Todas las tiendas';
    const match = tenantOptions.value.find((option) => String(option.value) === String(state.tenant));
    return match ? `Servidor: ${match.label.replace(/^[^\s]+\s/, '')}` : 'Servidor: Todas las tiendas';
});
const badgeAvail = computed(() => state.availableOrders.length);
const availableTotalPages = computed(() => Math.max(1, Math.ceil(state.availableOrders.length / AVAILABLE_ORDERS_PAGE_SIZE)));
const currentAvailablePage = computed(() => Math.min(Math.max(availablePage.value, 1), availableTotalPages.value));
// Para presentar: paginacion de Nuevos; evita renderizar decenas de pedidos al mismo tiempo en telefono.
const paginatedAvailableOrders = computed(() => {
    const startIndex = (currentAvailablePage.value - 1) * AVAILABLE_ORDERS_PAGE_SIZE;
    return state.availableOrders.slice(startIndex, startIndex + AVAILABLE_ORDERS_PAGE_SIZE);
});
const availablePageLabel = computed(() => {
    if (state.availableOrders.length === 0) return 'Sin pedidos nuevos';
    const start = (currentAvailablePage.value - 1) * AVAILABLE_ORDERS_PAGE_SIZE + 1;
    const end = Math.min(start + AVAILABLE_ORDERS_PAGE_SIZE - 1, state.availableOrders.length);
    return `${start}-${end} de ${state.availableOrders.length}`;
});
const availablePageNumbers = computed(() => {
    const total = availableTotalPages.value;
    const current = currentAvailablePage.value;
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
const activeDeliveryOrders = computed(() => (Array.isArray(state.activeOrders) ? state.activeOrders : []).filter(Boolean));
const badgeActive = computed(() => activeDeliveryOrders.value.length);
const financeBalance = computed(() => formatCurrency(state.earnings));
const statTips = computed(() => formatCurrency(state.tips));
const modalMaxAmount = computed(() => formatCurrency(state.earnings));
const shiftStatusText = computed(() => (state.status === 'online' ? 'Trabajando' : 'Desconectado'));
const isShiftOnline = computed(() => state.status === 'online');
const shiftButtonClasses = computed(() => (
    isShiftOnline.value
        ? 'w-full rounded-xl bg-[#ef4444] py-3.5 text-sm font-black text-white shadow-md transition-colors active:bg-red-600'
        : 'w-full rounded-xl bg-[#22c55e] py-3.5 text-sm font-black text-white shadow-md transition-colors active:bg-green-600'
));
const shiftButtonLabel = computed(() => (isShiftOnline.value ? 'FINALIZAR TURNO' : 'INICIAR TURNO'));
const shiftButtonIcon = computed(() => (isShiftOnline.value ? 'fa-solid fa-stop' : 'fa-solid fa-play'));
const shiftHistory = computed(() => [...state.shiftHistory].reverse());
const financeHistory = computed(() => [...state.history].reverse());
const showShiftTimer = computed(() => isShiftOnline.value && Boolean(state.currentShiftStart));
const showMapWrapper = computed(() => Boolean(state.activeOrder));
const isReportModalOpen = computed(() => activeModal.value === 'modal-report');
const isWithdrawModalOpen = computed(() => activeModal.value === 'modal-withdraw');
const isAbsenceModalOpen = computed(() => activeModal.value === 'modal-absence');
const isDeliveryConfirmModalOpen = computed(() => activeModal.value === 'modal-delivery-confirm');
const supportWarnings = computed(() => dedupeMessages([errorMessage.value, realtimeWarning.value, ...(data.value.warnings || [])]));
const activeOrderMeta = computed(() => {
    if (!state.activeOrder) return null;
    if (state.activeOrder.status === 'accepted') return { title: 'HACIA EL LOCAL', emoji: '🏪', buttonClass: 'bg-[#f97316] text-white', buttonLabel: 'LLEGUE AL LOCAL' };
    if (state.activeOrder.status === 'arrived') return { title: 'ESPERANDO PEDIDO', emoji: '⏳', buttonClass: 'bg-[#eab308] text-slate-900', buttonLabel: 'RECIBI COMIDA' };
    if (state.activeOrder.status === 'picked') return { title: 'RUMBO AL CLIENTE', emoji: '🏠', buttonClass: 'bg-[#22c55e] text-white', buttonLabel: 'LLEGUE AL DESTINO' };
    return { title: 'EN EL DESTINO', emoji: '✅', buttonClass: 'bg-[#22c55e] text-white', buttonLabel: 'CONFIRMAR ENTREGA' };
});
const activeOrderAddress = computed(() => (state.activeOrder ? (['picked', 'arrived_customer'].includes(state.activeOrder.status) ? state.activeOrder.dropoff : state.activeOrder.pickup) : ''));
const expectedDeliveryCode = computed(() => String(state.activeOrder?.codigoDelivery || '').trim().toUpperCase());
const normalizedDeliveryCode = computed(() => normalizeDeliveryCodeInput(deliveryConfirmCode.value));
const deliveryCodeMatches = computed(() => {
    if (!expectedDeliveryCode.value) return false;
    return normalizedDeliveryCode.value === expectedDeliveryCode.value || normalizedDeliveryCode.value === expectedDeliveryCode.value.slice(-4);
});
const canSubmitDeliveryConfirmation = computed(() => (
    Boolean(state.activeOrder)
    && deliveryCodeMatches.value
    && Boolean(deliveryProofFile.value)
    && deliveryProofAccepted.value
    && !isAdvancing.value
));

const isAssignedToCurrentDriver = (order = {}) => {
    const currentDriverEmail = normalize(session.userEmail);
    if (!currentDriverEmail) return false;
    return normalize(order.deliveryAssignment?.driverEmail || order.driverEmail) === currentDriverEmail;
};

const assignedDriverOrders = computed(() =>
    buildScopedOrders()
        .filter((order) => isAssignedToCurrentDriver(order))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
);

const completedDriverOrders = computed(() => assignedDriverOrders.value.filter((order) => orderStatusKey(order) === 'entregado'));
const cancelledDriverOrders = computed(() => assignedDriverOrders.value.filter((order) => orderStatusKey(order) === 'cancelado'));
const localCompletedTrips = computed(() => state.tripHistory.filter((item) => item.kind === 'delivered'));
const localCancelledTrips = computed(() => state.tripHistory.filter((item) => ['released', 'cancelled'].includes(item.kind)));

const completedTripsCount = computed(() => {
    const ids = new Set([
        ...completedDriverOrders.value.map((order) => String(order.id)),
        ...localCompletedTrips.value.map((item) => String(item.orderId || item.id || item.createdAt)),
    ]);
    return Math.max(Number(state.trips || 0), ids.size);
});

const cancelledTripsCount = computed(() => {
    const ids = new Set([
        ...cancelledDriverOrders.value.map((order) => String(order.id)),
        ...localCancelledTrips.value.map((item) => String(item.orderId || item.id || item.createdAt)),
    ]);
    return ids.size;
});

const activeTripsCount = computed(() => {
    return Math.max(activeDeliveryOrders.value.length, assignedDriverOrders.value.filter((order) => ['preparando', 'en camino'].includes(orderStatusKey(order))).length);
});

const estimatedActiveTime = computed(() => {
    if (!state.activeOrder) return 'Sin viaje activo';
    if (state.activeOrder.status === 'accepted') return '12 min al local';
    if (state.activeOrder.status === 'arrived') return 'Esperando local';
    return '18 min al cliente';
});

const firstActiveCustomerLocation = computed(() => {
    const firstOrder = activeDeliveryOrders.value[0];
    return firstOrder ? getCustomerLocation(firstOrder) : null;
});

const getOrderDistanceFromFirstActive = (order = {}) => {
    const firstLocation = firstActiveCustomerLocation.value;
    if (!firstLocation) return 0;
    return distanceKm(firstLocation, getCustomerLocation(order));
};

const canAcceptOrder = (order = {}) => {
    if (!order.canAccept) return false;
    if (activeDeliveryOrders.value.length >= MAX_ACTIVE_DELIVERY_ORDERS) return false;
    if (activeDeliveryOrders.value.length === 0) return true;
    return getOrderDistanceFromFirstActive(order) <= FIRST_ORDER_ZONE_RADIUS_KM;
};

const getAcceptRestrictionMessage = (order = {}) => {
    if (activeDeliveryOrders.value.length >= MAX_ACTIVE_DELIVERY_ORDERS) return 'Maximo 3 pedidos activos';
    if (activeDeliveryOrders.value.length > 0 && getOrderDistanceFromFirstActive(order) > FIRST_ORDER_ZONE_RADIUS_KM) {
        return 'Fuera de la zona del primer pedido';
    }
    return '';
};

const averageTripValue = computed(() => {
    const values = [
        ...completedDriverOrders.value.map((order) => Number(order.totalValue || 0)),
        ...localCompletedTrips.value.map((item) => Number(item.amount || 0)),
    ].filter((value) => value > 0);
    if (values.length === 0) return formatCurrency(0);
    return formatCurrency(values.reduce((sum, value) => sum + value, 0) / values.length);
});

const driverPerformanceCards = computed(() => [
    { label: 'Activos', value: activeTripsCount.value, hint: estimatedActiveTime.value, icon: 'fa-solid fa-route', class: 'bg-orange-50 text-[#f97316]' },
    { label: 'Completados', value: completedTripsCount.value, hint: `${averageTripValue.value} promedio`, icon: 'fa-solid fa-check', class: 'bg-emerald-50 text-emerald-600' },
    { label: 'Cancelados', value: cancelledTripsCount.value, hint: 'Liberados o anulados', icon: 'fa-solid fa-ban', class: 'bg-rose-50 text-rose-500' },
    { label: 'Ganancias', value: financeBalance.value, hint: `${state.trips} viajes pagados`, icon: 'fa-solid fa-wallet', class: 'bg-slate-100 text-slate-700' },
]);

const formatTripDate = (value) => {
    if (!value) return 'Ahora';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return `${date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })} ${date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`;
};

const appendTripHistory = (entry = {}) => {
    const createdAt = new Date().toISOString();
    const normalizedEntry = {
        ...entry,
        orderId: String(entry.orderId || ''),
        createdAt,
        time: entry.time || formatTripDate(createdAt),
    };
    state.tripHistory = [
        ...state.tripHistory.filter((item) => !(normalizedEntry.orderId && String(item.orderId) === normalizedEntry.orderId && item.kind === normalizedEntry.kind)),
        normalizedEntry,
    ].slice(-60);
};

const buildLocalTripRow = (item = {}) => {
    const isDone = item.kind === 'delivered';
    return {
        id: `local-${item.kind}-${item.orderId || item.createdAt}`,
        icon: isDone ? 'fa-solid fa-check' : 'fa-solid fa-triangle-exclamation',
        iconClass: isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500',
        title: item.franchiseName || item.desc || 'Viaje FoodRush',
        subtitle: item.status || (isDone ? 'Entregado' : 'Liberado'),
        detail: item.address || 'Sin direccion registrada',
        amountText: Number(item.amount || 0) > 0 ? `+${formatCurrency(item.amount)}` : 'Sin pago',
        amountClass: Number(item.amount || 0) > 0 ? 'text-emerald-600' : 'text-slate-400',
        time: item.time || formatTripDate(item.createdAt),
    };
};

const buildRemoteTripRow = (order = {}) => {
    const statusKey = orderStatusKey(order);
    const isDone = statusKey === 'entregado';
    return {
        id: `remote-${statusKey}-${order.id}`,
        icon: isDone ? 'fa-solid fa-check' : 'fa-solid fa-ban',
        iconClass: isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500',
        title: `${order.tenantName} #${order.id}`,
        subtitle: isDone ? 'Entregado' : 'Cancelado',
        detail: order.address || 'Sin direccion registrada',
        amountText: isDone ? `+${formatCurrency(order.totalValue)}` : 'Cancelado',
        amountClass: isDone ? 'text-emerald-600' : 'text-rose-500',
        time: formatTripDate(order.createdAt),
    };
};

const activeTripRow = computed(() => {
    if (!state.activeOrder) return null;
    return {
        id: `active-${state.activeOrder.id}`,
        icon: 'fa-solid fa-motorcycle',
        iconClass: 'bg-orange-50 text-[#f97316]',
        title: state.activeOrder.franchise.name,
        subtitle: activeOrderMeta.value?.title || 'En curso',
        detail: activeOrderAddress.value,
        amountText: formatCurrency(state.activeOrder.price),
        amountClass: 'text-[#f97316]',
        time: estimatedActiveTime.value,
    };
});

const setSelectedActiveOrder = (orderId) => {
    const selectedOrder = activeDeliveryOrders.value.find((order) => String(order.id) === String(orderId));
    if (!selectedOrder) return;
    state.activeOrderId = String(selectedOrder.id);
    state.activeStage = selectedOrder.status;
    state.activeOrder = selectedOrder;
    saveState();
    nextTick(() => {
        if (mapInstance) syncRouteFromState();
    });
};

const driverHistoryRows = computed(() => {
    const localOrderIds = new Set(state.tripHistory.map((item) => String(item.orderId)).filter(Boolean));
    const localRows = [...state.tripHistory].reverse().map((item) => buildLocalTripRow(item));
    const remoteRows = assignedDriverOrders.value
        .filter((order) => ['entregado', 'cancelado'].includes(orderStatusKey(order)))
        .filter((order) => !localOrderIds.has(String(order.id)))
        .map((order) => buildRemoteTripRow(order));

    return [
        ...(activeTripRow.value ? [activeTripRow.value] : []),
        ...localRows,
        ...remoteRows,
    ].slice(0, 30);
});
const badgeHistory = computed(() => driverHistoryRows.value.length);

const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        status: state.status,
        currentShiftStart: state.currentShiftStart,
        shiftHistory: state.shiftHistory,
        lastWorkDate: state.lastWorkDate,
        absenceReported: state.absenceReported,
        earnings: state.earnings,
        tips: state.tips,
        trips: state.trips,
        tenant: state.tenant,
        dismissedOrderIds: state.dismissedOrderIds,
        activeOrderId: state.activeOrderId,
        activeStage: state.activeStage,
        activeOrderIds: state.activeOrderIds,
        activeStagesById: state.activeStagesById,
        tripHistory: state.tripHistory,
        history: state.history,
    }));
};

const loadState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        const merged = { ...defaultState(), ...parsed };
        merged.shiftHistory = Array.isArray(merged.shiftHistory) ? merged.shiftHistory : [];
        merged.tripHistory = Array.isArray(merged.tripHistory) ? merged.tripHistory : [];
        merged.history = Array.isArray(merged.history) ? merged.history : [];
        merged.dismissedOrderIds = Array.isArray(merged.dismissedOrderIds) ? merged.dismissedOrderIds : [];
        merged.activeOrderIds = Array.isArray(merged.activeOrderIds)
            ? merged.activeOrderIds
            : (merged.activeOrderId ? [merged.activeOrderId] : []);
        merged.activeStagesById = merged.activeStagesById && typeof merged.activeStagesById === 'object'
            ? merged.activeStagesById
            : (merged.activeOrderId ? { [merged.activeOrderId]: merged.activeStage || 'accepted' } : {});
        merged.activeOrders = [];
        Object.assign(state, merged);
    } catch (error) {
        console.error('No se pudo cargar el estado de delivery', error);
    }
};

const updateShiftTimer = () => {
    if (!state.currentShiftStart || state.status !== 'online') {
        shiftTimerText.value = '00:00:00';
        return;
    }

    const diff = Date.now() - state.currentShiftStart;
    const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    shiftTimerText.value = `${hours}:${minutes}:${seconds}`;
};

const stopShiftTimer = () => {
    if (timerInterval) {
        window.clearInterval(timerInterval);
        timerInterval = null;
    }
    shiftTimerText.value = '00:00:00';
};

const startTimerIfOnline = () => {
    stopShiftTimer();
    if (state.status !== 'online' || !state.currentShiftStart) return;
    updateShiftTimer();
    timerInterval = window.setInterval(updateShiftTimer, 1000);
};

const removeToast = (id) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
};

const showToast = (message, type = 'success') => {
    const id = ++toastId;
    toasts.value.unshift({ id, message, type });
    queueTimeout(() => removeToast(id), 3500);
};

const navigate = (view) => {
    currentView.value = view;
    if (view === 'orders' && state.activeOrder) {
        nextTick(() => {
            queueTimeout(() => {
                if (mapInstance) mapInstance.invalidateSize();
            }, 100);
        });
    }
};

const switchTab = (tab) => {
    currentTab.value = tab;
    if (tab === 'active' && state.activeOrder) {
        nextTick(() => {
            queueTimeout(() => {
                if (mapInstance) mapInstance.invalidateSize();
            }, 100);
        });
    }
};

const scrollOrdersToTop = () => {
    nextTick(() => {
        const main = document.querySelector('.delivery-pro main');
        const tabs = document.querySelector('.delivery-order-tabs');
        if (!main || !tabs) return;

        const nextTop = Math.max(0, tabs.offsetTop - 8);
        main.scrollTo({ top: nextTop, behavior: 'smooth' });
    });
};

const setAvailablePage = (page) => {
    const nextPage = Math.min(Math.max(Number(page) || 1, 1), availableTotalPages.value);
    if (availablePage.value === nextPage) return;

    availablePage.value = nextPage;
    scrollOrdersToTop();
};

const openPage = (pageId) => { activePage.value = pageId; };
const closePage = (pageId) => { if (activePage.value === pageId) activePage.value = ''; };
const openModal = (modalId) => { activeModal.value = modalId; };
const closeModal = (modalId) => { if (activeModal.value === modalId) activeModal.value = ''; };
const showTutorial = () => { onboardingVisible.value = true; };

const finishOnboarding = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    onboardingVisible.value = false;
    if (state.status === 'offline') {
        showToast("¡Estás listo! Ve a tu Perfil y toca 'Iniciar Turno'.");
        navigate('profile');
    }
};

const checkOnboarding = () => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
        localStorage.setItem(TUTORIAL_KEY, 'available');
        queueTimeout(() => {
            showToast('Guia disponible en Perfil > Centro de Ayuda.', 'info');
        }, 1000);
    }
};

const checkAbsence = () => {
    if (!state.lastWorkDate || state.status === 'online' || state.absenceReported) return;
    if (Date.now() - state.lastWorkDate > 86400000) {
        queueTimeout(() => openModal('modal-absence'), 1500);
    }
};

const reportAbsence = () => {
    state.absenceReported = true;
    state.lastWorkDate = Date.now();
    saveState();
    closeModal('modal-absence');
    showToast('Gracias por avisar. ¡Disfruta tu tiempo!');
};

const buildScopedOrders = () => {
    const allOrders = Array.isArray(data.value.orders) ? data.value.orders : [];
    return state.tenant === 'Global'
        ? allOrders
        : allOrders.filter((order) => String(order.tenantId) === String(state.tenant));
};

const clearRouteLayers = () => {
    if (!mapInstance) return;
    routeLayers.forEach((layer) => {
        if (mapInstance.hasLayer(layer)) mapInstance.removeLayer(layer);
    });
    routeLayers = [];
};

const clearRoute = () => {
    clearRouteLayers();
    currentRoute = null;
    if (mapInstance) mapInstance.setView(coordsSantiago, 14);
};

const buildLeafletIcon = (emoji) => {
    if (!leaflet) return null;
    return leaflet.divIcon({ className: '', html: `<div style="font-size:20px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${emoji}</div>`, iconSize: [20, 20] });
};

const resolveActiveRoute = () => {
    if (!state.activeOrder) return null;

    const store = getStoreLocation(state.activeOrder);
    const customer = getCustomerLocation(state.activeOrder);
    const isCustomerRoute = ['picked', 'arrived_customer'].includes(state.activeOrder.status);
    const origin = isCustomerRoute ? store : SANTIAGO_CENTER;
    const target = isCustomerRoute ? customer : store;
    const progressByStage = {
        accepted: 0.2,
        arrived: 0.95,
        picked: 0.42,
        arrived_customer: 0.95,
    };

    return {
        type: isCustomerRoute ? 'customer' : 'restaurant',
        origin,
        target,
        progress: progressByStage[state.activeOrder.status] ?? 0.2,
        color: isCustomerRoute ? '#22c55e' : '#f97316',
        emoji: isCustomerRoute ? '🏠' : '🏪',
    };
};

const resolveStreetPoints = async (route, requestId) => {
    try {
        routeAbortController?.abort();
        routeAbortController = new AbortController();
        const streetRoute = await fetchStreetRoute(route.origin, route.target, { signal: routeAbortController.signal });
        if (requestId !== routeRequestId) return null;
        if (streetRoute?.points?.length >= 2) return streetRoute.points;
    } catch (error) {
        if (error?.name !== 'AbortError') {
            console.warn('No se pudo calcular ruta real en delivery, usando estimacion', error);
        }
    }

    return buildFallbackRoute(route.origin, route.target);
};

const renderCurrentRoute = async () => {
    if (!mapInstance || !leaflet || !currentRoute) return;
    const requestId = ++routeRequestId;
    clearRouteLayers();
    const routePoints = await resolveStreetPoints(currentRoute, requestId);
    if (requestId !== routeRequestId || !routePoints?.length) return;

    const riderPoint = getPointAlongRoute(routePoints, currentRoute.progress) || currentRoute.origin;
    void reportDriverLocation(riderPoint, state.activeOrder.status);
    const targetMarker = leaflet.marker([currentRoute.target.lat, currentRoute.target.lng], { icon: buildLeafletIcon(currentRoute.emoji) }).addTo(mapInstance);
    const rider = leaflet.marker([riderPoint.lat, riderPoint.lng], { icon: buildLeafletIcon('🛵') }).addTo(mapInstance);
    const line = leaflet.polyline(routePoints.map((point) => [point.lat, point.lng]), { color: currentRoute.color, weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(mapInstance);
    routeLayers = [targetMarker, rider, line];
    queueTimeout(() => {
        if (!mapInstance) return;
        mapInstance.invalidateSize();
        mapInstance.fitBounds(line.getBounds(), { padding: [30, 30] });
    }, 100);
};

const setRoute = () => {
    if (!leaflet || !mapInstance) return;
    currentRoute = resolveActiveRoute();
    void renderCurrentRoute();
};

const syncRouteFromState = () => {
    if (!state.activeOrder) {
        clearRoute();
        return;
    }
    setRoute();
};

const ensureLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) {
        resolve(window.L);
        return;
    }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
    }
    const existingScript = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.L), { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
});

const initMap = () => {
    if (!mapEl.value || !leaflet || mapInstance) return;
    mapInstance = leaflet.map(mapEl.value, { zoomControl: false, attributionControl: false }).setView(coordsSantiago, 14);
    leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance);
    if (state.activeOrder) syncRouteFromState();
};

const updateOrderAsCancelledByTimeout = async (order) => {
    if (isQaOrder(order)) {
        setQaOrderOverride(order.id, {
            ...getQaOrderStatusPatch(ORDER_STATUS_CODES.cancelled),
            cancellationReason: 'Cancelado automaticamente: no fue aceptado en 3 horas.',
        });
        updateCachedOrderStatus(order.id, ORDER_STATUS_CODES.cancelled, null, {
            cancellationReason: 'Cancelado automaticamente: no fue aceptado en 3 horas.',
        });
        return;
    }

    const response = await api.updateOrder(order.id, {
        estado_id: ORDER_STATUS_CODES.cancelled,
        notas: `${order.notes || order.notas || ''} Cancelado automaticamente: no fue aceptado en 3 horas.`.trim(),
    }, buildTenantHeaders(order.tenantId));
    updateCachedOrderStatus(order.id, response?.data?.estado_id || response?.data?.estado?.id || ORDER_STATUS_CODES.cancelled, null, {
        cancellationReason: 'Cancelado automaticamente: no fue aceptado en 3 horas.',
    });
};

const markOrderWithFreeDelivery = async (order) => {
    const assignment = {
        ...(order.deliveryAssignment || {}),
        orderId: order.id,
        tenantId: order.tenantId,
        deliveryFeeWaived: true,
        deliveryFreeReason: 'Envio gratis: el pedido supero 1 hora desde la aceptacion.',
        deliveryFeeWaivedAt: new Date().toISOString(),
    };

    setDeliveryAssignment(order.id, assignment);
    updateCachedOrderStatus(order.id, order.statusId || order.estado_id || ORDER_STATUS_CODES.inTransit, null, {
        deliveryFeeWaived: true,
        envioGratis: true,
        deliveryFreeReason: assignment.deliveryFreeReason,
    });

    if (isQaOrder(order)) {
        setQaOrderOverride(order.id, {
            deliveryAssignment: assignment,
            deliveryFeeWaived: true,
            envioGratis: true,
            deliveryFreeReason: assignment.deliveryFreeReason,
        });
    }
};

const enforceOrderTimePolicies = async (orders = []) => {
    const now = Date.now();
    let changed = false;

    for (const order of orders) {
        const statusKey = orderStatusKey(order);
        if (['entregado', 'cancelado'].includes(statusKey)) continue;

        const createdAt = toTimestamp(order.createdAt || order.creado_en);
        const assignedAt = toTimestamp(order.deliveryAssignment?.assignedAt || order.deliveryAssignment?.asignado_en);

        if (!hasDriverAssignment(order) && createdAt && now - createdAt >= UNACCEPTED_ORDER_CANCEL_MS) {
            try {
                await updateOrderAsCancelledByTimeout(order);
                changed = true;
            } catch (error) {
                console.warn('No se pudo cancelar automaticamente el pedido vencido', order.id, error);
            }
            continue;
        }

        if (hasDriverAssignment(order) && assignedAt && now - assignedAt >= ACCEPTED_FREE_DELIVERY_MS && !hasFreeDelivery(order)) {
            await markOrderWithFreeDelivery(order);
            changed = true;
        }
    }

    return changed;
};

// Para presentar: refresca pedidos disponibles, activos e historial desde el dataset/backend.
const syncOrdersFromBackend = () => {
    const scopedOrders = buildScopedOrders();
    const currentDriverEmail = normalize(session.userEmail);
    const visibleNewOrders = scopedOrders.filter((order) => ['pendiente', 'preparando'].includes(orderStatusKey(order)));
    const visibleNewIds = new Set(visibleNewOrders.map((order) => String(order.id)));
    state.dismissedOrderIds = state.dismissedOrderIds.filter((id) => visibleNewIds.has(String(id)));

    const activeSources = (currentDriverEmail
        ? scopedOrders.filter((order) => (
            normalize(order.deliveryAssignment?.driverEmail) === currentDriverEmail &&
            ['preparando', 'en camino'].includes(orderStatusKey(order))
        ))
        : [])
        .sort((left, right) => toTimestamp(left.deliveryAssignment?.assignedAt || left.createdAt) - toTimestamp(right.deliveryAssignment?.assignedAt || right.createdAt))
        .slice(0, MAX_ACTIVE_DELIVERY_ORDERS);
    const activeOrderIds = activeSources.map((order) => String(order.id));
    state.activeOrderIds = activeOrderIds;
    state.activeOrders = activeSources.map((order) => {
        const activeStage = deriveActiveStage(order);
        state.activeStagesById[String(order.id)] = activeStage;
        return buildOrderView(order, activeStage);
    });

    if (!activeOrderIds.includes(String(state.activeOrderId))) {
        state.activeOrderId = activeOrderIds[0] || '';
    }

    state.activeOrder = activeDeliveryOrders.value.find((order) => String(order.id) === String(state.activeOrderId)) || null;
    state.activeStage = state.activeOrder?.status || '';

    state.availableOrders = visibleNewOrders
        .filter((order) => !activeOrderIds.includes(String(order.id)))
        .filter((order) => {
            const assignment = order.deliveryAssignment;
            if (!assignment?.driverEmail) return true;
            return normalize(assignment.driverEmail) === currentDriverEmail;
        })
        .filter((order) => !state.dismissedOrderIds.includes(String(order.id)))
        .map((order) => buildOrderView(order, 'pending'));

    if (activeDeliveryOrders.value.length > 0 && currentTab.value !== 'history') currentTab.value = 'active';
    else if (currentTab.value === 'active') currentTab.value = 'available';

    nextTick(() => {
        if (mapInstance) syncRouteFromState();
    });
};

// Delivery lee el mismo dataset operacional que Administracion para que ambos paneles vean el mismo estado.
const refreshData = async ({ silent = false } = {}) => {
    if (silent && document.visibilityState === 'hidden') return null;
    if (refreshPromise) return refreshPromise;

    const task = (async () => {
        if (silent) isRefreshing.value = true;
        else {
            isLoading.value = true;
            errorMessage.value = '';
        }

        try {
            data.value = await fetchOperationalDataset({ selectedTenantId: 'Global', includeSessions: false });
            const policyChanged = await enforceOrderTimePolicies(data.value.orders || []);
            if (policyChanged) {
                data.value = await fetchOperationalDataset({ selectedTenantId: 'Global', includeSessions: false });
            }
            if (state.tenant !== 'Global' && !data.value.tenants.some((tenant) => String(tenant.id) === String(state.tenant))) {
                state.tenant = 'Global';
            }
            lastUpdatedAt.value = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
            syncOrdersFromBackend();
            return data.value;
        } catch (error) {
            console.error('No se pudo cargar delivery', error);
            errorMessage.value = error.message || 'No se pudo cargar la vista de delivery.';
            if (!silent) showToast(errorMessage.value, 'error');
            return null;
        } finally {
            isLoading.value = false;
            isRefreshing.value = false;
        }
    })();

    refreshPromise = task;
    task.finally(() => {
        if (refreshPromise === task) refreshPromise = null;
    });
    return task;
};

const queueRealtimeRefresh = () => {
    if (realtimeRefreshTimer) return;
    realtimeRefreshTimer = window.setTimeout(() => {
        realtimeRefreshTimer = null;
        void refreshData({ silent: true });
    }, REALTIME_REFRESH_DEBOUNCE_MS);
};

const closeRealtimeConnections = () => {
    realtimeConnections.forEach((connection) => connection.close());
    realtimeConnections = [];
};

const setupRealtimeConnections = () => {
    closeRealtimeConnections();
    realtimeConnections = (data.value.tenants || []).map((tenant) =>
        connectRealtime({
            tenantId: tenant.id,
            onEvent(message) {
                if (['order-created', 'order-updated', 'order-cancelled', 'delivery-assigned'].includes(message.event)) {
                    realtimeWarning.value = '';
                    queueRealtimeRefresh();
                }
            },
            onError(error) {
                console.warn('Realtime delivery no disponible', error);
                realtimeWarning.value = 'Actualizacion en vivo no disponible. Seguimos revisando pedidos automaticamente cada 20 segundos.';
            },
        }),
    );
};

const toggleShift = async () => {
    if (state.status === 'offline') {
        state.status = 'online';
        state.currentShiftStart = Date.now();
        state.lastWorkDate = state.currentShiftStart;
        state.absenceReported = false;
        saveState();
        startTimerIfOnline();
        showToast('¡Turno Iniciado! Atento a los pedidos.');
        navigate('orders');
        await refreshData({ silent: true });
        return;
    }

    if (state.activeOrder) {
        showToast('No puedes salirte con un viaje en curso.', 'error');
        return;
    }

    const end = Date.now();
    const start = state.currentShiftStart || end;
    const diffMs = end - start;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    state.shiftHistory.push({ date: new Date().toLocaleDateString(), start: formatTime(start), end: formatTime(end), duration: `${hours}h ${minutes}m` });
    state.status = 'offline';
    state.currentShiftStart = null;
    state.activeOrder = null;
    state.activeOrderId = '';
    state.activeStage = '';
    state.activeOrderIds = [];
    state.activeStagesById = {};
    state.activeOrders = [];
    currentTab.value = 'available';
    clearRoute();
    stopShiftTimer();
    saveState();
    showToast('Turno finalizado. ¡Buen trabajo!');
};

// El repartidor toma un viaje: se guarda asignacion y se notifica al resto del flujo.
// Para presentar: aceptar viaje; mueve el pedido a activo y avisa al flujo operativo.
const acceptOrder = async (id) => {
    if (!isShiftOnline.value) {
        showToast('Inicia tu turno antes de aceptar un viaje.', 'error');
        return;
    }
    if (activeDeliveryOrders.value.length >= MAX_ACTIVE_DELIVERY_ORDERS) {
        showToast('Solo puedes aceptar hasta 3 pedidos activos.', 'error');
        return;
    }

    const order = state.availableOrders.find((candidate) => String(candidate.id) === String(id));
    if (!order) {
        showToast('El pedido ya no está disponible.', 'error');
        await refreshData({ silent: true });
        return;
    }
    const restrictionMessage = getAcceptRestrictionMessage(order);
    if (restrictionMessage) {
        showToast(restrictionMessage, 'error');
        return;
    }

    isAdvancing.value = true;
    try {
        const identity = driverIdentity();
        if (isQaOrder(order)) {
            await syncDeliveryAssignment(order, 'accepted', 'accepted');
            const updatedOrder = buildQaOrderWithStatus(order, ORDER_STATUS_CODES.preparing);
            setQaOrderOverride(order.id, {
                ...getQaOrderStatusPatch(ORDER_STATUS_CODES.preparing),
                driverName: identity.driverName,
                driverEmail: identity.driverEmail,
            });
            state.activeOrderId = String(order.id);
            state.activeStagesById[String(order.id)] = 'accepted';
            state.activeStage = 'accepted';
            state.activeOrder = buildOrderView(updatedOrder, 'accepted');
            state.activeOrderIds = [...new Set([...state.activeOrderIds, String(order.id)])].slice(0, MAX_ACTIVE_DELIVERY_ORDERS);
            state.activeOrders = [...activeDeliveryOrders.value.filter((item) => String(item.id) !== String(order.id)), state.activeOrder];
            state.lastWorkDate = Date.now();
            state.dismissedOrderIds = state.dismissedOrderIds.filter((candidate) => String(candidate) !== String(order.id));
            currentTab.value = 'active';
            saveState();
            await refreshData({ silent: true });
            showToast('Pedido QA aceptado. Pide el código al cliente cuando lo tengas frente a ti.');
            return;
        }

        const response = await api.updateOrder(order.id, { estado_id: ORDER_STATUS_CODES.preparing }, buildTenantHeaders(order.tenantId));
        await syncDeliveryAssignment(order, 'accepted', 'accepted');
        updateCachedOrderStatus(order.id, response?.data?.estado_id || response?.data?.estado?.id || ORDER_STATUS_CODES.preparing, null, {
            repartidor_nombre: identity.driverName,
            repartidor_email: identity.driverEmail,
        });
        state.activeOrderId = String(order.id);
        state.activeStagesById[String(order.id)] = 'accepted';
        state.activeStage = 'accepted';
        state.activeOrder = buildOrderView({ ...order, driverName: identity.driverName, driverEmail: identity.driverEmail }, 'accepted');
        state.activeOrderIds = [...new Set([...state.activeOrderIds, String(order.id)])].slice(0, MAX_ACTIVE_DELIVERY_ORDERS);
        state.activeOrders = [...activeDeliveryOrders.value.filter((item) => String(item.id) !== String(order.id)), state.activeOrder];
        state.lastWorkDate = Date.now();
        state.dismissedOrderIds = state.dismissedOrderIds.filter((candidate) => String(candidate) !== String(order.id));
        currentTab.value = 'active';
        saveState();
        await refreshData({ silent: true });
        showToast('Pedido aceptado. Pide el código al cliente cuando lo tengas frente a ti.');
    } catch (error) {
        console.error('No se pudo aceptar el pedido', error);
        showToast(error.message || 'No se pudo aceptar el pedido.', 'error');
    } finally {
        isAdvancing.value = false;
    }
};

const rejectOrder = (id) => {
    state.dismissedOrderIds.push(String(id));
    state.dismissedOrderIds = [...new Set(state.dismissedOrderIds)];
    state.availableOrders = state.availableOrders.filter((order) => String(order.id) !== String(id));
    saveState();
};

const handleActiveOrderPrimaryAction = () => {
    if (!state.activeOrder) return;
    if (state.activeOrder.status === 'accepted') {
        void updateOrderStatus('arrived');
        return;
    }
    if (state.activeOrder.status === 'arrived') {
        void updateOrderStatus('picked');
        return;
    }
    if (state.activeOrder.status === 'picked') {
        void updateOrderStatus('arrived_customer');
        return;
    }
    openDeliveryConfirmation();
};

// Para presentar: avanza el viaje de recogida a camino y sincroniza estado para cliente/admin.
const updateOrderStatus = async (status) => {
    if (!state.activeOrder) return;
    if (status === 'arrived') {
        state.activeStage = 'arrived';
        state.activeStagesById[String(state.activeOrder.id)] = 'arrived';
        state.activeOrder = buildOrderView(state.activeOrder, 'arrived');
        state.activeOrders = activeDeliveryOrders.value.map((order) => String(order.id) === String(state.activeOrder.id) ? state.activeOrder : order);
        void syncDeliveryAssignment(state.activeOrder, 'arrived', 'arrived').catch((error) => {
            console.warn('No se pudo sincronizar llegada al local', error);
        });
        saveState();
        syncRouteFromState();
        showToast('Llegaste al local. Espera la comida.');
        return;
    }

    if (status === 'picked') {
        isAdvancing.value = true;
        try {
            const identity = driverIdentity();
            if (isQaOrder(state.activeOrder)) {
                const updatedOrder = buildQaOrderWithStatus(state.activeOrder, ORDER_STATUS_CODES.inTransit);
                setQaOrderOverride(state.activeOrder.id, {
                    ...getQaOrderStatusPatch(ORDER_STATUS_CODES.inTransit),
                    driverName: identity.driverName,
                    driverEmail: identity.driverEmail,
                });
                await syncDeliveryAssignment(updatedOrder, 'picked', 'picked');
                state.activeStage = 'picked';
                state.activeStagesById[String(state.activeOrder.id)] = 'picked';
                state.activeOrder = buildOrderView(updatedOrder, 'picked');
                state.activeOrders = activeDeliveryOrders.value.map((order) => String(order.id) === String(state.activeOrder.id) ? state.activeOrder : order);
                saveState();
                await refreshData({ silent: true });
                showToast('Comida QA recibida. Ruta activada hacia el cliente.');
                return;
            }

            const response = await api.updateOrder(state.activeOrder.id, { estado_id: ORDER_STATUS_CODES.inTransit }, buildTenantHeaders(state.activeOrder.tenantId));
            await syncDeliveryAssignment(state.activeOrder, 'picked', 'picked');
            updateCachedOrderStatus(state.activeOrder.id, response?.data?.estado_id || response?.data?.estado?.id || ORDER_STATUS_CODES.inTransit, null, {
                repartidor_nombre: identity.driverName,
                repartidor_email: identity.driverEmail,
            });
            state.activeStage = 'picked';
            state.activeStagesById[String(state.activeOrder.id)] = 'picked';
            state.activeOrder = buildOrderView(state.activeOrder, 'picked');
            state.activeOrders = activeDeliveryOrders.value.map((order) => String(order.id) === String(state.activeOrder.id) ? state.activeOrder : order);
            saveState();
            await refreshData({ silent: true });
            showToast('Comida recibida. Ruta activada hacia el cliente.');
        } catch (error) {
            console.error('No se pudo actualizar el pedido', error);
            showToast(error.message || 'No se pudo marcar en camino.', 'error');
        } finally {
            isAdvancing.value = false;
        }
    }

    if (status === 'arrived_customer') {
        state.activeStage = 'arrived_customer';
        state.activeStagesById[String(state.activeOrder.id)] = 'arrived_customer';
        state.activeOrder = buildOrderView(state.activeOrder, 'arrived_customer');
        state.activeOrders = activeDeliveryOrders.value.map((order) => String(order.id) === String(state.activeOrder.id) ? state.activeOrder : order);
        void syncDeliveryAssignment(state.activeOrder, 'arrived_customer', 'arrived_customer').catch((error) => {
            console.warn('No se pudo sincronizar llegada al cliente', error);
        });
        saveState();
        syncRouteFromState();
        showToast('Llegaste al destino. Pide el código al cliente para confirmar.');
    }
};

const cancelOrder = async () => {
    if (!state.activeOrder) return;
    if (['picked', 'arrived_customer'].includes(state.activeStage)) {
        showToast('No puedes cancelar despues de recoger la comida. Reporta el problema a soporte.', 'error');
        return;
    }

    const releasedOrder = state.activeOrder;

    try {
        if (isQaOrder(releasedOrder)) {
            setQaOrderOverride(releasedOrder.id, getQaOrderStatusPatch(ORDER_STATUS_CODES.preparing));
            await syncDeliveryAssignment(releasedOrder, 'released', 'released');
        } else {
            const response = await api.updateOrder(releasedOrder.id, { estado_id: ORDER_STATUS_CODES.preparing }, buildTenantHeaders(releasedOrder.tenantId));
            await syncDeliveryAssignment(releasedOrder, 'released', 'released');
            updateCachedOrderStatus(releasedOrder.id, response?.data?.estado_id || response?.data?.estado?.id || ORDER_STATUS_CODES.preparing);
        }
    } catch (error) {
        console.warn('No se pudo devolver el pedido a preparacion', error);
    }

    appendTripHistory({
        kind: 'released',
        orderId: releasedOrder.id,
        franchiseName: releasedOrder.franchise.name,
        status: 'Liberado por incidencia',
        amount: 0,
        address: releasedOrder.dropoff,
    });
    clearDeliveryAssignment(releasedOrder.id);
    state.activeOrderIds = state.activeOrderIds.filter((orderId) => String(orderId) !== String(releasedOrder.id));
    delete state.activeStagesById[String(releasedOrder.id)];
    state.activeOrders = activeDeliveryOrders.value.filter((order) => String(order.id) !== String(releasedOrder.id));
    state.activeOrderId = state.activeOrderIds[0] || '';
    state.activeOrder = activeDeliveryOrders.value.find((order) => String(order.id) === String(state.activeOrderId)) || null;
    state.activeStage = state.activeOrder?.status || '';
    currentTab.value = state.activeOrder ? 'active' : 'available';
    clearRoute();
    saveState();
    await refreshData({ silent: true });
    showToast('Pedido liberado.');
};

const resetDeliveryConfirmation = () => {
    deliveryConfirmCode.value = '';
    deliveryProofFile.value = null;
    deliveryProofFileName.value = 'Toca para tomar foto de entrega';
    deliveryProofAccepted.value = false;
    if (cameraInput.value) cameraInput.value.value = '';
};

const openDeliveryConfirmation = () => {
    if (!state.activeOrder) return;
    if (state.activeOrder.status !== 'arrived_customer') {
        showToast('Primero marca que llegaste al destino.', 'error');
        return;
    }
    resetDeliveryConfirmation();
    openModal('modal-delivery-confirm');
};

const triggerDeliveryProof = () => {
    cameraInput.value?.click();
};

const handleDeliveryPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    deliveryProofFile.value = file;
    deliveryProofFileName.value = file.name ? `${file.name} cargada` : 'Foto de entrega cargada';
};

// Para presentar: entrega segura; compara código del cliente, evidencia y marca el pedido entregado.
const completeDelivery = async () => {
    if (!state.activeOrder) return;
    if (!deliveryCodeMatches.value) {
        showToast('Código de entrega incorrecto.', 'error');
        return;
    }
    if (!deliveryProofFile.value) {
        showToast('Toma o sube una foto de entrega.', 'error');
        return;
    }
    if (!deliveryProofAccepted.value) {
        showToast('Confirma que entregaste el pedido al cliente correcto.', 'error');
        return;
    }
    isAdvancing.value = true;
    showToast('Registrando entrega...', 'info');

    try {
        const deliveredOrder = state.activeOrder;
        const identity = driverIdentity();
        if (isQaOrder(deliveredOrder)) {
            setQaOrderOverride(deliveredOrder.id, {
                ...getQaOrderStatusPatch(ORDER_STATUS_CODES.delivered),
                driverName: identity.driverName,
                driverEmail: identity.driverEmail,
                deliveryProof: deliveryProofFile.value?.name || 'foto',
                confirmedCode: normalizedDeliveryCode.value,
            });
            await syncDeliveryAssignment(deliveredOrder, 'delivered', 'delivered');
        } else {
            const response = await api.updateOrder(deliveredOrder.id, {
                estado_id: ORDER_STATUS_CODES.delivered,
                nota: `Entrega confirmada con código ${normalizedDeliveryCode.value}. Evidencia: ${deliveryProofFile.value?.name || 'foto'}.`,
            }, buildTenantHeaders(deliveredOrder.tenantId));
            await syncDeliveryAssignment(deliveredOrder, 'delivered', 'delivered');
            updateCachedOrderStatus(deliveredOrder.id, response?.data?.estado_id || response?.data?.estado?.id || ORDER_STATUS_CODES.delivered, null, {
                repartidor_nombre: identity.driverName,
                repartidor_email: identity.driverEmail,
            });
        }
        const grossDeliveryPayment = resolveDeliveryGrossPayment(deliveredOrder);
        const payment = Math.max(0, grossDeliveryPayment * DELIVERY_WALLET_PAYOUT_RATE);
        state.earnings += payment;
        state.trips += 1;
        appendTripHistory({
            kind: 'delivered',
            orderId: deliveredOrder.id,
            franchiseName: deliveredOrder.franchise.name,
            status: 'Entregado',
            amount: payment,
            address: deliveredOrder.dropoff,
            proof: deliveryProofFile.value?.name || 'foto de entrega',
            confirmationCode: normalizedDeliveryCode.value,
            grossDeliveryPayment,
        });
        state.history.push({ emoji: deliveredOrder.franchise.emoji, desc: `Entrega ${deliveredOrder.franchise.name}`, amount: payment, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        state.activeOrderIds = state.activeOrderIds.filter((orderId) => String(orderId) !== String(deliveredOrder.id));
        delete state.activeStagesById[String(deliveredOrder.id)];
        state.activeOrders = activeDeliveryOrders.value.filter((order) => String(order.id) !== String(deliveredOrder.id));
        state.activeOrderId = state.activeOrderIds[0] || '';
        state.activeOrder = activeDeliveryOrders.value.find((order) => String(order.id) === String(state.activeOrderId)) || null;
        state.activeStage = state.activeOrder?.status || '';
        currentTab.value = state.activeOrder ? 'active' : 'available';
        closeModal('modal-delivery-confirm');
        clearRoute();
        saveState();
        await refreshData({ silent: true });
        showToast('Entrega completada correctamente.');
    } catch (error) {
        console.error('No se pudo completar la entrega', error);
        showToast(error.message || 'No se pudo marcar la entrega.', 'error');
    } finally {
        resetDeliveryConfirmation();
        isAdvancing.value = false;
    }
};

const processWithdraw = () => {
    const amount = Number.parseFloat(withdrawInput.value);
    if (Number.isNaN(amount) || amount <= 0 || amount > state.earnings) {
        showToast('Monto inválido', 'error');
        return;
    }

    isWithdrawing.value = true;
    queueTimeout(() => {
        state.earnings -= amount;
        state.history.push({ emoji: '🏦', desc: 'Retiro', amount: -amount, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        withdrawInput.value = '';
        isWithdrawing.value = false;
        closeModal('modal-withdraw');
        saveState();
        showToast('Dinero retirado');
    }, 1000);
};

const triggerReportUpload = () => {
    reportEvidenceInput.value?.click();
};

const handleReportEvidenceChange = (event) => {
    const file = event.target.files?.[0] || null;
    reportEvidence.value = file;
    reportFileLoaded.value = Boolean(file);
    reportFileName.value = file ? 'Evidencia cargada ✅' : 'Toca para subir captura de pantalla';
};

const submitReport = () => {
    if (!reportId.value.trim()) {
        showToast('Ingresa el ID del viaje', 'error');
        return;
    }
    if (!reportEvidence.value) {
        showToast('Sube una captura', 'error');
        return;
    }

    isSubmittingReport.value = true;
    queueTimeout(() => {
        closeModal('modal-report');
        reportId.value = '';
        reportEvidence.value = null;
        reportFileLoaded.value = false;
        reportFileName.value = 'Toca para subir captura de pantalla';
        isSubmittingReport.value = false;
        if (reportEvidenceInput.value) reportEvidenceInput.value.value = '';
        showToast('Reporte enviado al Soporte.');
    }, 1500);
};

const triggerSOS = () => {
    if (window.confirm('🚨 ALERTA SOS: ¿Estás en peligro? Esto avisará a soporte central.')) {
        showToast('Alerta enviada. Te llamaremos en segundos.', 'error');
    }
};

const changeTenant = () => {
    syncOrdersFromBackend();
    saveState();
};

const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible') {
        void refreshData({ silent: true });
    }
};

const refreshFromStorageEvent = () => {
    void refreshData({ silent: true });
};

const logout = () => {
    if (window.confirm('¿Cerrar sesión? Tendrás que volver a iniciar sesión para entrar al panel de delivery.')) {
        saveState();
        clearSession();
        router.replace('/login');
    }
};

watch(() => state.tenant, () => {
    availablePage.value = 1;
    changeTenant();
});

watch(() => state.availableOrders.length, () => {
    if (availablePage.value > availableTotalPages.value) {
        availablePage.value = availableTotalPages.value;
    }
});

onMounted(async () => {
    loadState();
    if (state.activeOrderId) currentTab.value = 'active';
    startTimerIfOnline();
    checkOnboarding();
    checkAbsence();
    await refreshData();
    setupRealtimeConnections();
    window.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener(APP_EVENTS.ordersChanged, refreshFromStorageEvent);

    try {
        leaflet = await ensureLeaflet();
        await nextTick();
        initMap();
    } catch (error) {
        console.error('Leaflet no pudo cargar en delivery', error);
    }

    refreshTimer = window.setInterval(() => {
        void refreshData({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);
});

onBeforeUnmount(() => {
    routeAbortController?.abort();
    stopShiftTimer();
    clearScheduledTimeouts();
    if (refreshTimer) window.clearInterval(refreshTimer);
    if (realtimeRefreshTimer) window.clearTimeout(realtimeRefreshTimer);
    window.removeEventListener('visibilitychange', refreshWhenVisible);
    window.removeEventListener('focus', refreshWhenVisible);
    window.removeEventListener(APP_EVENTS.ordersChanged, refreshFromStorageEvent);
    closeRealtimeConnections();
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
});
</script>

<template>
    <div class="delivery-pro relative flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-700" :class="{ 'delivery-dark': isDarkMode }">
        <div
            v-if="onboardingVisible"
            :class="[
                'delivery-onboarding fixed inset-0 flex flex-col bg-white transition-opacity duration-500',
                'pointer-events-auto opacity-100'
            ]"
        >
            <div class="flex-none bg-[#f97316] px-6 pb-4 pt-12 text-white shadow-md">
                <h2 class="text-2xl font-black">Guia de FoodRush <i class="fa-solid fa-motorcycle"></i></h2>
                <p class="text-sm font-semibold opacity-90">Todo lo que necesitas saber paso a paso:</p>
            </div>

            <div class="hide-scrollbar flex-1 space-y-6 overflow-y-auto bg-slate-50 px-6 py-6 pb-32">
                <div v-for="step in onboardingSteps" :key="step.number" class="flex gap-4">
                    <div :class="['flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black', step.badgeClass]">
                        {{ step.number }}
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800">{{ step.title }}</h4>
                        <p class="mt-1 text-xs text-slate-600" v-html="step.description"></p>
                    </div>
                </div>
            </div>

            <div class="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent p-6">
                <button
                    type="button"
                    class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] py-4 text-sm font-black text-white shadow-xl shadow-orange-500/40 active:bg-[#ea580c]"
                    @click="finishOnboarding"
                >
                    TODO CLARO, ESTOY LISTO <i class="fa-solid fa-check-circle"></i>
                </button>
            </div>
        </div>

        <div class="pointer-events-none fixed left-1/2 top-16 z-[100] flex w-[90%] max-w-sm -translate-x-1/2 flex-col gap-2">
            <div
                v-for="toast in toasts"
                :key="toast.id"
                :class="[
                    'toast-enter rounded-xl p-3 text-xs font-bold shadow-lg',
                    toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'
                ]"
            >
                {{ toast.message }}
            </div>
        </div>

        <header class="relative z-40 flex flex-none items-center justify-between bg-white px-4 py-3 shadow-sm">
            <div class="delivery-header-brand flex min-w-0 items-center gap-3">
                <div class="relative">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-xl text-[#f97316]">
                        <i class="fa-solid fa-motorcycle"></i>
                    </div>
                    <div
                        :class="[
                            'delivery-shift-dot absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-colors',
                            isShiftOnline ? 'bg-[#22c55e]' : 'bg-slate-400'
                        ]"
                    ></div>
                </div>
                <div class="min-w-0">
                    <h1 class="leading-none text-lg font-black text-slate-800">
                        Food<span class="text-[#f97316]">Rush</span>
                    </h1>
                    <p class="delivery-header-meta mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] font-bold text-slate-500">
                        <span class="min-w-0 break-words">{{ tenantDisplay }}</span>
                        <span v-if="lastUpdatedAt">• {{ lastUpdatedAt }}</span>
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600 shadow-sm transition active:bg-slate-200"
                    :aria-label="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
                    @click="toggleTheme"
                >
                    <i :class="isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
                </button>
                <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg text-[#f97316] shadow-sm transition active:bg-orange-100"
                    @click="refreshData({ silent: true })"
                >
                    <i class="fa-solid fa-rotate-right" :class="{ 'fa-spin': isRefreshing }"></i>
                </button>
            </div>
        </header>

        <main class="hide-scrollbar relative mx-auto w-full max-w-md flex-1 overflow-y-auto pb-20">
            <section :class="['view px-4 pt-4', currentView === 'orders' ? 'active' : '']">
                <div class="mb-4 grid grid-cols-2 gap-2">
                    <div
                        v-for="card in driverPerformanceCards"
                        :key="card.label"
                        class="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                    >
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <span :class="['flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm', card.class]">
                                <i :class="card.icon"></i>
                            </span>
                            <p class="truncate text-right text-lg font-black leading-none text-slate-800">{{ card.value }}</p>
                        </div>
                        <p class="text-[10px] font-black uppercase tracking-wide text-slate-400">{{ card.label }}</p>
                        <p class="mt-0.5 truncate text-[10px] font-bold text-slate-500">{{ card.hint }}</p>
                    </div>
                </div>

                <div v-if="realtimeWarning" class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700 shadow-sm" role="status" aria-live="polite">
                    <div class="flex gap-2">
                        <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
                        <div>
                            <p>{{ realtimeWarning }}</p>
                            <button type="button" class="mt-2 text-[11px] font-black uppercase text-amber-800 underline" @click="refreshData({ silent: false })">
                                Actualizar pedidos
                            </button>
                        </div>
                    </div>
                </div>

                <div class="delivery-order-tabs sticky top-0 z-30 mb-4 flex shrink-0 rounded-xl bg-slate-100 p-1">
                    <button
                        type="button"
                        :class="[
                            'flex-1 rounded-lg py-2.5 text-sm font-bold',
                            currentTab === 'available' ? 'bg-white text-[#f97316] shadow-sm' : 'text-slate-400'
                        ]"
                        @click="switchTab('available')"
                    >
                        Nuevos ({{ badgeAvail }})
                    </button>
                    <button
                        type="button"
                        :class="[
                            'flex-1 rounded-lg py-2.5 text-sm font-bold',
                            currentTab === 'active' ? 'bg-white text-[#f97316] shadow-sm' : 'text-slate-400'
                        ]"
                        @click="switchTab('active')"
                    >
                        En Curso ({{ badgeActive }})
                    </button>
                    <button
                        type="button"
                        :class="[
                            'flex-1 rounded-lg py-2.5 text-sm font-bold',
                            currentTab === 'history' ? 'bg-white text-[#f97316] shadow-sm' : 'text-slate-400'
                        ]"
                        @click="switchTab('history')"
                    >
                        Historial ({{ badgeHistory }})
                    </button>
                </div>

                <div :class="['space-y-3 pb-4', currentTab === 'available' ? '' : 'hidden']">
                    <div v-if="state.status === 'offline'" class="rounded-2xl border border-slate-100 bg-white p-6 text-center">
                        <div class="mb-2 text-4xl">&#x1F634;</div>
                        <h3 class="text-sm font-black text-slate-800">Estas desconectado</h3>
                        <p class="text-xs text-slate-500">Inicia turno en tu perfil.</p>
                    </div>

                    <div v-else-if="isLoading" class="rounded-2xl border border-slate-100 bg-white p-6 text-center">
                        <div class="mb-2 text-4xl"><i class="fa-solid fa-circle-notch fa-spin text-[#f97316]"></i></div>
                        <h3 class="text-sm font-black text-slate-800">Sincronizando pedidos</h3>
                        <p class="text-xs text-slate-500">Consultando el backend real.</p>
                    </div>

                    <div v-else-if="state.availableOrders.length === 0" class="rounded-2xl border border-slate-100 bg-white p-6 text-center">
                        <div class="mb-2 text-4xl">&#x1F37D;</div>
                        <h3 class="text-sm font-black text-slate-800">Buscando viajes</h3>
                        <p class="text-xs text-slate-500">No hay pedidos pendientes por ahora.</p>
                    </div>

                    <div v-if="state.availableOrders.length > 0" class="delivery-available-pager rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div class="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p class="text-[10px] font-black uppercase tracking-wide text-slate-400">Pedidos nuevos</p>
                                <p class="text-xs font-bold text-slate-600">{{ availablePageLabel }}</p>
                            </div>
                            <p class="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black text-[#f97316]">
                                Pagina {{ currentAvailablePage }} / {{ availableTotalPages }}
                            </p>
                        </div>

                        <div class="flex items-center gap-2 overflow-x-auto pb-1">
                            <button
                                type="button"
                                class="h-9 min-w-9 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-black text-slate-500 disabled:opacity-40"
                                :disabled="currentAvailablePage === 1"
                                @click="setAvailablePage(currentAvailablePage - 1)"
                            >
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <span v-if="availablePageNumbers[0] > 1" class="px-1 text-xs font-black text-slate-400">...</span>
                            <button
                                v-for="page in availablePageNumbers"
                                :key="page"
                                type="button"
                                class="h-9 min-w-9 rounded-xl px-3 text-xs font-black transition"
                                :class="page === currentAvailablePage ? 'bg-[#f97316] text-white shadow-md shadow-orange-500/20' : 'border border-slate-100 bg-slate-50 text-slate-500'"
                                @click="setAvailablePage(page)"
                            >
                                {{ page }}
                            </button>
                            <span v-if="availablePageNumbers[availablePageNumbers.length - 1] < availableTotalPages" class="px-1 text-xs font-black text-slate-400">...</span>
                            <button
                                type="button"
                                class="h-9 min-w-9 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-black text-slate-500 disabled:opacity-40"
                                :disabled="currentAvailablePage === availableTotalPages"
                                @click="setAvailablePage(currentAvailablePage + 1)"
                            >
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>

                    <div v-for="order in paginatedAvailableOrders" :key="order.id" class="card-shadow rounded-2xl border border-slate-50 bg-white p-4">
                        <div class="mb-3 flex items-start justify-between">
                            <div class="flex items-center gap-2">
                                <div :class="['flex h-10 w-10 items-center justify-center rounded-full text-xl', order.franchise.color]">
                                    {{ order.franchise.emoji }}
                                </div>
                                <div>
                                    <h3 class="text-sm font-black leading-tight text-slate-800">{{ order.franchise.name }}</h3>
                                    <p class="text-[10px] font-bold text-slate-500">{{ order.franchise.items }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] font-black uppercase text-[#f97316]">Pago</p>
                                <p class="text-lg font-black leading-none text-[#22c55e]">{{ formatCurrency(order.price) }}</p>
                            </div>
                        </div>

                        <div class="mb-3 rounded-xl bg-slate-50 p-2.5">
                            <p class="mb-0.5 text-[10px] font-bold text-slate-400">Destino:</p>
                            <p class="text-xs font-black text-slate-700">{{ order.dropoff }}</p>
                        </div>

                        <div
                            class="mb-3 rounded-xl px-3 py-2 text-[11px] font-black"
                            :class="order.backendStatusKey === 'preparando' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'"
                        >
                            <i class="fa-solid mr-1" :class="order.canAccept ? 'fa-circle-check' : 'fa-clock'"></i>
                            {{ order.backendStatusKey === 'preparando' ? 'Listo para aceptar' : 'Nuevo pedido: valida en el local' }}
                        </div>
                        <div
                            v-if="getAcceptRestrictionMessage(order)"
                            class="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-600"
                        >
                            <i class="fa-solid fa-circle-exclamation mr-1"></i>
                            {{ getAcceptRestrictionMessage(order) }}
                        </div>

                        <div class="flex gap-2">
                            <button
                                type="button"
                                class="h-10 w-12 rounded-lg bg-slate-100 font-black text-slate-400 transition hover:bg-slate-200"
                                @click="rejectOrder(order.id)"
                            >
                                X
                            </button>
                            <button
                                type="button"
                                class="h-10 flex-1 rounded-lg text-xs font-black text-white shadow-md transition"
                                :class="canAcceptOrder(order) ? 'bg-[#f97316] active:bg-[#ea580c]' : 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none'"
                                :disabled="isAdvancing || !canAcceptOrder(order)"
                                @click="acceptOrder(order.id)"
                            >
                                {{ order.backendStatusKey === 'preparando' ? 'ACEPTAR VIAJE' : 'ACEPTAR Y VALIDAR' }}
                            </button>
                        </div>
                    </div>

                    <div v-if="availableTotalPages > 1" class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <button
                            type="button"
                            class="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40"
                            :disabled="currentAvailablePage === 1"
                            @click="setAvailablePage(currentAvailablePage - 1)"
                        >
                            Anterior
                        </button>
                        <span class="text-xs font-black text-slate-500">Pagina {{ currentAvailablePage }} de {{ availableTotalPages }}</span>
                        <button
                            type="button"
                            class="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 disabled:opacity-40"
                            :disabled="currentAvailablePage === availableTotalPages"
                            @click="setAvailablePage(currentAvailablePage + 1)"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>

                <div :class="['flex-1 flex-col pb-4', currentTab === 'active' ? 'flex' : 'hidden']">
                    <div class="mb-3 shrink-0">
                        <div v-if="!state.activeOrder && state.status === 'offline'" class="rounded-2xl border border-slate-100 bg-white p-6 text-center">
                            <div class="mb-2 text-4xl">&#x1F6CC;</div>
                            <h3 class="text-sm font-black text-slate-800">Turno finalizado</h3>
                        </div>

                        <div v-else-if="!state.activeOrder" class="rounded-2xl border border-slate-100 bg-white p-6 text-center">
                            <div class="mb-2 text-4xl">&#x1F6F5;</div>
                            <h3 class="text-sm font-black text-slate-800">No hay viaje en curso</h3>
                        </div>

                        <div v-if="activeDeliveryOrders.length > 1" class="mb-3 flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                            <button
                                v-for="order in activeDeliveryOrders"
                                :key="`active-select-${order.id}`"
                                type="button"
                                class="min-w-[8rem] rounded-xl px-3 py-2 text-left text-[10px] font-black transition"
                                :class="String(order.id) === String(state.activeOrderId) ? 'bg-[#f97316] text-white shadow-md shadow-orange-500/20' : 'bg-slate-50 text-slate-500'"
                                @click="setSelectedActiveOrder(order.id)"
                            >
                                <span class="block truncate">#{{ order.id }} {{ order.franchise.name }}</span>
                                <span class="block truncate opacity-80">{{ order.status === 'picked' ? 'Al cliente' : 'En gestion' }}</span>
                            </button>
                        </div>

                        <div v-if="state.activeOrder" class="card-shadow overflow-hidden rounded-2xl border-2 border-orange-200 bg-white">
                            <div class="flex items-center justify-center gap-1 bg-orange-50 p-2 text-center">
                                <span class="text-sm">{{ activeOrderMeta?.emoji }}</span>
                                <span class="text-[10px] font-black uppercase text-[#f97316]">{{ activeOrderMeta?.title }}</span>
                            </div>

                            <div class="p-4">
                                <div class="mb-4 flex items-center gap-3">
                                    <div class="text-3xl">{{ state.activeOrder.franchise.emoji }}</div>
                                    <div>
                                        <h3 class="text-sm font-black text-slate-800">{{ state.activeOrder.franchise.name }}</h3>
                                        <p class="text-[10px] font-bold text-slate-500">{{ state.activeOrder.franchise.items }}</p>
                                    </div>
                                </div>

                                <div class="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <p class="mb-0.5 text-[9px] font-bold uppercase text-slate-400">Direccion</p>
                                    <p class="text-xs font-black text-slate-800">{{ activeOrderAddress }}</p>
                                </div>

                                <div v-if="state.activeOrder.deliveryFeeWaived" class="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-[11px] font-black text-emerald-700">
                                    <i class="fa-solid fa-gift mr-1"></i>
                                    Envio gratis para el cliente por superar 1 hora desde la aceptacion.
                                </div>

                                <div class="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3 shadow-sm">
                                    <div class="mb-2 flex items-center justify-between border-b border-orange-200/50 pb-2">
                                        <p class="text-[10px] font-bold uppercase text-slate-500">Código de entrega</p>
                                        <p class="rounded-lg bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#f97316] shadow-sm">
                                            Pidelo al cliente
                                        </p>
                                    </div>
                                    <div>
                                        <p class="mb-0.5 text-[9px] font-bold uppercase text-slate-500">Descripción del Pedido</p>
                                        <p class="whitespace-pre-line text-xs font-black text-slate-800">{{ state.activeOrder.descripcionDetallada }}</p>
                                    </div>
                                </div>

                                <button
                                    v-if="state.activeOrder.status !== 'arrived_customer'"
                                    type="button"
                                    :class="['flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black shadow-md', activeOrderMeta?.buttonClass]"
                                    :disabled="isAdvancing"
                                    @click="handleActiveOrderPrimaryAction"
                                >
                                    <i class="fa-solid fa-location-arrow"></i>
                                    {{ activeOrderMeta?.buttonLabel }}
                                </button>

                                <button
                                    v-else
                                    type="button"
                                    :class="['flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black shadow-md', activeOrderMeta?.buttonClass]"
                                    :disabled="isAdvancing"
                                    @click="openDeliveryConfirmation"
                                >
                                    <i class="fa-solid fa-check-double"></i>
                                    {{ activeOrderMeta?.buttonLabel }}
                                </button>

                                <div class="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        class="flex-1 rounded-lg bg-slate-100 py-2 text-[10px] font-bold text-slate-500"
                                        @click="cancelOrder"
                                    >
                                        Problema (Cancelar)
                                    </button>
                                    <button
                                        type="button"
                                        class="flex w-10 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600"
                                        @click="triggerSOS"
                                    >
                                        <i class="fa-solid fa-phone"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div :class="['relative min-h-[250px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-inner', showMapWrapper ? '' : 'hidden']">
                        <div ref="mapEl" class="delivery-map absolute inset-0"></div>
                    </div>
                </div>

                <div :class="['space-y-3 pb-4', currentTab === 'history' ? '' : 'hidden']">
                    <div class="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#f97316] shadow-sm">
                                <i class="fa-solid fa-chart-line"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-black text-slate-800">Resumen del repartidor</h3>
                                <p class="text-[11px] font-bold text-slate-500">Viajes activos, completados, cancelados e ingresos aproximados.</p>
                            </div>
                        </div>
                    </div>

                    <div v-if="driverHistoryRows.length === 0" class="rounded-2xl border border-slate-100 bg-white p-6 text-center">
                        <div class="mb-2 text-4xl"><i class="fa-regular fa-clipboard text-slate-300"></i></div>
                        <h3 class="text-sm font-black text-slate-800">Sin historial todavia</h3>
                        <p class="text-xs text-slate-500">Cuando aceptes o completes viajes apareceran aqui.</p>
                    </div>

                    <div
                        v-for="item in driverHistoryRows"
                        :key="item.id"
                        class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex min-w-0 items-start gap-3">
                                <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm', item.iconClass]">
                                    <i :class="item.icon"></i>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="truncate text-sm font-black text-slate-800">{{ item.title }}</h3>
                                    <p class="text-[10px] font-black uppercase tracking-wide text-[#f97316]">{{ item.subtitle }}</p>
                                    <p class="mt-1 line-clamp-2 text-xs font-bold leading-snug text-slate-500">{{ item.detail }}</p>
                                </div>
                            </div>
                            <div class="shrink-0 text-right">
                                <p :class="['text-sm font-black', item.amountClass]">{{ item.amountText }}</p>
                                <p class="mt-1 text-[9px] font-bold text-slate-400">{{ item.time }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section :class="['view px-4 pt-4', currentView === 'finance' ? 'active' : '']">
                <div class="card-shadow mb-5 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] p-5 text-center text-white">
                    <p class="mb-1 text-[10px] font-bold uppercase tracking-wider text-orange-100">Saldo Disponible</p>
                    <h2 class="mb-4 text-4xl font-black">{{ financeBalance }}</h2>

                    <div class="mb-4 flex gap-2 rounded-xl bg-white/20 p-3 text-left">
                        <div class="flex-1 border-r border-white/20">
                            <p class="text-[10px] font-bold text-orange-100">Viajes</p>
                            <p class="text-lg font-black leading-tight">{{ state.trips }}</p>
                        </div>
                        <div class="flex-1 pl-2">
                            <p class="text-[10px] font-bold text-orange-100">Propinas</p>
                            <p class="text-lg font-black leading-tight">{{ statTips }}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="w-full rounded-xl bg-white py-3 text-sm font-black text-[#f97316] shadow-md active:bg-orange-50"
                        @click="openModal('modal-withdraw')"
                    >
                        RETIRAR DINERO
                    </button>
                </div>

                <button
                    type="button"
                    class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-xs font-bold text-red-600 transition active:bg-red-100"
                    @click="openModal('modal-report')"
                >
                    <i class="fa-solid fa-triangle-exclamation"></i> No recibiste un pago? Reportalo
                </button>

                <h3 class="mb-3 px-1 text-sm font-black text-slate-800">Historial Financiero</h3>

                <div class="space-y-2 pb-4">
                    <p v-if="financeHistory.length === 0" class="py-2 text-center text-[10px] font-bold text-slate-400">Sin movimientos</p>

                    <div
                        v-for="item in financeHistory"
                        :key="`${item.desc}-${item.time}-${item.amount}`"
                        class="flex items-center justify-between rounded-xl border border-slate-50 bg-white p-3 shadow-sm"
                    >
                        <div class="flex items-center gap-2">
                            <div class="text-lg">{{ item.emoji }}</div>
                            <div>
                                <p class="text-xs font-black text-slate-800">{{ item.desc }}</p>
                                <p class="text-[9px] font-bold text-slate-400">{{ item.time }}</p>
                            </div>
                        </div>
                        <p :class="['text-sm font-black', item.amount > 0 ? 'text-[#22c55e]' : 'text-slate-400']">
                            {{ item.amount > 0 ? '+' : '-' }}{{ formatCurrency(Math.abs(item.amount)) }}
                        </p>
                    </div>
                </div>
            </section>

            <section :class="['view px-4 pt-4', currentView === 'profile' ? 'active' : '']">
                <div class="card-shadow mb-4 rounded-2xl border border-slate-100 bg-white p-5">
                    <div class="mb-5 text-center">
                        <div class="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-orange-50 text-3xl shadow-sm">
                            <i class="fa-solid fa-user-astronaut"></i>
                        </div>
                        <h2 class="text-lg font-black leading-tight text-slate-800">{{ session.userName || 'Juan Delivery' }}</h2>
                        <p class="mt-0.5 text-xs font-bold text-[#f97316]">&#9733; 4.9 Puntuacion</p>
                    </div>
                </div>

                <div class="card-shadow mb-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <div class="mb-3 flex items-center justify-between">
                        <h3 class="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
                            <i class="fa-regular fa-clock"></i> Control de Turno
                        </h3>
                        <span class="text-[10px] font-bold text-slate-400">{{ shiftStatusText }}</span>
                    </div>

                    <button type="button" :class="shiftButtonClasses" @click="toggleShift">
                        <span class="flex items-center justify-center gap-2">
                            <i :class="shiftButtonIcon"></i>
                            {{ shiftButtonLabel }}
                        </span>
                    </button>

                    <div v-if="showShiftTimer" class="mt-4 border-t border-slate-100 pt-3 text-center">
                        <p class="mb-1 text-[10px] font-bold uppercase text-slate-400">Tiempo Trabajado</p>
                        <p class="tracking-widest text-3xl font-black text-slate-800">{{ shiftTimerText }}</p>
                    </div>
                </div>

                <div class="card-shadow mb-4 space-y-1 rounded-2xl border border-slate-100 bg-white p-2">
                    <button
                        type="button"
                        class="flex w-full items-center justify-between rounded-xl bg-white px-4 py-4 text-sm font-bold text-slate-700 transition active:bg-slate-50"
                        @click="openPage('page-shift-history')"
                    >
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-list-ul w-5 text-[#f97316]"></i> Historial de Horarios
                        </div>
                        <i class="fa-solid fa-chevron-right text-slate-300"></i>
                    </button>

                    <hr class="mx-4 border-slate-100">

                    <button
                        type="button"
                        class="flex w-full items-center justify-between rounded-xl bg-white px-4 py-4 text-sm font-bold text-slate-700 transition active:bg-slate-50"
                        @click="openPage('page-help-center')"
                    >
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-headset w-5 text-blue-500"></i> Centro de Ayuda / SOS
                        </div>
                        <i class="fa-solid fa-chevron-right text-slate-300"></i>
                    </button>

                    <hr class="mx-4 border-slate-100">

                    <div class="px-4 py-3">
                        <label class="mb-2 block text-[10px] font-bold uppercase text-slate-400">Filtro de Franquicia (Multitenant)</label>
                        <select v-model="state.tenant" class="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700 outline-none">
                            <option v-for="option in tenantOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <button
                    type="button"
                    class="delivery-logout-button mb-4 w-full rounded-xl py-4 text-sm font-black transition active:scale-[0.99]"
                    @click="logout"
                >
                    Cerrar sesión
                </button>
            </section>
        </main>

        <nav class="delivery-bottom-nav relative z-40 flex-none border-t border-slate-100 bg-white px-4 py-2 pb-safe">
            <div class="mx-auto flex w-full max-w-sm items-center justify-between">
                <button type="button" :class="['flex flex-1 flex-col items-center gap-1', currentView === 'orders' ? 'text-[#f97316]' : 'text-slate-300']" @click="navigate('orders')">
                    <i class="fa-solid fa-motorcycle text-xl"></i>
                    <span class="text-[9px] font-black uppercase">Viajes</span>
                </button>
                <button type="button" :class="['flex flex-1 flex-col items-center gap-1', currentView === 'finance' ? 'text-[#f97316]' : 'text-slate-300']" @click="navigate('finance')">
                    <i class="fa-solid fa-wallet text-xl"></i>
                    <span class="text-[9px] font-black uppercase">Wallet</span>
                </button>
                <button type="button" :class="['flex flex-1 flex-col items-center gap-1', currentView === 'profile' ? 'text-[#f97316]' : 'text-slate-300']" @click="navigate('profile')">
                    <i class="fa-solid fa-user-astronaut text-xl"></i>
                    <span class="text-[9px] font-black uppercase">Perfil</span>
                </button>
            </div>
        </nav>

        <div
            :class="[
                'fixed inset-0 z-[150] flex flex-col bg-slate-50 transition-transform duration-300',
                activePage === 'page-shift-history' ? 'translate-x-0' : 'pointer-events-none translate-x-full'
            ]"
        >
            <header class="z-10 flex items-center gap-4 bg-white px-4 py-4 shadow-sm">
                <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 active:bg-slate-200" @click="closePage('page-shift-history')">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h2 class="text-lg font-black text-slate-800">Historial de Horarios</h2>
            </header>

            <div class="hide-scrollbar flex-1 overflow-y-auto p-4 pb-safe">
                <div class="space-y-3">
                    <div v-if="shiftHistory.length === 0" class="py-20 text-center">
                        <i class="fa-regular fa-clock mb-3 text-4xl text-slate-300"></i>
                        <p class="text-sm font-bold text-slate-500">No hay turnos registrados</p>
                    </div>

                    <div
                        v-for="item in shiftHistory"
                        :key="`${item.date}-${item.start}-${item.end}`"
                        class="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                        <div>
                            <p class="text-sm font-black text-slate-800">{{ item.date }}</p>
                            <p class="text-xs font-bold text-slate-500">{{ item.start }} - {{ item.end }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold uppercase text-slate-400">Tiempo</p>
                            <p class="text-sm font-black text-[#f97316]">{{ item.duration }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            :class="[
                'fixed inset-0 z-[150] flex flex-col bg-slate-50 transition-transform duration-300',
                activePage === 'page-help-center' ? 'translate-x-0' : 'pointer-events-none translate-x-full'
            ]"
        >
            <header class="z-10 flex items-center gap-4 bg-white px-4 py-4 shadow-sm">
                <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 active:bg-slate-200" @click="closePage('page-help-center')">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h2 class="text-lg font-black text-slate-800">Centro de Soporte</h2>
            </header>

            <div class="hide-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-safe">
                <div class="mb-6 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-500">
                        <i class="fa-solid fa-truck-medical"></i>
                    </div>
                    <h3 class="mb-2 font-black text-slate-800">Estas en peligro?</h3>
                    <p class="mb-4 text-xs text-slate-500">
                        Usa este boton solo en caso de accidentes, asaltos o emergencias de salud en tu ruta.
                    </p>
                    <button type="button" class="w-full rounded-xl bg-red-500 py-4 font-black text-white shadow-md active:bg-red-600" @click="triggerSOS">
                        BOTON DE PANICO (SOS)
                    </button>
                </div>

                <div v-if="supportWarnings.length > 0" class="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                    <h3 class="text-xs font-black uppercase tracking-wide text-amber-700">Alertas del Sistema</h3>
                    <div class="mt-3 space-y-2">
                        <p v-for="warning in supportWarnings" :key="warning" class="text-xs font-bold text-amber-700">
                            {{ warning }}
                        </p>
                    </div>
                </div>

                <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <button
                        type="button"
                        class="flex w-full items-center justify-between border-b border-slate-100 bg-white px-5 py-4 font-bold text-slate-700 active:bg-slate-50"
                        @click="showTutorial(); closePage('page-help-center')"
                    >
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-book-open w-5 text-[#f97316]"></i> Volver a ver el Tutorial de Inicio
                        </div>
                        <i class="fa-solid fa-chevron-right text-slate-300"></i>
                    </button>

                    <button
                        type="button"
                        class="flex w-full items-center justify-between border-b border-slate-100 bg-white px-5 py-4 font-bold text-slate-700 active:bg-slate-50"
                        @click="showToast('Conectando agente...', 'info')"
                    >
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-headset w-5 text-blue-500"></i> Llamar al Soporte Tecnico
                        </div>
                        <i class="fa-solid fa-chevron-right text-slate-300"></i>
                    </button>

                    <button
                        type="button"
                        class="flex w-full items-center justify-between bg-white px-5 py-4 font-bold text-slate-700 active:bg-slate-50"
                        @click="openModal('modal-report'); closePage('page-help-center')"
                    >
                        <div class="flex items-center gap-3">
                            <i class="fa-solid fa-money-bill-wave w-5 text-[#22c55e]"></i> Reportar un Pago no Recibido
                        </div>
                        <i class="fa-solid fa-chevron-right text-slate-300"></i>
                    </button>
                </div>
            </div>
        </div>

        <div
            :class="[
                'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm transition-opacity',
                isAbsenceModalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            ]"
        >
            <div :class="['w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-2xl transition-transform duration-300', isAbsenceModalOpen ? 'scale-100' : 'scale-95']">
                <div class="mb-4 text-5xl">&#x1F97A;</div>
                <h3 class="mb-2 text-xl font-black text-slate-800">Te extranamos</h3>
                <p class="mb-6 text-sm font-bold text-slate-500">
                    Notamos que tienes dias sin conectarte. Como trabajas cuando quieres, no pasa nada, pero queremos saber si todo esta bien contigo.
                </p>

                <div class="space-y-3">
                    <button type="button" class="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 active:bg-slate-200" @click="reportAbsence">Solo queria descansar unos dias</button>
                    <button type="button" class="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 active:bg-slate-200" @click="reportAbsence">Problemas con mi vehiculo</button>
                    <button type="button" class="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 active:bg-slate-200" @click="reportAbsence">Tuve problemas con la App</button>
                </div>
            </div>
        </div>

        <div
            :class="[
                'fixed inset-0 z-[100] flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity',
                isDeliveryConfirmModalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            ]"
        >
            <div :class="['mx-auto w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl transition-transform duration-300', isDeliveryConfirmModalOpen ? 'translate-y-0' : 'translate-y-full']">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.22em] text-[#f97316]">Entrega segura</p>
                        <h3 class="text-lg font-black text-slate-800">Confirmar entrega</h3>
                    </div>
                    <button type="button" class="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-500" @click="closeModal('modal-delivery-confirm')">X</button>
                </div>

                <div class="space-y-4">
                    <div class="rounded-2xl border border-orange-100 bg-orange-50 p-3 text-xs font-bold text-slate-600">
                        Pide al cliente el código del pedido, toma una evidencia y confirma solo cuando el pedido ya esté en sus manos.
                    </div>

                    <div>
                        <label class="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">Código del cliente</label>
                        <input
                            v-model="deliveryConfirmCode"
                            type="text"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            placeholder="Ej. 001234"
                            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl font-black tracking-[0.25em] text-slate-800 outline-none focus:border-[#f97316] focus:bg-white"
                        >
                        <p v-if="deliveryConfirmCode && !deliveryCodeMatches" class="mt-2 text-[11px] font-bold text-red-500">
                            Ese código no coincide con el pedido activo.
                        </p>
                    </div>

                    <button type="button" class="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition active:bg-slate-100" @click="triggerDeliveryProof">
                        <i class="fa-solid fa-camera mb-2 text-2xl text-[#f97316]"></i>
                        <p :class="['text-xs font-black', deliveryProofFile ? 'text-[#22c55e]' : 'text-slate-500']">
                            {{ deliveryProofFileName }}
                        </p>
                    </button>

                    <label class="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-xs font-bold text-slate-600 shadow-sm">
                        <input v-model="deliveryProofAccepted" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#22c55e]">
                        <span>Confirmo que entregue el pedido al cliente correcto y que la evidencia corresponde a esta entrega.</span>
                    </label>

                    <button
                        type="button"
                        class="w-full rounded-xl bg-[#22c55e] py-3.5 text-sm font-black text-white shadow-lg shadow-green-500/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                        :disabled="!canSubmitDeliveryConfirmation"
                        @click="completeDelivery"
                    >
                        <span v-if="isAdvancing"><i class="fa-solid fa-spinner fa-spin"></i> CONFIRMANDO...</span>
                        <span v-else>CONFIRMAR ENTREGA</span>
                    </button>
                </div>
            </div>
        </div>

        <div
            :class="[
                'fixed inset-0 z-[100] flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity',
                isWithdrawModalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            ]"
        >
            <div :class="['mx-auto w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl transition-transform duration-300', isWithdrawModalOpen ? 'translate-y-0' : 'translate-y-full']">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-black text-slate-800">Retirar Dinero</h3>
                    <button type="button" class="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-500" @click="closeModal('modal-withdraw')">X</button>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-3">
                        <span class="text-xs font-bold text-[#f97316]">Disponible</span>
                        <span class="text-lg font-black text-[#f97316]">{{ modalMaxAmount }}</span>
                    </div>

                    <div>
                        <input v-model="withdrawInput" type="number" placeholder="0.00" class="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center text-xl font-black text-slate-800 outline-none">
                    </div>

                    <button type="button" class="w-full rounded-xl bg-[#22c55e] py-3.5 text-sm font-black text-white active:bg-green-600" @click="processWithdraw">
                        {{ isWithdrawing ? 'PROCESANDO...' : 'CONFIRMAR' }}
                    </button>
                </div>
            </div>
        </div>

        <div
            :class="[
                'fixed inset-0 z-[100] flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity',
                isReportModalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            ]"
        >
            <div :class="['mx-auto w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl transition-transform duration-300', isReportModalOpen ? 'translate-y-0' : 'translate-y-full']">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-black text-slate-800">Reportar Pago</h3>
                    <button type="button" class="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-500" @click="closeModal('modal-report')">X</button>
                </div>

                <div class="space-y-3">
                    <p class="mb-2 text-[11px] font-bold text-slate-500">
                        Necesitamos el ID del pedido y una captura de pantalla como evidencia.
                    </p>

                    <input v-model="reportId" type="text" placeholder="ID del Viaje (ej. 4A2B)" class="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 outline-none">

                    <div class="w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition active:bg-slate-100" @click="triggerReportUpload">
                        <i class="fa-solid fa-image mb-2 text-2xl text-slate-400"></i>
                        <p :class="['text-xs font-bold', reportFileLoaded ? 'text-[#22c55e]' : 'text-slate-500']">
                            {{ reportFileName }}
                        </p>
                    </div>

                    <input ref="reportEvidenceInput" type="file" class="hidden" accept="image/*" @change="handleReportEvidenceChange">

                    <button type="button" class="mt-2 w-full rounded-xl bg-[#ef4444] py-3.5 text-sm font-black text-white active:bg-red-600" @click="submitReport">
                        <span v-if="isSubmittingReport"><i class="fa-solid fa-spinner fa-spin"></i> ENVIANDO...</span>
                        <span v-else>ENVIAR EVIDENCIA</span>
                    </button>
                </div>
            </div>
        </div>

        <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="handleDeliveryPhoto">
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');

.delivery-pro {
    font-family: 'Inter', sans-serif;
    height: 100dvh;
    max-height: 100dvh;
    -webkit-tap-highlight-color: transparent;
}

.delivery-header-brand {
    max-width: calc(100% - 6rem);
}

.delivery-header-meta span:last-child {
    white-space: nowrap;
}

.delivery-shift-dot {
    box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.delivery-dark .delivery-shift-dot {
    border-color: #101827 !important;
    box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.28);
}

.delivery-dark .delivery-shift-dot.bg-slate-400 {
    background-color: #64748b !important;
}

.delivery-order-tabs {
    backdrop-filter: blur(16px);
}

.delivery-dark .delivery-order-tabs {
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(16, 24, 39, 0.92) !important;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.24);
}

.delivery-bottom-nav {
    position: sticky;
    bottom: 0;
    box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.08);
}

.delivery-dark .delivery-bottom-nav {
    box-shadow: 0 -14px 34px rgba(0, 0, 0, 0.38);
}

.delivery-logout-button {
    border: 1px solid #fecaca;
    background: #fee2e2;
    color: #b91c1c;
    box-shadow: 0 12px 26px rgba(239, 68, 68, 0.12);
}

.delivery-logout-button:active {
    background: #fecaca;
}

.delivery-dark .delivery-logout-button {
    border-color: rgba(248, 113, 113, 0.38);
    background: linear-gradient(135deg, rgba(127, 29, 29, 0.92), rgba(185, 28, 28, 0.76));
    color: #fff1f2;
    box-shadow: 0 18px 36px rgba(127, 29, 29, 0.32);
}

.delivery-dark .delivery-logout-button:active {
    background: linear-gradient(135deg, rgba(153, 27, 27, 0.96), rgba(220, 38, 38, 0.82));
}

@supports not (height: 100dvh) {
    .delivery-pro {
        height: 100vh;
        max-height: 100vh;
    }
}

.delivery-onboarding {
    z-index: 200;
}

.hide-scrollbar::-webkit-scrollbar {
    display: none;
}

.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.view {
    display: none;
    min-height: 100%;
    animation: fade-in 0.2s ease-in-out forwards;
}

.view.active {
    display: flex;
    flex-direction: column;
}

.delivery-map {
    width: 100%;
    height: 100%;
    border-radius: 1rem;
    z-index: 10;
}

.card-shadow {
    box-shadow: 0 4px 20px -5px rgba(249, 115, 22, 0.08);
}

.pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
}

.toast-enter {
    animation: toast-in 0.25s ease-out;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes toast-in {
    from {
        opacity: 0;
        transform: translateY(-14px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
