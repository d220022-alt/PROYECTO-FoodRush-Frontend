import { api } from './api';
import { getSession } from './storage';

const STORAGE_PREFIX = 'foodrush_admin_phase2';
const MAX_AUDIT_ENTRIES = 120;
const ZONE_KIND = 'admin_operation_zone';
const CLOSURE_ENTITY = 'admin_operation_closure';
const AUDIT_ENTITY = 'admin_operation_audit';

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
const canUseRemote = () => hasWindow() && Boolean(window.localStorage.getItem('auth_token'));

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
  if (typeof value === 'object') return value;
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

const buildZoneDescription = (zone) => JSON.stringify({
  kind: ZONE_KIND,
  zone,
  updatedAt: new Date().toISOString(),
});

const parseZoneRoute = (route = {}, index = 0) => {
  const payload = safeJsonParse(route.descripcion, {});
  if (payload.kind !== ZONE_KIND && payload.zone?.kind !== ZONE_KIND) return null;
  return {
    ...normalizeZone(payload.zone || payload, index),
    routeId: String(route.id || ''),
    createdAt: route.creado_en || '',
  };
};

const normalizeAuditEntry = (entry = {}) => ({
  id: safeText(entry.id, `audit-${Date.now()}`),
  action: safeText(entry.action, entry.accion || 'Accion registrada'),
  detail: safeText(entry.detail, entry.detalle || entry.detalles || 'Sin detalle'),
  tenantId: safeText(entry.tenantId),
  tenantName: safeText(entry.tenantName, 'Vista Global'),
  tone: safeText(entry.tone, 'info'),
  userName: safeText(entry.userName, 'Admin FoodRush'),
  userEmail: safeText(entry.userEmail),
  createdAt: safeText(entry.createdAt, new Date().toISOString()),
  metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
});

const parseAuditLogRow = (row = {}) => {
  const payload = safeJsonParse(row.detalles, {});
  return normalizeAuditEntry({
    ...(payload.entry || payload),
    id: payload.entry?.id || payload.id || row.entidad_id || `auditlog-${row.id}`,
    action: payload.entry?.action || payload.action || row.accion,
    createdAt: payload.entry?.createdAt || payload.createdAt || row.creado_en,
  });
};

const normalizeClosureRecord = (record = {}) => ({
  id: safeText(record.id, `closure-${Date.now()}`),
  dateKey: safeText(record.dateKey, new Date().toISOString().slice(0, 10)),
  tenantId: safeText(record.tenantId, 'Global'),
  tenantName: safeText(record.tenantName, 'Vista Global'),
  totalOrders: Number.parseInt(record.totalOrders || 0, 10) || 0,
  deliveredOrders: Number.parseInt(record.deliveredOrders || 0, 10) || 0,
  cancelledOrders: Number.parseInt(record.cancelledOrders || 0, 10) || 0,
  activeOrders: Number.parseInt(record.activeOrders || 0, 10) || 0,
  assignedOrders: Number.parseInt(record.assignedOrders || 0, 10) || 0,
  grossSales: Number.parseFloat(record.grossSales || 0) || 0,
  averageTicket: Number.parseFloat(record.averageTicket || 0) || 0,
  activeZones: Number.parseInt(record.activeZones || 0, 10) || 0,
  generatedAt: safeText(record.generatedAt, new Date().toISOString()),
});

const parseClosureRow = (row = {}) => {
  const payload = safeJsonParse(row.detalles, {});
  return normalizeClosureRecord(payload.record || payload);
};

const listGenericResource = async (resource) => {
  const response = await api.request(`/api/${resource}`);
  return Array.isArray(response?.data) ? response.data : [];
};

const loadGenericAdminState = async () => {
  const [routes, auditLogs] = await Promise.all([
    listGenericResource('rutas'),
    listGenericResource('auditlogs'),
  ]);

  let zones = routes.map(parseZoneRoute).filter(Boolean);
  if (zones.length === 0) {
    const createdZones = await Promise.all(DEFAULT_OPERATION_ZONES.map((zone) => {
      const normalized = normalizeZone({ ...zone, updatedAt: new Date().toISOString() });
      return api.createResource('rutas', {
        descripcion: buildZoneDescription(normalized),
      }).then((response) => parseZoneRoute(response.data) || normalized);
    }));
    zones = createdZones.map((zone) => normalizeZone(zone));
  }

  return {
    zones,
    closures: auditLogs
      .filter((row) => row.entidad === CLOSURE_ENTITY)
      .map(parseClosureRow)
      .slice(0, 60),
    audit: auditLogs
      .filter((row) => row.entidad === AUDIT_ENTITY)
      .map(parseAuditLogRow)
      .slice(0, MAX_AUDIT_ENTRIES),
    remote: true,
    generic: true,
  };
};

const syncLocalState = ({ zones, closures, audit } = {}) => {
  if (Array.isArray(zones)) writeJson('zones', zones.map(normalizeZone));
  if (Array.isArray(closures)) writeJson('closures', closures);
  if (Array.isArray(audit)) writeJson('audit', audit);
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

export const loadAdminPhaseTwoState = async () => {
  const localState = {
    zones: getAdminZones(),
    closures: getClosureRecords(),
    audit: getAuditLog(),
    remote: false,
  };

  if (!canUseRemote()) return localState;

  try {
    let remoteState = {};
    try {
      const response = await api.getAdminOperationsState();
      remoteState = response?.data || {};
    } catch (error) {
      if (error?.status !== 404) throw error;
      remoteState = await loadGenericAdminState();
    }

    const zones = Array.isArray(remoteState.zones) && remoteState.zones.length > 0
      ? remoteState.zones.map(normalizeZone)
      : localState.zones;
    const closures = Array.isArray(remoteState.closures) ? remoteState.closures : localState.closures;
    const audit = Array.isArray(remoteState.audit) ? remoteState.audit : localState.audit;

    syncLocalState({ zones, closures, audit });

    return {
      zones,
      closures,
      audit,
      remote: true,
    };
  } catch (error) {
    console.warn('Operaciones admin remotas no disponibles, usando respaldo local.', error);
    return {
      ...localState,
      error,
    };
  }
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

export const saveAdminZoneRemote = async (zone) => {
  const localZone = saveAdminZone(zone);

  if (!canUseRemote()) return localZone;

  try {
    let response;
    try {
      response = await api.upsertAdminOperationZone(localZone);
    } catch (error) {
      if (error?.status !== 404) throw error;

      const routes = await listGenericResource('rutas');
      const existing = routes
        .map((route, index) => ({ route, zone: parseZoneRoute(route, index) }))
        .find((item) => item.zone?.id === localZone.id);

      response = existing?.route?.id
        ? await api.updateResource('rutas', existing.route.id, { descripcion: buildZoneDescription(localZone) })
        : await api.createResource('rutas', { descripcion: buildZoneDescription(localZone) });
    }
    const remoteZone = parseZoneRoute(response?.data) || normalizeZone(response?.data || localZone);
    saveAdminZone(remoteZone);
    return remoteZone;
  } catch (error) {
    console.warn('No se pudo guardar la zona en el backend, quedo como respaldo local.', error);
    return localZone;
  }
};

export const getClosureRecords = () => readJson('closures', []);

export const getAuditLog = () => readJson('audit', []);

const persistAuditEntry = async (entry) => {
  if (!canUseRemote()) return null;

  try {
    let response;
    try {
      response = await api.createAdminOperationAudit(entry);
    } catch (error) {
      if (error?.status !== 404) throw error;
      response = await api.createResource('auditlogs', {
        accion: entry.action,
        entidad: AUDIT_ENTITY,
        entidad_id: entry.id,
        detalles: JSON.stringify({ entry }),
      });
    }
    const remoteEntry = response?.data?.detalles
      ? parseAuditLogRow(response.data)
      : normalizeAuditEntry(response?.data || entry);
    const nextEntries = [
      remoteEntry,
      ...getAuditLog().filter((item) => item.id !== entry.id && item.id !== remoteEntry.id),
    ].slice(0, MAX_AUDIT_ENTRIES);
    writeJson('audit', nextEntries);
    return remoteEntry;
  } catch (error) {
    console.warn('No se pudo guardar auditoria en backend, queda local.', error);
    return null;
  }
};

export const appendAuditLog = ({ action, detail, tenantId = '', tenantName = '', tone = 'info', metadata = {} } = {}, options = {}) => {
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

  if (options.syncRemote !== false) {
    void persistAuditEntry(entry);
  }

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

export const createClosureRecordRemote = async (snapshot) => {
  const localRecord = createClosureRecord(snapshot);

  if (!canUseRemote()) return localRecord;

  try {
    let response;
    try {
      response = await api.createAdminOperationClosure(localRecord);
    } catch (error) {
      if (error?.status !== 404) throw error;
      response = await api.createResource('auditlogs', {
        accion: 'Cierre operativo',
        entidad: CLOSURE_ENTITY,
        entidad_id: localRecord.id,
        detalles: JSON.stringify({ record: localRecord }),
      });
    }
    const remoteRecord = response?.data?.detalles ? parseClosureRow(response.data) : response?.data || localRecord;
    const nextRecords = [
      remoteRecord,
      ...getClosureRecords().filter((item) => item.id !== localRecord.id && item.id !== remoteRecord.id),
    ].slice(0, 60);
    writeJson('closures', nextRecords);
    return remoteRecord;
  } catch (error) {
    console.warn('No se pudo guardar el cierre en backend, queda local.', error);
    return localRecord;
  }
};
