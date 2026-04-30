import { api } from './api';
import { getDeliveryAssignment } from './storage';
import { franchiseConfigs } from '../views/franchiseConfigs';

export const ORDER_STATUS_IDS = {
  pending: 1,
  preparing: 2,
  inTransit: 3,
  delivered: 4,
  cancelled: 5,
};

export const ORDER_STATUS_LABELS = {
  1: 'Pendiente',
  2: 'Preparando',
  3: 'En camino',
  4: 'Entregado',
  5: 'Cancelado',
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

export const getStatusLabel = (order = {}) => {
  const explicit = safeText(order?.estado?.descripcion || order?.status || order?.estado);
  if (explicit) return explicit;

  const statusId = Number.parseInt(order?.estado_id ?? order?.estado?.id, 10);
  return ORDER_STATUS_LABELS[statusId] || 'Pendiente';
};

const getStatusKey = (label = '') => safeText(label, 'Pendiente').toLowerCase();

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

const normalizeOrder = (order = {}, tenant, itemsByOrderId, productsMap, clientsMap) => {
  const id = safeText(order.id);
  const statusLabel = getStatusLabel(order);
  const statusKey = getStatusKey(statusLabel);
  const relatedItems = (itemsByOrderId.get(id) || []).map((item, index) => {
    const productId = safeText(item.producto_id || item.productoId);
    const product = productsMap.get(productId);
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
  const deliveryAssignment = getDeliveryAssignment(id);

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
    securityCode: safeText(order.codigo_seguridad || order.securityCode),
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

  const [ordersResult, productsResult, usersResult, clientsResult, orderItemsResult] = await Promise.allSettled([
    api.getOrders({}, headers),
    api.getProducts({ limite: 200 }, headers),
    api.getUsers({}, headers),
    api.getClients({}, headers),
    api.getOrderItems({}, headers),
  ]);

  collectWarning(warnings, ordersResult, `Pedidos ${tenant.name}`);
  collectWarning(warnings, productsResult, `Productos ${tenant.name}`);
  collectWarning(warnings, usersResult, `Usuarios ${tenant.name}`);
  collectWarning(warnings, clientsResult, `Clientes ${tenant.name}`);
  collectWarning(warnings, orderItemsResult, `Detalle de pedidos ${tenant.name}`);

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

  const orders = rawOrders
    .map((order) => normalizeOrder(order, tenant, itemsByOrderId, productsMap, clientsMap))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return {
    tenant,
    orders,
    products,
    users,
    warnings,
  };
}

export async function fetchOperationalDataset({ selectedTenantId = 'Global', includeSessions = true } = {}) {
  const warnings = [];
  const tenantsResponse = await api.getFranchises();
  const tenants = (tenantsResponse?.data || []).map((tenant, index) => normalizeTenant(tenant, index));
  const scopedTenants =
    safeText(selectedTenantId, 'Global') === 'Global'
      ? tenants
      : tenants.filter((tenant) => safeText(tenant.id) === safeText(selectedTenantId));

  let sessions = [];
  let connectedUserKeys = new Set();

  if (includeSessions && tenants.length > 0) {
    const sessionResults = await Promise.allSettled(
      tenants.map(async (tenant) => {
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

  return {
    tenants,
    scopedTenants,
    orders,
    products,
    users,
    connectedUsers,
    sessions: uniqueSessions,
    warnings: dedupeBy(warnings.filter(Boolean), (warning) => warning),
  };
}
