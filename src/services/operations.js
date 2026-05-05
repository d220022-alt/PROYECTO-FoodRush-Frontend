/*
  Guia rapida para presentar:
  Une datos reales del backend con datos QA para que Admin, Delivery y Tracking hablen el mismo idioma.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { api } from './api';
import { getDeliveryAssignment, getSession } from './storage';
import { enrichOperationalDatasetWithQaData } from '../data/qaOperationalDataset';
import { franchiseConfigs } from '../views/franchiseConfigs';
import { resolveDeliveryCode } from '../utils/deliveryCode';

// Estados compartidos entre pantallas. Si cambian en la DB, este mapa ayuda a mantener la UI coherente.
export const ORDER_STATUS_IDS = {
  pending: 1,
  confirmed: 2,
  preparing: 3,
  inTransit: 4,
  delivered: 5,
  cancelled: 6,
};

export const ORDER_STATUS_CODES = {
  pending: 'pendiente',
  preparing: 'preparando',
  inTransit: 'en camino',
  delivered: 'entregado',
  cancelled: 'cancelado',
};

export const ORDER_STATUS_LABELS = {
  1: 'Pendiente de confirmacion',
  2: 'Pedido confirmado por el restaurante',
  3: 'Pedido en preparación',
  4: 'Pedido en camino',
  5: 'Pedido entregado',
  6: 'Pedido cancelado',
};

const STATUS_VARIANTS = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  preparando: 'bg-sky-50 text-sky-700 border-sky-200',
  'en camino': 'bg-violet-50 text-violet-700 border-violet-200',
  entregado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_ORDER = {
  pendiente: 0,
  preparando: 1,
  'en camino': 2,
  entregado: 3,
  cancelado: 4,
};

const FALLBACK_COLORS = ['#ea580c', '#0f766e', '#2563eb', '#b45309', '#7c3aed'];

const franchiseMetaByTenantId = new Map(
  Object.values(franchiseConfigs).map((config, index) => [
    String(config.tenantId),
    {
      slug: config.slug,
      name: config.name,
      logo: config.logo,
      primary: config.primary || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      accent: config.accent || '#fff7ed',
      background: config.background || '#fffaf5',
    },
  ]),
);

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
};

const normalizeText = (value = '') =>
  safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .toLowerCase();

export const normalizeStatusKey = (value = '') => {
  const rawValue = safeText(value);
  const numericValue = Number.parseInt(rawValue, 10);
  if (Number.isFinite(numericValue) && rawValue === String(numericValue) && ORDER_STATUS_LABELS[numericValue]) {
    return normalizeStatusKey(ORDER_STATUS_LABELS[numericValue]);
  }

  const normalized = normalizeText(rawValue);
  if (!normalized) return 'pendiente';
  if (normalized.includes('cancel')) return 'cancelado';
  if (normalized.includes('entreg')) return 'entregado';
  if (normalized.includes('transito') || normalized.includes('camino') || normalized.includes('ruta') || normalized.includes('shipping')) return 'en camino';
  if (normalized.includes('pend') || normalized.includes('recib') || normalized.includes('solicit')) return 'pendiente';
  if (normalized.includes('prepar') || normalized.includes('confirm')) return 'preparando';
  return normalized;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dedupeBy = (items = [], getKey) => {
  const seen = new Set();
  const deduped = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
};

export const buildTenantHeaders = (tenantId) =>
  tenantId ? { 'X-Tenant-ID': String(tenantId) } : {};

const buildFallbackTenantsFromConfigs = () =>
  Object.values(franchiseConfigs).map((config, index) =>
    normalizeTenant(
      {
        id: config.tenantId || index + 1,
        codigo: config.slug || `tenant-${index + 1}`,
        nombre: config.name || `Franquicia ${index + 1}`,
        activo: true,
      },
      index,
    ),
  );

export const getStatusLabel = (order = {}) => {
  const statusId = Number.parseInt(order?.estado_id ?? order?.estado?.id, 10);
  const explicit = safeText(order?.statusLabel || order?.status || order?.estado?.descripcion || order?.estado);
  const explicitKey = normalizeStatusKey(explicit);
  const statusIdLabel = ORDER_STATUS_LABELS[statusId];
  const statusIdKey = statusIdLabel ? normalizeStatusKey(statusIdLabel) : '';

  if (statusId === ORDER_STATUS_IDS.pending && explicitKey === 'pendiente') {
    return ORDER_STATUS_LABELS[ORDER_STATUS_IDS.pending];
  }

  if (statusIdLabel && statusId !== ORDER_STATUS_IDS.pending) {
    if (!explicit || explicitKey === 'pendiente' || explicitKey !== statusIdKey) {
      return statusIdLabel;
    }
  }

  if (explicit) return explicit;

  return statusIdLabel || 'Pendiente';
};

const getStatusKey = (label = '') => normalizeStatusKey(label || 'Pendiente');

export const getStatusVariant = (label = '') =>
  STATUS_VARIANTS[getStatusKey(label)] || 'bg-slate-50 text-slate-700 border-slate-200';

export const getOrderProgressStep = (label = '') => {
  const statusKey = getStatusKey(label);
  if (statusKey === 'cancelado') return 0;
  if (statusKey === 'entregado') return 4;
  if (statusKey === 'en camino') return 3;
  if (statusKey === 'preparando') return 2;
  return 1;
};

export const isSessionActive = (session = {}) => {
  const expiresAt = safeText(session.expiracion);
  if (!expiresAt) return true;

  const expirationMs = new Date(expiresAt).getTime();
  return Number.isFinite(expirationMs) && expirationMs > Date.now();
};

// Normaliza franquicias para que Admin, Delivery y Tracking reciban los mismos nombres y colores.
export const normalizeTenant = (tenant = {}, index = 0) => {
  const id = safeText(tenant.id, `tenant-${index + 1}`);
  const meta = franchiseMetaByTenantId.get(id) || {};

  return {
    id,
    name: safeText(tenant.nombre, meta.name || `Franquicia ${id}`),
    code: safeText(tenant.codigo, meta.slug || `tenant-${id}`),
    active: tenant.activo !== false,
    logo: meta.logo || '',
    primary: meta.primary || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    accent: meta.accent || '#fff7ed',
    background: meta.background || '#fffaf5',
    slug: meta.slug || '',
    raw: tenant,
  };
};

// Producto enriquecido con datos de franquicia; Admin usa esto para filtros y tarjetas de catalogo.
const normalizeProduct = (product = {}, tenant) => ({
  ...product,
  tenantId: safeText(tenant.id),
  tenantName: tenant.name,
  tenantLogo: tenant.logo,
  tenantPrimary: tenant.primary,
  categoryLabel: safeText(product.category || product.categoria?.nombre, 'General'),
  priceValue: toNumber(product.precio ?? product.price),
  isActive: product.activo !== false,
});

const normalizeUser = (user = {}, tenant, connectedUserKeys) => {
  const tenantId = safeText(tenant.id);
  const userId = safeText(user.id);

  return {
    ...user,
    id: userId,
    tenantId,
    tenantName: tenant.name,
    tenantLogo: tenant.logo,
    name: safeText(user.nombre || user.name, 'Usuario sin nombre'),
    email: safeText(user.correo || user.email),
    phone: safeText(user.telefono || user.phone),
    roleLabel: safeText(user.rol || user.rol_nombre || user.role, 'Usuario'),
    isConnected: connectedUserKeys.has(`${tenantId}:${userId}`),
  };
};

const normalizeSession = (session = {}, tenant) => {
  const tenantId = safeText(tenant.id);
  const userId = safeText(session.usuario_id || session.user_id);
  const createdAt = safeText(session.creado_en || session.created_at || session.createdAt);
  const expiresAt = safeText(session.expiracion || session.expires_at || session.expiresAt);

  return {
    ...session,
    id: safeText(session.id, `${tenantId}:${userId}:${createdAt || 'session'}`),
    tenantId,
    tenantName: tenant.name,
    userId,
    createdAt: createdAt || new Date().toISOString(),
    expiresAt,
    ipAddress: safeText(session.ip || session.ip_address),
    userAgent: safeText(session.user_agent || session.userAgent),
    isActive: isSessionActive({ expiracion: expiresAt }),
  };
};

const buildItemsByOrderId = (orderItems = [], validOrderIds = new Set()) => {
  const grouped = new Map();

  orderItems.forEach((item) => {
    const orderId = safeText(item.pedido_id || item.pedidoId);
    if (!orderId || (validOrderIds.size > 0 && !validOrderIds.has(orderId))) return;

    const current = grouped.get(orderId) || [];
    current.push(item);
    grouped.set(orderId, current);
  });

  return grouped;
};

const buildProductsMap = (products = []) =>
  new Map(
    products.map((product) => [
      safeText(product.id),
      {
        id: safeText(product.id),
        name: safeText(product.nombre || product.name, 'Producto'),
        price: toNumber(product.precio ?? product.price),
      },
    ]),
  );

const buildClientsMap = (clients = []) =>
  new Map(
    clients.map((client) => [
      safeText(client.id),
      {
        id: safeText(client.id),
        name: safeText(client.nombre || client.name, 'Cliente'),
        phone: safeText(client.telefono || client.phone),
        email: safeText(client.correo || client.email),
        address: safeText(client.direccion || client.address),
      },
    ]),
  );

const buildAssignmentsByOrderId = (assignments = []) =>
  new Map(
    assignments
      .filter((assignment) => !['released', 'liberado'].includes(safeText(assignment.status || assignment.estado).toLowerCase()))
      .map((assignment) => [
        safeText(assignment.orderId || assignment.pedido_id),
        {
          orderId: safeText(assignment.orderId || assignment.pedido_id),
          tenantId: safeText(assignment.tenantId || assignment.tenant_id),
          driverId: safeText(assignment.driverId || assignment.repartidor_id),
          repartidor_id: safeText(assignment.repartidor_id || assignment.driverId),
          driverName: safeText(assignment.driverName || assignment.repartidor_nombre, 'Repartidor FoodRush'),
          driverEmail: safeText(assignment.driverEmail || assignment.repartidor_email),
          status: safeText(assignment.status || assignment.estado, 'accepted'),
          stage: safeText(assignment.stage || assignment.status, 'accepted'),
          assignedAt: safeText(assignment.assignedAt || assignment.asignado_en),
          updatedAt: safeText(assignment.updatedAt),
        },
      ]),
  );

// Convertimos pedidos de varias fuentes al mismo formato para que Admin, Delivery y Tracking no dupliquen reglas.
const normalizeOrder = (order = {}, tenant, itemsByOrderId, productsMap, clientsMap, assignmentsByOrderId) => {
  const id = safeText(order.id);
  const statusLabel = getStatusLabel(order);
  const statusKey = getStatusKey(order.estado?.codigo || order.statusKey || order.status_key || statusLabel);
  const explicitItems = Array.isArray(order.items) ? order.items : [];
  const itemCandidates = dedupeBy(
    [...(itemsByOrderId.get(id) || []), ...explicitItems],
    (item, index) => safeText(item.id, `${safeText(item.producto_id || item.productId || item.producto?.id)}:${index}`),
  );

  const relatedItems = itemCandidates.map((item, index) => {
    const productId = safeText(item.producto_id || item.productoId);
    const product = productsMap.get(productId) || {
      id: productId,
      name: safeText(item.producto?.nombre || item.product?.name),
      price: toNumber(item.producto?.precio ?? item.product?.price),
    };
    const quantity = toNumber(item.cantidad ?? item.qty, 1);
    const unitPrice = toNumber(item.precio_unitario ?? item.price ?? product?.price, 0);

    return {
      id: safeText(item.id, `${id}-item-${index + 1}`),
      productId,
      name: safeText(item.nombre || item.name || product?.name, 'Producto'),
      quantity,
      unitPrice,
      subtotal: toNumber(item.subtotal, unitPrice * quantity),
    };
  });

  const customerId = safeText(order.cliente_id || order.cliente?.id);
  const customerFromOrder = order.cliente
    ? {
        name: safeText(order.cliente.nombre || order.cliente.name),
        phone: safeText(order.cliente.telefono || order.cliente.phone),
        email: safeText(order.cliente.correo || order.cliente.email),
      }
    : null;
  const customer = clientsMap.get(customerId) || customerFromOrder || {};
  const deliveryAssignment = assignmentsByOrderId.get(id) || getDeliveryAssignment(id);

  return {
    ...order,
    id,
    tenantId: safeText(tenant.id),
    tenantName: tenant.name,
    tenantLogo: tenant.logo,
    tenantPrimary: tenant.primary,
    customerId,
    customerName: safeText(customer.name, 'Cliente sin nombre'),
    customerPhone: safeText(customer.phone, 'Sin telefono'),
    customerEmail: safeText(customer.email),
    address: safeText(order.direccion_entrega || customer.address, 'Recogida en tienda'),
    notes: safeText(order.notas),
    paymentMethod: safeText(order.metodo_pago),
    totalValue: toNumber(order.total),
    createdAt: safeText(order.creado_en || order.createdAt, new Date().toISOString()),
    statusId: Number.parseInt(order.estado_id ?? order.estado?.id, 10) || ORDER_STATUS_IDS.pending,
    statusLabel,
    statusKey,
    statusVariant: getStatusVariant(statusLabel),
    progressStep: getOrderProgressStep(statusLabel),
    securityCode: resolveDeliveryCode(order, id),
    driverName: safeText(order.repartidor?.nombre || order.repartidor_nombre || order.driverName || deliveryAssignment?.driverName),
    driverEmail: safeText(order.repartidor_email || order.driverEmail || deliveryAssignment?.driverEmail),
    deliveryAssignment,
    itemsDetailed: relatedItems,
    itemCount: relatedItems.reduce((total, item) => total + item.quantity, 0),
    itemSummary: relatedItems.length
      ? relatedItems.map((item) => `${item.quantity}x ${item.name}`).join(', ')
      : 'Sin detalle de productos en el backend',
  };
};

const collectResultOrDefault = (result, fallback = []) =>
  result.status === 'fulfilled' && result.value?.success !== false ? result.value.data || fallback : fallback;

const collectWarning = (warnings, result, fallbackLabel) => {
  if (result.status === 'rejected') {
    warnings.push(`${fallbackLabel}: ${result.reason?.message || 'No disponible'}`);
  } else if (result.value?.success === false) {
    warnings.push(`${fallbackLabel}: ${result.value?.message || 'No disponible'}`);
  }
};

async function fetchTenantSlice(tenant, connectedUserKeys) {
  const headers = buildTenantHeaders(tenant.id);
  const warnings = [];

  const [ordersResult, productsResult, usersResult, clientsResult, orderItemsResult, assignmentsResult] = await Promise.allSettled([
    api.getOrders({}, headers),
    api.getProducts({ limite: 200 }, headers),
    api.getUsers({}, headers),
    api.getClients({}, headers),
    api.getOrderItems({}, headers),
    api.getDeliveryAssignments({}, headers),
  ]);

  collectWarning(warnings, ordersResult, `Pedidos ${tenant.name}`);
  collectWarning(warnings, productsResult, `Productos ${tenant.name}`);
  collectWarning(warnings, usersResult, `Usuarios ${tenant.name}`);
  collectWarning(warnings, clientsResult, `Clientes ${tenant.name}`);
  collectWarning(warnings, orderItemsResult, `Detalle de pedidos ${tenant.name}`);
  collectWarning(warnings, assignmentsResult, `Delivery ${tenant.name}`);

  const products = collectResultOrDefault(productsResult).map((product) => normalizeProduct(product, tenant));
  const users = collectResultOrDefault(usersResult).map((user) => normalizeUser(user, tenant, connectedUserKeys));
  const clients = collectResultOrDefault(clientsResult);
  const rawOrders = collectResultOrDefault(ordersResult);
  const orderIds = new Set(rawOrders.map((order) => safeText(order.id)));
  const orderItems = collectResultOrDefault(orderItemsResult).filter((item) =>
    orderIds.has(safeText(item.pedido_id || item.pedidoId)),
  );

  const productsMap = buildProductsMap(products);
  const clientsMap = buildClientsMap(clients);
  const itemsByOrderId = buildItemsByOrderId(orderItems, orderIds);
  const assignmentsByOrderId = buildAssignmentsByOrderId(collectResultOrDefault(assignmentsResult));

  const orders = rawOrders
    .map((order) => normalizeOrder(order, tenant, itemsByOrderId, productsMap, clientsMap, assignmentsByOrderId))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return {
    tenant,
    orders,
    products,
    users,
    warnings,
  };
}

// Esta funcion es el tablero de control: junta backend, cache local y datos QA en una sola respuesta.
export async function fetchOperationalDataset({ selectedTenantId = 'Global', includeSessions = true } = {}) {
  const warnings = [];
  let tenants = [];

  try {
    const tenantsResponse = await api.getFranchises();
    tenants = (tenantsResponse?.data || []).map((tenant, index) => normalizeTenant(tenant, index));
  } catch (error) {
    warnings.push(`Franquicias: ${error.message || 'No disponible'}`);
    tenants = buildFallbackTenantsFromConfigs();
  }
  const sessionTenantId = safeText(getSession().tenantId);
  const requestedTenantId = safeText(selectedTenantId, 'Global');
  const effectiveTenantId =
    requestedTenantId === 'Global' && sessionTenantId && tenants.some((tenant) => safeText(tenant.id) === sessionTenantId)
      ? sessionTenantId
      : requestedTenantId;
  const scopedTenants =
    effectiveTenantId === 'Global'
      ? tenants
      : tenants.filter((tenant) => safeText(tenant.id) === effectiveTenantId);

  let sessions = [];
  let connectedUserKeys = new Set();

  if (includeSessions && tenants.length > 0) {
    const sessionTenants = sessionTenantId ? scopedTenants : tenants;
    const sessionResults = await Promise.allSettled(
      sessionTenants.map(async (tenant) => {
        try {
          return {
            tenant,
            response: await api.getSessions({}, buildTenantHeaders(tenant.id)),
          };
        } catch (error) {
          throw Object.assign(error, { tenantName: tenant.name });
        }
      }),
    );

    sessions = sessionResults.flatMap((result) => {
      if (result.status === 'rejected') {
        warnings.push(`Sesiones ${result.reason?.tenantName || 'tenant'}: ${result.reason?.message || 'No disponible'}`);
        return [];
      }

      const { tenant, response } = result.value;
      if (response?.success === false) {
        warnings.push(`Sesiones ${tenant.name}: ${response.message || 'No disponible'}`);
        return [];
      }

      const tenantSessions = Array.isArray(response?.data) ? response.data : [];
      return tenantSessions.map((session) => normalizeSession(session, tenant));
    });

    connectedUserKeys = new Set(
      sessions
        .filter((session) => session.isActive)
        .map((session) => `${safeText(session.tenantId)}:${safeText(session.userId)}`),
    );
  }

  const tenantSlices = await Promise.all(scopedTenants.map((tenant) => fetchTenantSlice(tenant, connectedUserKeys)));

  tenantSlices.forEach((slice) => warnings.push(...slice.warnings));

  const orders = tenantSlices
    .flatMap((slice) => slice.orders)
    .sort((left, right) => {
      const statusDiff = (STATUS_ORDER[left.statusKey] ?? 99) - (STATUS_ORDER[right.statusKey] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  const products = tenantSlices.flatMap((slice) => slice.products);
  const users = dedupeBy(tenantSlices.flatMap((slice) => slice.users), (user) => `${user.tenantId}:${user.id}`);
  const connectedUsers = users.filter((user) => user.isConnected);
  const uniqueSessions = dedupeBy(
    sessions.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    (session) => `${session.tenantId}:${session.userId}:${session.id}`,
  );

  return enrichOperationalDatasetWithQaData({
    tenants,
    scopedTenants,
    requestedTenantId,
    effectiveTenantId,
    orders,
    products,
    users,
    connectedUsers,
    sessions: uniqueSessions,
    warnings: dedupeBy(warnings.filter(Boolean), (warning) => warning),
  });
}
