<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import '@fortawesome/fontawesome-free/css/all.min.css';

const STORAGE_KEY = 'FoodRush_V8_Final';
const TUTORIAL_KEY = 'FoodRush_Tutorial_Final';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const onboardingSteps = [
    {
        number: 1,
        badgeClass: 'bg-[#ffedd5] text-[#ea580c]',
        title: 'Eres tu propio jefe',
        description: 'El horario es <b>100% flexible</b>. No es obligatorio trabajar en horas específicas. Tú decides cuándo conectarte y hacer dinero.'
    },
    {
        number: 2,
        badgeClass: 'bg-blue-100 text-blue-600',
        title: 'Iniciar Turno',
        description: 'Para empezar a recibir viajes, ve a la pestaña <b>Perfil</b> y presiona el botón verde de "INICIAR TURNO".'
    },
    {
        number: 3,
        badgeClass: 'bg-slate-200 text-slate-600',
        title: 'Días libres y ausencias',
        description: 'Si pasas un día entero sin trabajar, la app te enviará una notificación preguntando por qué. Es solo para saber que estás bien, <b>no hay penalizaciones</b>.'
    },
    {
        number: 4,
        badgeClass: 'bg-[#eab308] text-white',
        title: 'Pantalla de Viajes',
        description: 'Ve a la pestaña de <b>Viajes</b>. Aquí irán apareciendo los pedidos de comida cercanos a ti.'
    },
    {
        number: 5,
        badgeClass: 'bg-[#f97316] text-white',
        title: 'Aceptar un Pedido',
        description: 'Revisa cuánto te pagarán y a dónde va el pedido. Si te conviene, presiona <b>"ACEPTAR VIAJE"</b> rápido antes que otro repartidor.'
    },
    {
        number: 6,
        badgeClass: 'bg-slate-800 text-white',
        title: 'Mapa hacia el Local',
        description: 'Al aceptar, aparecerá un mapa inteligente. Sigue la ruta naranja hasta el restaurante y al llegar presiona <b>"LLEGUÉ AL LOCAL"</b>.'
    },
    {
        number: 7,
        badgeClass: 'bg-orange-400 text-white',
        title: 'Recoger Comida',
        description: 'Dale tu número de orden al cajero. Cuando te entreguen la mochila, presiona <b>"¡RECIBÍ COMIDA!"</b>.'
    },
    {
        number: 8,
        badgeClass: 'bg-green-400 text-white',
        title: 'Ruta al Cliente',
        description: 'El mapa cambiará para guiarte a la casa del cliente. Conduce con cuidado siguiendo la ruta verde.'
    },
    {
        number: 9,
        badgeClass: 'bg-purple-500 text-white',
        title: 'Evidencia Fotográfica',
        description: 'Al entregar, la app te exigirá abrir tu cámara. <b>Debes tomar una foto</b> del paquete en la puerta del cliente para comprobar la entrega.'
    },
    {
        number: 10,
        badgeClass: 'bg-[#22c55e] text-white',
        title: 'Recibe tu Pago',
        description: 'Tan pronto envíes la foto, el costo del viaje y las propinas se sumarán automáticamente a tu cuenta.'
    },
    {
        number: 11,
        badgeClass: 'bg-blue-400 text-white',
        title: 'Wallet y Retiros',
        description: 'En la pestaña <b>Wallet</b> verás tu dinero acumulado. Usa el botón "Retirar Dinero" para enviarlo a tu banco cuando quieras.'
    },
    {
        number: 12,
        badgeClass: 'bg-[#ef4444] text-white',
        title: 'Emergencias (SOS)',
        description: 'Si tienes un accidente, asalto o duda, ve a tu Perfil y abre el <b>Centro de Ayuda</b> o usa el botón rojo de <b>Emergencia SOS</b>.'
    }
];

const tenantOptions = [
    { value: 'Global', label: '🍔 Simular Servidor: Todas las Tiendas' },
    { value: 'BurgerKing', label: '🍔 Simular Servidor: Burger King' },
    { value: 'PizzaHut', label: '🍕 Simular Servidor: Pizza Hut' }
];

const franchises = [
    { id: 'BurgerKing', name: 'Burger King', emoji: '🍔', items: '2x Whopper', color: 'bg-orange-100 text-orange-600' },
    { id: 'PizzaHut', name: 'Pizza Hut', emoji: '🍕', items: '1x Familiar', color: 'bg-red-100 text-red-600' }
];

const streets = ['Villa Olga', 'Los Jardines', 'Cerros de Gurabo', 'Centro Histórico'];
const coordsSantiago = [19.4517, -70.697];

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
    availableOrders: [],
    activeOrder: null,
    history: []
});

const state = reactive(defaultState());
const currentView = ref('orders');
const currentTab = ref('available');
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
const isWithdrawing = ref(false);
const isSubmittingReport = ref(false);
const mapEl = ref(null);
const cameraInput = ref(null);
const reportEvidenceInput = ref(null);

let toastId = 0;
let timerInterval = null;
let leaflet = null;
let mapInstance = null;
let riderMarker = null;
let routeLayers = [];
let currentRoute = null;
const scheduledTimeouts = [];

const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

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

const tenantDisplay = computed(() => {
    if (state.tenant === 'Global') return 'Servidor: Global';
    const match = tenantOptions.find((option) => option.value === state.tenant);
    return match ? `Servidor: ${match.label.split(':')[1].trim()}` : 'Servidor: Global';
});

const badgeAvail = computed(() => state.availableOrders.length);
const badgeActive = computed(() => (state.activeOrder ? 1 : 0));
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
const activeOrderMeta = computed(() => {
    if (!state.activeOrder) return null;

    if (state.activeOrder.status === 'accepted') {
        return {
            title: 'HACIA EL LOCAL',
            emoji: '🏪',
            buttonClass: 'bg-[#f97316] text-white',
            buttonLabel: 'LLEGUÉ AL LOCAL'
        };
    }

    if (state.activeOrder.status === 'arrived') {
        return {
            title: 'ESPERANDO PEDIDO',
            emoji: '⏳',
            buttonClass: 'bg-[#eab308] text-slate-900',
            buttonLabel: '¡RECIBÍ COMIDA!'
        };
    }

    return {
        title: 'ENTREGANDO AL CLIENTE',
        emoji: '🏠',
        buttonClass: 'bg-[#22c55e] text-white',
        buttonLabel: 'TOMAR FOTO DE ENTREGA'
    };
});
const activeOrderAddress = computed(() => {
    if (!state.activeOrder) return '';
    return state.activeOrder.status === 'picked' ? state.activeOrder.dropoff : state.activeOrder.pickup;
});

const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        const merged = { ...defaultState(), ...parsed };
        merged.shiftHistory = Array.isArray(merged.shiftHistory) ? merged.shiftHistory : [];
        merged.availableOrders = Array.isArray(merged.availableOrders) ? merged.availableOrders : [];
        merged.history = Array.isArray(merged.history) ? merged.history : [];

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

const openPage = (pageId) => {
    activePage.value = pageId;
};

const closePage = (pageId) => {
    if (activePage.value === pageId) activePage.value = '';
};

const openModal = (modalId) => {
    activeModal.value = modalId;
};

const closeModal = (modalId) => {
    if (activeModal.value === modalId) activeModal.value = '';
};

const showTutorial = () => {
    onboardingVisible.value = true;
};

const finishOnboarding = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    onboardingVisible.value = false;

    if (state.status === 'offline') {
        showToast("¡Estás listo! Ve a tu Perfil y toca 'Iniciar Turno'.");
        navigate('profile');
    }
};

const checkOnboarding = () => {
    const tutorialDone = localStorage.getItem(TUTORIAL_KEY);

    if (!tutorialDone) {
        showTutorial();
        return;
    }

    if (state.status === 'online' && state.availableOrders.length === 0 && !state.activeOrder) {
        queueTimeout(() => generateMockOrder(), 800);
    }
};

const checkAbsence = () => {
    if (!state.lastWorkDate || state.status === 'online' || state.absenceReported) return;

    const now = Date.now();
    if (now - state.lastWorkDate > 86400000) {
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

const toggleShift = () => {
    if (state.status === 'offline') {
        state.status = 'online';
        state.currentShiftStart = Date.now();
        state.lastWorkDate = state.currentShiftStart;
        state.absenceReported = false;
        saveState();
        startTimerIfOnline();
        showToast('¡Turno Iniciado! Atento a los pedidos.');

        queueTimeout(() => {
            navigate('orders');
            generateMockOrder();
        }, 1500);

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

    state.shiftHistory.push({
        date: new Date().toLocaleDateString(),
        start: formatTime(start),
        end: formatTime(end),
        duration: `${hours}h ${minutes}m`
    });

    state.status = 'offline';
    state.currentShiftStart = null;
    state.availableOrders = [];
    currentTab.value = 'available';
    clearRoute();
    stopShiftTimer();
    saveState();
    showToast('Turno finalizado. ¡Buen trabajo!');
};

const pickFranchiseList = () => {
    if (state.tenant === 'Global') return franchises;
    const filtered = franchises.filter((franchise) => franchise.id === state.tenant);
    return filtered.length ? filtered : franchises;
};

const generateMockOrder = () => {
    if (state.status === 'offline') return;

    const list = pickFranchiseList();
    const franchise = list[Math.floor(Math.random() * list.length)];

    state.availableOrders.push({
        id: Math.random().toString(36).slice(2, 7).toUpperCase(),
        franchise,
        pickup: `${franchise.name} Central`,
        dropoff: streets[Math.floor(Math.random() * streets.length)],
        price: (Math.random() * 5) + 3,
        status: 'pending'
    });

    currentTab.value = 'available';
    saveState();
    showToast(`¡Pedido de ${franchise.name}! ${franchise.emoji}`);
};

const buildLeafletIcon = (emoji) => {
    if (!leaflet) return null;

    return leaflet.divIcon({
        className: '',
        html: `<div style="font-size:20px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));">${emoji}</div>`,
        iconSize: [20, 20]
    });
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

const renderCurrentRoute = () => {
    if (!mapInstance || !leaflet || !currentRoute) return;

    clearRouteLayers();

    const marker = leaflet.marker(currentRoute.target, { icon: buildLeafletIcon(currentRoute.emoji) }).addTo(mapInstance);
    const line = leaflet.polyline([coordsSantiago, currentRoute.target], {
        color: currentRoute.color,
        weight: 4,
        dashArray: '6,6'
    }).addTo(mapInstance);

    routeLayers = [marker, line];

    queueTimeout(() => {
        if (!mapInstance) return;
        mapInstance.invalidateSize();
        mapInstance.fitBounds(line.getBounds(), { padding: [30, 30] });
    }, 100);
};

const setRoute = (targetType) => {
    if (!leaflet || !mapInstance) return;

    if (!currentRoute || currentRoute.type !== targetType) {
        currentRoute = {
            type: targetType,
            target: [
                coordsSantiago[0] + ((Math.random() - 0.5) * 0.02),
                coordsSantiago[1] + ((Math.random() - 0.5) * 0.02)
            ],
            color: targetType === 'restaurant' ? '#f97316' : '#22c55e',
            emoji: targetType === 'restaurant' ? '🏪' : '🏠'
        };
    }

    renderCurrentRoute();
};

const syncRouteFromState = () => {
    if (!state.activeOrder) {
        clearRoute();
        return;
    }

    setRoute(state.activeOrder.status === 'picked' ? 'customer' : 'restaurant');
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
    riderMarker = leaflet.marker(coordsSantiago, { icon: buildLeafletIcon('🛵') }).addTo(mapInstance);
    void riderMarker;

    if (state.activeOrder) syncRouteFromState();
};

const acceptOrder = (id) => {
    if (state.activeOrder) {
        showToast('Solo puedes llevar un pedido a la vez', 'error');
        return;
    }

    const index = state.availableOrders.findIndex((order) => order.id === id);
    if (index < 0) return;

    const order = state.availableOrders[index];
    
    // Generar código de seguridad de 6 caracteres
    const codigoDelivery = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Construir la descripción detallada
    const descripcionDetallada = `Pedido #${order.id}\nLocal: ${order.pickup}\nArtículos: ${order.franchise.items}`;

    // Asignar los nuevos valores al estado del pedido activo
    state.activeOrder = { 
        ...order, 
        status: 'accepted',
        codigoDelivery,
        descripcionDetallada
    };
    
    state.availableOrders.splice(index, 1);
    currentTab.value = 'active';
    saveState();

    showToast(`Pedido aceptado. Código de seguridad: ${codigoDelivery}`);

    nextTick(() => {
        if (mapInstance) setRoute('restaurant');
    });
};

const rejectOrder = (id) => {
    state.availableOrders = state.availableOrders.filter((order) => order.id !== id);
    saveState();
};

const updateOrderStatus = (status) => {
    if (!state.activeOrder) return;

    state.activeOrder.status = status;
    saveState();

    nextTick(() => {
        if (status === 'picked') {
            currentRoute = null;
            setRoute('customer');
        } else if (mapInstance) {
            mapInstance.invalidateSize();
        }
    });
};

const cancelOrder = () => {
    state.activeOrder = null;
    currentTab.value = 'available';
    clearRoute();
    saveState();
};

const triggerCamera = () => {
    cameraInput.value?.click();
};

const handleDeliveryPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showToast('Subiendo evidencia...', 'info');

    queueTimeout(() => {
        if (state.activeOrder) {
            const payment = state.activeOrder.price;
            const tip = Math.random() > 0.5 ? 1.5 : 0;

            state.earnings += payment + tip;
            state.tips += tip;
            state.trips += 1;
            state.history.push({
                emoji: state.activeOrder.franchise.emoji,
                desc: `Pago ${state.activeOrder.franchise.name}`,
                amount: payment + tip,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            state.activeOrder = null;
            currentTab.value = 'available';
            clearRoute();
            saveState();
            showToast(`+${formatCurrency(payment + tip)} depositados`);
            queueTimeout(() => generateMockOrder(), 2000);
        }

        if (cameraInput.value) cameraInput.value.value = '';
    }, 1000);
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
        state.history.push({
            emoji: '🏦',
            desc: 'Retiro',
            amount: -amount,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

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
    if (window.confirm('🚨 ALERTA SOS: ¿Estás en peligro? Esto avisará a la policía y soporte central.')) {
        showToast('Alerta enviada. Te llamaremos en segundos.', 'error');
    }
};

const changeTenant = () => {
    saveState();
};

const resetSystem = () => {
    if (window.confirm('¿Cerrar sesión y reiniciar app? El tutorial volverá a salir.')) {
        localStorage.clear();
        window.location.reload();
    }
};

onMounted(async () => {
    loadState();
    if (state.activeOrder) currentTab.value = 'active';
    startTimerIfOnline();
    checkOnboarding();
    checkAbsence();

    try {
        leaflet = await ensureLeaflet();
        await nextTick();
        initMap();
    } catch (error) {
        console.error('Leaflet no pudo cargar en delivery', error);
    }
});

onBeforeUnmount(() => {
    stopShiftTimer();
    clearScheduledTimeouts();

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
});
</script>

<template>
    <div class="delivery-pro relative flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-700">
        <div
            :class="[
                'fixed inset-0 z-[200] flex flex-col bg-white transition-opacity duration-500',
                onboardingVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            ]"
        >
            <div class="flex-none bg-[#f97316] px-6 pb-4 pt-12 text-white shadow-md">
                <h2 class="text-2xl font-black">Guia de FoodRush <i class="fa-solid fa-motorcycle"></i></h2>
                <p class="text-sm font-semibold opacity-90">Todo lo que necesitas saber paso a paso:</p>
            </div>

            <div class="hide-scrollbar flex-1 space-y-6 overflow-y-auto bg-slate-50 px-6 py-6 pb-32">
                <div
                    v-for="step in onboardingSteps"
                    :key="step.number"
                    class="flex gap-4"
                >
                    <div
                        :class="['flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black', step.badgeClass]"
                    >
                        {{ step.number }}
                    </div>
                    <div>
                        <h4 class="font-black text-slate-800">{{ step.title }}</h4>
                        <p class="mt-1 text-xs text-slate-600" v-html="step.description"></p>
                    </div>
                </div>
            </div>

            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-6">
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
            <div class="flex items-center gap-3">
                <div class="relative">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-xl text-[#f97316]">
                        <i class="fa-solid fa-motorcycle"></i>
                    </div>
                    <div
                        :class="[
                            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-colors',
                            isShiftOnline ? 'bg-[#22c55e]' : 'bg-slate-400'
                        ]"
                    ></div>
                </div>
                <div>
                    <h1 class="leading-none text-lg font-black text-slate-800">
                        Food<span class="text-[#f97316]">Rush</span>
                    </h1>
                    <p class="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <span>{{ tenantDisplay }}</span>
                    </p>
                </div>
            </div>

            <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg text-[#f97316] shadow-sm transition active:bg-orange-100"
                @click="generateMockOrder"
            >
                <i class="fa-solid fa-burger"></i>
            </button>
        </header>

        <main class="hide-scrollbar relative mx-auto w-full max-w-md flex-1 overflow-y-auto pb-20">
            <section :class="['view px-4 pt-4', currentView === 'orders' ? 'active' : '']">
                <div class="mb-4 flex shrink-0 rounded-xl bg-slate-100 p-1">
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
                </div>

                <div :class="['space-y-3 pb-4', currentTab === 'available' ? '' : 'hidden']">
                    <div
                        v-if="state.status === 'offline'"
                        class="rounded-2xl border border-slate-100 bg-white p-6 text-center"
                    >
                        <div class="mb-2 text-4xl">&#x1F634;</div>
                        <h3 class="text-sm font-black text-slate-800">Estas desconectado</h3>
                        <p class="text-xs text-slate-500">Inicia turno en tu perfil.</p>
                    </div>

                    <div
                        v-else-if="state.availableOrders.length === 0"
                        class="rounded-2xl border border-slate-100 bg-white p-6 text-center"
                    >
                        <div class="mb-2 text-4xl">&#x1F37D;</div>
                        <h3 class="text-sm font-black text-slate-800">Buscando viajes</h3>
                        <p class="text-xs text-slate-500">Manten la app abierta.</p>
                    </div>

                    <div
                        v-for="order in state.availableOrders"
                        :key="order.id"
                        class="card-shadow rounded-2xl border border-slate-50 bg-white p-4"
                    >
                        <div class="mb-3 flex items-start justify-between">
                            <div class="flex items-center gap-2">
                                <div
                                    :class="['flex h-10 w-10 items-center justify-center rounded-full text-xl', order.franchise.color]"
                                >
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
                                class="h-10 flex-1 rounded-lg bg-[#f97316] text-xs font-black text-white shadow-md active:bg-[#ea580c]"
                                @click="acceptOrder(order.id)"
                            >
                                ACEPTAR VIAJE
                            </button>
                        </div>
                    </div>
                </div>

                <div :class="['flex-1 flex-col pb-4', currentTab === 'active' ? 'flex' : 'hidden']">
                    <div class="mb-3 shrink-0">
                        <div
                            v-if="!state.activeOrder && state.status === 'offline'"
                            class="rounded-2xl border border-slate-100 bg-white p-6 text-center"
                        >
                            <div class="mb-2 text-4xl">&#x1F6CC;</div>
                            <h3 class="text-sm font-black text-slate-800">Turno finalizado</h3>
                        </div>

                        <div
                            v-else-if="!state.activeOrder"
                            class="rounded-2xl border border-slate-100 bg-white p-6 text-center"
                        >
                            <div class="mb-2 text-4xl">&#x1F6F5;</div>
                            <h3 class="text-sm font-black text-slate-800">No hay viaje en curso</h3>
                        </div>

                        <div
                            v-else
                            class="card-shadow overflow-hidden rounded-2xl border-2 border-orange-200 bg-white"
                        >
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

                                <div class="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3 shadow-sm">
                                    <div class="mb-2 flex items-center justify-between border-b border-orange-200/50 pb-2">
                                        <p class="text-[10px] font-bold uppercase text-slate-500">Código de Seguridad</p>
                                        <p class="rounded-lg bg-white px-3 py-1 text-sm font-black tracking-widest text-[#f97316] shadow-sm">
                                            {{ state.activeOrder.codigoDelivery }}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="mb-0.5 text-[9px] font-bold uppercase text-slate-500">Descripción del Pedido</p>
                                        <p class="whitespace-pre-line text-xs font-black text-slate-800">{{ state.activeOrder.descripcionDetallada }}</p>
                                    </div>
                                </div>

                                <button
                                    v-if="state.activeOrder.status !== 'picked'"
                                    type="button"
                                    :class="['w-full rounded-xl py-3.5 text-sm font-black shadow-md', activeOrderMeta?.buttonClass]"
                                    @click="updateOrderStatus(state.activeOrder.status === 'accepted' ? 'arrived' : 'picked')"
                                >
                                    {{ activeOrderMeta?.buttonLabel }}
                                </button>

                                <button
                                    v-else
                                    type="button"
                                    :class="['flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black shadow-md', activeOrderMeta?.buttonClass]"
                                    @click="triggerCamera"
                                >
                                    <i class="fa-solid fa-camera"></i>
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

                    <div
                        :class="[
                            'relative min-h-[250px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-inner',
                            showMapWrapper ? '' : 'hidden'
                        ]"
                    >
                        <div ref="mapEl" class="delivery-map absolute inset-0"></div>
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
                    <p
                        v-if="financeHistory.length === 0"
                        class="py-2 text-center text-[10px] font-bold text-slate-400"
                    >
                        Sin movimientos
                    </p>

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
                        <h2 class="text-lg font-black leading-tight text-slate-800">Juan Delivery</h2>
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

                    <button
                        type="button"
                        :class="shiftButtonClasses"
                        @click="toggleShift"
                    >
                        <span class="flex items-center justify-center gap-2">
                            <i :class="shiftButtonIcon"></i>
                            {{ shiftButtonLabel }}
                        </span>
                    </button>

                    <div
                        v-if="showShiftTimer"
                        class="mt-4 border-t border-slate-100 pt-3 text-center"
                    >
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
                        <label class="mb-2 block text-[10px] font-bold uppercase text-slate-400">
                            Simulador de Backend (Multitenant)
                        </label>
                        <select
                            v-model="state.tenant"
                            class="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700 outline-none"
                            @change="changeTenant"
                        >
                            <option
                                v-for="option in tenantOptions"
                                :key="option.value"
                                :value="option.value"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <button
                    type="button"
                    class="mb-4 w-full rounded-xl bg-slate-200 py-4 text-sm font-black text-slate-600 active:bg-slate-300"
                    @click="resetSystem"
                >
                    BORRAR DATOS DE LA APP
                </button>
            </section>
        </main>

        <nav class="relative z-40 flex-none border-t border-slate-100 bg-white px-4 py-2 pb-safe">
            <div class="mx-auto flex w-full max-w-sm items-center justify-between">
                <button
                    type="button"
                    :class="['flex flex-1 flex-col items-center gap-1', currentView === 'orders' ? 'text-[#f97316]' : 'text-slate-300']"
                    @click="navigate('orders')"
                >
                    <i class="fa-solid fa-motorcycle text-xl"></i>
                    <span class="text-[9px] font-black uppercase">Viajes</span>
                </button>
                <button
                    type="button"
                    :class="['flex flex-1 flex-col items-center gap-1', currentView === 'finance' ? 'text-[#f97316]' : 'text-slate-300']"
                    @click="navigate('finance')"
                >
                    <i class="fa-solid fa-wallet text-xl"></i>
                    <span class="text-[9px] font-black uppercase">Wallet</span>
                </button>
                <button
                    type="button"
                    :class="['flex flex-1 flex-col items-center gap-1', currentView === 'profile' ? 'text-[#f97316]' : 'text-slate-300']"
                    @click="navigate('profile')"
                >
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
                <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 active:bg-slate-200"
                    @click="closePage('page-shift-history')"
                >
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h2 class="text-lg font-black text-slate-800">Historial de Horarios</h2>
            </header>

            <div class="hide-scrollbar flex-1 overflow-y-auto p-4 pb-safe">
                <div class="space-y-3">
                    <div
                        v-if="shiftHistory.length === 0"
                        class="py-20 text-center"
                    >
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
                <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 active:bg-slate-200"
                    @click="closePage('page-help-center')"
                >
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
                    <button
                        type="button"
                        class="w-full rounded-xl bg-red-500 py-4 font-black text-white shadow-md active:bg-red-600"
                        @click="triggerSOS"
                    >
                        BOTON DE PANICO (SOS)
                    </button>
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
            <div
                :class="[
                    'w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-2xl transition-transform duration-300',
                    isAbsenceModalOpen ? 'scale-100' : 'scale-95'
                ]"
            >
                <div class="mb-4 text-5xl">&#x1F97A;</div>
                <h3 class="mb-2 text-xl font-black text-slate-800">Te extranamos</h3>
                <p class="mb-6 text-sm font-bold text-slate-500">
                    Notamos que tienes dias sin conectarte. Como trabajas cuando quieres, no pasa nada, pero queremos saber si todo esta bien contigo.
                </p>

                <div class="space-y-3">
                    <button
                        type="button"
                        class="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 active:bg-slate-200"
                        @click="reportAbsence"
                    >
                        Solo queria descansar unos dias
                    </button>
                    <button
                        type="button"
                        class="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 active:bg-slate-200"
                        @click="reportAbsence"
                    >
                        Problemas con mi vehiculo
                    </button>
                    <button
                        type="button"
                        class="w-full rounded-xl bg-slate-100 py-3 font-bold text-slate-700 active:bg-slate-200"
                        @click="reportAbsence"
                    >
                        Tuve problemas con la App
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
            <div
                :class="[
                    'mx-auto w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl transition-transform duration-300',
                    isWithdrawModalOpen ? 'translate-y-0' : 'translate-y-full'
                ]"
            >
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-black text-slate-800">Retirar Dinero</h3>
                    <button
                        type="button"
                        class="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-500"
                        @click="closeModal('modal-withdraw')"
                    >
                        X
                    </button>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-3">
                        <span class="text-xs font-bold text-[#f97316]">Disponible</span>
                        <span class="text-lg font-black text-[#f97316]">{{ modalMaxAmount }}</span>
                    </div>

                    <div>
                        <input
                            v-model="withdrawInput"
                            type="number"
                            placeholder="0.00"
                            class="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-center text-xl font-black text-slate-800 outline-none"
                        >
                    </div>

                    <button
                        type="button"
                        class="w-full rounded-xl bg-[#22c55e] py-3.5 text-sm font-black text-white active:bg-green-600"
                        @click="processWithdraw"
                    >
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
            <div
                :class="[
                    'mx-auto w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl transition-transform duration-300',
                    isReportModalOpen ? 'translate-y-0' : 'translate-y-full'
                ]"
            >
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-black text-slate-800">Reportar Pago</h3>
                    <button
                        type="button"
                        class="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-500"
                        @click="closeModal('modal-report')"
                    >
                        X
                    </button>
                </div>

                <div class="space-y-3">
                    <p class="mb-2 text-[11px] font-bold text-slate-500">
                        Necesitamos el ID del pedido y una captura de pantalla como evidencia.
                    </p>

                    <input
                        v-model="reportId"
                        type="text"
                        placeholder="ID del Viaje (ej. 4A2B)"
                        class="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 outline-none"
                    >

                    <div
                        class="w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition active:bg-slate-100"
                        @click="triggerReportUpload"
                    >
                        <i class="fa-solid fa-image mb-2 text-2xl text-slate-400"></i>
                        <p :class="['text-xs font-bold', reportFileLoaded ? 'text-[#22c55e]' : 'text-slate-500']">
                            {{ reportFileName }}
                        </p>
                    </div>

                    <input
                        ref="reportEvidenceInput"
                        type="file"
                        class="hidden"
                        accept="image/*"
                        @change="handleReportEvidenceChange"
                    >

                    <button
                        type="button"
                        class="mt-2 w-full rounded-xl bg-[#ef4444] py-3.5 text-sm font-black text-white active:bg-red-600"
                        @click="submitReport"
                    >
                        <span v-if="isSubmittingReport"><i class="fa-solid fa-spinner fa-spin"></i> ENVIANDO...</span>
                        <span v-else>ENVIAR EVIDENCIA</span>
                    </button>
                </div>
            </div>
        </div>

        <input
            ref="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="handleDeliveryPhoto"
        >
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');

.delivery-pro {
    font-family: 'Inter', sans-serif;
    -webkit-tap-highlight-color: transparent;
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
    height: 100%;
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