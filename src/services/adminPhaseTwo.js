import { getSession } from './storage';

const STORAGE_PREFIX = 'foodrush_admin_phase2';
const MAX_AUDIT_ENTRIES = 120;

export const DEFAULT_OPERATION_ZONES = [
  {
    id: 'gurabo',
    name: 'Gurabo',
    center: { lat: 19.4876, lng: -70.6727 },
    radiusKm: 3.2,
    deliveryFee: 50,
    etaMin: 24,
    priority: 'Alta',
    active: true,
    color: '#f97316',
    keywords: ['gurabo'],
    notes: 'Zona con alta demanda y rutas rapidas hacia el centro.',
  },
  {
    id: 'villa-olga',
    name: 'Villa Olga',
    center: { lat: 19.4595, lng: -70.6819 },
    radiusKm: 2.4,
    deliveryFee: 45,
    etaMin: 18,
    priority: 'Alta',
    active: true,
    color: '#0f766e',
    keywords: ['villa olga'],
    notes: 'Zona prioritaria por cercania a varias franquicias.',
  },
  {
    id: 'pekin',
    name: 'Pekin',
    center: { lat: 19.4214, lng: -70.7045 },
    radiusKm: 3.6,
    deliveryFee: 60,
    etaMin: 32,
    priority: 'Media',
    active: true,
    color: '#2563eb',
    keywords: ['pekin', 'pekin'],
    notes: 'Cobertura sur con ETA mayor por distancia.',
  },
  {
    id: 'santiago-centro',
    name: 'Santiago Centro',
    center: { lat: 19.4517, lng: -70.697 },
    radiusKm: 2.8,
    deliveryFee: 40,
    etaMin: 20,
    priority: 'Media',
    active: true,
    color: '#7c3aed',
    keywords: ['santiago', 'centro', 'monumental'],
    notes: 'Cobertura base cuando la direccion no cae en otra zona.',
  },
];

const hasWindow = () => typeof window !== 'undefined';

const safeText = (value = '', fallback = '') => String(value || fallback || '').trim();

const normalizeEmailKey = (email = '') =>
  safeText(email, 'admin@foodrush.local')
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '');

const getScope = () => normalizeEmailKey(getSession().userEmail);

const storageKey = (bucket) => `${STORAGE_PREFIX}:${getScope()}:${bucket}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readJson = (bucket, fallback) => {
  if (!hasWindow()) return clone(fallback);
  return safeJsonParse(window.localStorage.getItem(storageKey(bucket)), clone(fallback));
};

const writeJson = (bucket, value) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(storageKey(bucket), JSON.stringify(value));
};

const normalizeZone = (zone = {}, index = 0) => {
  const fallback = DEFAULT_OPERATION_ZONES[index] || DEFAULT_OPERATION_ZONES[0];
  const radiusKm = Number.parseFloat(zone.radiusKm ?? fallback.radiusKm);
  const deliveryFee = Number.parseFloat(zone.deliveryFee ?? fallback.deliveryFee);
  const etaMin = Number.parseInt(zone.etaMin ?? fallback.etaMin, 10);
  const lat = Number.parseFloat(zone.center?.lat ?? fallback.center.lat);
  const lng = Number.parseFloat(zone.center?.lng ?? fallback.center.lng);

  return {
    ...fallback,
    ...zone,
    id: safeText(zone.id, fallback.id),
    name: safeText(zone.name, fallback.name),
    center: {
      lat: Number.isFinite(lat) ? lat : fallback.center.lat,
      lng: Number.isFinite(lng) ? lng : fallback.center.lng,
    },
    radiusKm: Number.isFinite(radiusKm) ? Math.max(0.5, radiusKm) : fallback.radiusKm,
    deliveryFee: Number.isFinite(deliveryFee) ? Math.max(0, deliveryFee) : fallback.deliveryFee,
    etaMin: Number.isFinite(etaMin) ? Math.max(5, etaMin) : fallback.etaMin,
    priority: safeText(zone.priority, fallback.priority),
    active: zone.active !== false,
    color: safeText(zone.color, fallback.color),
    keywords: Array.isArray(zone.keywords)
      ? zone.keywords.map((item) => safeText(item)).filter(Boolean)
      : fallback.keywords,
    notes: safeText(zone.notes, fallback.notes),
    updatedAt: safeText(zone.updatedAt),
  };
};

export const getAdminZones = () => {
  const saved = readJson('zones', DEFAULT_OPERATION_ZONES);
  const zones = Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_OPERATION_ZONES;
  return zones.map(normalizeZone);
};

export const saveAdminZone = (zone) => {
  const zones = getAdminZones();
  const normalized = normalizeZone({ ...zone, updatedAt: new Date().toISOString() });
  const nextZones = zones.some((item) => item.id === normalized.id)
    ? zones.map((item) => (item.id === normalized.id ? normalized : item))
    : [...zones, normalized];

  writeJson('zones', nextZones);
  return normalized;
};

export const getClosureRecords = () => readJson('closures', []);

export const getAuditLog = () => readJson('audit', []);

export const appendAuditLog = ({ action, detail, tenantId = '', tenantName = '', tone = 'info', metadata = {} } = {}) => {
  const session = getSession();
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    action: safeText(action, 'Accion registrada'),
    detail: safeText(detail, 'Sin detalle'),
    tenantId: safeText(tenantId),
    tenantName: safeText(tenantName, 'Vista Global'),
    tone: safeText(tone, 'info'),
    userName: safeText(session.userName, 'Admin FoodRush'),
    userEmail: safeText(session.userEmail),
    createdAt: new Date().toISOString(),
    metadata,
  };

  const nextEntries = [entry, ...getAuditLog()].slice(0, MAX_AUDIT_ENTRIES);
  writeJson('audit', nextEntries);
  return entry;
};

const statusKey = (order = {}) => safeText(order.statusKey || order.statusLabel || order.estado?.codigo).toLowerCase();

const isDelivered = (order) => statusKey(order).includes('entreg');
const isCancelled = (order) => statusKey(order).includes('cancel');
const isActive = (order) => !isDelivered(order) && !isCancelled(order);

export const buildClosureSnapshot = ({ tenantId = 'Global', tenantName = 'Vista Global', orders = [], zones = [] } = {}) => {
  const delivered = orders.filter(isDelivered);
  const cancelled = orders.filter(isCancelled);
  const active = orders.filter(isActive);
  const grossSales = delivered.reduce((sum, order) => sum + Number(order.totalValue || 0), 0);
  const assigned = orders.filter((order) => Boolean(order.driverName || order.driverEmail || order.deliveryAssignment?.driverName));
  const activeZones = zones.filter((zone) => zone.active !== false);

  return {
    tenantId: safeText(tenantId, 'Global'),
    tenantName: safeText(tenantName, 'Vista Global'),
    totalOrders: orders.length,
    deliveredOrders: delivered.length,
    cancelledOrders: cancelled.length,
    activeOrders: active.length,
    assignedOrders: assigned.length,
    grossSales,
    averageTicket: delivered.length > 0 ? grossSales / delivered.length : 0,
    activeZones: activeZones.length,
    generatedAt: new Date().toISOString(),
  };
};

export const createClosureRecord = (snapshot) => {
  const record = {
    id: `closure-${Date.now()}`,
    dateKey: new Date().toISOString().slice(0, 10),
    ...snapshot,
  };

  const nextRecords = [record, ...getClosureRecords()].slice(0, 60);
  writeJson('closures', nextRecords);
  return record;
};
