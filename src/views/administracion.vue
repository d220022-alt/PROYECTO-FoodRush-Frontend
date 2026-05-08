<!--
  Guia rápida para presentar:
  Panel operativo de administracion. Controla pedidos, catalogos, locales, alertas, mapa y metricas.
  Buscar en VS Code: administracion, dashboard, pedidos, mapa, delivery, metricas, paginacion, QA dataset.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import '@fortawesome/fontawesome-free/css/all.min.css';
import AdminLiveOrdersMap from '../components/AdminLiveOrdersMap.vue';
import { api } from '../services/api';
import { appendAuditLog, buildClosureSnapshot, createClosureRecordRemote, getAdminZones, getAuditLog, getClosureRecords, loadAdminPhaseTwoState } from '../services/adminPhaseTwo';
import { getQaOrderStatusPatch, isQaDatasetEnabled, isQaOrder, setQaDatasetEnabled, setQaOrderOverride } from '../data/qaOperationalDataset';
import { ORDER_STATUS_CODES, buildTenantHeaders, fetchOperationalDataset, isSessionActive, normalizeStatusKey } from '../services/operations';
import { connectRealtime } from '../services/realtime';
import { APP_EVENTS, clearDeliveryAssignment, clearSession, getSession, updateCachedOrderStatus } from '../services/storage';
import { useTheme } from '../services/theme';
import { useCurrency } from '../utils/currency';

const router = useRouter();
const session = getSession();

const currentView = ref('dashboard');
const selectedTenant = ref('Global');
const search = ref({ orders: '', products: '', users: '', franchises: '' });
const orderStatusFilter = ref('all');
const orderDeliveryFilter = ref('all');
const orderPage = ref(1);
const orderPageSize = ref(10);
const productPage = ref(1);
const productPageSize = ref(12);
const franchisePage = ref(1);
const franchisePageSize = ref(12);
const userPage = ref(1);
const userPageSize = ref(12);
const sessionPage = ref(1);
const sessionPageSize = ref(8);
const supportPage = ref(1);
const supportPageSize = ref(8);
const closurePage = ref(1);
const closurePageSize = ref(8);
const auditPage = ref(1);
const auditPageSize = ref(8);
const liveMapFilter = ref('all');
const liveMapPage = ref(1);
const liveMapPageSize = ref(8);
const selectedMapOrderId = ref('');
const isLoading = ref(true);
const isRefreshing = ref(false);
const savingOrderId = ref('');
const errorMessage = ref('');
const phaseTwoMessage = ref('');
const lastUpdatedAt = ref('');
const data = ref({ tenants: [], orders: [], products: [], users: [], connectedUsers: [], sessions: [], warnings: [] });
const qaDatasetEnabled = ref(isQaDatasetEnabled());
const operationZones = ref(getAdminZones());
const closureRecords = ref(getClosureRecords());
const auditEntries = ref(getAuditLog());
const AUTO_REFRESH_INTERVAL_MS = 20000;
const REALTIME_REFRESH_DEBOUNCE_MS = 1500;
const { isDarkMode, toggleTheme } = useTheme();
const { formatCurrency } = useCurrency();

const menuGroups = [
  { name: 'SISTEMA GLOBAL', items: [{ id: 'dashboard', name: 'Dashboard Principal', icon: 'fa-solid fa-chart-pie' }] },
  {
    name: 'OPERACIONES FRANQUICIAS',
    items: [
      { id: 'orders', name: 'Recepción de pedidos', icon: 'fa-solid fa-receipt' },
      { id: 'menu', name: 'Catálogos y precios', icon: 'fa-solid fa-burger' },
      { id: 'franchises_list', name: 'Gestión de locales', icon: 'fa-solid fa-store' },
    ],
  },
  {
    name: 'LOGÍSTICA DELIVERY',
    items: [
      { id: 'zones', name: 'Mapa', icon: 'fa-solid fa-map-location-dot' },
      { id: 'users_fleet', name: 'Personas Conectadas', icon: 'fa-solid fa-users' },
      { id: 'support', name: 'Centro de Alertas', icon: 'fa-solid fa-headset' },
    ],
  },
  {
    name: 'CONTROL OPERATIVO',
    items: [
      { id: 'daily_close', name: 'Cierre Operativo', icon: 'fa-solid fa-cash-register' },
      { id: 'audit', name: 'Auditoría', icon: 'fa-solid fa-clipboard-list' },
    ],
  },
  { name: 'CONFIGURACIÓN', items: [{ id: 'settings', name: 'Ajustes Base', icon: 'fa-solid fa-gear' }] },
];

const statusOptions = [
  { id: ORDER_STATUS_CODES.pending, label: 'Pendiente' },
  { id: ORDER_STATUS_CODES.preparing, label: 'Preparacion' },
  { id: ORDER_STATUS_CODES.inTransit, label: 'En camino' },
  { id: ORDER_STATUS_CODES.delivered, label: 'Entregado' },
  { id: ORDER_STATUS_CODES.cancelled, label: 'Cancelado' },
];
const orderStatusFilterOptions = [
  { id: 'all', label: 'Todos los estados' },
  ...statusOptions,
];
const orderDeliveryFilterOptions = [
  { id: 'all', label: 'Todos los pedidos' },
  { id: 'assigned', label: 'Con delivery' },
  { id: 'unassigned', label: 'Sin delivery' },
];
const liveMapFilterOptions = [
  { id: 'all', label: 'Todos' },
  { id: ORDER_STATUS_CODES.pending, label: 'Pendientes' },
  { id: ORDER_STATUS_CODES.preparing, label: 'Preparando' },
  { id: ORDER_STATUS_CODES.inTransit, label: 'En camino' },
  { id: 'unassigned', label: 'Sin delivery' },
];
const orderPageSizeOptions = [5, 10, 20, 50];
const recordPageSizeOptions = [8, 12, 24, 48];

// Timers y promesas compartidas: evitan refrescos dobles cuando llegan eventos realtime y polling.
let refreshTimer = null;
let realtimeRefreshTimer = null;
let realtimeConnections = [];
let refreshPromise = null;

const normalize = (value = '') =>
  String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const orderStatusKey = (order = {}) => normalizeStatusKey(order.statusKey || order.statusLabel || order.estado?.codigo || order.estado?.descripcion);
const isDeliveredOrder = (order = {}) => orderStatusKey(order) === 'entregado';
const isCancelledOrder = (order = {}) => orderStatusKey(order) === 'cancelado';
const isPendingOrder = (order = {}) => orderStatusKey(order) === 'pendiente';
const isPreparingOrder = (order = {}) => orderStatusKey(order) === 'preparando';
const isInTransitOrder = (order = {}) => orderStatusKey(order) === 'en camino';
const isFinalOrder = (order = {}) => isDeliveredOrder(order) || isCancelledOrder(order);
const hasAssignedDriver = (order = {}) => Boolean(order.driverName || order.driverEmail || order.deliveryAssignment?.driverName || order.deliveryAssignment?.driverId || order.deliveryAssignment?.driverEmail);
const formatChartCurrency = (value) => {
  const amount = Number(value || 0);
  if (!amount) return formatCurrency(0, { decimals: 0 });
  return formatCurrency(amount, { compact: true });
};
const formatDate = (value) => value ? new Date(value).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha';

const clampPage = (page, totalPages) => Math.min(Math.max(Number(page) || 1, 1), Math.max(Number(totalPages) || 1, 1));
const getVisiblePages = (currentPage, totalPages) => {
  const total = Math.max(Number(totalPages) || 1, 1);
  const current = clampPage(currentPage, total);
  const start = Math.max(1, Math.min(current - 1, Math.max(1, total - 2)));
  const end = Math.min(total, start + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

const makePagination = (itemsRef, pageRef, pageSizeRef) => {
  const total = computed(() => itemsRef.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / Number(pageSizeRef.value || 12))));
  const pageStart = computed(() => (total.value === 0 ? 0 : ((pageRef.value - 1) * Number(pageSizeRef.value || 12)) + 1));
  const pageEnd = computed(() => Math.min(total.value, pageRef.value * Number(pageSizeRef.value || 12)));
  const items = computed(() => {
    const pageSize = Number(pageSizeRef.value || 12);
    const start = (pageRef.value - 1) * pageSize;
    return itemsRef.value.slice(start, start + pageSize);
  });
  const visiblePages = computed(() => getVisiblePages(pageRef.value, totalPages.value));
  return { total, totalPages, pageStart, pageEnd, items, visiblePages };
};

const currentViewTitle = computed(() => {
  for (const group of menuGroups) {
    const found = group.items.find((item) => item.id === currentView.value);
    if (found) return found.name;
  }
  return 'Panel';
});

const viewDescriptions = {
  dashboard: 'Resumen ejecutivo de ventas, operaciones y alertas.',
  orders: 'Recepción, estados y seguimiento operativo de pedidos.',
  menu: 'Catálogo, precios y disponibilidad por franquicia.',
  franchises_list: 'Locales activos, ventas y rendimiento por franquicia.',
  zones: 'Pedidos, repartidores y locales en tiempo real sobre el mapa.',
  users_fleet: 'Personal conectado, roles y actividad operacional.',
  support: 'Sesiones, alertas y soporte operativo.',
  daily_close: 'Cierre diario, ventas y evidencia de auditoria.',
  audit: 'Historial de eventos y acciones administrativas.',
  settings: 'Configuracion visible del panel y sincronizacion.',
};

const currentViewDescription = computed(() => viewDescriptions[currentView.value] || 'Panel operativo de FoodRush.');

const syncStatusLabel = computed(() => {
  if (errorMessage.value) return 'Revisar alerta';
  if (isRefreshing.value) return 'Sincronizando';
  return 'Operación estable';
});

const syncStatusClass = computed(() => {
  if (errorMessage.value) return 'border-red-200 bg-red-50 text-red-600';
  if (isRefreshing.value) return 'border-blue-200 bg-blue-50 text-blue-600';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
});

const toggleAdminTheme = () => toggleTheme();

const toggleQaDatasetMode = () => {
  const nextValue = !qaDatasetEnabled.value;
  qaDatasetEnabled.value = nextValue;
  setQaDatasetEnabled(nextValue);
  phaseTwoMessage.value = nextValue
    ? 'Datos QA activados para probar dashboards, pedidos y delivery.'
    : 'Datos QA ocultos. Solo se muestran datos reales del backend.';
  void refreshData({ silent: true });
};

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

// Para presentar: filtro central de pedidos; combina busqueda, estado y delivery asignado.
const filteredOrders = computed(() => {
  const term = normalize(search.value.orders);
  return scopedOrders.value.filter((order) => {
    const statusKey = orderStatusKey(order);
    const matchesSearch = !term || normalize(`${order.id} ${order.tenantName} ${order.customerName} ${order.customerPhone} ${order.customerEmail} ${order.address} ${order.itemSummary} ${order.driverName} ${order.deliveryAssignment?.driverName} ${order.statusLabel} ${statusKey}`).includes(term);
    const matchesStatus = orderStatusFilter.value === 'all' || statusKey === orderStatusFilter.value;
    const matchesDelivery =
      orderDeliveryFilter.value === 'all' ||
      (orderDeliveryFilter.value === 'assigned' && hasAssignedDriver(order)) ||
      (orderDeliveryFilter.value === 'unassigned' && !hasAssignedDriver(order));
    return matchesSearch && matchesStatus && matchesDelivery;
  });
});

const orderPaginationTotal = computed(() => filteredOrders.value.length);
const orderTotalPages = computed(() => Math.max(1, Math.ceil(orderPaginationTotal.value / Number(orderPageSize.value || 10))));
const orderPageStart = computed(() => {
  if (orderPaginationTotal.value === 0) return 0;
  return ((orderPage.value - 1) * Number(orderPageSize.value)) + 1;
});
const orderPageEnd = computed(() => Math.min(orderPaginationTotal.value, orderPage.value * Number(orderPageSize.value)));
const paginatedOrders = computed(() => {
  const pageSize = Number(orderPageSize.value || 10);
  const start = (orderPage.value - 1) * pageSize;
  return filteredOrders.value.slice(start, start + pageSize);
});
const visibleOrderPages = computed(() => {
  return getVisiblePages(orderPage.value, orderTotalPages.value);
});
const hasOrderFilters = computed(() => Boolean(
  search.value.orders ||
  orderStatusFilter.value !== 'all' ||
  orderDeliveryFilter.value !== 'all',
));

const filteredProducts = computed(() => {
  const term = normalize(search.value.products);
  if (!term) return scopedProducts.value;
  return scopedProducts.value.filter((product) => normalize(`${product.nombre || product.name} ${product.tenantName} ${product.categoryLabel}`).includes(term));
});
const productPagination = makePagination(filteredProducts, productPage, productPageSize);
const productPaginationTotal = productPagination.total;
const productTotalPages = productPagination.totalPages;
const productPageStart = productPagination.pageStart;
const productPageEnd = productPagination.pageEnd;
const paginatedProducts = productPagination.items;
const visibleProductPages = productPagination.visiblePages;

const filteredUsers = computed(() => {
  const term = normalize(search.value.users);
  if (!term) return scopedUsers.value;
  return scopedUsers.value.filter((user) => normalize(`${user.name} ${user.email} ${user.roleLabel} ${user.tenantName}`).includes(term));
});
const userPagination = makePagination(filteredUsers, userPage, userPageSize);
const userPaginationTotal = userPagination.total;
const userTotalPages = userPagination.totalPages;
const userPageStart = userPagination.pageStart;
const userPageEnd = userPagination.pageEnd;
const paginatedUsers = userPagination.items;
const visibleUserPages = userPagination.visiblePages;

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
const franchisePagination = makePagination(franchiseCards, franchisePage, franchisePageSize);
const franchisePaginationTotal = franchisePagination.total;
const franchiseTotalPages = franchisePagination.totalPages;
const franchisePageStart = franchisePagination.pageStart;
const franchisePageEnd = franchisePagination.pageEnd;
const paginatedFranchiseCards = franchisePagination.items;
const visibleFranchisePages = franchisePagination.visiblePages;

const totalSales = computed(() => scopedOrders.value.filter(isDeliveredOrder).reduce((sum, order) => sum + Number(order.totalValue || 0), 0));
const totalOrdersCount = computed(() => scopedOrders.value.length);
const deliveredOrdersCount = computed(() => scopedOrders.value.filter(isDeliveredOrder).length);
const cancelledOrdersCount = computed(() => scopedOrders.value.filter(isCancelledOrder).length);
const pendingOrdersCount = computed(() => scopedOrders.value.filter((order) => !isFinalOrder(order)).length);
const activeDriversCount = computed(() => {
  const deliveryUsers = scopedUsers.value.filter((user) => {
    const role = normalize(user.roleLabel);
    return role.includes('repart') || role.includes('delivery');
  });
  return deliveryUsers.length > 0 ? deliveryUsers.length : connectedUsers.value.length;
});
const assignedDeliveryOrders = computed(() => scopedOrders.value.filter(hasAssignedDriver));
const deliveryAssignedOrdersCount = computed(() => assignedDeliveryOrders.value.length);
const activeDeliveryOrdersCount = computed(() => assignedDeliveryOrders.value.filter((order) => isPreparingOrder(order) || isInTransitOrder(order)).length);
const readyForDeliveryCount = computed(() => scopedOrders.value.filter((order) => isPreparingOrder(order) && !hasAssignedDriver(order)).length);
// Pedidos que alimentan el mapa en vivo: solo salen los que tienen datos suficientes para operacion.
const liveMapOrders = computed(() => scopedOrders.value
  .filter((order) => !isFinalOrder(order))
  .sort((left, right) => {
    const leftTransit = isInTransitOrder(left) ? 1 : 0;
    const rightTransit = isInTransitOrder(right) ? 1 : 0;
    if (leftTransit !== rightTransit) return rightTransit - leftTransit;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  }));
const liveMapFilteredOrders = computed(() => liveMapOrders.value.filter((order) => {
  if (liveMapFilter.value === 'all') return true;
  if (liveMapFilter.value === 'unassigned') return isPreparingOrder(order) && !hasAssignedDriver(order);
  return orderStatusKey(order) === liveMapFilter.value;
}));
const liveMapPagination = makePagination(liveMapFilteredOrders, liveMapPage, liveMapPageSize);
const liveMapPaginationTotal = liveMapPagination.total;
const liveMapTotalPages = liveMapPagination.totalPages;
const liveMapPageStart = liveMapPagination.pageStart;
const liveMapPageEnd = liveMapPagination.pageEnd;
const paginatedLiveMapOrders = liveMapPagination.items;
const visibleLiveMapPages = liveMapPagination.visiblePages;
const selectedMapOrder = computed(() =>
  liveMapOrders.value.find((order) => String(order.id) === String(selectedMapOrderId.value)) || liveMapFilteredOrders.value[0] || null,
);
const liveMapPendingCount = computed(() => liveMapOrders.value.filter(isPendingOrder).length);
const liveMapPreparingCount = computed(() => liveMapOrders.value.filter(isPreparingOrder).length);
const liveMapTransitCount = computed(() => liveMapOrders.value.filter(isInTransitOrder).length);
const liveMapUnassignedCount = computed(() => liveMapOrders.value.filter((order) => isPreparingOrder(order) && !hasAssignedDriver(order)).length);
const averageTicket = computed(() => (deliveredOrdersCount.value > 0 ? totalSales.value / deliveredOrdersCount.value : 0));
const completionRate = computed(() => (totalOrdersCount.value > 0 ? Math.round((deliveredOrdersCount.value / totalOrdersCount.value) * 100) : 0));
const cancellationRate = computed(() => (totalOrdersCount.value > 0 ? Math.round((cancelledOrdersCount.value / totalOrdersCount.value) * 100) : 0));

const dashboardKpis = computed(() => [
  { label: 'Ventas entregadas', value: formatCurrency(totalSales.value), detail: `${deliveredOrdersCount.value} pedidos completados`, icon: 'fa-solid fa-sack-dollar', tone: 'bg-orange-50 text-brand-600' },
  { label: 'Pedidos activos', value: pendingOrdersCount.value, detail: `${readyForDeliveryCount.value} listos para delivery`, icon: 'fa-solid fa-bell-concierge', tone: 'bg-blue-50 text-blue-600' },
  { label: 'Delivery activo', value: activeDeliveryOrdersCount.value, detail: `${deliveryAssignedOrdersCount.value} pedidos asignados`, icon: 'fa-solid fa-motorcycle', tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Ticket promedio', value: formatCurrency(averageTicket.value), detail: `${completionRate.value}% completados`, icon: 'fa-solid fa-receipt', tone: 'bg-slate-100 text-slate-700' },
]);

const orderStatusSummary = computed(() => statusOptions.map((status) => {
  const orders = scopedOrders.value.filter((order) => orderStatusKey(order) === status.id);
  const amount = orders.reduce((sum, order) => sum + Number(order.totalValue || 0), 0);
  const percent = totalOrdersCount.value > 0 ? Math.round((orders.length / totalOrdersCount.value) * 100) : 0;
  return { ...status, count: orders.length, amount, percent };
}));

const deliveryOpsSummary = computed(() => [
  { label: 'Con repartidor', value: deliveryAssignedOrdersCount.value, detail: `${activeDeliveryOrdersCount.value} activos en cocina/ruta`, icon: 'fa-solid fa-id-badge', tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Sin asignar', value: readyForDeliveryCount.value, detail: 'Pedidos preparando sin delivery', icon: 'fa-solid fa-user-plus', tone: 'bg-amber-50 text-amber-600' },
  { label: 'Flota registrada', value: activeDriversCount.value, detail: `${connectedSessionsCount.value} sesiones activas`, icon: 'fa-solid fa-users-gear', tone: 'bg-blue-50 text-blue-600' },
  { label: 'Cancelacion', value: `${cancellationRate.value}%`, detail: `${cancelledOrdersCount.value} pedidos cancelados`, icon: 'fa-solid fa-triangle-exclamation', tone: 'bg-red-50 text-red-600' },
]);

const maxFranchiseSales = computed(() => Math.max(...franchiseCards.value.map((franchise) => franchise.sales), 1));
const franchisePerformanceRows = computed(() => franchiseCards.value
  .map((franchise) => {
    const orders = allOrders.value.filter((order) => String(order.tenantId) === String(franchise.id));
    const delivered = orders.filter(isDeliveredOrder);
    const active = orders.filter((order) => !isFinalOrder(order));
    const assigned = orders.filter(hasAssignedDriver);
    const cancelled = orders.filter(isCancelledOrder);
    return {
      ...franchise,
      deliveredCount: delivered.length,
      activeCount: active.length,
      assignedCount: assigned.length,
      cancelledCount: cancelled.length,
      averageTicket: delivered.length > 0 ? franchise.sales / delivered.length : 0,
      barWidth: `${Math.max(8, (franchise.sales / maxFranchiseSales.value) * 100)}%`,
    };
  })
  .sort((left, right) => right.sales - left.sales || right.ordersCount - left.ordersCount || left.name.localeCompare(right.name))
  .slice(0, 6));

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
  const max = Math.max(...points.map((point) => point.amount), 0);
  return points.map((point) => ({
    ...point,
    hasValue: point.amount > 0,
    height: point.amount > 0 && max > 0 ? `${Math.max(14, (point.amount / max) * 100)}%` : '0%',
  }));
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
const sessionPagination = makePagination(sessionRows, sessionPage, sessionPageSize);
const sessionPaginationTotal = sessionPagination.total;
const sessionTotalPages = sessionPagination.totalPages;
const sessionPageStart = sessionPagination.pageStart;
const sessionPageEnd = sessionPagination.pageEnd;
const paginatedSessionRows = sessionPagination.items;
const visibleSessionPages = sessionPagination.visiblePages;

const supportAlerts = computed(() => scopedOrders.value
  .filter((order) => !isFinalOrder(order)));
const supportPagination = makePagination(supportAlerts, supportPage, supportPageSize);
const supportPaginationTotal = supportPagination.total;
const supportTotalPages = supportPagination.totalPages;
const supportPageStart = supportPagination.pageStart;
const supportPageEnd = supportPagination.pageEnd;
const paginatedSupportAlerts = supportPagination.items;
const visibleSupportPages = supportPagination.visiblePages;

const closurePreview = computed(() => buildClosureSnapshot({
  tenantId: selectedTenant.value,
  tenantName: selectedTenantName.value,
  orders: scopedOrders.value,
  zones: operationZones.value,
}));

const closureHistory = computed(() => (
  selectedTenant.value === 'Global'
    ? closureRecords.value
    : closureRecords.value.filter((record) => String(record.tenantId) === String(selectedTenant.value))
));
const closurePagination = makePagination(closureHistory, closurePage, closurePageSize);
const closurePaginationTotal = closurePagination.total;
const closureTotalPages = closurePagination.totalPages;
const closurePageStart = closurePagination.pageStart;
const closurePageEnd = closurePagination.pageEnd;
const paginatedClosureHistory = closurePagination.items;
const visibleClosurePages = closurePagination.visiblePages;

const auditRows = computed(() => (
  selectedTenant.value === 'Global'
    ? auditEntries.value
    : auditEntries.value.filter((entry) => !entry.tenantId || String(entry.tenantId) === String(selectedTenant.value))
));
const auditPagination = makePagination(auditRows, auditPage, auditPageSize);
const auditPaginationTotal = auditPagination.total;
const auditTotalPages = auditPagination.totalPages;
const auditPageStart = auditPagination.pageStart;
const auditPageEnd = auditPagination.pageEnd;
const paginatedAuditRows = auditPagination.items;
const visibleAuditPages = auditPagination.visiblePages;

const auditSummaryRows = computed(() => {
  const rows = new Map();
  auditRows.value.forEach((entry) => {
    const key = entry.action || 'Accion';
    rows.set(key, (rows.get(key) || 0) + 1);
  });
  return Array.from(rows, ([label, count]) => ({ label, count })).slice(0, 6);
});

const getStatusBadgeClass = (statusValue) => {
  const key = normalizeStatusKey(statusValue);
  if (key === 'pendiente') return 'bg-yellow-100 text-yellow-700';
  if (key === 'preparando') return 'bg-blue-100 text-blue-700';
  if (key === 'en camino') return 'bg-purple-100 text-purple-700';
  if (key === 'en destino') return 'bg-indigo-100 text-indigo-700';
  if (key === 'entregado') return 'bg-green-100 text-green-700';
  if (key === 'cancelado') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

const getMenuBadge = (id) => {
  if (id === 'orders') return pendingOrdersCount.value;
  if (id === 'zones') return liveMapOrders.value.length;
  if (id === 'daily_close') return closurePreview.value.activeOrders;
  if (id === 'audit') return auditRows.value.length;
  if (id === 'users_fleet') return connectedUsers.value.length;
  if (id === 'support') return systemAlerts.value.length;
  return 0;
};

const goToOrderPage = (page) => {
  const nextPage = Number(page);
  if (!Number.isFinite(nextPage)) return;
  orderPage.value = clampPage(nextPage, orderTotalPages.value);
};

const goToProductPage = (page) => { productPage.value = clampPage(page, productTotalPages.value); };
const goToFranchisePage = (page) => { franchisePage.value = clampPage(page, franchiseTotalPages.value); };
const goToUserPage = (page) => { userPage.value = clampPage(page, userTotalPages.value); };
const goToSessionPage = (page) => { sessionPage.value = clampPage(page, sessionTotalPages.value); };
const goToSupportPage = (page) => { supportPage.value = clampPage(page, supportTotalPages.value); };
const goToClosurePage = (page) => { closurePage.value = clampPage(page, closureTotalPages.value); };
const goToAuditPage = (page) => { auditPage.value = clampPage(page, auditTotalPages.value); };
const goToLiveMapPage = (page) => { liveMapPage.value = clampPage(page, liveMapTotalPages.value); };

const selectMapOrder = (orderId) => {
  selectedMapOrderId.value = String(orderId || '');
};

const clearOrderFilters = () => {
  search.value.orders = '';
  orderStatusFilter.value = 'all';
  orderDeliveryFilter.value = 'all';
  orderPage.value = 1;
};

const refreshPhaseTwoState = async ({ remote = true } = {}) => {
  if (remote) {
    const state = await loadAdminPhaseTwoState();
    operationZones.value = state.zones;
    closureRecords.value = state.closures;
    auditEntries.value = state.audit;
    return state;
  }

  operationZones.value = getAdminZones();
  closureRecords.value = getClosureRecords();
  auditEntries.value = getAuditLog();
  return {
    zones: operationZones.value,
    closures: closureRecords.value,
    audit: auditEntries.value,
    remote: false,
  };
};

const generateDailyClosure = async () => {
  const record = await createClosureRecordRemote(closurePreview.value);
  appendAuditLog({
    action: 'Cierre operativo',
    detail: `${record.tenantName}: ${formatCurrency(record.grossSales)} en ${record.deliveredOrders} pedidos entregados.`,
    tenantId: record.tenantId === 'Global' ? '' : record.tenantId,
    tenantName: record.tenantName,
    tone: 'success',
    metadata: { closureId: record.id },
  }, {
    syncRemote: false,
  });
  phaseTwoMessage.value = `Cierre operativo generado para ${record.tenantName}.`;
  await refreshPhaseTwoState({ remote: true });
};

// Refresca el tablero completo: tenants, pedidos, productos, usuarios y sesiones conectadas.
const refreshData = async ({ silent = false } = {}) => {
  if (silent && document.visibilityState === 'hidden') return null;
  if (refreshPromise) return refreshPromise;

  const task = (async () => {
    if (silent) isRefreshing.value = true;
    else isLoading.value = true;

    errorMessage.value = '';
    try {
      data.value = await fetchOperationalDataset({ selectedTenantId: 'Global', includeSessions: true });
      qaDatasetEnabled.value = data.value?.qaEnabled !== false;
      lastUpdatedAt.value = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
      return data.value;
    } catch (error) {
      console.error('No se pudo cargar administracion', error);
      errorMessage.value = error.message || 'No se pudo cargar la vista de administración.';
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

// Accion clave de Administracion: cambia estado del pedido y sincroniza cache local para Delivery/Tracking.
// Para presentar: accion clave de Admin; cambia estado del pedido y sincroniza cache para Delivery/Tracking.
const updateOrderStatus = async (order, nextStatusId) => {
  const statusKey = normalizeStatusKey(nextStatusId);
  if (!statusKey || statusKey === orderStatusKey(order)) return;

  savingOrderId.value = String(order.id);
  try {
    if (isQaOrder(order)) {
      setQaOrderOverride(order.id, getQaOrderStatusPatch(nextStatusId));
      appendAuditLog({
        action: 'Estado de pedido QA',
        detail: `Pedido #${order.id} paso a ${nextStatusId}.`,
        tenantId: order.tenantId,
        tenantName: order.tenantName,
        tone: statusKey === 'cancelado' ? 'danger' : statusKey === 'entregado' ? 'success' : 'info',
        metadata: { orderId: order.id, status: nextStatusId, source: 'qa' },
      });
      if (['pendiente', 'cancelado'].includes(statusKey)) {
        clearDeliveryAssignment(order.id);
      }
      phaseTwoMessage.value = `Pedido QA #${order.id} actualizado localmente.`;
      await refreshPhaseTwoState({ remote: false });
      await refreshData({ silent: true });
      return;
    }

    const response = await api.updateOrder(order.id, { estado_id: nextStatusId }, buildTenantHeaders(order.tenantId));
    const resolvedStatusId = response?.data?.estado_id || response?.data?.estado?.id;
    updateCachedOrderStatus(order.id, resolvedStatusId || nextStatusId);
    appendAuditLog({
      action: 'Estado de pedido',
      detail: `Pedido #${order.id} paso a ${nextStatusId}.`,
      tenantId: order.tenantId,
      tenantName: order.tenantName,
      tone: statusKey === 'cancelado' ? 'danger' : statusKey === 'entregado' ? 'success' : 'info',
      metadata: { orderId: order.id, status: nextStatusId },
    });
    await refreshPhaseTwoState({ remote: true });
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

const refreshWhenVisible = () => {
  if (document.visibilityState === 'visible') {
    void refreshData({ silent: true });
  }
};

const logout = () => {
  clearSession();
  router.replace('/login');
};

watch(
  [selectedTenant, () => search.value.orders, orderStatusFilter, orderDeliveryFilter, orderPageSize],
  () => {
    orderPage.value = 1;
  },
);

watch([selectedTenant, () => search.value.products, productPageSize], () => { productPage.value = 1; });
watch([selectedTenant, () => search.value.franchises, franchisePageSize], () => { franchisePage.value = 1; });
watch([selectedTenant, () => search.value.users, userPageSize], () => { userPage.value = 1; });
watch([selectedTenant, sessionPageSize], () => { sessionPage.value = 1; });
watch([selectedTenant, supportPageSize], () => { supportPage.value = 1; });
watch([selectedTenant, closurePageSize], () => { closurePage.value = 1; });
watch([selectedTenant, auditPageSize], () => { auditPage.value = 1; });
watch([selectedTenant, liveMapFilter, liveMapPageSize], () => { liveMapPage.value = 1; });

watch(orderTotalPages, (totalPages) => {
  orderPage.value = clampPage(orderPage.value, totalPages);
});
watch(productTotalPages, (totalPages) => { productPage.value = clampPage(productPage.value, totalPages); });
watch(franchiseTotalPages, (totalPages) => { franchisePage.value = clampPage(franchisePage.value, totalPages); });
watch(userTotalPages, (totalPages) => { userPage.value = clampPage(userPage.value, totalPages); });
watch(sessionTotalPages, (totalPages) => { sessionPage.value = clampPage(sessionPage.value, totalPages); });
watch(supportTotalPages, (totalPages) => { supportPage.value = clampPage(supportPage.value, totalPages); });
watch(closureTotalPages, (totalPages) => { closurePage.value = clampPage(closurePage.value, totalPages); });
watch(auditTotalPages, (totalPages) => { auditPage.value = clampPage(auditPage.value, totalPages); });
watch(liveMapTotalPages, (totalPages) => { liveMapPage.value = clampPage(liveMapPage.value, totalPages); });
watch(liveMapFilteredOrders, (orders) => {
  if (orders.length === 0) {
    selectedMapOrderId.value = '';
    return;
  }

  const selectedExists = orders.some((order) => String(order.id) === String(selectedMapOrderId.value));
  if (!selectedExists) {
    selectedMapOrderId.value = String(orders[0].id);
  }
}, { immediate: true });

onMounted(async () => {
  if (!session.isAuthenticated) {
    router.replace('/login');
    return;
  }
  await refreshData();
  await refreshPhaseTwoState({ remote: true });
  setupRealtimeConnections();
  window.addEventListener('visibilitychange', refreshWhenVisible);
  window.addEventListener('focus', refreshWhenVisible);
  window.addEventListener(APP_EVENTS.ordersChanged, refreshWhenVisible);
  refreshTimer = window.setInterval(() => { void refreshData({ silent: true }); }, AUTO_REFRESH_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
  if (realtimeRefreshTimer) window.clearTimeout(realtimeRefreshTimer);
  window.removeEventListener('visibilitychange', refreshWhenVisible);
  window.removeEventListener('focus', refreshWhenVisible);
  window.removeEventListener(APP_EVENTS.ordersChanged, refreshWhenVisible);
  closeRealtimeConnections();
});
</script>

<template>
  <div class="admin-enterprise admin-shell flex min-h-dvh w-full flex-col text-slate-800 antialiased lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden" :class="{ 'admin-dark': isDarkMode }">
    <aside class="admin-sidebar hidden h-dvh max-h-dvh w-80 shrink-0 flex-col overflow-hidden text-white lg:flex">
      <div class="admin-sidebar-header z-10 flex h-20 shrink-0 items-center border-b px-6">
        <div class="admin-brand-mark flex items-center gap-3 text-xl text-brand-500">
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30">
            <i class="fa-solid fa-layer-group"></i>
          </span>
          <div class="min-w-0">
            <h1 class="font-black tracking-wide text-white">Food<span class="text-brand-500">Rush</span></h1>
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Command Center</p>
          </div>
        </div>
      </div>

      <div class="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto p-5">
        <div v-for="group in menuGroups" :key="group.name" class="mb-6">
          <p class="admin-menu-label mb-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{{ group.name }}</p>
          <nav class="space-y-1.5">
            <button v-for="menu in group.items" :key="menu.id" type="button" class="admin-menu-button flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition-all" :class="currentView === menu.id ? 'admin-menu-active bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'" @click="currentView = menu.id">
              <span class="admin-menu-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <i :class="`${menu.icon} text-base`"></i>
              </span>
              <span class="min-w-0 flex-1 truncate">{{ menu.name }}</span>
              <span v-if="getMenuBadge(menu.id) > 0" class="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{{ getMenuBadge(menu.id) }}</span>
            </button>
          </nav>
        </div>
      </div>

      <div class="admin-sidebar-footer shrink-0 border-t p-5">
        <div class="mb-4 grid grid-cols-2 gap-2">
          <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <p class="text-[10px] font-black uppercase text-slate-500">Pedidos</p>
            <p class="mt-1 text-lg font-black text-white">{{ pendingOrdersCount }}</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <p class="text-[10px] font-black uppercase text-slate-500">Alertas</p>
            <p class="mt-1 text-lg font-black text-white">{{ systemAlerts.length }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-bold shadow-inner">{{ (session.userName || 'AD').slice(0, 2).toUpperCase() }}</div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-white">{{ session.userName || 'Admin Principal' }}</p>
            <p class="truncate text-[10px] font-bold uppercase text-brand-500">{{ session.userEmail || 'Superusuario' }}</p>
          </div>
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar sesión" @click="logout"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </div>
    </aside>

    <div class="flex w-full min-w-0 flex-1 flex-col lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <header class="admin-topbar flex min-h-16 flex-col gap-4 border-b px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">FoodRush Admin</span>
              <span class="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider" :class="syncStatusClass">
                <i class="fa-solid fa-circle mr-1 text-[7px]"></i>{{ syncStatusLabel }}
              </span>
              <span class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {{ lastUpdatedAt ? `Sync ${lastUpdatedAt}` : 'Sync pendiente' }}
              </span>
            </div>
            <h2 class="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">{{ currentViewTitle }}</h2>
            <p class="mt-1 max-w-2xl text-sm font-semibold text-slate-500">{{ currentViewDescription }}</p>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white lg:hidden"
            @click="logout"
          >
            <i class="fa-solid fa-right-from-bracket"></i>
            Salir
          </button>
        </div>
        <div class="admin-toolbar flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:items-center xl:gap-3">
          <div class="admin-filter-control flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:gap-2">
            <label class="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtro de Datos</label>
            <select v-model="selectedTenant" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500 sm:w-auto">
              <option value="Global">Vista Global (Todo)</option>
              <option v-for="franchise in franchises" :key="franchise.id" :value="franchise.id">{{ franchise.name }}</option>
            </select>
          </div>
          <button type="button" class="admin-icon-action inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-500 shadow-sm hover:border-brand-200 hover:text-brand-600" @click="toggleAdminTheme" :aria-pressed="isDarkMode">
            <i :class="isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
            <span>{{ isDarkMode ? 'Claro' : 'Oscuro' }}</span>
          </button>
          <button type="button" class="admin-icon-action inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm" :class="qaDatasetEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300' : 'border-slate-200 bg-white text-slate-500 hover:border-brand-200 hover:text-brand-600'" @click="toggleQaDatasetMode" :aria-pressed="qaDatasetEnabled">
            <i class="fa-solid fa-flask"></i>
            <span>{{ qaDatasetEnabled ? 'Datos QA' : 'QA off' }}</span>
          </button>
          <button type="button" class="admin-icon-action inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm hover:border-brand-200 hover:text-brand-600" aria-label="Actualizar datos" @click="refreshData({ silent: true })">
            <i class="fa-solid fa-rotate-right text-xl" :class="{ 'fa-spin': isRefreshing }"></i>
          </button>
        </div>
      </header>

      <div class="admin-mobile-nav border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div class="hide-scrollbar flex gap-2 overflow-x-auto">
          <template v-for="group in menuGroups" :key="group.name">
            <button v-for="menu in group.items" :key="menu.id" type="button" class="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition" :class="currentView === menu.id ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-orange-500/20' : 'border-slate-200 bg-white text-slate-500'" @click="currentView = menu.id">
              <i :class="menu.icon"></i>
              {{ menu.name }}
            </button>
          </template>
        </div>
      </div>

      <main class="admin-main flex-1 p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto">
        <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{{ errorMessage }}</div>
        <div v-if="phaseTwoMessage" class="mb-5 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <span><i class="fa-solid fa-circle-check mr-2"></i>{{ phaseTwoMessage }}</span>
          <button type="button" class="text-emerald-500 hover:text-emerald-700" @click="phaseTwoMessage = ''"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div v-if="isLoading" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div v-for="card in 8" :key="card" class="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm"></div>
        </div>

        <template v-else>
          <div class="admin-command-strip mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <button type="button" class="admin-command-tile text-left" @click="currentView = 'orders'">
              <span class="admin-command-icon bg-amber-50 text-amber-600"><i class="fa-solid fa-receipt"></i></span>
              <span class="min-w-0">
                <span class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Pendientes</span>
                <span class="mt-1 block text-xl font-black text-slate-900">{{ pendingOrdersCount }}</span>
              </span>
            </button>
            <button type="button" class="admin-command-tile text-left" @click="currentView = 'orders'; orderDeliveryFilter = 'unassigned'">
              <span class="admin-command-icon bg-orange-50 text-brand-600"><i class="fa-solid fa-user-plus"></i></span>
              <span class="min-w-0">
                <span class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Sin delivery</span>
                <span class="mt-1 block text-xl font-black text-slate-900">{{ readyForDeliveryCount }}</span>
              </span>
            </button>
            <button type="button" class="admin-command-tile text-left" @click="currentView = 'zones'">
              <span class="admin-command-icon bg-emerald-50 text-emerald-600"><i class="fa-solid fa-map-location-dot"></i></span>
              <span class="min-w-0">
                <span class="block text-[10px] font-black uppercase tracking-wider text-slate-400">En mapa</span>
                <span class="mt-1 block text-xl font-black text-slate-900">{{ liveMapOrders.length }}</span>
              </span>
            </button>
            <button type="button" class="admin-command-tile text-left" @click="currentView = 'support'">
              <span class="admin-command-icon bg-red-50 text-red-600"><i class="fa-solid fa-triangle-exclamation"></i></span>
              <span class="min-w-0">
                <span class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Alertas</span>
                <span class="mt-1 block text-xl font-black text-slate-900">{{ systemAlerts.length }}</span>
              </span>
            </button>
          </div>

          <section v-if="currentView === 'dashboard'" class="space-y-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div v-for="card in dashboardKpis" :key="card.label" class="admin-kpi-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-start justify-between gap-3">
                  <p class="text-xs font-black uppercase tracking-wider text-slate-400">{{ card.label }}</p>
                  <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base', card.tone]">
                    <i :class="card.icon"></i>
                  </span>
                </div>
                <p class="text-2xl font-black leading-none text-slate-800">{{ card.value }}</p>
                <p class="mt-2 text-xs font-bold text-slate-500">{{ card.detail }}</p>
              </div>
            </div>

            <div class="admin-module-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.28em] text-brand-600">Acciones rápidas</p>
                  <h3 class="mt-2 text-xl font-black text-slate-900">Mover la operación sin perder contexto</h3>
                  <p class="mt-1 text-sm font-bold text-slate-500">Accesos directos a los módulos donde normalmente hay que actuar primero.</p>
                </div>
                <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <button type="button" class="admin-quick-action" @click="currentView = 'orders'"><i class="fa-solid fa-receipt"></i> Pedidos</button>
                  <button type="button" class="admin-quick-action" @click="currentView = 'zones'"><i class="fa-solid fa-map-location-dot"></i> Mapa</button>
                  <button type="button" class="admin-quick-action" @click="currentView = 'daily_close'"><i class="fa-solid fa-cash-register"></i> Cierre</button>
                  <button type="button" class="admin-quick-action" @click="currentView = 'audit'"><i class="fa-solid fa-clipboard-list"></i> Auditoría</button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-7">
                <h3 class="mb-4 text-sm font-black text-slate-800">Rendimiento Semanal (Ventas)</h3>
                <div class="admin-chart-shell rounded-2xl p-3 sm:p-4">
                  <div class="admin-weekly-chart" role="img" aria-label="Ventas entregadas de los ultimos siete dias">
                    <div v-for="day in weeklySales" :key="day.key" class="admin-weekly-column">
                      <div class="admin-weekly-track">
                        <div
                          class="admin-weekly-bar"
                          :class="{ 'admin-weekly-bar-empty': !day.hasValue }"
                          :style="{ height: day.height }"
                          :title="`${day.label.toUpperCase()}: ${formatCurrency(day.amount)}`"
                        ></div>
                      </div>
                      <p class="admin-weekly-label">{{ day.label }}</p>
                      <p class="admin-weekly-value">{{ formatChartCurrency(day.amount) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-5">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-black text-slate-800">Pedidos por Estado</h3>
                    <p class="mt-1 text-xs font-bold text-slate-400">{{ totalOrdersCount }} pedidos en {{ selectedTenantName }}</p>
                  </div>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-500">{{ completionRate }}% entregados</span>
                </div>
                <div class="space-y-3">
                  <div v-for="status in orderStatusSummary" :key="status.id" class="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-xs font-black text-slate-800">{{ status.label }}</p>
                        <p class="text-[10px] font-bold text-slate-400">{{ formatCurrency(status.amount) }}</p>
                      </div>
                      <p class="shrink-0 text-sm font-black text-slate-800">{{ status.count }}</p>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-white">
                      <div class="h-full rounded-full bg-brand-500" :style="{ width: `${Math.max(status.percent, status.count > 0 ? 8 : 0)}%` }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-5">
                <h3 class="mb-4 text-sm font-black text-slate-800">Operación delivery</h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div v-for="item in deliveryOpsSummary" :key="item.label" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div class="mb-3 flex items-center justify-between gap-2">
                      <span :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm', item.tone]">
                        <i :class="item.icon"></i>
                      </span>
                      <p class="text-xl font-black text-slate-800">{{ item.value }}</p>
                    </div>
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">{{ item.label }}</p>
                    <p class="mt-1 text-xs font-bold text-slate-500">{{ item.detail }}</p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-7">
                <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 class="text-sm font-black text-slate-800">Rendimiento por Franquicia</h3>
                    <p class="text-xs font-bold text-slate-400">Ventas, pedidos activos y delivery asignado.</p>
                  </div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-brand-600">{{ franchisePerformanceRows.length }} locales destacados</p>
                </div>

                <div class="space-y-3">
                  <div v-for="franchise in franchisePerformanceRows" :key="franchise.id" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div class="mb-3 flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-black text-slate-800">{{ franchise.name }}</p>
                        <p class="mt-1 text-[10px] font-bold uppercase text-slate-400">
                          {{ franchise.ordersCount }} pedidos - {{ franchise.activeCount }} activos - {{ franchise.assignedCount }} con delivery
                        </p>
                      </div>
                      <div class="shrink-0 text-right">
                        <p class="text-sm font-black text-slate-800">{{ formatCurrency(franchise.sales) }}</p>
                        <p class="mt-1 text-[10px] font-bold text-slate-400">{{ formatCurrency(franchise.averageTicket) }} prom.</p>
                      </div>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-white">
                      <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" :style="{ width: franchise.barWidth }"></div>
                    </div>
                  </div>

                  <div v-if="franchisePerformanceRows.length === 0" class="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
                    No hay rendimiento disponible para el filtro actual.
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <h3 class="mb-4 text-sm font-black text-slate-800">Alertas del Sistema</h3>
              <div v-if="systemAlerts.length === 0" class="rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm font-bold text-emerald-700">Todo funciona correctamente.</div>
              <ul v-else class="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <li v-for="(alert, index) in systemAlerts" :key="`${index}-${alert}`" class="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">{{ alert }}</li>
              </ul>
            </div>
          </section>

          <section v-if="currentView === 'orders'" class="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="border-b border-slate-100 p-4 sm:p-6">
              <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_180px_170px_130px]">
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Buscar pedido</span>
                    <input v-model="search.orders" type="text" placeholder="ID, cliente, local, telefono..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-500">
                  </label>

                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Estado</span>
                    <select v-model="orderStatusFilter" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-500">
                      <option v-for="status in orderStatusFilterOptions" :key="status.id" :value="status.id">{{ status.label }}</option>
                    </select>
                  </label>

                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery</span>
                    <select v-model="orderDeliveryFilter" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-500">
                      <option v-for="option in orderDeliveryFilterOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
                    </select>
                  </label>

                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Por pagina</span>
                    <select v-model.number="orderPageSize" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-brand-500">
                      <option v-for="size in orderPageSizeOptions" :key="size" :value="size">{{ size }}</option>
                    </select>
                  </label>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button v-if="hasOrderFilters" type="button" class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-500 hover:border-brand-500 hover:text-brand-600" @click="clearOrderFilters">LIMPIAR</button>
                  <button type="button" class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-black text-white" @click="refreshData({ silent: true })">RECARGAR</button>
                </div>
              </div>

              <div class="mt-4 flex flex-col gap-2 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>Mostrando {{ orderPageStart }}-{{ orderPageEnd }} de {{ orderPaginationTotal }} pedidos</p>
                <p>{{ selectedTenantName }} · {{ lastUpdatedAt ? `Actualizado ${lastUpdatedAt}` : 'Sin sincronizar' }}</p>
              </div>
            </div>
            <div class="space-y-3 p-4 md:hidden">
              <article v-for="order in paginatedOrders" :key="`mobile-${order.tenantId}-${order.id}`" class="admin-order-card rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">{{ order.tenantName }}</p>
                    <h3 class="mt-1 truncate text-lg font-black text-slate-900">Pedido #{{ order.id }}</h3>
                    <p class="mt-1 truncate text-sm font-bold text-slate-500">{{ order.customerName }}</p>
                  </div>
                  <p class="shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-900">{{ formatCurrency(order.totalValue) }}</p>
                </div>

                <p class="mt-3 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{{ order.itemSummary }}</p>

                <div class="mt-4 grid grid-cols-2 gap-2">
                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-[10px] font-black uppercase text-slate-400">Delivery</p>
                    <p class="mt-1 truncate text-xs font-black text-slate-800">{{ order.driverName || order.deliveryAssignment?.driverName || 'Sin asignar' }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-[10px] font-black uppercase text-slate-400">Contacto</p>
                    <p class="mt-1 truncate text-xs font-black text-slate-800">{{ order.customerPhone || 'Sin telefono' }}</p>
                  </div>
                </div>

                <div class="mt-4 flex flex-col gap-2">
                  <select class="rounded-xl px-3 py-3 text-xs font-black outline-none" :class="getStatusBadgeClass(order.statusKey)" :disabled="savingOrderId === String(order.id)" :value="orderStatusKey(order)" @change="updateOrderStatus(order, $event.target.value)">
                    <option v-for="status in statusOptions" :key="status.id" :value="status.id">{{ status.label }}</option>
                  </select>
                  <div class="grid grid-cols-2 gap-2">
                    <button v-if="isPendingOrder(order)" type="button" class="rounded-xl bg-orange-50 px-3 py-3 text-xs font-black text-orange-600 hover:bg-orange-100" :disabled="savingOrderId === String(order.id)" @click="confirmOrder(order)">CONFIRMAR</button>
                    <button type="button" class="rounded-xl bg-slate-900 px-3 py-3 text-xs font-black text-white hover:bg-brand-600" :class="{ 'col-span-2': !isPendingOrder(order) }" @click="router.push({ path: `/tracking/${order.id}`, query: { tenant: order.tenantId } })">TRACKING</button>
                  </div>
                </div>
              </article>
              <div v-if="filteredOrders.length === 0" class="rounded-2xl border border-slate-100 bg-white p-10 text-center">
                <p class="text-sm font-bold text-slate-400">No hay pedidos registrados en este local.</p>
              </div>
            </div>

            <div class="hidden overflow-x-auto md:block">
              <table class="min-w-[1100px] w-full text-left border-collapse">
                <thead><tr class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200"><th class="p-4 pl-6">ID / Local</th><th class="p-4">Cliente</th><th class="p-4">Pedido</th><th class="p-4">Total</th><th class="p-4">Estado</th><th class="p-4">Delivery</th><th class="p-4 pr-6 text-right">Acciones</th></tr></thead>
                <tbody class="text-sm">
                  <tr v-for="order in paginatedOrders" :key="`${order.tenantId}-${order.id}`" class="border-b border-slate-50 hover:bg-slate-50/50">
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
            <div v-if="filteredOrders.length > 0" class="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <p class="text-xs font-bold text-slate-400">Pagina {{ orderPage }} de {{ orderTotalPages }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 disabled:cursor-not-allowed disabled:opacity-40" :disabled="orderPage <= 1" @click="goToOrderPage(orderPage - 1)">Anterior</button>
                <button v-for="page in visibleOrderPages" :key="page" type="button" class="rounded-lg border px-3 py-2 text-xs font-black transition" :class="page === orderPage ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 text-slate-500 hover:border-brand-500 hover:text-brand-600'" @click="goToOrderPage(page)">{{ page }}</button>
                <button type="button" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 disabled:cursor-not-allowed disabled:opacity-40" :disabled="orderPage >= orderTotalPages" @click="goToOrderPage(orderPage + 1)">Siguiente</button>
              </div>
            </div>
          </section>

          <section v-if="currentView === 'menu'" class="admin-module-card rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="admin-section-kicker">Catálogo operativo</p>
                <h3 class="mt-1 text-xl font-black text-slate-900">Gestión de productos</h3>
                <p class="mt-1 text-xs font-bold text-slate-500">Catálogo real cargado desde el backend, con precio, stock y local visible.</p>
              </div>
              <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <input v-model="search.products" type="text" placeholder="Buscar producto..." class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-brand-500 sm:w-80">
                <select v-model.number="productPageSize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-brand-500">
                  <option v-for="size in recordPageSizeOptions" :key="`products-${size}`" :value="size">{{ size }} por pagina</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 p-5 sm:p-6 xl:grid-cols-2">
              <div v-for="product in paginatedProducts" :key="`${product.tenantId}-${product.id}`" class="admin-data-card rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-black text-slate-900">{{ product.nombre || product.name || 'Producto' }}</p>
                    <p class="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">ID: {{ product.id }} - {{ product.tenantName }}</p>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900">{{ formatCurrency(product.priceValue) }}</div>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <div class="rounded-xl bg-white p-3"><p class="font-black uppercase text-slate-400">Stock</p><p class="mt-1 font-black text-slate-800">{{ product.stock ?? product.existencias ?? product.inventario ?? 'N/D' }}</p></div>
                  <div class="rounded-xl bg-white p-3"><p class="font-black uppercase text-slate-400">Categoria</p><p class="mt-1 truncate font-black text-slate-800">{{ product.categoryLabel }}</p></div>
                  <div class="rounded-xl bg-white p-3 sm:col-span-1"><p class="font-black uppercase text-slate-400">Local</p><p class="mt-1 truncate font-black text-slate-800">{{ product.tenantName }}</p></div>
                </div>
              </div>
              <div v-if="filteredProducts.length === 0" class="py-12 text-center"><p class="text-sm font-bold text-slate-400">No hay productos en esta franquicia.</p></div>
            </div>
            <div v-if="filteredProducts.length > 0" class="admin-pagination">
              <p>Mostrando {{ productPageStart }}-{{ productPageEnd }} de {{ productPaginationTotal }} productos</p>
              <div class="admin-pagination-actions">
                <button type="button" :disabled="productPage <= 1" @click="goToProductPage(productPage - 1)">Anterior</button>
                <button v-for="page in visibleProductPages" :key="`product-page-${page}`" type="button" :class="{ 'is-active': page === productPage }" @click="goToProductPage(page)">{{ page }}</button>
                <button type="button" :disabled="productPage >= productTotalPages" @click="goToProductPage(productPage + 1)">Siguiente</button>
              </div>
            </div>
          </section>

          <section v-if="currentView === 'franchises_list'" class="admin-module-card rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="admin-section-kicker">Red de locales</p>
                <h3 class="mt-1 text-xl font-black text-slate-900">Gestión de locales</h3>
                <p class="mt-1 text-xs font-bold text-slate-500">Todas las franquicias visibles en el sistema.</p>
              </div>
              <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <input v-model="search.franchises" type="text" placeholder="Buscar franquicia..." class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-brand-500 sm:w-80">
                <select v-model.number="franchisePageSize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-brand-500">
                  <option v-for="size in recordPageSizeOptions" :key="`franchises-${size}`" :value="size">{{ size }} por pagina</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
              <div v-for="franchise in paginatedFranchiseCards" :key="franchise.id" class="admin-data-card rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-black text-slate-900">{{ franchise.name }}</p>
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Sistema: {{ franchise.id }}</p>
                  </div>
                  <span class="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">Activo</span>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3 text-sm"><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Pedidos</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.ordersCount }}</p></div><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Productos</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.productsCount }}</p></div><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Usuarios</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.usersCount }}</p></div><div class="rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Conectados</p><p class="mt-2 text-xl font-black text-slate-800">{{ franchise.connectedCount }}</p></div></div>
                <div class="mt-4 rounded-xl bg-white p-3"><p class="text-[10px] font-black uppercase text-slate-400">Ventas Entregadas</p><p class="mt-2 text-xl font-black text-slate-800">{{ formatCurrency(franchise.sales) }}</p></div>
              </div>
            </div>
            <div v-if="franchiseCards.length > 0" class="admin-pagination">
              <p>Mostrando {{ franchisePageStart }}-{{ franchisePageEnd }} de {{ franchisePaginationTotal }} locales</p>
              <div class="admin-pagination-actions">
                <button type="button" :disabled="franchisePage <= 1" @click="goToFranchisePage(franchisePage - 1)">Anterior</button>
                <button v-for="page in visibleFranchisePages" :key="`franchise-page-${page}`" type="button" :class="{ 'is-active': page === franchisePage }" @click="goToFranchisePage(page)">{{ page }}</button>
                <button type="button" :disabled="franchisePage >= franchiseTotalPages" @click="goToFranchisePage(franchisePage + 1)">Siguiente</button>
              </div>
            </div>
          </section>

          <section v-if="currentView === 'users_fleet'" class="admin-module-card rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="admin-section-kicker">Equipo operativo</p>
                <h3 class="mt-1 text-xl font-black text-slate-900">Flota y Personal</h3>
                <p class="mt-1 text-xs font-bold text-slate-500">Usuarios y personas conectadas en el sitio web.</p>
              </div>
              <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <input v-model="search.users" type="text" placeholder="Buscar persona..." class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-brand-500 sm:w-80">
                <select v-model.number="userPageSize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-brand-500">
                  <option v-for="size in recordPageSizeOptions" :key="`users-${size}`" :value="size">{{ size }} por pagina</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-3 p-4 md:hidden">
              <article v-for="user in paginatedUsers" :key="`user-mobile-${user.tenantId}-${user.id}`" class="admin-data-card rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div class="flex items-start gap-3">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-brand-600">{{ (user.name || 'US').slice(0, 2).toUpperCase() }}</div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-black text-slate-900">{{ user.name }}</p>
                    <p class="truncate text-xs font-bold text-slate-500">{{ user.email || user.phone || 'Sin contacto' }}</p>
                    <p class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{{ user.roleLabel }} - {{ user.tenantName }}</p>
                  </div>
                  <span class="rounded-full px-3 py-1.5 text-[10px] font-black" :class="user.isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">{{ user.isConnected ? 'Online' : 'Offline' }}</span>
                </div>
              </article>
            </div>
            <div class="hidden overflow-x-auto p-6 md:block">
              <table class="w-full text-left border-collapse">
                <thead><tr class="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200"><th class="p-4 pl-6">Nombre del Empleado</th><th class="p-4">Rol / Permisos</th><th class="p-4">Local</th><th class="p-4 pr-6 text-right">Estado</th></tr></thead>
                <tbody><tr v-for="user in paginatedUsers" :key="`${user.tenantId}-${user.id}`" class="border-b border-slate-50 hover:bg-slate-50/50"><td class="p-4 pl-6"><p class="font-black text-slate-800">{{ user.name }}</p><p class="mt-1 text-xs font-bold text-slate-400">{{ user.email || user.phone || 'Sin contacto' }}</p></td><td class="p-4"><span class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{{ user.roleLabel }}</span></td><td class="p-4 text-sm font-bold text-slate-600">{{ user.tenantName }}</td><td class="p-4 pr-6 text-right"><span class="rounded-full px-3 py-1.5 text-xs font-black" :class="user.isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">{{ user.isConnected ? 'Conectado' : 'Desconectado' }}</span></td></tr></tbody>
              </table>
            </div>
            <div v-if="filteredUsers.length > 0" class="admin-pagination">
              <p>Mostrando {{ userPageStart }}-{{ userPageEnd }} de {{ userPaginationTotal }} personas</p>
              <div class="admin-pagination-actions">
                <button type="button" :disabled="userPage <= 1" @click="goToUserPage(userPage - 1)">Anterior</button>
                <button v-for="page in visibleUserPages" :key="`user-page-${page}`" type="button" :class="{ 'is-active': page === userPage }" @click="goToUserPage(page)">{{ page }}</button>
                <button type="button" :disabled="userPage >= userTotalPages" @click="goToUserPage(userPage + 1)">Siguiente</button>
              </div>
            </div>
          </section>

          <section v-if="currentView === 'support'" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="admin-module-card flex max-h-[620px] flex-col rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div class="border-b border-slate-100 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="admin-section-kicker">Actividad viva</p>
                    <h3 class="mt-1 text-sm font-black text-slate-800"><i class="fa-solid fa-user-clock mr-2 text-brand-500"></i> Sesiones Web Activas</h3>
                  </div>
                  <select v-model.number="sessionPageSize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black outline-none focus:border-brand-500">
                    <option v-for="size in recordPageSizeOptions" :key="`sessions-${size}`" :value="size">{{ size }} por pagina</option>
                  </select>
                </div>
              </div>
              <div class="min-h-0 flex-1 overflow-y-auto p-5"><div class="space-y-3"><div v-for="row in paginatedSessionRows" :key="row.id" class="rounded-xl border border-slate-100 bg-slate-50 p-3"><p class="text-xs font-black text-slate-800">{{ row.userName }}</p><p class="text-[10px] font-bold text-slate-500">{{ row.email }} · {{ row.tenantName }}</p><p class="mt-1 text-[10px] font-bold text-slate-400">Expira: {{ formatDate(row.expiresAt) }}</p></div><div v-if="sessionRows.length === 0" class="py-6 text-center text-xs font-bold text-slate-400">No hay sesiones activas detectadas.</div></div></div>
              <div v-if="sessionRows.length > 0" class="admin-pagination">
                <p>{{ sessionPageStart }}-{{ sessionPageEnd }} de {{ sessionPaginationTotal }} sesiones</p>
                <div class="admin-pagination-actions">
                  <button type="button" :disabled="sessionPage <= 1" @click="goToSessionPage(sessionPage - 1)">Anterior</button>
                  <button v-for="page in visibleSessionPages" :key="`session-page-${page}`" type="button" :class="{ 'is-active': page === sessionPage }" @click="goToSessionPage(page)">{{ page }}</button>
                  <button type="button" :disabled="sessionPage >= sessionTotalPages" @click="goToSessionPage(sessionPage + 1)">Siguiente</button>
                </div>
              </div>
            </div>

            <div class="admin-module-card flex max-h-[620px] flex-col rounded-2xl border border-red-100 bg-white shadow-sm">
              <div class="rounded-t-2xl border-b border-red-100 bg-red-50 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="admin-section-kicker text-red-500">Resolver primero</p>
                    <h3 class="mt-1 text-sm font-black text-red-600"><i class="fa-solid fa-truck-medical mr-2"></i> Centro de Alertas</h3>
                  </div>
                  <select v-model.number="supportPageSize" class="rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-600 outline-none focus:border-brand-500">
                    <option v-for="size in recordPageSizeOptions" :key="`support-${size}`" :value="size">{{ size }} por pagina</option>
                  </select>
                </div>
              </div>
              <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
                <div v-for="order in paginatedSupportAlerts" :key="order.id" class="rounded-xl border border-red-200 bg-red-50 p-4"><p class="text-sm font-black text-red-700">Pedido #{{ order.id }}</p><p class="mt-1 text-xs font-bold text-red-500">{{ order.customerName }} · {{ order.tenantName }}</p><p class="mt-2 text-xs text-red-600">{{ order.itemSummary }}</p></div>
                <div v-for="(alert, index) in systemAlerts" :key="`alert-${index}`" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-700">{{ alert }}</div>
                <div v-if="supportAlerts.length === 0 && systemAlerts.length === 0" class="py-12 text-center text-sm font-bold text-slate-500">Sistema estable. No hay alertas criticas.</div>
              </div>
              <div v-if="supportAlerts.length > 0" class="admin-pagination">
                <p>{{ supportPageStart }}-{{ supportPageEnd }} de {{ supportPaginationTotal }} alertas de pedido</p>
                <div class="admin-pagination-actions">
                  <button type="button" :disabled="supportPage <= 1" @click="goToSupportPage(supportPage - 1)">Anterior</button>
                  <button v-for="page in visibleSupportPages" :key="`support-page-${page}`" type="button" :class="{ 'is-active': page === supportPage }" @click="goToSupportPage(page)">{{ page }}</button>
                  <button type="button" :disabled="supportPage >= supportTotalPages" @click="goToSupportPage(supportPage + 1)">Siguiente</button>
                </div>
              </div>
            </div>
          </section>

          <section v-if="currentView === 'zones'" class="space-y-6">
            <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div class="admin-module-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Pedidos en vivo</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ liveMapOrders.length }}</p>
                <p class="mt-1 text-xs font-bold text-slate-500">{{ selectedTenantName }}</p>
              </div>
              <div class="admin-module-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Preparando</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ liveMapPreparingCount }}</p>
                <p class="mt-1 text-xs font-bold text-slate-500">{{ liveMapUnassignedCount }} sin delivery</p>
              </div>
              <div class="admin-module-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">En camino</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ liveMapTransitCount }}</p>
                <p class="mt-1 text-xs font-bold text-slate-500">Repartidores activos</p>
              </div>
              <div class="admin-module-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Pendientes</p>
                <p class="mt-3 text-3xl font-black text-slate-900">{{ liveMapPendingCount }}</p>
                <p class="mt-1 text-xs font-bold text-slate-500">Esperando local</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.55fr)]">
              <div class="admin-module-card overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div class="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p class="admin-section-kicker">Mapa en vivo</p>
                    <h3 class="mt-1 text-xl font-black text-slate-900">Operación de pedidos en tiempo real</h3>
                    <p class="mt-1 text-xs font-bold text-slate-500">Visualiza locales, clientes y repartidores activos sin editar reglas de zona.</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase text-brand-600">{{ selectedTenantName }}</span>
                    <span class="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
                      <i class="fa-solid fa-satellite-dish mr-1"></i>
                      {{ isRefreshing ? 'Sincronizando' : 'En vivo' }}
                    </span>
                  </div>
                </div>

                <div class="admin-live-map-shell">
                  <AdminLiveOrdersMap
                    :orders="liveMapFilteredOrders"
                    :selected-order-id="selectedMapOrder?.id || ''"
                    @select-order="selectMapOrder"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2 border-t border-slate-100 p-4 text-[10px] font-black uppercase text-slate-400 sm:grid-cols-4">
                  <div class="rounded-xl bg-slate-50 p-3"><i class="fa-solid fa-circle mr-1 text-amber-500"></i> Pendiente</div>
                  <div class="rounded-xl bg-slate-50 p-3"><i class="fa-solid fa-circle mr-1 text-blue-500"></i> Preparando</div>
                  <div class="rounded-xl bg-slate-50 p-3"><i class="fa-solid fa-circle mr-1 text-orange-500"></i> En camino</div>
                  <div class="rounded-xl bg-slate-50 p-3"><i class="fa-solid fa-circle mr-1 text-emerald-500"></i> Seleccionado</div>
                </div>
              </div>

              <aside class="space-y-6">
                <div class="admin-module-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p class="admin-section-kicker">Pedidos</p>
                      <h3 class="text-lg font-black text-slate-900">Actividad del mapa</h3>
                    </div>
                    <select v-model.number="liveMapPageSize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black outline-none focus:border-brand-500">
                      <option v-for="size in recordPageSizeOptions" :key="`live-map-${size}`" :value="size">{{ size }} por pagina</option>
                    </select>
                  </div>

                  <div class="hide-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
                    <button
                      v-for="filter in liveMapFilterOptions"
                      :key="filter.id"
                      type="button"
                      class="shrink-0 rounded-full border px-4 py-2 text-xs font-black transition"
                      :class="liveMapFilter === filter.id ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-orange-500/20' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-200 hover:text-brand-600'"
                      @click="liveMapFilter = filter.id"
                    >
                      {{ filter.label }}
                    </button>
                  </div>

                  <div class="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                    <button
                      v-for="order in paginatedLiveMapOrders"
                      :key="order.id"
                      type="button"
                      class="w-full rounded-2xl border p-4 text-left transition"
                      :class="String(selectedMapOrder?.id) === String(order.id) ? 'border-brand-500 bg-orange-50 shadow-sm shadow-orange-500/10' : 'border-slate-100 bg-slate-50 hover:border-orange-200'"
                      @click="selectMapOrder(order.id)"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="truncate text-sm font-black text-slate-900">Pedido #{{ order.id }}</p>
                          <p class="mt-1 truncate text-xs font-bold text-slate-500">{{ order.tenantName }} - {{ order.customerName }}</p>
                        </div>
                        <span class="shrink-0 rounded-full px-3 py-1 text-[10px] font-black" :class="getStatusBadgeClass(order.statusLabel)">
                          {{ orderStatusKey(order) }}
                        </span>
                      </div>
                      <div class="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                        <span class="rounded-xl bg-white px-3 py-2"><i class="fa-solid fa-location-dot mr-1 text-brand-500"></i>{{ order.address }}</span>
                        <span class="rounded-xl bg-white px-3 py-2"><i class="fa-solid fa-motorcycle mr-1 text-emerald-500"></i>{{ order.driverName || order.deliveryAssignment?.driverName || 'Sin delivery' }}</span>
                      </div>
                    </button>
                    <div v-if="liveMapFilteredOrders.length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
                      No hay pedidos activos para este filtro.
                    </div>
                  </div>

                  <div v-if="liveMapFilteredOrders.length > 0" class="admin-pagination mt-4 rounded-2xl border border-slate-100">
                    <p>{{ liveMapPageStart }}-{{ liveMapPageEnd }} de {{ liveMapPaginationTotal }} pedidos</p>
                    <div class="admin-pagination-actions">
                      <button type="button" :disabled="liveMapPage <= 1" @click="goToLiveMapPage(liveMapPage - 1)">Anterior</button>
                      <button v-for="page in visibleLiveMapPages" :key="`live-map-page-${page}`" type="button" :class="{ 'is-active': page === liveMapPage }" @click="goToLiveMapPage(page)">{{ page }}</button>
                      <button type="button" :disabled="liveMapPage >= liveMapTotalPages" @click="goToLiveMapPage(liveMapPage + 1)">Siguiente</button>
                    </div>
                  </div>
                </div>

                <div v-if="selectedMapOrder" class="admin-module-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p class="admin-section-kicker">Pedido seleccionado</p>
                  <div class="mt-3 flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <h3 class="truncate text-xl font-black text-slate-900">#{{ selectedMapOrder.id }} - {{ selectedMapOrder.tenantName }}</h3>
                      <p class="mt-1 text-xs font-bold text-slate-500">{{ selectedMapOrder.customerName }} - {{ selectedMapOrder.customerPhone }}</p>
                    </div>
                    <span class="rounded-full px-3 py-1 text-[10px] font-black" :class="getStatusBadgeClass(selectedMapOrder.statusLabel)">{{ orderStatusKey(selectedMapOrder) }}</span>
                  </div>
                  <div class="mt-5 grid grid-cols-1 gap-3 text-sm">
                    <div class="rounded-2xl bg-slate-50 p-4">
                      <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Direccion</p>
                      <p class="mt-1 font-black text-slate-800">{{ selectedMapOrder.address }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="rounded-2xl bg-slate-50 p-4">
                        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total</p>
                        <p class="mt-1 font-black text-slate-800">{{ formatCurrency(selectedMapOrder.totalValue) }}</p>
                      </div>
                      <div class="rounded-2xl bg-slate-50 p-4">
                        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Codigo</p>
                        <p class="mt-1 font-black text-slate-800">{{ selectedMapOrder.securityCode || 'N/D' }}</p>
                      </div>
                    </div>
                    <div class="rounded-2xl bg-slate-50 p-4">
                      <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery</p>
                      <p class="mt-1 font-black text-slate-800">{{ selectedMapOrder.driverName || selectedMapOrder.deliveryAssignment?.driverName || 'Pendiente de asignacion' }}</p>
                    </div>
                  </div>
                  <button type="button" class="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-brand-600" @click="router.push({ path: `/tracking/${selectedMapOrder.id}`, query: { tenant: selectedMapOrder.tenantId } })">
                    <i class="fa-solid fa-location-arrow mr-2"></i> Ver tracking del pedido
                  </button>
                </div>
              </aside>
            </div>
          </section>

          <section v-if="currentView === 'daily_close'" class="space-y-6">
            <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600">Cierre diario</p>
                  <h3 class="mt-2 text-2xl font-black text-slate-800">Resumen operativo de {{ selectedTenantName }}</h3>
                  <p class="mt-1 text-sm font-bold text-slate-500">Genera un corte local con ventas, pedidos, zonas y delivery.</p>
                </div>
                <button type="button" class="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 hover:bg-brand-600" @click="generateDailyClosure">
                  <i class="fa-solid fa-file-circle-check mr-2"></i> GENERAR CIERRE
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-[10px] font-black uppercase text-slate-400">Ventas entregadas</p><p class="mt-3 text-2xl font-black text-slate-800">{{ formatCurrency(closurePreview.grossSales) }}</p><p class="mt-1 text-xs font-bold text-slate-500">{{ closurePreview.deliveredOrders }} pedidos completados</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-[10px] font-black uppercase text-slate-400">Ticket promedio</p><p class="mt-3 text-2xl font-black text-slate-800">{{ formatCurrency(closurePreview.averageTicket) }}</p><p class="mt-1 text-xs font-bold text-slate-500">{{ closurePreview.totalOrders }} pedidos totales</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-[10px] font-black uppercase text-slate-400">Pedidos activos</p><p class="mt-3 text-2xl font-black text-slate-800">{{ closurePreview.activeOrders }}</p><p class="mt-1 text-xs font-bold text-slate-500">{{ closurePreview.assignedOrders }} con delivery asignado</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-[10px] font-black uppercase text-slate-400">Zonas activas</p><p class="mt-3 text-2xl font-black text-slate-800">{{ closurePreview.activeZones }}</p><p class="mt-1 text-xs font-bold text-slate-500">{{ closurePreview.cancelledOrders }} cancelados</p></div>
            </div>

            <div class="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div class="border-b border-slate-100 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 class="font-black text-slate-800">Historial de cierres</h3>
                    <p class="text-xs font-bold text-slate-500">Ultimos cortes generados desde este navegador administrativo.</p>
                  </div>
                  <select v-model.number="closurePageSize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black outline-none focus:border-brand-500">
                    <option v-for="size in recordPageSizeOptions" :key="`closures-${size}`" :value="size">{{ size }} por pagina</option>
                  </select>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-[860px] w-full text-left">
                  <thead><tr class="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500"><th class="p-4 pl-6">Fecha</th><th class="p-4">Alcance</th><th class="p-4">Ventas</th><th class="p-4">Entregados</th><th class="p-4">Activos</th><th class="p-4 pr-6">Zonas</th></tr></thead>
                  <tbody class="text-sm">
                    <tr v-for="record in paginatedClosureHistory" :key="record.id" class="border-b border-slate-50">
                      <td class="p-4 pl-6 font-black text-slate-800">{{ formatDate(record.generatedAt) }}</td>
                      <td class="p-4 font-bold text-slate-600">{{ record.tenantName }}</td>
                      <td class="p-4 font-black text-slate-800">{{ formatCurrency(record.grossSales) }}</td>
                      <td class="p-4 font-bold text-slate-600">{{ record.deliveredOrders }}</td>
                      <td class="p-4 font-bold text-slate-600">{{ record.activeOrders }}</td>
                      <td class="p-4 pr-6 font-bold text-slate-600">{{ record.activeZones }}</td>
                    </tr>
                    <tr v-if="closureHistory.length === 0"><td colspan="6" class="p-10 text-center text-sm font-bold text-slate-400">Todavia no hay cierres generados.</td></tr>
                  </tbody>
                </table>
              </div>
              <div v-if="closureHistory.length > 0" class="admin-pagination">
                <p>Mostrando {{ closurePageStart }}-{{ closurePageEnd }} de {{ closurePaginationTotal }} cierres</p>
                <div class="admin-pagination-actions">
                  <button type="button" :disabled="closurePage <= 1" @click="goToClosurePage(closurePage - 1)">Anterior</button>
                  <button v-for="page in visibleClosurePages" :key="`closure-page-${page}`" type="button" :class="{ 'is-active': page === closurePage }" @click="goToClosurePage(page)">{{ page }}</button>
                  <button type="button" :disabled="closurePage >= closureTotalPages" @click="goToClosurePage(closurePage + 1)">Siguiente</button>
                </div>
              </div>
            </div>
          </section>

          <section v-if="currentView === 'audit'" class="space-y-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Eventos</p><p class="mt-3 text-3xl font-black text-slate-800">{{ auditRows.length }}</p><p class="mt-1 text-xs font-bold text-slate-500">Acciones registradas</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Cierres</p><p class="mt-3 text-3xl font-black text-slate-800">{{ closureHistory.length }}</p><p class="mt-1 text-xs font-bold text-slate-500">Cortes locales guardados</p></div>
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ultimo evento</p><p class="mt-3 text-sm font-black text-slate-800">{{ auditRows[0]?.action || 'Sin actividad' }}</p><p class="mt-1 text-xs font-bold text-slate-500">{{ auditRows[0] ? formatDate(auditRows[0].createdAt) : 'Pendiente' }}</p></div>
            </div>

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-4">
                <h3 class="mb-4 text-sm font-black text-slate-800">Resumen de acciones</h3>
                <div class="space-y-3">
                  <div v-for="row in auditSummaryRows" :key="row.label" class="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <p class="text-xs font-black text-slate-700">{{ row.label }}</p>
                    <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-800">{{ row.count }}</span>
                  </div>
                  <div v-if="auditSummaryRows.length === 0" class="rounded-xl bg-slate-50 p-6 text-center text-xs font-bold text-slate-400">Sin acciones registradas.</div>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-8">
                <div class="border-b border-slate-100 p-5">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 class="font-black text-slate-800">Bitacora administrativa</h3>
                      <p class="text-xs font-bold text-slate-500">Cambios de estado, ajustes de zonas y cierres operativos.</p>
                    </div>
                    <select v-model.number="auditPageSize" class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black outline-none focus:border-brand-500">
                      <option v-for="size in recordPageSizeOptions" :key="`audit-${size}`" :value="size">{{ size }} por pagina</option>
                    </select>
                  </div>
                </div>
                <div class="divide-y divide-slate-100">
                  <div v-for="entry in paginatedAuditRows" :key="entry.id" class="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="rounded-full px-3 py-1 text-[10px] font-black uppercase" :class="entry.tone === 'success' ? 'bg-emerald-100 text-emerald-700' : entry.tone === 'danger' ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-brand-600'">{{ entry.action }}</span>
                        <p class="text-xs font-bold text-slate-400">{{ entry.tenantName }}</p>
                      </div>
                      <p class="mt-2 text-sm font-bold text-slate-700">{{ entry.detail }}</p>
                      <p class="mt-1 text-xs font-bold text-slate-400">{{ entry.userName }} - {{ entry.userEmail || 'sin correo' }}</p>
                    </div>
                    <p class="shrink-0 text-xs font-black text-slate-400">{{ formatDate(entry.createdAt) }}</p>
                  </div>
                  <div v-if="auditRows.length === 0" class="p-12 text-center text-sm font-bold text-slate-400">La auditoria empezara a llenarse cuando cambies estados, zonas o cierres.</div>
                </div>
                <div v-if="auditRows.length > 0" class="admin-pagination">
                  <p>Mostrando {{ auditPageStart }}-{{ auditPageEnd }} de {{ auditPaginationTotal }} eventos</p>
                  <div class="admin-pagination-actions">
                    <button type="button" :disabled="auditPage <= 1" @click="goToAuditPage(auditPage - 1)">Anterior</button>
                    <button v-for="page in visibleAuditPages" :key="`audit-page-${page}`" type="button" :class="{ 'is-active': page === auditPage }" @click="goToAuditPage(page)">{{ page }}</button>
                    <button type="button" :disabled="auditPage >= auditTotalPages" @click="goToAuditPage(auditPage + 1)">Siguiente</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-if="currentView === 'settings'" class="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div class="border-b border-slate-100 p-6"><h3 class="font-black text-slate-800">Estado del Sistema</h3><p class="text-xs font-bold text-slate-500">Resumen real de la integracion actual de FoodRush.</p></div>
            <div class="space-y-6 p-6">
              <div><label class="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Usuario actual</label><input :value="session.userName || session.userEmail || 'Sin sesión'" readonly type="text" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"></div>
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

.admin-shell {
  --admin-bg: #f6f7fb;
  --admin-surface: rgba(255, 255, 255, 0.94);
  --admin-surface-soft: #f8fafc;
  --admin-line: rgba(226, 232, 240, 0.92);
  --admin-text: #0f172a;
  --admin-muted: #64748b;
  --admin-sidebar: #0f172a;
  --admin-sidebar-deep: #080f1f;
  --admin-sidebar-line: rgba(148, 163, 184, 0.16);
  --admin-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  --admin-shadow-soft: 0 10px 28px rgba(15, 23, 42, 0.06);
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.08), transparent 28rem),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.08), transparent 28rem),
    var(--admin-bg);
  color: var(--admin-text);
  min-height: 100dvh;
}

.admin-shell.admin-dark {
  color-scheme: dark;
  --admin-bg: #070b14;
  --admin-surface: rgba(15, 23, 42, 0.94);
  --admin-surface-soft: #111827;
  --admin-line: rgba(71, 85, 105, 0.72);
  --admin-text: #e5e7eb;
  --admin-muted: #94a3b8;
  --admin-sidebar: #050816;
  --admin-sidebar-deep: #020617;
  --admin-sidebar-line: rgba(148, 163, 184, 0.14);
  --admin-shadow: 0 22px 55px rgba(0, 0, 0, 0.34);
  --admin-shadow-soft: 0 14px 34px rgba(0, 0, 0, 0.26);
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.18), transparent 26rem),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.12), transparent 30rem),
    var(--admin-bg);
}

.admin-sidebar {
  background:
    linear-gradient(180deg, var(--admin-sidebar), var(--admin-sidebar-deep)),
    var(--admin-sidebar);
  border-right: 1px solid var(--admin-sidebar-line);
  box-shadow: 18px 0 45px rgba(2, 6, 23, 0.18);
}

.admin-sidebar-header,
.admin-sidebar-footer {
  border-color: var(--admin-sidebar-line);
  background: rgba(2, 6, 23, 0.32);
  backdrop-filter: blur(16px);
}

.admin-sidebar-scroll,
.admin-main {
  overscroll-behavior: contain;
  scrollbar-color: rgba(148, 163, 184, 0.55) transparent;
  scrollbar-width: thin;
}

.admin-sidebar-scroll::-webkit-scrollbar,
.admin-main::-webkit-scrollbar {
  width: 0.7rem;
}

.admin-sidebar-scroll::-webkit-scrollbar-track,
.admin-main::-webkit-scrollbar-track {
  background: transparent;
}

.admin-sidebar-scroll::-webkit-scrollbar-thumb,
.admin-main::-webkit-scrollbar-thumb {
  border: 0.18rem solid transparent;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.56);
  background-clip: content-box;
}

.admin-sidebar-scroll::-webkit-scrollbar-thumb:hover,
.admin-main::-webkit-scrollbar-thumb:hover {
  background: rgba(249, 115, 22, 0.76);
  background-clip: content-box;
}

.admin-brand-mark {
  letter-spacing: 0;
}

.admin-menu-label {
  color: rgba(148, 163, 184, 0.76);
}

.admin-menu-button {
  position: relative;
  overflow: hidden;
  min-height: 46px;
}

.admin-menu-button::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), transparent);
  transition: opacity 180ms ease;
}

.admin-menu-button:hover::after,
.admin-menu-active::after {
  opacity: 1;
}

.admin-menu-button:hover {
  transform: translateX(2px);
}

.admin-menu-icon {
  background: rgba(148, 163, 184, 0.10);
  color: currentColor;
}

.admin-menu-active .admin-menu-icon {
  background: rgba(255, 255, 255, 0.20);
}

.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-color: var(--admin-line);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(18px);
}

.admin-dark .admin-topbar {
  background: rgba(15, 23, 42, 0.86);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.26);
}

.admin-mobile-nav {
  position: sticky;
  top: 0;
  z-index: 25;
  border-color: var(--admin-line);
  background: var(--admin-surface);
  backdrop-filter: blur(18px);
}

.admin-main {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 12rem),
    transparent;
}

.admin-chart-shell {
  border: 1px solid var(--admin-line);
  background: var(--admin-surface-soft);
  overflow: hidden;
}

.admin-weekly-chart {
  display: grid;
  min-height: 17rem;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  align-items: end;
  gap: 0.55rem;
}

.admin-weekly-column {
  display: grid;
  min-width: 0;
  grid-template-rows: minmax(9rem, 1fr) auto auto;
  gap: 0.45rem;
  text-align: center;
}

.admin-weekly-track {
  position: relative;
  display: flex;
  min-height: 9rem;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.05));
}

.admin-weekly-track::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(180deg, transparent 24%, rgba(148, 163, 184, 0.12) 25%, transparent 26%),
    linear-gradient(180deg, transparent 49%, rgba(148, 163, 184, 0.12) 50%, transparent 51%),
    linear-gradient(180deg, transparent 74%, rgba(148, 163, 184, 0.12) 75%, transparent 76%);
  opacity: 0.45;
}

.admin-weekly-bar {
  position: relative;
  z-index: 1;
  width: min(100%, 1.35rem);
  min-height: 0.6rem;
  border-radius: 999px 999px 0.4rem 0.4rem;
  background: linear-gradient(180deg, #fbbf24 0%, #f97316 55%, #ea580c 100%);
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.24);
  transition: height 180ms ease;
}

.admin-weekly-bar-empty {
  min-height: 0.35rem;
  background: rgba(148, 163, 184, 0.38);
  box-shadow: none;
}

.admin-weekly-label {
  color: var(--admin-muted);
  font-size: 0.68rem;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}

.admin-weekly-value {
  color: var(--admin-muted);
  font-size: 0.65rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  white-space: nowrap;
}

.admin-filter-control,
.admin-icon-action {
  border-color: var(--admin-line);
}

.admin-command-strip {
  isolation: isolate;
}

.admin-command-tile {
  display: flex;
  min-height: 86px;
  align-items: center;
  gap: 0.875rem;
  border: 1px solid var(--admin-line);
  border-radius: 1rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.52)),
    var(--admin-surface);
  padding: 1rem;
  box-shadow: var(--admin-shadow-soft);
}

.admin-command-tile:hover {
  border-color: rgba(249, 115, 22, 0.42);
  box-shadow: var(--admin-shadow);
  transform: translateY(-2px);
}

.admin-command-icon {
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  font-size: 1rem;
}

.admin-module-card,
.admin-kpi-card,
.admin-data-card,
.admin-order-card {
  border-color: var(--admin-line);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-soft);
}

.admin-module-card:hover,
.admin-kpi-card:hover,
.admin-data-card:hover,
.admin-order-card:hover {
  box-shadow: var(--admin-shadow);
}

.admin-kpi-card {
  position: relative;
  overflow: hidden;
}

.admin-kpi-card::before {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(249, 115, 22, 0.08), transparent 42%),
    radial-gradient(circle at top right, rgba(15, 23, 42, 0.05), transparent 9rem);
}

.admin-kpi-card > * {
  position: relative;
}

.admin-data-card,
.admin-order-card {
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.admin-data-card:hover,
.admin-order-card:hover {
  border-color: rgba(249, 115, 22, 0.28);
  transform: translateY(-1px);
}

.admin-section-kicker {
  color: #ea580c;
  font-size: 0.625rem;
  font-weight: 900;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.admin-quick-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid var(--admin-line);
  border-radius: 0.875rem;
  background: var(--admin-surface-soft);
  padding: 0.75rem 1rem;
  color: var(--admin-text);
  font-size: 0.75rem;
  font-weight: 900;
}

.admin-quick-action:hover {
  border-color: rgba(249, 115, 22, 0.44);
  color: #ea580c;
  box-shadow: 0 12px 26px rgba(249, 115, 22, 0.14);
}

.admin-live-map-shell {
  height: min(62vh, 720px);
  min-height: 30rem;
  overflow: hidden;
  background: var(--admin-surface-soft);
}

.line-clamp-2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;

}

.admin-dark .admin-command-tile {
  background:
    linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.58)),
    var(--admin-surface);
}

.admin-dark .admin-kpi-card::before {
  background:
    linear-gradient(135deg, rgba(249, 115, 22, 0.16), transparent 42%),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.10), transparent 9rem);
}

.admin-enterprise :deep(.rounded-2xl.border.border-slate-100.bg-white),
.admin-enterprise :deep(section.rounded-2xl.border.border-slate-100.bg-white) {
  border-color: var(--admin-line);
  background: var(--admin-surface);
  box-shadow: var(--admin-shadow-soft);
}

.admin-enterprise :deep(.rounded-2xl.border.border-slate-100.bg-white:hover) {
  box-shadow: var(--admin-shadow);
}

.admin-enterprise :deep(button),
.admin-enterprise :deep(input),
.admin-enterprise :deep(select),
.admin-enterprise :deep(textarea) {
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.admin-enterprise :deep(button:not(:disabled):active) {
  transform: translateY(1px);
}

.admin-enterprise :deep(thead tr) {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.92));
}

.admin-enterprise :deep(tbody tr) {
  transition: background-color 150ms ease;
}

.admin-enterprise :deep(tbody tr:hover) {
  background-color: rgba(249, 115, 22, 0.045);
}

.admin-enterprise :deep(.h-2.overflow-hidden.rounded-full.bg-white) {
  background-color: rgba(226, 232, 240, 0.95);
}

.admin-dark :deep(.bg-white) {
  background-color: var(--admin-surface) !important;
}

.admin-dark :deep(.bg-slate-50),
.admin-dark :deep(.bg-slate-100) {
  background-color: var(--admin-surface-soft) !important;
}

.admin-dark :deep(.bg-orange-50),
.admin-dark :deep(.bg-brand-50) {
  background-color: rgba(249, 115, 22, 0.14) !important;
}

.admin-dark :deep(.bg-emerald-50) {
  background-color: rgba(16, 185, 129, 0.14) !important;
}

.admin-dark :deep(.bg-blue-50) {
  background-color: rgba(59, 130, 246, 0.14) !important;
}

.admin-dark :deep(.bg-red-50) {
  background-color: rgba(239, 68, 68, 0.14) !important;
}

.admin-dark :deep(.bg-amber-50) {
  background-color: rgba(245, 158, 11, 0.14) !important;
}

.admin-dark :deep(.border-slate-100),
.admin-dark :deep(.border-slate-200),
.admin-dark :deep(.border-orange-200),
.admin-dark :deep(.border-red-100),
.admin-dark :deep(.border-emerald-100),
.admin-dark :deep(.border-blue-100),
.admin-dark :deep(.border-amber-200) {
  border-color: var(--admin-line) !important;
}

.admin-dark :deep(.text-slate-900),
.admin-dark :deep(.text-slate-800),
.admin-dark :deep(.text-slate-700),
.admin-dark :deep(.text-slate-600) {
  color: var(--admin-text) !important;
}

.admin-dark .admin-data-card,
.admin-dark .admin-order-card,
.admin-dark .admin-module-card,
.admin-dark :deep(.admin-data-card p),
.admin-dark :deep(.admin-order-card p) {
  color: var(--admin-text);
}

.admin-dark :deep(.text-slate-500),
.admin-dark :deep(.text-slate-400) {
  color: var(--admin-muted) !important;
}

.admin-dark :deep(input),
.admin-dark :deep(select),
.admin-dark :deep(textarea) {
  border-color: var(--admin-line) !important;
  background-color: rgba(2, 6, 23, 0.42) !important;
  color: var(--admin-text) !important;
}

.admin-dark :deep(input::placeholder),
.admin-dark :deep(textarea::placeholder) {
  color: rgba(148, 163, 184, 0.72);
}

.admin-dark :deep(option) {
  background-color: #0f172a;
  color: #e5e7eb;
}

.admin-dark :deep(thead tr) {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.92)) !important;
}

.admin-dark :deep(tbody tr:hover) {
  background-color: rgba(249, 115, 22, 0.10) !important;
}

.admin-dark :deep(.h-2.overflow-hidden.rounded-full.bg-white) {
  background-color: rgba(51, 65, 85, 0.82) !important;
}

.admin-dark :deep(.leaflet-container) {
  filter: saturate(0.86) brightness(0.88) contrast(1.04);
}

.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid var(--admin-line);
  padding: 1rem 1.25rem;
  color: var(--admin-muted);
  font-size: 0.75rem;
  font-weight: 800;
}

.admin-pagination-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.admin-pagination-actions button {
  min-height: 2.25rem;
  min-width: 2.25rem;
  border: 1px solid var(--admin-line);
  border-radius: 0.75rem;
  background: var(--admin-surface-soft);
  padding: 0.5rem 0.75rem;
  color: var(--admin-muted);
  font-size: 0.75rem;
  font-weight: 900;
}

.admin-pagination-actions button:hover:not(:disabled) {
  border-color: rgba(249, 115, 22, 0.58);
  color: #ea580c;
}

.admin-pagination-actions button.is-active {
  border-color: #f97316;
  background: #f97316;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(249, 115, 22, 0.22);
}

.admin-pagination-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

@media (max-width: 1023px) {
  .admin-shell {
    overflow-x: hidden;
  }

  .admin-topbar,
  .admin-mobile-nav,
  .admin-main {
    width: 100%;
    max-width: 100%;
  }

  .admin-main {
    min-height: auto;
    overflow: visible;
    overscroll-behavior: auto;
    padding-bottom: calc(2rem + env(safe-area-inset-bottom));
  }

  .admin-topbar,
  .admin-mobile-nav,
  .admin-sidebar-header,
  .admin-sidebar-footer {
    backdrop-filter: none;
  }

  .admin-command-tile,
  .admin-kpi-card,
  .admin-module-card,
  .admin-data-card,
  .admin-order-card {
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  }

  .admin-command-tile:hover,
  .admin-menu-button:hover,
  .admin-data-card:hover,
  .admin-order-card:hover,
  .admin-enterprise :deep(button:not(:disabled):active) {
    transform: none;
  }

  .admin-toolbar,
  .admin-filter-control {
    min-width: 0;
  }

  .admin-pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-pagination-actions {
    justify-content: flex-start;
    width: 100%;
  }
}

@media (max-width: 520px) {
  .admin-live-map-shell {
    height: 28rem;
    min-height: 28rem;
  }

  .admin-weekly-chart {
    min-height: 14.5rem;
    gap: 0.35rem;
  }

  .admin-weekly-column {
    grid-template-rows: minmax(7.25rem, 1fr) auto auto;
    gap: 0.4rem;
  }

  .admin-weekly-track {
    min-height: 7.25rem;
    border-radius: 0.75rem;
  }

  .admin-weekly-bar {
    width: min(100%, 1rem);
  }

  .admin-weekly-label {
    font-size: 0.6rem;
  }

  .admin-weekly-value {
    font-size: 0.56rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-enterprise *,
  .admin-enterprise *::before,
  .admin-enterprise *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
