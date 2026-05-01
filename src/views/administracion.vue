<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { api } from '../services/api';
import { ORDER_STATUS_CODES, buildTenantHeaders, fetchOperationalDataset, isSessionActive, normalizeStatusKey } from '../services/operations';
import { connectRealtime } from '../services/realtime';
import { clearDeliveryAssignment, clearSession, getSession, updateCachedOrderStatus } from '../services/storage';

const router = useRouter();
const session = getSession();

const currentView = ref('dashboard');
const selectedTenant = ref('Global');
const search = ref({ orders: '', products: '', users: '', franchises: '' });
const isLoading = ref(true);
const isRefreshing = ref(false);
const savingOrderId = ref('');
const errorMessage = ref('');
const lastUpdatedAt = ref('');
const data = ref({ tenants: [], orders: [], products: [], users: [], connectedUsers: [], sessions: [], warnings: [] });
const AUTO_REFRESH_INTERVAL_MS = 60000;
const REALTIME_REFRESH_DEBOUNCE_MS = 1500;

const menuGroups = [
  { name: 'SISTEMA GLOBAL', items: [{ id: 'dashboard', name: 'Dashboard Principal', icon: 'fa-solid fa-chart-pie' }] },
  {
    name: 'OPERACIONES FRANQUICIAS',
    items: [
      { id: 'orders', name: 'Recepcion de Pedidos', icon: 'fa-solid fa-receipt' },
      { id: 'menu', name: 'Catalogos y Precios', icon: 'fa-solid fa-burger' },
      { id: 'franchises_list', name: 'Gestion de Locales', icon: 'fa-solid fa-store' },
    ],
  },
  {
    name: 'LOGISTICA DELIVERY',
    items: [
      { id: 'users_fleet', name: 'Personas Conectadas', icon: 'fa-solid fa-users' },
      { id: 'support', name: 'Centro de Alertas', icon: 'fa-solid fa-headset' },
    ],
  },
  { name: 'CONFIGURACION', items: [{ id: 'settings', name: 'Ajustes Base', icon: 'fa-solid fa-gear' }] },
];

const statusOptions = [
  { id: ORDER_STATUS_CODES.pending, label: 'Pendiente' },
  { id: ORDER_STATUS_CODES.preparing, label: 'Preparacion' },
  { id: ORDER_STATUS_CODES.inTransit, label: 'En camino' },
  { id: ORDER_STATUS_CODES.delivered, label: 'Entregado' },
  { id: ORDER_STATUS_CODES.cancelled, label: 'Cancelado' },
];

let refreshTimer = null;
let realtimeRefreshTimer = null;
let realtimeConnections = [];
let refreshPromise = null;

const normalize = (value = '') => String(value || '').trim().toLowerCase();
const orderStatusKey = (order = {}) => normalizeStatusKey(order.statusKey || order.statusLabel || order.estado?.codigo || order.estado?.descripcion);
const isDeliveredOrder = (order = {}) => orderStatusKey(order) === 'entregado';
const isCancelledOrder = (order = {}) => orderStatusKey(order) === 'cancelado';
const isPendingOrder = (order = {}) => orderStatusKey(order) === 'pendiente';
const isPreparingOrder = (order = {}) => orderStatusKey(order) === 'preparando';
const isInTransitOrder = (order = {}) => orderStatusKey(order) === 'en camino';
const isFinalOrder = (order = {}) => isDeliveredOrder(order) || isCancelledOrder(order);
const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => value ? new Date(value).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha';

const currentViewTitle = computed(() => {
  for (const group of menuGroups) {
    const found = group.items.find((item) => item.id === currentView.value);
    if (found) return found.name;
  }
  return 'Panel';
});

const franchises = computed(() => data.value.tenants || []);
const allOrders = computed(() => data.value.orders || []);
const allProducts = computed(() => data.value.products || []);
const allUsers = computed(() => data.value.users || []);
const activeSessions = computed(() => (data.value.sessions || []).filter((item) => item?.isActive !== false && isSessionActive(item)));
const selectedTenantName = computed(() => (
  selectedTenant.value === 'Global'
    ? 'Vista Global'
    : franchises.value.find((tenant) => String(tenant.id) === String(selectedTenant.value))?.name || 'Tenant'
));

const byTenant = (collection, tenantField = 'tenantId') => (
  selectedTenant.value === 'Global'
    ? collection
    : collection.filter((item) => String(item?.[tenantField]) === String(selectedTenant.value))
);

const scopedOrders = computed(() => byTenant(allOrders.value));
const scopedProducts = computed(() => byTenant(allProducts.value));
const scopedUsers = computed(() => byTenant(allUsers.value));
const connectedUsers = computed(() => scopedUsers.value.filter((user) => user.isConnected));
const connectedSessionsCount = computed(() => activeSessions.value.filter((sessionItem) => (
  selectedTenant.value === 'Global' || String(sessionItem.tenantId) === String(selectedTenant.value)
)).length);

const filteredOrders = computed(() => {
  const term = normalize(search.value.orders);
  if (!term) return scopedOrders.value;
  return scopedOrders.value.filter((order) => normalize(`${order.id} ${order.tenantName} ${order.customerName} ${order.customerPhone} ${order.itemSummary}`).includes(term));
});

const filteredProducts = computed(() => {
  const term = normalize(search.value.products);
  if (!term) return scopedProducts.value;
  return scopedProducts.value.filter((product) => normalize(`${product.nombre || product.name} ${product.tenantName} ${product.categoryLabel}`).includes(term));
});

const filteredUsers = computed(() => {
  const term = normalize(search.value.users);
  if (!term) return scopedUsers.value;
  return scopedUsers.value.filter((user) => normalize(`${user.name} ${user.email} ${user.roleLabel} ${user.tenantName}`).includes(term));
});

const filteredFranchises = computed(() => {
  const term = normalize(search.value.franchises);
  const base = selectedTenant.value === 'Global' ? franchises.value : franchises.value.filter((item) => String(item.id) === String(selectedTenant.value));
  if (!term) return base;
  return base.filter((item) => normalize(`${item.name} ${item.code} ${item.id}`).includes(term));
});

const franchiseCards = computed(() => filteredFranchises.value.map((franchise) => {
  const orders = allOrders.value.filter((order) => String(order.tenantId) === String(franchise.id));
  const products = allProducts.value.filter((product) => String(product.tenantId) === String(franchise.id));
  const users = allUsers.value.filter((user) => String(user.tenantId) === String(franchise.id));
  return {
    ...franchise,
    ordersCount: orders.length,
    productsCount: products.length,
    usersCount: users.length,
    connectedCount: users.filter((user) => user.isConnected).length,
    sales: orders.filter(isDeliveredOrder).reduce((sum, order) => sum + Number(order.totalValue || 0), 0),
  };
}));

const totalSales = computed(() => scopedOrders.value.filter(isDeliveredOrder).reduce((sum, order) => sum + Number(order.totalValue || 0), 0));
const pendingOrdersCount = computed(() => scopedOrders.value.filter((order) => !isFinalOrder(order)).length);
const activeDriversCount = computed(() => {
  const deliveryUsers = scopedUsers.value.filter((user) => {
    const role = normalize(user.roleLabel);
    return role.includes('repart') || role.includes('delivery');
  });
  return deliveryUsers.length > 0 ? deliveryUsers.length : connectedUsers.value.length;
});

const weeklySales = computed(() => {
  const fmt = new Intl.DateTimeFormat('es-DO', { weekday: 'short' });
  const points = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const amount = scopedOrders.value
      .filter(isDeliveredOrder)
      .filter((order) => new Date(order.createdAt).toISOString().slice(0, 10) === key)
      .reduce((sum, order) => sum + Number(order.totalValue || 0), 0);
    points.push({ key, label: fmt.format(date).replace('.', ''), amount });
  }
  const max = Math.max(...points.map((point) => point.amount), 1);
  return points.map((point) => ({ ...point, height: `${Math.max(10, (point.amount / max) * 100)}%` }));
});

const systemAlerts = computed(() => {
  const alerts = [...(data.value.warnings || [])];
  scopedOrders.value.forEach((order) => {
    if (isPendingOrder(order)) {
      const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
      if (minutes >= 30) alerts.push(`Pedido #${order.id} sigue pendiente hace ${minutes} min.`);
    }
  });
  franchiseCards.value.forEach((franchise) => {
    if (franchise.productsCount === 0) alerts.push(`La franquicia ${franchise.name} no tiene productos sincronizados.`);
  });
  return [...new Set(alerts)].slice(0, 8);
});

const sessionRows = computed(() => {
  const usersById = new Map(allUsers.value.map((user) => [`${user.tenantId}:${user.id}`, user]));
  return activeSessions.value.map((sessionItem, index) => {
    const userKey = `${sessionItem.tenantId}:${sessionItem.userId || sessionItem.usuario_id}`;
    const user = usersById.get(userKey);
    return {
      id: sessionItem.id || `session-${index + 1}`,
      userName: user?.name || `Usuario #${sessionItem.userId || sessionItem.usuario_id || 'N/D'}`,
      email: user?.email || 'Sin correo',
      tenantName: user?.tenantName || sessionItem.tenantName || 'Global',
      expiresAt: sessionItem.expiresAt || sessionItem.expiracion || '',
    };
  }).filter((row) => selectedTenant.value === 'Global' || row.tenantName === franchises.value.find((tenant) => String(tenant.id) === String(selectedTenant.value))?.name);
});

const supportAlerts = computed(() => scopedOrders.value
  .filter((order) => !isFinalOrder(order))
  .slice(0, 6));

const getStatusBadgeClass = (statusValue) => {
  const key = normalizeStatusKey(statusValue);
  if (key === 'pendiente') return 'bg-yellow-100 text-yellow-700';
  if (key === 'preparando') return 'bg-blue-100 text-blue-700';
  if (key === 'en camino') return 'bg-purple-100 text-purple-700';
  if (key === 'entregado') return 'bg-green-100 text-green-700';
  if (key === 'cancelado') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

const getMenuBadge = (id) => {
  if (id === 'orders') return pendingOrdersCount.value;
  if (id === 'users_fleet') return connectedUsers.value.length;
  if (id === 'support') return systemAlerts.value.length;
  return 0;
};

const refreshData = async ({ silent = false } = {}) => {
  if (silent && document.visibilityState === 'hidden') return null;
  if (refreshPromise) return refreshPromise;

  const task = (async () => {
    if (silent) isRefreshing.value = true;
    else isLoading.value = true;

    errorMessage.value = '';
    try {
      data.value = await fetchOperationalDataset({ selectedTenantId: 'Global', includeSessions: true });
      lastUpdatedAt.value = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
      return data.value;
    } catch (error) {
      console.error('No se pudo cargar administracion', error);
      errorMessage.value = error.message || 'No se pudo cargar la vista de administracion.';
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

const updateOrderStatus = async (order, nextStatusId) => {
  const statusKey = normalizeStatusKey(nextStatusId);
  if (!statusKey || statusKey === orderStatusKey(order)) return;

  savingOrderId.value = String(order.id);
  try {
    const response = await api.updateOrder(order.id, { estado_id: nextStatusId }, buildTenantHeaders(order.tenantId));
    const resolvedStatusId = response?.data?.estado_id || response?.data?.estado?.id;
    updateCachedOrderStatus(order.id, resolvedStatusId || nextStatusId);
    if (['pendiente', 'cancelado'].includes(statusKey)) {
      clearDeliveryAssignment(order.id);
    }
    await refreshData({ silent: true });
  } catch (error) {
    console.error('No se pudo actualizar pedido', error);
    errorMessage.value = error.message || `No se pudo actualizar el pedido #${order.id}.`;
  } finally {
    savingOrderId.value = '';
  }
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
        if (['order-created', 'order-updated', 'order-cancelled', 'delivery-assigned', 'driver-location'].includes(message.event)) {
          queueRealtimeRefresh();
        }
      },
      onError(error) {
        console.warn('Realtime administracion no disponible', error);
      },
    }),
  );
};

const confirmOrder = (order) => updateOrderStatus(order, ORDER_STATUS_CODES.preparing);

const logout = () => {
  clearSession();
  router.replace('/login');
};

onMounted(async () => {
  if (!session.isAuthenticated) {
    router.replace('/login');
    return;
  }
  await refreshData();
  setupRealtimeConnections();
  refreshTimer = window.setInterval(() => { void refreshData({ silent: true }); }, AUTO_REFRESH_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
  if (realtimeRefreshTimer) window.clearTimeout(realtimeRefreshTimer);
  closeRealtimeConnections();
});
</script>

<template>
  <div class="admin-enterprise flex min-h-screen w-full bg-slate-50 text-slate-800 antialiased">
    <aside class="hide-scrollbar hidden w-72 shrink-0 flex-col overflow-y-auto bg-slate-900 text-white lg:flex">
      <div class="sticky top-0 z-10 flex h-16 items-center border-b border-slate-800 bg-slate-900 px-6">
        <div class="flex items-center gap-3 text-xl text-brand-500">
          <i class="fa-solid fa-layer-group"></i>
          <h1 class="font-black tracking-wide text-white">Food<span class="text-brand-500">Rush</span></h1>
        </div>
      </div>

      <div class="flex-1 p-4">
        <div v-for="group in menuGroups" :key="group.name" class="mb-6">
          <p class="mb-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{{ group.name }}</p>
          <nav class="space-y-1.5">
            <button v-for="menu in group.items" :key="menu.id" type="button" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-all" :class="currentView === menu.id ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'" @click="currentView = menu.id">
              <i :class="`${menu.icon} w-5 text-center text-lg`"></i>
              {{ menu.name }}
              <span v-if="getMenuBadge(menu.id) > 0" class="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{{ getMenuBadge(menu.id) }}</span>
            </button>
          </nav>
        </div>
      </div>

      <div class="mt-auto border-t border-slate-800 bg-slate-900 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-bold">{{ (session.userName || 'AD').slice(0, 2).toUpperCase() }}</div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-white">{{ session.userName || 'Admin Principal' }}</p>
            <p class="truncate text-[10px] font-bold uppercase text-brand-500">{{ session.userEmail || 'Superusuario' }}</p>
          </div>
          <button type="button" class="text-slate-400 hover:text-white" @click="logout"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="flex min-h-16 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 class="text-xl font-black text-slate-800">{{ currentViewTitle }}</h2>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label class="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtro de Datos</label>
            <select v-model="selectedTenant" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 sm:w-auto">
              <option value="Global">Vista Global (Todo)</option>
              <option v-for="franchise in franchises" :key="franchise.id" :value="franchise.id">{{ franchise.name }}</option>
            </select>
          </div>
          <button type="button" class="text-slate-400 hover:text-brand-500" @click="refreshData({ silent: true })">
            <i class="fa-solid fa-rotate-right text-xl" :class="{ 'fa-spin': isRefreshing }"></i>
          </button>
        </div>
      </header>

      <div class="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div class="hide-scrollbar flex gap-2 overflow-x-auto">
          <template v-for="group in menuGroups" :key="group.name">
            <button v-for="menu in group.items" :key="menu.id" type="button" class="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition" :class="currentView === menu.id ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-orange-500/20' : 'border-slate-200 bg-white text-slate-500'" @click="currentView = menu.id">
              <i :class="menu.icon"></i>
              {{ menu.name }}
            </button>
          </template>
        </div>
      </div>

      <main class="hide-scrollbar flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6">
        <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{{ errorMessage }}</div>

        <div v-if="isLoading" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div v-for="card in 8" :key="card" class="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm"></div>
        </div>

        <template v-else>
          <section v-show="currentView === 'dashboard'" class="space-y-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-xs font-bold uppercase tracking-wider text-slate-400">Ventas Totales</p><p class="mt-2 text-2xl font-black text-slate-800">{{ formatCurrency(totalSales) }}</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-xs font-bold uppercase tracking-wider text-slate-400">Pedidos Activos</p><p class="mt-2 text-2xl font-black text-slate-800">{{ pendingOrdersCount }}</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-xs font-bold uppercase tracking-wider text-slate-400">Flota Activa</p><p class="mt-2 text-2xl font-black text-slate-800">{{ activeDriversCount }}</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-xs font-bold uppercase tracking-wider text-slate-400">Alertas</p><p class="mt-2 text-2xl font-black text-slate-800">{{ systemAlerts.length }}</p></div>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                <h3 class="mb-4 text-sm font-black text-slate-800">Rendimiento Semanal (Ventas)</h3>
                <div class="flex h-64 items-end gap-3 rounded-2xl bg-slate-50 p-4">
                  <div v-for="day in weeklySales" :key="day.key" class="flex flex-1 flex-col items-center gap-2">
                    <div class="flex h-full w-full items-end"><div class="w-full rounded-t-xl bg-gradient-to-t from-brand-600 to-brand-500" :style="{ height: day.height }"></div></div>
                    <p class="text-[10px] font-black uppercase text-slate-500">{{ day.label }}</p>
                    <p class="text-[10px] font-bold text-slate-400">{{ formatCurrency(day.amount) }}</p>
                  </div>
                </div>
              </div>
              <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 class="mb-4 text-sm font-black text-slate-800">Alertas del Sistema</h3>
                <div v-if="systemAlerts.length === 0" class="py-10 text-center text-sm font-bold text-slate-400">Todo funciona correctamente.</div>
                <ul v-else class="space-y-3"><li v-for="(alert, index) in systemAlerts" :key="`${index}-${alert}`" class="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">{{ alert }}</li></ul>
              </div>
            </div>
          </section>

          <section v-show="currentView === 'orders'" class="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <input v-model="search.orders" type="text" placeholder="Buscar ID de pedido o Cliente..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500 sm:w-72">
              <button type="button" class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-black text-white" @click="refreshData({ silent: true })">RECARGAR</button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-[1100px] w-full text-left border-collapse">
                <thead><tr class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200"><th class="p-4 pl-6">ID / Local</th><th class="p-4">Cliente</th><th class="p-4">Pedido</th><th class="p-4">Total</th><th class="p-4">Estado</th><th class="p-4">Delivery</th><th class="p-4 pr-6 text-right">Acciones</th></tr></thead>
                <tbody class="text-sm">
                  <tr v-for="order in filteredOrders" :key="`${order.tenantId}-${order.id}`" class="border-b border-slate-50 hover:bg-slate-50/50">
                    <td class="p-4 pl-6"><p class="font-black text-slate-800">{{ order.id }}</p><p class="text-[10px] font-bold text-slate-400">{{ order.tenantName }}</p></td>
                    <td class="p-4"><p class="font-bold text-slate-700">{{ order.customerName }}</p><p class="mt-1 text-xs text-slate-400">{{ order.customerPhone }}</p></td>
                    <td class="p-4"><p class="max-w-[260px] text-xs font-bold text-slate-500">{{ order.itemSummary }}</p></td>
                    <td class="p-4 font-black text-slate-800">{{ formatCurrency(order.totalValue) }}</td>
                    <td class="p-4"><select class="rounded-full px-3 py-1.5 text-xs font-black outline-none" :class="getStatusBadgeClass(order.statusKey)" :disabled="savingOrderId === String(order.id)" :value="orderStatusKey(order)" @change="updateOrderStatus(order, $event.target.value)"><option v-for="status in statusOptions" :key="status.id" :value="status.id">{{ status.label }}</option></select></td>
                    <td class="p-4">
                      <p class="text-xs font-black text-slate-700">{{ order.driverName || order.deliveryAssignment?.driverName || 'Sin asignar' }}</p>
                      <p class="mt-1 text-[10px] font-bold uppercase text-slate-400">
                        {{ isPreparingOrder(order) ? 'Listo para delivery' : isInTransitOrder(order) ? 'En ruta' : 'Esperando local' }}
                      </p>
                    </td>
                    <td class="p-4 pr-6">
                      <div class="flex flex-wrap justify-end gap-2">
                        <button v-if="isPendingOrder(order)" type="button" class="rounded-lg bg-orange-50 px-3 py-2 text-xs font-black text-orange-600 hover:bg-orange-100" :disabled="savingOrderId === String(order.id)" @click="confirmOrder(order)">CONFIRMAR</button>
                        <button type="button" class="rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 hover:bg-brand-50 hover:text-brand-600" @click="router.push({ path: `/tracking/${order.id}`, query: { tenant: order.tenantId } })">VER TRACKING</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredOrders.length === 0"><td colspan="7" class="p-12 text-center"><p class="text-sm font-bold text-slate-400">No hay pedidos registrados en este local.</p></td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section v-show="currentView === 'menu'" class="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 p-6">
              <div><h3 class="font-black text-slate-800">Gestion de Productos</h3><p class="text-xs font-bold text-slate-500">Catalogo real cargado desde el backend.</p></div>
              <input v-model="search.products" type="text" placeholder="Buscar producto..." class="w-72 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500">
            </div>
            <div class="space-y-4 p-6">
              <div v-for="product in filteredProducts" :key="`${product.tenantId}-${product.id}`" class="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="min-w-[200px] flex-1"><p class="font-black text-slate-800">{{ product.nombre || product.name || 'Producto' }}</p><p class="text-[10px] font-bold text-slate-400">ID: {{ product.id }}</p></div>
                <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700">{{ formatCurrency(product.priceValue) }}</div>
                <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">Stock: {{ product.stock ?? product.existencias ?? product.inventario ?? 'N/D' }}</div>
                <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">{{ product.categoryLabel }}</div>
                <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">{{ product.tenantName }}</div>
              </div>
              <div v-if="filteredProducts.length === 0" class="py-12 text-center"><p class="text-sm font-bold text-slate-400">No hay productos en esta franquicia.</p></div>
            </div>
          </section>

          <section v-show="currentView === 'franchises_list'" class="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 p-6">
              <div><h3 class="font-black text-slate-800">Gestion de Locales</h3><p class="text-xs font-bold text-slate-500">Todas las franquicias visibles en el sistema.</p></div>
              <input v-model="search.franchises" type="text" placeholder="Buscar franquicia..." class="w-72 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500">
            </div>
            <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
              <div v-for="franchise in franchiseCards" :key="franchise.id" class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p class="font-black text-slate-800">{{ franchise.name }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Sistema: {{ franchise.id }}</p>
                <div class="mt-4 grid grid-cols-2 gap-3 text-sm"><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Pedidos</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.ordersCount }}</p></div><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Productos</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.productsCount }}</p></div><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Usuarios</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.usersCount }}</p></div><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Conectados</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.connectedCount }}</p></div></div>
                <div class="mt-4 rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Ventas Entregadas</p><p class="mt-2 text-xl font-black text-slate-800">{{ formatCurrency(franchise.sales) }}</p></div>
              </div>
            </div>
          </section>

          <section v-show="currentView === 'users_fleet'" class="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 p-6">
              <div><h3 class="font-black text-slate-800">Flota y Personal</h3><p class="text-xs font-bold text-slate-500">Usuarios y personas conectadas en el sitio web.</p></div>
              <input v-model="search.users" type="text" placeholder="Buscar persona..." class="w-72 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500">
            </div>
            <div class="overflow-x-auto p-6">
              <table class="w-full text-left border-collapse">
                <thead><tr class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200"><th class="p-4 pl-6">Nombre del Empleado</th><th class="p-4">Rol / Permisos</th><th class="p-4">Local</th><th class="p-4 pr-6 text-right">Estado</th></tr></thead>
                <tbody><tr v-for="user in filteredUsers" :key="`${user.tenantId}-${user.id}`" class="border-b border-slate-50 hover:bg-slate-50/50"><td class="p-4 pl-6"><p class="font-black text-slate-800">{{ user.name }}</p><p class="mt-1 text-xs font-bold text-slate-400">{{ user.email || user.phone || 'Sin contacto' }}</p></td><td class="p-4"><span class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{{ user.roleLabel }}</span></td><td class="p-4 text-sm font-bold text-slate-600">{{ user.tenantName }}</td><td class="p-4 pr-6 text-right"><span class="rounded-full px-3 py-1.5 text-xs font-black" :class="user.isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">{{ user.isConnected ? 'Conectado' : 'Desconectado' }}</span></td></tr></tbody>
              </table>
            </div>
          </section>

          <section v-show="currentView === 'support'" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="flex h-[500px] flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div class="border-b border-slate-100 p-5"><h3 class="text-sm font-black text-slate-800"><i class="fa-solid fa-user-clock mr-2 text-brand-500"></i> Sesiones Web Activas</h3></div>
              <div class="hide-scrollbar flex-1 overflow-y-auto p-5"><div class="space-y-3"><div v-for="row in sessionRows" :key="row.id" class="rounded-xl border border-slate-100 bg-slate-50 p-3"><p class="text-xs font-black text-slate-800">{{ row.userName }}</p><p class="text-[10px] font-bold text-slate-500">{{ row.email }} · {{ row.tenantName }}</p><p class="mt-1 text-[10px] font-bold text-slate-400">Expira: {{ formatDate(row.expiresAt) }}</p></div><div v-if="sessionRows.length === 0" class="py-6 text-center text-xs font-bold text-slate-400">No hay sesiones activas detectadas.</div></div></div>
            </div>

            <div class="flex h-[500px] flex-col rounded-2xl border border-red-100 bg-white shadow-sm">
              <div class="rounded-t-2xl border-b border-red-100 bg-red-50 p-5"><h3 class="text-sm font-black text-red-600"><i class="fa-solid fa-truck-medical mr-2"></i> Centro de Alertas</h3></div>
              <div class="hide-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
                <div v-for="order in supportAlerts" :key="order.id" class="rounded-xl border border-red-200 bg-red-50 p-4"><p class="text-sm font-black text-red-700">Pedido #{{ order.id }}</p><p class="mt-1 text-xs font-bold text-red-500">{{ order.customerName }} · {{ order.tenantName }}</p><p class="mt-2 text-xs text-red-600">{{ order.itemSummary }}</p></div>
                <div v-for="(alert, index) in systemAlerts" :key="`alert-${index}`" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-700">{{ alert }}</div>
                <div v-if="supportAlerts.length === 0 && systemAlerts.length === 0" class="py-12 text-center text-sm font-bold text-slate-500">Sistema estable. No hay alertas criticas.</div>
              </div>
            </div>
          </section>

          <section v-show="currentView === 'settings'" class="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="border-b border-slate-100 p-6"><h3 class="font-black text-slate-800">Estado del Sistema</h3><p class="text-xs font-bold text-slate-500">Resumen real de la integracion actual de FoodRush.</p></div>
            <div class="space-y-6 p-6">
              <div><label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Usuario actual</label><input :value="session.userName || session.userEmail || 'Sin sesion'" readonly type="text" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"></div>
              <div><label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Tenant visible</label><input :value="selectedTenantName" readonly type="text" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"></div>
              <div class="grid grid-cols-2 gap-4"><div><label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Franquicias cargadas</label><input :value="franchises.length" readonly type="text" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"></div><div><label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Sesiones activas</label><input :value="connectedSessionsCount" readonly type="text" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"></div></div>
              <div><label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Ultima sincronizacion</label><input :value="lastUpdatedAt || 'Pendiente'" readonly type="text" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"></div>
              <div class="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs font-bold text-blue-600"><i class="fa-solid fa-circle-info mr-1"></i> Esta vista ya no genera pedidos, productos o usuarios simulados. Lo mostrado depende de la API y del tenant que corresponda.</div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.admin-enterprise { font-family: 'Inter', sans-serif; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.text-brand-500 { color: #f97316; }
.text-brand-600 { color: #ea580c; }
.bg-brand-50 { background-color: #fff7ed; }
.bg-brand-500 { background-color: #f97316; }
.bg-brand-600 { background-color: #ea580c; }
.focus\:border-brand-500:focus { border-color: #f97316; }
.focus\:ring-brand-500:focus { --tw-ring-color: rgb(249 115 22 / 0.5); }
</style>
