<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import '@fortawesome/fontawesome-free/css/all.min.css';
import AdminZonesMap from '../components/AdminZonesMap.vue';
import { api } from '../services/api';
import { appendAuditLog, buildClosureSnapshot, createClosureRecordRemote, getAdminZones, getAuditLog, getClosureRecords, loadAdminPhaseTwoState, saveAdminZoneRemote } from '../services/adminPhaseTwo';
import { ORDER_STATUS_CODES, buildTenantHeaders, fetchOperationalDataset, isSessionActive, normalizeStatusKey } from '../services/operations';
import { connectRealtime } from '../services/realtime';
import { APP_EVENTS, clearDeliveryAssignment, clearSession, getSession, updateCachedOrderStatus } from '../services/storage';

const router = useRouter();
const session = getSession();

const currentView = ref('dashboard');
const selectedTenant = ref('Global');
const search = ref({ orders: '', products: '', users: '', franchises: '' });
const orderStatusFilter = ref('all');
const orderDeliveryFilter = ref('all');
const orderPage = ref(1);
const orderPageSize = ref(10);
const isLoading = ref(true);
const isRefreshing = ref(false);
const savingOrderId = ref('');
const errorMessage = ref('');
const phaseTwoMessage = ref('');
const lastUpdatedAt = ref('');
const data = ref({ tenants: [], orders: [], products: [], users: [], connectedUsers: [], sessions: [], warnings: [] });
const operationZones = ref(getAdminZones());
const selectedZoneId = ref(operationZones.value[0]?.id || '');
const zoneDraft = ref({});
const closureRecords = ref(getClosureRecords());
const auditEntries = ref(getAuditLog());
const AUTO_REFRESH_INTERVAL_MS = 20000;
const REALTIME_REFRESH_DEBOUNCE_MS = 1500;
const ADMIN_THEME_STORAGE_KEY = 'foodrush_admin_theme';

const readAdminThemePreference = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === 'dark';
};

const isDarkMode = ref(readAdminThemePreference());

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
      { id: 'zones', name: 'Zonas y Rutas', icon: 'fa-solid fa-route' },
      { id: 'users_fleet', name: 'Personas Conectadas', icon: 'fa-solid fa-users' },
      { id: 'support', name: 'Centro de Alertas', icon: 'fa-solid fa-headset' },
    ],
  },
  {
    name: 'CONTROL OPERATIVO',
    items: [
      { id: 'daily_close', name: 'Cierre Operativo', icon: 'fa-solid fa-cash-register' },
      { id: 'audit', name: 'Auditoria', icon: 'fa-solid fa-clipboard-list' },
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
const orderStatusFilterOptions = [
  { id: 'all', label: 'Todos los estados' },
  ...statusOptions,
];
const orderDeliveryFilterOptions = [
  { id: 'all', label: 'Todos los pedidos' },
  { id: 'assigned', label: 'Con delivery' },
  { id: 'unassigned', label: 'Sin delivery' },
];
const orderPageSizeOptions = [5, 10, 20, 50];
const zonePriorityOptions = ['Alta', 'Media', 'Baja'];
const zoneColorOptions = ['#f97316', '#0f766e', '#2563eb', '#7c3aed', '#dc2626'];

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
const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => value ? new Date(value).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha';

const currentViewTitle = computed(() => {
  for (const group of menuGroups) {
    const found = group.items.find((item) => item.id === currentView.value);
    if (found) return found.name;
  }
  return 'Panel';
});

const viewDescriptions = {
  dashboard: 'Resumen ejecutivo de ventas, operaciones y alertas.',
  orders: 'Recepcion, estados y seguimiento operativo de pedidos.',
  menu: 'Catalogo, precios y disponibilidad por franquicia.',
  franchises_list: 'Locales activos, ventas y rendimiento por franquicia.',
  zones: 'Cobertura, rutas y reglas de entrega por zona.',
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
  return 'Operacion estable';
});

const syncStatusClass = computed(() => {
  if (errorMessage.value) return 'border-red-200 bg-red-50 text-red-600';
  if (isRefreshing.value) return 'border-blue-200 bg-blue-50 text-blue-600';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
});

const toggleAdminTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, isDarkMode.value ? 'dark' : 'light');
  }
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
  const total = orderTotalPages.value;
  const current = orderPage.value;
  const start = Math.max(1, current - 1);
  const end = Math.min(total, start + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
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

const selectedZone = computed(() =>
  operationZones.value.find((zone) => zone.id === selectedZoneId.value) || operationZones.value[0] || null,
);

const toZoneDraft = (zone = {}) => ({
  id: zone.id || '',
  name: zone.name || '',
  center: {
    lat: Number(zone.center?.lat || 0),
    lng: Number(zone.center?.lng || 0),
  },
  radiusKm: Number(zone.radiusKm || 1),
  deliveryFee: Number(zone.deliveryFee || 0),
  etaMin: Number(zone.etaMin || 20),
  priority: zone.priority || 'Media',
  active: zone.active !== false,
  color: zone.color || '#f97316',
  keywordsText: Array.isArray(zone.keywords) ? zone.keywords.join(', ') : '',
  notes: zone.notes || '',
});

zoneDraft.value = toZoneDraft(selectedZone.value || {});

const getZoneOrders = (zone = {}) => {
  const keys = [
    zone.name,
    ...(Array.isArray(zone.keywords) ? zone.keywords : []),
  ].map(normalize).filter(Boolean);

  return scopedOrders.value.filter((order) => {
    const address = normalize(`${order.address} ${order.customerName} ${order.tenantName}`);
    return keys.some((key) => address.includes(key));
  });
};

const zoneCoverageRows = computed(() => operationZones.value.map((zone) => {
  const orders = getZoneOrders(zone);
  const delivered = orders.filter(isDeliveredOrder);
  const active = orders.filter((order) => !isFinalOrder(order));
  const revenue = delivered.reduce((sum, order) => sum + Number(order.totalValue || 0), 0);
  return {
    ...zone,
    ordersCount: orders.length,
    activeCount: active.length,
    deliveredCount: delivered.length,
    revenue,
  };
}));

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

const auditRows = computed(() => (
  selectedTenant.value === 'Global'
    ? auditEntries.value
    : auditEntries.value.filter((entry) => !entry.tenantId || String(entry.tenantId) === String(selectedTenant.value))
));

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
  if (key === 'entregado') return 'bg-green-100 text-green-700';
  if (key === 'cancelado') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

const getMenuBadge = (id) => {
  if (id === 'orders') return pendingOrdersCount.value;
  if (id === 'zones') return operationZones.value.filter((zone) => zone.active === false).length;
  if (id === 'daily_close') return closurePreview.value.activeOrders;
  if (id === 'audit') return auditRows.value.length;
  if (id === 'users_fleet') return connectedUsers.value.length;
  if (id === 'support') return systemAlerts.value.length;
  return 0;
};

const goToOrderPage = (page) => {
  const nextPage = Number(page);
  if (!Number.isFinite(nextPage)) return;
  orderPage.value = Math.min(Math.max(1, nextPage), orderTotalPages.value);
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

const selectZone = (zoneId) => {
  selectedZoneId.value = zoneId;
};

const resetZoneDraft = () => {
  zoneDraft.value = toZoneDraft(selectedZone.value || {});
};

const saveZone = async () => {
  const draft = zoneDraft.value;
  const saved = await saveAdminZoneRemote({
    ...draft,
    center: {
      lat: Number(draft.center?.lat),
      lng: Number(draft.center?.lng),
    },
    keywords: String(draft.keywordsText || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  });

  selectedZoneId.value = saved.id;
  phaseTwoMessage.value = `Zona ${saved.name} guardada para operaciones.`;
  appendAuditLog({
    action: 'Zona actualizada',
    detail: `${saved.name}: ${saved.radiusKm} km, envio ${formatCurrency(saved.deliveryFee)}, ETA ${saved.etaMin} min.`,
    tenantId: selectedTenant.value === 'Global' ? '' : selectedTenant.value,
    tenantName: selectedTenantName.value,
    tone: 'info',
    metadata: { zoneId: saved.id },
  }, {
    syncRemote: false,
  });
  await refreshPhaseTwoState({ remote: true });
  resetZoneDraft();
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

watch(selectedZoneId, () => {
  resetZoneDraft();
});

watch(orderTotalPages, (totalPages) => {
  if (orderPage.value > totalPages) orderPage.value = totalPages;
});

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
  <div class="admin-enterprise admin-shell flex min-h-screen w-full text-slate-800 antialiased" :class="{ 'admin-dark': isDarkMode }">
    <aside class="admin-sidebar hide-scrollbar hidden w-72 shrink-0 flex-col overflow-y-auto text-white lg:flex">
      <div class="admin-sidebar-header sticky top-0 z-10 flex h-16 items-center border-b px-6">
        <div class="admin-brand-mark flex items-center gap-3 text-xl text-brand-500">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
            <i class="fa-solid fa-layer-group"></i>
          </span>
          <h1 class="font-black tracking-wide text-white">Food<span class="text-brand-500">Rush</span></h1>
        </div>
      </div>

      <div class="flex-1 p-4">
        <div v-for="group in menuGroups" :key="group.name" class="mb-6">
          <p class="admin-menu-label mb-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{{ group.name }}</p>
          <nav class="space-y-1.5">
            <button v-for="menu in group.items" :key="menu.id" type="button" class="admin-menu-button flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all" :class="currentView === menu.id ? 'admin-menu-active bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'" @click="currentView = menu.id">
              <span class="admin-menu-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <i :class="`${menu.icon} text-base`"></i>
              </span>
              <span class="min-w-0 flex-1 truncate">{{ menu.name }}</span>
              <span v-if="getMenuBadge(menu.id) > 0" class="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{{ getMenuBadge(menu.id) }}</span>
            </button>
          </nav>
        </div>
      </div>

      <div class="admin-sidebar-footer mt-auto border-t p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-bold shadow-inner">{{ (session.userName || 'AD').slice(0, 2).toUpperCase() }}</div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-white">{{ session.userName || 'Admin Principal' }}</p>
            <p class="truncate text-[10px] font-bold uppercase text-brand-500">{{ session.userEmail || 'Superusuario' }}</p>
          </div>
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Cerrar sesion" @click="logout"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="admin-topbar flex min-h-16 flex-col gap-4 border-b px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">FoodRush Admin</span>
              <span class="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider" :class="syncStatusClass">
                <i class="fa-solid fa-circle mr-1 text-[7px]"></i>{{ syncStatusLabel }}
              </span>
            </div>
            <h2 class="truncate text-2xl font-black text-slate-900">{{ currentViewTitle }}</h2>
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

      <main class="admin-main hide-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
        <div v-if="errorMessage" class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{{ errorMessage }}</div>
        <div v-if="phaseTwoMessage" class="mb-5 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <span><i class="fa-solid fa-circle-check mr-2"></i>{{ phaseTwoMessage }}</span>
          <button type="button" class="text-emerald-500 hover:text-emerald-700" @click="phaseTwoMessage = ''"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div v-if="isLoading" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div v-for="card in 8" :key="card" class="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm"></div>
        </div>

        <template v-else>
          <section v-show="currentView === 'dashboard'" class="space-y-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div v-for="card in dashboardKpis" :key="card.label" class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
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

            <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-7">
                <h3 class="mb-4 text-sm font-black text-slate-800">Rendimiento Semanal (Ventas)</h3>
                <div class="flex h-64 items-end gap-3 rounded-2xl bg-slate-50 p-4">
                  <div v-for="day in weeklySales" :key="day.key" class="flex flex-1 flex-col items-center gap-2">
                    <div class="flex h-full w-full items-end"><div class="w-full rounded-t-xl bg-gradient-to-t from-brand-600 to-brand-500" :style="{ height: day.height }"></div></div>
                    <p class="text-[10px] font-black uppercase text-slate-500">{{ day.label }}</p>
                    <p class="text-[10px] font-bold text-slate-400">{{ formatCurrency(day.amount) }}</p>
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
                <h3 class="mb-4 text-sm font-black text-slate-800">Operacion Delivery</h3>
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

          <section v-show="currentView === 'orders'" class="rounded-2xl border border-slate-100 bg-white shadow-sm">
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
            <div class="overflow-x-auto">
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

          <section v-show="currentView === 'zones'" class="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div class="space-y-6 xl:col-span-7">
              <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div class="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 class="font-black text-slate-800">Editor de Zonas y Rutas</h3>
                    <p class="text-xs font-bold text-slate-500">Cobertura operativa de delivery sobre OpenStreetMap.</p>
                  </div>
                  <span class="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase text-brand-600">{{ selectedTenantName }}</span>
                </div>
                <div class="h-[420px]">
                  <AdminZonesMap :zones="operationZones" :selected-zone-id="selectedZoneId" @select-zone="selectZone" />
                </div>
              </div>

              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 class="mb-4 text-sm font-black text-slate-800">Ajustar zona seleccionada</h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label class="block sm:col-span-2">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Nombre</span>
                    <input v-model="zoneDraft.name" type="text" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Latitud</span>
                    <input v-model.number="zoneDraft.center.lat" type="number" step="0.0001" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Longitud</span>
                    <input v-model.number="zoneDraft.center.lng" type="number" step="0.0001" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Radio km</span>
                    <input v-model.number="zoneDraft.radiusKm" type="number" min="0.5" step="0.1" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Envio</span>
                    <input v-model.number="zoneDraft.deliveryFee" type="number" min="0" step="5" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">ETA min</span>
                    <input v-model.number="zoneDraft.etaMin" type="number" min="5" step="1" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Prioridad</span>
                    <select v-model="zoneDraft.priority" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                      <option v-for="priority in zonePriorityOptions" :key="priority" :value="priority">{{ priority }}</option>
                    </select>
                  </label>
                  <label class="block sm:col-span-2">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Palabras clave de direccion</span>
                    <input v-model="zoneDraft.keywordsText" type="text" placeholder="gurabo, villa olga..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Color</span>
                    <select v-model="zoneDraft.color" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500">
                      <option v-for="color in zoneColorOptions" :key="color" :value="color">{{ color }}</option>
                    </select>
                  </label>
                  <label class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-600">
                    <input v-model="zoneDraft.active" type="checkbox" class="h-4 w-4 accent-orange-500">
                    Zona activa
                  </label>
                  <label class="block sm:col-span-2">
                    <span class="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Notas operativas</span>
                    <textarea v-model="zoneDraft.notes" rows="3" class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-brand-500"></textarea>
                  </label>
                </div>
                <div class="mt-4 flex flex-wrap justify-end gap-2">
                  <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-500 hover:border-brand-500 hover:text-brand-600" @click="resetZoneDraft">REVERTIR</button>
                  <button type="button" class="rounded-lg bg-brand-500 px-5 py-2 text-xs font-black text-white" @click="saveZone">GUARDAR ZONA</button>
                </div>
              </div>
            </div>

            <div class="space-y-6 xl:col-span-5">
              <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-black text-slate-800">Zonas activas</h3>
                    <p class="text-xs font-bold text-slate-400">Pedidos detectados por direccion.</p>
                  </div>
                  <p class="text-2xl font-black text-slate-800">{{ operationZones.filter((zone) => zone.active).length }}</p>
                </div>
                <div class="space-y-3">
                  <button v-for="zone in zoneCoverageRows" :key="zone.id" type="button" class="w-full rounded-xl border p-4 text-left transition" :class="selectedZoneId === zone.id ? 'border-brand-500 bg-orange-50' : 'border-slate-100 bg-slate-50 hover:border-orange-200'" @click="selectZone(zone.id)">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-black text-slate-800">{{ zone.name }}</p>
                        <p class="mt-1 text-[10px] font-bold uppercase text-slate-400">{{ zone.radiusKm }} km - ETA {{ zone.etaMin }} min - {{ formatCurrency(zone.deliveryFee) }}</p>
                      </div>
                      <span class="rounded-full px-3 py-1 text-[10px] font-black" :class="zone.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'">{{ zone.active ? 'Activa' : 'Pausada' }}</span>
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div class="rounded-lg bg-white p-2"><p class="text-[10px] font-black text-slate-400">Pedidos</p><p class="text-sm font-black text-slate-800">{{ zone.ordersCount }}</p></div>
                      <div class="rounded-lg bg-white p-2"><p class="text-[10px] font-black text-slate-400">Activos</p><p class="text-sm font-black text-slate-800">{{ zone.activeCount }}</p></div>
                      <div class="rounded-lg bg-white p-2"><p class="text-[10px] font-black text-slate-400">Ventas</p><p class="text-sm font-black text-slate-800">{{ formatCurrency(zone.revenue) }}</p></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section v-show="currentView === 'daily_close'" class="space-y-6">
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
                <h3 class="font-black text-slate-800">Historial de cierres</h3>
                <p class="text-xs font-bold text-slate-500">Ultimos cortes generados desde este navegador administrativo.</p>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-[860px] w-full text-left">
                  <thead><tr class="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500"><th class="p-4 pl-6">Fecha</th><th class="p-4">Alcance</th><th class="p-4">Ventas</th><th class="p-4">Entregados</th><th class="p-4">Activos</th><th class="p-4 pr-6">Zonas</th></tr></thead>
                  <tbody class="text-sm">
                    <tr v-for="record in closureHistory" :key="record.id" class="border-b border-slate-50">
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
            </div>
          </section>

          <section v-show="currentView === 'audit'" class="space-y-6">
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
                  <h3 class="font-black text-slate-800">Bitacora administrativa</h3>
                  <p class="text-xs font-bold text-slate-500">Cambios de estado, ajustes de zonas y cierres operativos.</p>
                </div>
                <div class="divide-y divide-slate-100">
                  <div v-for="entry in auditRows" :key="entry.id" class="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
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

.admin-filter-control,
.admin-icon-action {
  border-color: var(--admin-line);
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
