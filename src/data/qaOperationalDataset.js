/*
  Guia rapida para presentar:
  Dataset de QA para presentar flujos completos sin depender de que la DB tenga pedidos perfectos.
  Buscar en VS Code: datos QA, pedidos de prueba, graficos, administracion, delivery.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { getDeliveryAssignment } from '../services/storage';

export const QA_DATA_STORAGE_KEY = 'foodrush_qa_data_mode';
export const QA_ORDER_OVERRIDES_KEY = 'foodrush_qa_order_overrides';
export const QA_DATA_CHANGED_EVENT = 'foodrush:qa-data-changed';

const STATUS_META = {
  pendiente: { id: 1, key: 'pendiente', label: 'Pendiente de confirmacion', progressStep: 1 },
  preparando: { id: 3, key: 'preparando', label: 'Pedido en preparacion', progressStep: 2 },
  'en camino': { id: 4, key: 'en camino', label: 'Pedido en camino', progressStep: 3 },
  entregado: { id: 5, key: 'entregado', label: 'Pedido entregado', progressStep: 4 },
  cancelado: { id: 6, key: 'cancelado', label: 'Pedido cancelado', progressStep: 0 },
};

const STATUS_VARIANT = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  preparando: 'bg-sky-50 text-sky-700 border-sky-200',
  'en camino': 'bg-violet-50 text-violet-700 border-violet-200',
  entregado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
};

const SAMPLE_ADDRESSES = [
  'Santiago de los Caballeros, Gurabo, Calle 15',
  'Santiago Centro, Calle del Sol',
  'Villa Olga, Av. Juan Pablo Duarte',
  'Pekin, Santiago, Calle Principal',
  'Los Jardines Metropolitanos, Santiago',
];

const SAMPLE_PRODUCTS = [
  ['Combo firma', 'Menu estrella', 350],
  ['Producto premium', 'Favorito FoodRush', 420],
  ['Bebida especial', 'Bebidas', 160],
  ['Postre de temporada', 'Postres', 220],
  ['Combo familiar', 'Combo familiar', 580],
  ['Menu ejecutivo', 'Almuerzo rapido', 310],
  ['Extra popular', 'Complementos', 95],
  ['Promo express', 'Oferta activa', 260],
  ['Producto de temporada', 'Edicion limitada', 390],
  ['Pack para compartir', 'Grupo FoodRush', 640],
];

const now = () => Date.now();
const hasWindow = () => typeof window !== 'undefined';
const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const normalizeText = (value = '') =>
  safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const dedupeBy = (items = [], getKey) => {
  const seen = new Set();
  const result = [];

  items.forEach((item) => {
    const key = getKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });

  return result;
};

export const isQaDatasetEnabled = () => {
  if (!hasWindow()) return true;
  return window.localStorage.getItem(QA_DATA_STORAGE_KEY) !== 'off';
};

export const setQaDatasetEnabled = (enabled) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(QA_DATA_STORAGE_KEY, enabled ? 'on' : 'off');
  window.dispatchEvent(new CustomEvent(QA_DATA_CHANGED_EVENT, { detail: { enabled } }));
};

const readOverrides = () => {
  if (!hasWindow()) return {};

  try {
    return JSON.parse(window.localStorage.getItem(QA_ORDER_OVERRIDES_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const writeOverrides = (overrides) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(QA_ORDER_OVERRIDES_KEY, JSON.stringify(overrides || {}));
  window.dispatchEvent(new CustomEvent(QA_DATA_CHANGED_EVENT, { detail: { enabled: isQaDatasetEnabled() } }));
};

const normalizeStatusValue = (value = '') => {
  const normalized = normalizeText(value);
  const numeric = Number.parseInt(normalized, 10);

  if (Number.isFinite(numeric)) {
    const foundById = Object.values(STATUS_META).find((status) => status.id === numeric);
    if (foundById) return foundById.key;
  }

  if (normalized.includes('cancel')) return 'cancelado';
  if (normalized.includes('entreg')) return 'entregado';
  if (normalized.includes('camino') || normalized.includes('transito')) return 'en camino';
  if (normalized.includes('prepar') || normalized.includes('confirm')) return 'preparando';
  return 'pendiente';
};

export const getQaOrderStatusPatch = (value = '') => {
  const key = normalizeStatusValue(value);
  const status = STATUS_META[key] || STATUS_META.pendiente;

  return {
    estado_id: status.id,
    statusId: status.id,
    statusKey: status.key,
    statusLabel: status.label,
    statusVariant: STATUS_VARIANT[status.key] || STATUS_VARIANT.pendiente,
    progressStep: status.progressStep,
    estado: {
      id: status.id,
      codigo: status.key,
      descripcion: status.label,
    },
  };
};

export const isQaOrder = (order = {}) => Boolean(order?.isQa || order?.source === 'qa' || String(order?.id || '').startsWith('qa-'));

export const setQaOrderOverride = (orderId, patch = {}) => {
  const id = safeText(orderId);
  if (!id) return;

  const overrides = readOverrides();
  overrides[id] = {
    ...(overrides[id] || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeOverrides(overrides);
};

export const clearQaOrderOverride = (orderId) => {
  const id = safeText(orderId);
  if (!id) return;

  const overrides = readOverrides();
  delete overrides[id];
  writeOverrides(overrides);
};

const deliveryCodeFor = (numericId) => String(numericId).padStart(6, '0').slice(-6);

const categoryForTenant = (tenantName = '') => {
  const name = normalizeText(tenantName);
  if (name.includes('starbucks') || name.includes('bon')) return 'Bebidas';
  if (name.includes('pizza') || name.includes('caesar')) return 'Pizza';
  if (name.includes('kfc') || name.includes('pollo')) return 'Pollo';
  if (name.includes('taco')) return 'Tacos';
  if (name.includes('krispy') || name.includes('helado')) return 'Postres';
  if (name.includes('panda') || name.includes('barra')) return 'Criolla';
  return 'Hamburguesa';
};

const createQaProducts = (tenant, tenantIndex) =>
  SAMPLE_PRODUCTS.map(([name, description, price], index) => ({
    id: `qa-prod-${tenant.id}-${index + 1}`,
    source: 'qa',
    isQa: true,
    tenantId: String(tenant.id),
    tenantName: tenant.name,
    tenantLogo: tenant.logo,
    tenantPrimary: tenant.primary,
    nombre: `${name} ${tenant.name}`,
    name: `${name} ${tenant.name}`,
    descripcion: description,
    categoryLabel: index === 0 ? categoryForTenant(tenant.name) : description,
    precio: price + ((tenantIndex + index) % 4) * 25,
    priceValue: price + ((tenantIndex + index) % 4) * 25,
    isActive: true,
    activo: true,
  }));

const createQaUser = (tenant, index, role, connected = false, sequence = 1) => ({
  id: `qa-user-${tenant.id}-${role}-${sequence}`,
  source: 'qa',
  isQa: true,
  tenantId: String(tenant.id),
  tenantName: tenant.name,
  tenantLogo: tenant.logo,
  name: `${role === 'delivery' ? 'Delivery' : role === 'admin' ? 'Admin' : 'Cliente'} QA ${index + 1}.${sequence}`,
  email: `${role}${sequence}.qa.${tenant.id}@foodrush.test`,
  phone: `809-555-${String(1000 + index * 10 + sequence).slice(-4)}`,
  roleLabel: role === 'delivery' ? 'Repartidor' : role === 'admin' ? 'Administrador' : 'Cliente',
  isConnected: connected,
});

const createQaSession = (user, tenant, index) => ({
  id: `qa-session-${tenant.id}-${index}`,
  source: 'qa',
  isQa: true,
  tenantId: String(tenant.id),
  tenantName: tenant.name,
  userId: user.id,
  createdAt: new Date(now() - (index + 1) * 540000).toISOString(),
  expiresAt: new Date(now() + 86400000).toISOString(),
  ipAddress: `192.168.10.${20 + index}`,
  userAgent: 'FoodRush QA Browser',
  isActive: true,
});

const createQaOrder = (tenant, tenantIndex, orderIndex, products, overrides) => {
  const numericId = 930000 + tenantIndex * 100 + orderIndex + 1;
  const id = `qa-${numericId}`;
  const statusCycle = ['pendiente', 'preparando', 'en camino', 'entregado', 'entregado', 'cancelado', 'preparando', 'pendiente', 'en camino', 'entregado', 'preparando', 'entregado'];
  const statusKey = statusCycle[(tenantIndex + orderIndex) % statusCycle.length];
  const status = getQaOrderStatusPatch(statusKey);
  const product = products[orderIndex % products.length] || products[0];
  const quantity = (orderIndex % 3) + 1;
  const unitPrice = Number(product?.priceValue || product?.precio || 250);
  const totalValue = unitPrice * quantity + (statusKey === 'entregado' ? 50 : 0);
  const createdAt = new Date(now() - ((tenantIndex + orderIndex) % 7) * 86400000 - orderIndex * 1500000).toISOString();
  const storedAssignment = getDeliveryAssignment(id);
  const driverName = storedAssignment?.driverName || (['en camino', 'entregado'].includes(statusKey) ? `Delivery QA ${tenantIndex + 1}` : '');
  const driverEmail = storedAssignment?.driverEmail || (driverName ? `delivery.qa.${tenant.id}@foodrush.test` : '');
  const deliveryAssignment = storedAssignment || (driverName
    ? {
        orderId: id,
        pedido_id: id,
        tenantId: String(tenant.id),
        tenant_id: String(tenant.id),
        driverId: `qa-driver-${tenant.id}`,
        repartidor_id: `qa-driver-${tenant.id}`,
        driverName,
        driverEmail,
        status: statusKey === 'entregado' ? 'delivered' : 'picked',
        stage: statusKey === 'entregado' ? 'delivered' : 'picked',
        assignedAt: createdAt,
        updatedAt: createdAt,
      }
    : null);

  const baseOrder = {
    id,
    source: 'qa',
    isQa: true,
    tenantId: String(tenant.id),
    tenantName: tenant.name,
    tenantLogo: tenant.logo,
    tenantPrimary: tenant.primary,
    cliente_id: `qa-client-${numericId}`,
    customerId: `qa-client-${numericId}`,
    customerName: `Cliente QA ${tenantIndex + 1}-${orderIndex + 1}`,
    customerPhone: `809-555-${String(numericId).slice(-4)}`,
    customerEmail: `cliente.qa.${numericId}@foodrush.test`,
    address: SAMPLE_ADDRESSES[(tenantIndex + orderIndex) % SAMPLE_ADDRESSES.length],
    direccion_entrega: SAMPLE_ADDRESSES[(tenantIndex + orderIndex) % SAMPLE_ADDRESSES.length],
    notes: orderIndex % 2 === 0 ? 'Entregar en recepcion y llamar al llegar.' : 'Cliente solicita contacto por telefono.',
    paymentMethod: orderIndex % 3 === 0 ? 'Tarjeta' : 'Efectivo',
    metodo_pago: orderIndex % 3 === 0 ? 'Tarjeta' : 'Efectivo',
    total: totalValue,
    totalValue,
    creado_en: createdAt,
    createdAt,
    securityCode: deliveryCodeFor(numericId),
    codigo_entrega: deliveryCodeFor(numericId),
    codigoDelivery: deliveryCodeFor(numericId),
    driverName,
    driverEmail,
    repartidor_nombre: driverName,
    repartidor_email: driverEmail,
    deliveryAssignment,
    itemsDetailed: [
      {
        id: `qa-item-${numericId}`,
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
      },
    ],
    itemCount: quantity,
    itemSummary: `${quantity}x ${product.name}`,
    ...status,
  };

  const override = overrides[id] || {};
  const patchedStatus = override.statusKey ? getQaOrderStatusPatch(override.statusKey) : {};
  const patchedAssignment = override.deliveryAssignment || baseOrder.deliveryAssignment;

  return {
    ...baseOrder,
    ...patchedStatus,
    ...override,
    deliveryAssignment: patchedAssignment,
    driverName: override.driverName || patchedAssignment?.driverName || baseOrder.driverName,
    driverEmail: override.driverEmail || patchedAssignment?.driverEmail || baseOrder.driverEmail,
  };
};

export const enrichOperationalDatasetWithQaData = (dataset = {}) => {
  const qaEnabled = isQaDatasetEnabled();
  if (!qaEnabled) {
    return {
      ...dataset,
      qaEnabled: false,
      qaSummary: { orders: 0, products: 0, users: 0, sessions: 0 },
    };
  }

  const tenants = Array.isArray(dataset.tenants) ? dataset.tenants : [];
  const useAllTenantsForQa = safeText(dataset.requestedTenantId, 'Global') === 'Global';
  const scopedTenants = useAllTenantsForQa
    ? tenants
    : Array.isArray(dataset.scopedTenants) && dataset.scopedTenants.length > 0 ? dataset.scopedTenants : tenants;
  const overrides = readOverrides();
  const qaProducts = scopedTenants.flatMap((tenant, index) => createQaProducts(tenant, index));
  const qaUsers = scopedTenants.flatMap((tenant, index) => [
    createQaUser(tenant, index, 'admin', index % 3 === 0, 1),
    createQaUser(tenant, index, 'admin', index % 5 === 0, 2),
    createQaUser(tenant, index, 'delivery', index % 2 === 0, 1),
    createQaUser(tenant, index, 'delivery', index % 4 === 0, 2),
    createQaUser(tenant, index, 'client', index % 4 === 0, 1),
    createQaUser(tenant, index, 'client', index % 5 === 0, 2),
  ]);
  const qaSessions = qaUsers
    .filter((user) => user.isConnected)
    .map((user, index) => createQaSession(user, scopedTenants.find((tenant) => String(tenant.id) === String(user.tenantId)) || scopedTenants[0], index));
  const qaOrders = scopedTenants.flatMap((tenant, tenantIndex) => {
    const tenantProducts = qaProducts.filter((product) => String(product.tenantId) === String(tenant.id));
    return Array.from({ length: 12 }, (_, orderIndex) => createQaOrder(tenant, tenantIndex, orderIndex, tenantProducts, overrides));
  });

  const products = dedupeBy([...(dataset.products || []), ...qaProducts], (product) => String(product.id));
  const users = dedupeBy([...(dataset.users || []), ...qaUsers], (user) => `${user.tenantId}:${user.id}`);
  const sessions = dedupeBy([...(dataset.sessions || []), ...qaSessions], (session) => `${session.tenantId}:${session.userId}:${session.id}`);
  const connectedUsers = dedupeBy([...(dataset.connectedUsers || []), ...users.filter((user) => user.isConnected)], (user) => `${user.tenantId}:${user.id}`);
  const orders = dedupeBy([...(dataset.orders || []), ...qaOrders], (order) => String(order.id));

  return {
    ...dataset,
    orders,
    products,
    users,
    connectedUsers,
    sessions,
    warnings: dedupeBy(dataset.warnings || [], (warning) => warning),
    qaEnabled: true,
    qaSummary: {
      orders: qaOrders.length,
      products: qaProducts.length,
      users: qaUsers.length,
      sessions: qaSessions.length,
    },
  };
};
