<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import '@fortawesome/fontawesome-free/css/all.min.css';

const STORAGE_KEY = 'foodRushAdminDataV4';
const CHART_JS_URL = 'https://cdn.jsdelivr.net/npm/chart.js';

const categories = ref(['Hamburguesas', 'Pizza', 'Bebidas', 'Combos', 'Postres']);
const currentView = ref('dashboard');
const selectedTenant = ref('Global');
const franchises = ref([]);
const orders = ref([]);
const menuProducts = ref([]);
const users = ref([]);
const settings = ref({
    shippingCost: 50,
    openTime: '08:00',
    closeTime: '23:00'
});
const sosAlerts = ref([]);
const mockEvidences = ref([
    { id: 1, orderId: 'ORD-1234', driver: 'Carlos M.' },
    { id: 2, orderId: 'ORD-9981', driver: 'Ana T.' }
]);
const chartCanvas = ref(null);

let chartLibrary = null;
let chartInstance = null;

const menuGroups = computed(() => [
    {
        name: 'SISTEMA GLOBAL',
        items: [
            { id: 'dashboard', name: 'Dashboard Principal', icon: 'fa-solid fa-chart-pie' }
        ]
    },
    {
        name: 'OPERACIONES FRANQUICIAS',
        items: [
            { id: 'orders', name: 'Recepcion de Pedidos', icon: 'fa-solid fa-receipt' },
            { id: 'menu', name: 'Catalogos y Precios', icon: 'fa-solid fa-burger' },
            { id: 'franchises_list', name: 'Gestion de Locales', icon: 'fa-solid fa-store' }
        ]
    },
    {
        name: 'LOGISTICA DELIVERY',
        items: [
            { id: 'users_fleet', name: 'Flota de Repartidores', icon: 'fa-solid fa-motorcycle' },
            { id: 'support', name: 'Centro SOS y Evidencias', icon: 'fa-solid fa-headset', badge: sosAlerts.value.length }
        ]
    },
    {
        name: 'CONFIGURACION',
        items: [
            { id: 'settings', name: 'Ajustes Base', icon: 'fa-solid fa-gear' }
        ]
    }
]);

const currentViewTitle = computed(() => {
    for (const group of menuGroups.value) {
        const menu = group.items.find((item) => item.id === currentView.value);
        if (menu) return menu.name;
    }

    return 'Panel';
});

const filteredOrders = computed(() => {
    if (selectedTenant.value === 'Global') return orders.value;
    return orders.value.filter((order) => order.tenant === selectedTenant.value);
});

const filteredProducts = computed(() => {
    if (selectedTenant.value === 'Global') return menuProducts.value;
    return menuProducts.value.filter((product) => product.tenant === selectedTenant.value);
});

const totalSales = computed(() => (
    filteredOrders.value
        .filter((order) => order.status === 'entregado')
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0)
));

const pendingOrdersCount = computed(() => (
    filteredOrders.value.filter((order) => order.status !== 'entregado').length
));

const activeDriversCount = computed(() => (
    users.value.filter((user) => user.role === 'repartidor').length
));

const sosAlertsCount = computed(() => sosAlerts.value.length);

const systemAlerts = computed(() => {
    const alerts = [];

    menuProducts.value.forEach((product) => {
        if ((Number(product.stock) || 0) < 5) {
            alerts.push(`Stock Critico: ${product.name} - Solo ${product.stock} unidades.`);
        }
    });

    return alerts;
});

const loadState = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        franchises.value = [
            { id: 'BurgerKing', name: 'Burger King Centro' },
            { id: 'PizzaHut', name: 'Pizza Hut Mall' }
        ];
        menuProducts.value = [
            { id: 1, name: 'Whopper Doble', price: 250, stock: 15, category: 'Hamburguesas', tenant: 'BurgerKing' },
            { id: 2, name: 'Pizza Familiar', price: 600, stock: 4, category: 'Pizza', tenant: 'PizzaHut' }
        ];
        users.value = [
            { id: 1, name: 'Juan Repartidor', role: 'repartidor' },
            { id: 2, name: 'Admin Principal', role: 'admin' }
        ];
        return;
    }

    try {
        const saved = JSON.parse(raw);
        franchises.value = saved.franchises || [];
        orders.value = saved.orders || [];
        menuProducts.value = saved.menuProducts || [];
        users.value = saved.users || [];

        if (saved.settings) {
            settings.value = {
                shippingCost: saved.settings.shippingCost ?? 50,
                openTime: saved.settings.openTime ?? '08:00',
                closeTime: saved.settings.closeTime ?? '23:00'
            };
        }
    } catch (error) {
        console.error('No se pudo cargar el panel administrativo', error);
    }
};

const persistState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        franchises: franchises.value,
        orders: orders.value,
        menuProducts: menuProducts.value,
        users: users.value,
        settings: settings.value
    }));
};

watch([franchises, orders, menuProducts, users, settings], persistState, { deep: true });

const ensureChartJs = () => new Promise((resolve, reject) => {
    if (window.Chart) {
        resolve(window.Chart);
        return;
    }

    const existingScript = document.querySelector(`script[src="${CHART_JS_URL}"]`);
    if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.Chart), { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
    }

    const script = document.createElement('script');
    script.src = CHART_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.Chart);
    script.onerror = reject;
    document.body.appendChild(script);
});

const destroyChart = () => {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
};

const initChart = () => {
    if (!chartCanvas.value || !chartLibrary) return;

    destroyChart();

    chartInstance = new chartLibrary(chartCanvas.value, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
            datasets: [
                {
                    label: 'Ingresos ($)',
                    data: [1200, 1900, 1500, 2200, 3800, 4500, 3100],
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 4,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#ea580c',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
};

const renderChartIfNeeded = async () => {
    if (currentView.value !== 'dashboard') return;

    try {
        chartLibrary = chartLibrary || await ensureChartJs();
        await nextTick();

        if (!chartInstance) {
            initChart();
            return;
        }

        chartInstance.resize();
    } catch (error) {
        console.error('Chart.js no pudo cargar', error);
    }
};

watch(currentView, async (newView) => {
    if (newView === 'dashboard') {
        await renderChartIfNeeded();
    }
});

const getStatusBadgeClass = (status) => {
    const base = 'font-black text-center ';

    switch (status) {
    case 'pendiente':
        return `${base}bg-yellow-100 text-yellow-700`;
    case 'en preparacion':
        return `${base}bg-blue-100 text-blue-700`;
    case 'en camino':
        return `${base}bg-purple-100 text-purple-700`;
    case 'entregado':
        return `${base}bg-green-100 text-green-700`;
    default:
        return `${base}bg-slate-100 text-slate-700`;
    }
};

const createNewSimulatedOrder = () => {
    if (franchises.value.length === 0) {
        window.alert('Crea al menos una franquicia primero.');
        return;
    }

    const tenantFilter = selectedTenant.value === 'Global'
        ? franchises.value[0].id
        : selectedTenant.value;

    const tenantProducts = menuProducts.value.filter((product) => product.tenant === tenantFilter);
    const randomProduct = tenantProducts.length > 0
        ? tenantProducts[Math.floor(Math.random() * tenantProducts.length)]
        : { price: 200, stock: 10 };
    const securityCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const productPrice = Number(randomProduct.price) || 200;
    const shippingCost = Number(settings.value.shippingCost) || 0;

    const newOrder = {
        id: `ORD-${Math.floor(Math.random() * 10000)}`,
        tenant: tenantFilter,
        customerName: 'Cliente Simulado',
        total: productPrice + shippingCost,
        status: 'pendiente',
        securityCode
    };

    if ((Number(randomProduct.stock) || 0) > 0) {
        randomProduct.stock = Number(randomProduct.stock) - 1;
    }

    orders.value.unshift(newOrder);
};

const deleteOrder = (id) => {
    orders.value = orders.value.filter((order) => order.id !== id);
};

const addNewProduct = () => {
    const defaultTenant = franchises.value.length > 0 ? franchises.value[0].id : '';

    menuProducts.value.unshift({
        id: Date.now(),
        name: '',
        price: 0,
        stock: 10,
        category: categories.value[0],
        tenant: selectedTenant.value === 'Global' ? defaultTenant : selectedTenant.value
    });
};

const deleteProduct = (id) => {
    menuProducts.value = menuProducts.value.filter((product) => product.id !== id);
};

const addNewFranchise = () => {
    const newId = `FRANQ-${Math.floor(Math.random() * 1000)}`;
    franchises.value.push({ id: newId, name: 'Nueva Franquicia' });
};

const deleteFranchise = (id) => {
    if (!window.confirm('Seguro? Esto no eliminara los pedidos pasados, pero borrara el local.')) return;

    franchises.value = franchises.value.filter((franchise) => franchise.id !== id);
    menuProducts.value = menuProducts.value.filter((product) => product.tenant !== id);

    if (selectedTenant.value === id) {
        selectedTenant.value = 'Global';
    }
};

const addNewUser = () => {
    users.value.unshift({ id: Date.now(), name: '', role: 'repartidor' });
};

const deleteUser = (id) => {
    users.value = users.value.filter((user) => user.id !== id);
};

const resolveSOS = (id) => {
    sosAlerts.value = sosAlerts.value.filter((alert) => alert.id !== id);
};

const simulateSOS = () => {
    sosAlerts.value.unshift({
        id: Date.now(),
        driverName: 'Repartidor Simulado',
        time: new Date().toLocaleTimeString()
    });
};

const resolveEvidence = (id) => {
    mockEvidences.value = mockEvidences.value.filter((evidence) => evidence.id !== id);
};

onMounted(async () => {
    loadState();
    await renderChartIfNeeded();
});

onBeforeUnmount(() => {
    destroyChart();
});
</script>

<template>
    <div class="admin-enterprise flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800 antialiased">
        <aside class="hide-scrollbar flex w-72 flex-shrink-0 flex-col overflow-y-auto bg-slate-900 text-white transition-all duration-300">
            <div class="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center border-b border-slate-800 bg-slate-900 px-6">
                <div class="flex items-center gap-3 text-xl text-[#f97316]">
                    <i class="fa-solid fa-layer-group"></i>
                    <h1 class="tracking-wide font-black text-white">Food<span class="text-[#f97316]">Rush</span></h1>
                </div>
            </div>

            <div class="flex-1 p-4">
                <div
                    v-for="group in menuGroups"
                    :key="group.name"
                    class="mb-6"
                >
                    <p class="mb-3 flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <i v-if="group.name.includes('FRANQUICIAS')" class="fa-solid fa-store text-slate-600"></i>
                        <i v-if="group.name.includes('DELIVERY')" class="fa-solid fa-motorcycle text-slate-600"></i>
                        <i v-if="group.name.includes('SISTEMA')" class="fa-solid fa-server text-slate-600"></i>
                        <i v-if="group.name.includes('CONFIGURACION')" class="fa-solid fa-gear text-slate-600"></i>
                        {{ group.name }}
                    </p>

                    <nav class="space-y-1.5">
                        <button
                            v-for="menu in group.items"
                            :key="menu.id"
                            type="button"
                            :class="[
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all',
                                currentView === menu.id
                                    ? 'bg-[#f97316] text-white shadow-md shadow-orange-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            ]"
                            @click="currentView = menu.id"
                        >
                            <i :class="`${menu.icon} w-5 text-center text-lg`"></i>
                            {{ menu.name }}
                            <span
                                v-if="menu.badge !== undefined && menu.badge > 0"
                                class="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm"
                            >
                                {{ menu.badge }}
                            </span>
                        </button>
                    </nav>
                </div>
            </div>

            <div class="sticky bottom-0 mt-auto border-t border-slate-800 bg-slate-900 p-4">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-bold">
                        AD
                    </div>
                    <div>
                        <p class="text-sm font-bold leading-tight text-white">Admin Principal</p>
                        <p class="text-[10px] font-bold uppercase text-[#f97316]">Superusuario</p>
                    </div>
                </div>
            </div>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header class="z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
                <div class="flex items-center gap-4">
                    <h2 class="text-xl font-black text-slate-800">{{ currentViewTitle }}</h2>
                </div>

                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-2">
                        <label class="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtro de Datos</label>
                        <select
                            v-model="selectedTenant"
                            class="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="Global">Vista Global (Todo)</option>
                            <option
                                v-for="franchise in franchises"
                                :key="franchise.id"
                                :value="franchise.id"
                            >
                                {{ franchise.name }}
                            </option>
                        </select>
                    </div>

                    <div class="h-6 w-px bg-slate-200"></div>

                    <button type="button" class="relative text-slate-400 transition-colors hover:text-[#f97316]">
                        <i class="fa-solid fa-bell text-xl"></i>
                        <span
                            v-if="systemAlerts.length > 0"
                            class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500"
                        ></span>
                    </button>
                </div>
            </header>

            <main class="hide-scrollbar flex-1 overflow-y-auto bg-slate-50/50 p-6">
                <section v-show="currentView === 'dashboard'" class="space-y-6">
                    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div>
                                <p class="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Ventas Totales</p>
                                <p class="text-2xl font-black text-slate-800">${{ totalSales.toFixed(2) }}</p>
                            </div>
                            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-xl text-green-500">
                                <i class="fa-solid fa-dollar-sign"></i>
                            </div>
                        </div>

                        <div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div>
                                <p class="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Pedidos Activos</p>
                                <p class="text-2xl font-black text-slate-800">{{ pendingOrdersCount }}</p>
                            </div>
                            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-500">
                                <i class="fa-solid fa-receipt"></i>
                            </div>
                        </div>

                        <div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div>
                                <p class="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Flota Activa</p>
                                <p class="text-2xl font-black text-slate-800">{{ activeDriversCount }}</p>
                            </div>
                            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-xl text-[#f97316]">
                                <i class="fa-solid fa-motorcycle"></i>
                            </div>
                        </div>

                        <div class="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div>
                                <p class="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Alertas SOS</p>
                                <p class="text-2xl font-black text-slate-800">{{ sosAlertsCount }}</p>
                            </div>
                            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl text-red-500">
                                <i class="fa-solid fa-headset"></i>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                            <h3 class="mb-4 text-sm font-black text-slate-800">Rendimiento Semanal (Ventas)</h3>
                            <div class="h-64 w-full">
                                <canvas ref="chartCanvas"></canvas>
                            </div>
                        </div>

                        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h3 class="mb-4 flex items-center gap-2 text-sm font-black text-slate-800">
                                <i class="fa-solid fa-triangle-exclamation text-yellow-500"></i> Alertas del Sistema
                            </h3>
                            <div v-if="systemAlerts.length === 0" class="py-10 text-center text-sm font-bold text-slate-400">
                                Todo funciona correctamente.
                            </div>
                            <ul v-else class="space-y-3">
                                <li
                                    v-for="(alert, index) in systemAlerts"
                                    :key="index"
                                    class="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600"
                                >
                                    <i class="fa-solid fa-circle-exclamation mt-0.5"></i> {{ alert }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section v-show="currentView === 'orders'" class="flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div class="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white p-6">
                        <div class="relative w-72">
                            <i class="fa-solid fa-search absolute left-3 top-3.5 text-sm text-slate-400"></i>
                            <input
                                type="text"
                                placeholder="Buscar ID de pedido o Cliente..."
                                class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:bg-white"
                            >
                        </div>
                        <button
                            type="button"
                            class="rounded-lg bg-[#f97316] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-orange-500/30 transition-all active:scale-95 hover:bg-[#ea580c]"
                            @click="createNewSimulatedOrder"
                        >
                            <i class="fa-solid fa-plus mr-2"></i> CREAR PEDIDO
                        </button>
                    </div>

                    <div class="flex-1 overflow-x-auto">
                        <table class="min-w-[800px] w-full border-collapse text-left">
                            <thead>
                                <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <th class="p-4 pl-6">ID / Local</th>
                                    <th class="p-4">Cliente</th>
                                    <th class="p-4">Total</th>
                                    <th class="p-4">Seguridad (Repartidor)</th>
                                    <th class="p-4">Estado del Pedido</th>
                                    <th class="p-4 pr-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                <tr
                                    v-for="order in filteredOrders"
                                    :key="order.id"
                                    class="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                                >
                                    <td class="p-4 pl-6">
                                        <p class="font-black text-slate-800">{{ order.id }}</p>
                                        <p class="text-[10px] font-bold text-slate-400">{{ order.tenant }}</p>
                                    </td>
                                    <td class="p-4 font-bold text-slate-600">{{ order.customerName }}</td>
                                    <td class="p-4 font-black text-slate-800">${{ Number(order.total).toFixed(2) }}</td>
                                    <td class="p-4">
                                        <span
                                            v-if="order.securityCode"
                                            class="rounded-md border border-orange-100 bg-orange-50 px-2.5 py-1 font-mono text-xs font-black tracking-widest text-[#f97316]"
                                        >
                                            {{ order.securityCode }}
                                        </span>
                                        <span v-else class="text-xs font-bold text-slate-400">N/A</span>
                                    </td>
                                    <td class="p-4">
                                        <select
                                            v-model="order.status"
                                            :class="`${getStatusBadgeClass(order.status)} cursor-pointer appearance-none rounded-full border-0 px-3 py-1.5 text-xs font-black shadow-sm outline-none`"
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en preparacion">En Preparacion</option>
                                            <option value="en camino">En Camino</option>
                                            <option value="entregado">Entregado</option>
                                        </select>
                                    </td>
                                    <td class="p-4 pr-6 text-right">
                                        <button
                                            type="button"
                                            class="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                            @click="deleteOrder(order.id)"
                                        >
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="filteredOrders.length === 0">
                                    <td colspan="6" class="p-12 text-center">
                                        <i class="fa-solid fa-receipt mb-3 text-4xl text-slate-200"></i>
                                        <p class="text-sm font-bold text-slate-400">No hay pedidos registrados en este local.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section v-show="currentView === 'menu'" class="flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div class="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white p-6">
                        <div>
                            <h3 class="font-black text-slate-800">Gestion de Productos</h3>
                            <p class="text-xs font-bold text-slate-500">Anade o edita los productos de las franquicias.</p>
                        </div>
                        <button
                            type="button"
                            class="rounded-lg bg-[#f97316] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-orange-500/30 transition-all active:scale-95 hover:bg-[#ea580c]"
                            @click="addNewProduct"
                        >
                            <i class="fa-solid fa-plus mr-2"></i> NUEVO PRODUCTO
                        </button>
                    </div>

                    <div class="flex-1 overflow-x-auto p-6">
                        <div class="space-y-4">
                            <div
                                v-for="product in filteredProducts"
                                :key="product.id"
                                class="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <input
                                    v-model="product.name"
                                    placeholder="Nombre del Producto"
                                    class="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                                >

                                <div class="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                    <span class="border-r border-slate-200 bg-slate-50 px-3 font-bold text-slate-400">$</span>
                                    <input
                                        v-model="product.price"
                                        type="number"
                                        class="w-24 px-3 py-2 text-sm font-bold outline-none"
                                    >
                                </div>

                                <div class="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                    <span class="border-r border-slate-200 bg-slate-50 px-3 font-bold text-slate-400"><i class="fa-solid fa-box"></i></span>
                                    <input
                                        v-model="product.stock"
                                        type="number"
                                        title="Stock"
                                        class="w-20 px-3 py-2 text-sm font-bold outline-none"
                                    >
                                </div>

                                <select
                                    v-model="product.category"
                                    class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                                >
                                    <option
                                        v-for="cat in categories"
                                        :key="cat"
                                        :value="cat"
                                    >
                                        {{ cat }}
                                    </option>
                                </select>

                                <select
                                    v-model="product.tenant"
                                    class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                                >
                                    <option
                                        v-for="franchise in franchises"
                                        :key="franchise.id"
                                        :value="franchise.id"
                                    >
                                        {{ franchise.name }}
                                    </option>
                                </select>

                                <button
                                    type="button"
                                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                                    @click="deleteProduct(product.id)"
                                >
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>

                            <div v-if="filteredProducts.length === 0" class="py-12 text-center">
                                <p class="text-sm font-bold text-slate-400">No hay productos en esta franquicia.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-show="currentView === 'franchises_list'" class="flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div class="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white p-6">
                        <div>
                            <h3 class="font-black text-slate-800">Directorio de Franquicias</h3>
                            <p class="text-xs font-bold text-slate-500">Administra los locales (Tenants) registrados en el sistema.</p>
                        </div>
                        <button
                            type="button"
                            class="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-black text-white shadow-md transition-all active:scale-95 hover:bg-slate-900"
                            @click="addNewFranchise"
                        >
                            <i class="fa-solid fa-plus mr-2"></i> ANADIR LOCAL
                        </button>
                    </div>

                    <div class="flex-1 overflow-x-auto p-6">
                        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div
                                v-for="franchise in franchises"
                                :key="franchise.id"
                                class="group relative rounded-xl border border-slate-200 bg-slate-50 p-5"
                            >
                                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-100 bg-white text-xl text-[#f97316] shadow-sm">
                                    <i class="fa-solid fa-store"></i>
                                </div>
                                <input
                                    v-model="franchise.name"
                                    class="mb-2 w-full border-b border-slate-300 bg-transparent pb-1 text-lg font-black text-slate-800 outline-none transition-colors focus:border-orange-500"
                                >
                                <p class="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Sistema: {{ franchise.id }}</p>

                                <button
                                    type="button"
                                    class="w-full rounded-lg border border-red-200 bg-white py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                                    @click="deleteFranchise(franchise.id)"
                                >
                                    ELIMINAR LOCAL
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-show="currentView === 'users_fleet'" class="flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div class="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white p-6">
                        <div>
                            <h3 class="font-black text-slate-800">Flota y Personal</h3>
                            <p class="text-xs font-bold text-slate-500">Gestion de repartidores y administradores.</p>
                        </div>
                        <button
                            type="button"
                            class="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-blue-500/30 transition-all active:scale-95 hover:bg-blue-600"
                            @click="addNewUser"
                        >
                            <i class="fa-solid fa-user-plus mr-2"></i> NUEVO USUARIO
                        </button>
                    </div>

                    <div class="flex-1 overflow-x-auto p-6">
                        <table class="w-full border-collapse text-left">
                            <thead>
                                <tr class="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <th class="p-4 pl-6">Nombre del Empleado</th>
                                    <th class="p-4">Rol / Permisos</th>
                                    <th class="p-4 pr-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="user in users"
                                    :key="user.id"
                                    class="border-b border-slate-50 hover:bg-slate-50/50"
                                >
                                    <td class="p-4 pl-6">
                                        <input
                                            v-model="user.name"
                                            placeholder="Nombre completo"
                                            class="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                                        >
                                    </td>
                                    <td class="p-4">
                                        <select
                                            v-model="user.role"
                                            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                                        >
                                            <option value="repartidor">Repartidor (Flota)</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </td>
                                    <td class="p-4 pr-6 text-right">
                                        <button
                                            type="button"
                                            class="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                            @click="deleteUser(user.id)"
                                        >
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section v-show="currentView === 'support'" class="space-y-6">
                    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div class="flex h-[500px] flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div class="flex items-center justify-between border-b border-slate-100 p-5">
                                <h3 class="text-sm font-black text-slate-800">
                                    <i class="fa-solid fa-camera mr-2 text-[#f97316]"></i> Auditoria de Evidencias
                                </h3>
                            </div>
                            <div class="hide-scrollbar flex-1 overflow-y-auto p-5">
                                <p class="mb-4 text-xs font-bold text-slate-500">Fotos de prueba enviadas por la flota de delivery.</p>
                                <div class="space-y-3">
                                    <div
                                        v-for="evidence in mockEvidences"
                                        :key="evidence.id"
                                        class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                                                <i class="fa-solid fa-image"></i>
                                            </div>
                                            <div>
                                                <p class="text-xs font-black text-slate-800">Pedido #{{ evidence.orderId }}</p>
                                                <p class="text-[10px] font-bold text-slate-500">Repartidor: {{ evidence.driver }}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            class="rounded-lg border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-black text-[#f97316] transition-colors hover:bg-[#f97316] hover:text-white"
                                            @click="resolveEvidence(evidence.id)"
                                        >
                                            MARCAR REVISADO
                                        </button>
                                    </div>
                                    <div v-if="mockEvidences.length === 0" class="py-6 text-center text-xs font-bold text-slate-400">
                                        No hay evidencias pendientes de revision.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex h-[500px] flex-col rounded-2xl border border-red-100 bg-white shadow-sm">
                            <div class="flex items-center justify-between rounded-t-2xl border-b border-red-100 bg-red-50 p-5">
                                <h3 class="text-sm font-black text-red-600">
                                    <i class="fa-solid fa-truck-medical mr-2"></i> Centro de Emergencias (SOS)
                                </h3>
                            </div>
                            <div class="hide-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
                                <p class="mb-4 text-xs font-bold text-slate-500">Alertas de panico activadas por repartidores en ruta.</p>

                                <div
                                    v-for="alert in sosAlerts"
                                    :key="alert.id"
                                    class="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4"
                                >
                                    <div>
                                        <p class="text-sm font-black text-red-700"><i class="fa-solid fa-triangle-exclamation mr-1"></i> SOS Activado</p>
                                        <p class="mt-1 text-xs font-bold text-red-500">Repartidor: {{ alert.driverName }}</p>
                                        <p class="mt-1 text-[10px] font-bold text-red-400">Hora: {{ alert.time }}</p>
                                    </div>
                                    <button
                                        type="button"
                                        class="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white transition-colors hover:bg-red-700"
                                        @click="resolveSOS(alert.id)"
                                    >
                                        RESOLVER
                                    </button>
                                </div>

                                <div v-if="sosAlerts.length === 0" class="py-12 text-center">
                                    <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl text-green-500">
                                        <i class="fa-solid fa-shield-check"></i>
                                    </div>
                                    <p class="text-sm font-bold text-slate-500">Flota segura. No hay alertas SOS.</p>
                                </div>
                                <button
                                    v-if="sosAlerts.length === 0"
                                    type="button"
                                    class="mt-4 w-full rounded-lg border border-dashed border-red-300 py-2 text-xs font-bold text-red-400 hover:bg-red-50"
                                    @click="simulateSOS"
                                >
                                    Simular Alerta SOS
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-show="currentView === 'settings'" class="mx-auto flex h-full max-w-2xl flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div class="rounded-t-2xl border-b border-slate-100 bg-white p-6">
                        <h3 class="font-black text-slate-800">Ajustes Base del Sistema</h3>
                        <p class="text-xs font-bold text-slate-500">Configuracion general operativa de FoodRush.</p>
                    </div>

                    <div class="space-y-6 p-6">
                        <div>
                            <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Costo de Envio Base ($)</label>
                            <input
                                v-model="settings.shippingCost"
                                type="number"
                                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-orange-500"
                            >
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Horario Apertura</label>
                                <input
                                    v-model="settings.openTime"
                                    type="time"
                                    class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-orange-500"
                                >
                            </div>
                            <div>
                                <label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Horario Cierre</label>
                                <input
                                    v-model="settings.closeTime"
                                    type="time"
                                    class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-colors focus:border-orange-500"
                                >
                            </div>
                        </div>

                        <div class="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <p class="text-xs font-bold text-blue-600">
                                <i class="fa-solid fa-circle-info mr-1"></i> Los cambios se guardan automaticamente en el navegador.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.admin-enterprise {
    font-family: 'Inter', sans-serif;
}

.hide-scrollbar::-webkit-scrollbar {
    display: none;
}

.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
