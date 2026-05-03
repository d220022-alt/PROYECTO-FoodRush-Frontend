const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

export const SANTIAGO_CENTER = { lat: 19.4517, lng: -70.697, label: 'Santiago de los Caballeros' };

const STORE_LOCATIONS = {
  1: { lat: 19.4568, lng: -70.6869, label: 'Starbucks Santiago' },
  2: { lat: 19.4511, lng: -70.6992, label: "McDonald's Santiago" },
  3: { lat: 19.4452, lng: -70.6935, label: 'KFC Santiago' },
  4: { lat: 19.4591, lng: -70.7041, label: 'Burger King Santiago' },
  5: { lat: 19.4682, lng: -70.6891, label: 'Little Caesars Santiago' },
  6: { lat: 19.4493, lng: -70.7072, label: "Domino's Pizza Santiago" },
  7: { lat: 19.4624, lng: -70.6974, label: 'Pizza Hut Santiago' },
  8: { lat: 19.4536, lng: -70.6842, label: 'Krispy Kreme Santiago' },
  9: { lat: 19.4401, lng: -70.6988, label: 'Rico Hot Dog Santiago' },
  10: { lat: 19.4645, lng: -70.6764, label: 'Pizzarelli Santiago' },
  11: { lat: 19.4474, lng: -70.7051, label: 'Barra Payan Santiago' },
  12: { lat: 19.4528, lng: -70.6815, label: 'Taco Bell Santiago' },
  13: { lat: 19.4602, lng: -70.6918, label: 'Helados Bon Santiago' },
  14: { lat: 19.4572, lng: -70.6722, label: "Chili's Santiago" },
  15: { lat: 19.4209, lng: -70.6759, label: 'Panda Express Santiago' },
};

const ZONE_LOCATIONS = [
  { keywords: ['gurabo'], lat: 19.4876, lng: -70.6727, label: 'Gurabo' },
  { keywords: ['villa olga'], lat: 19.4595, lng: -70.6819, label: 'Villa Olga' },
  { keywords: ['pekin'], lat: 19.4214, lng: -70.7045, label: 'Pekin' },
  { keywords: ['santiago'], lat: 19.4517, lng: -70.697, label: 'Santiago' },
];

export const ensureLeaflet = () =>
  new Promise((resolve, reject) => {
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

const safeText = (value = '', fallback = '') => String(value || fallback || '').trim();

const normalizeLookupText = (value = '') =>
  safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hashString = (value = '') =>
  safeText(value)
    .split('')
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);

const parseCoordinates = (value = '') => {
  const match = safeText(value).match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, label: 'Direccion del cliente' };
};

export const getStoreLocation = (order = {}) => {
  const tenantId = safeText(order.tenantId || order.tenant_id || order.tenant?.id);
  if (STORE_LOCATIONS[tenantId]) return STORE_LOCATIONS[tenantId];
  return { ...SANTIAGO_CENTER, label: safeText(order.tenantName, 'FoodRush Santiago') };
};

export const getCustomerLocation = (order = {}) => {
  const address = safeText(order.address || order.direccion_entrega);
  const parsed = parseCoordinates(address);
  if (parsed) return parsed;

  const normalizedAddress = normalizeLookupText(address);
  const zone = ZONE_LOCATIONS.find((entry) => entry.keywords.some((keyword) => normalizedAddress.includes(keyword)));
  if (zone) return { lat: zone.lat, lng: zone.lng, label: zone.label };

  const seed = Math.abs(hashString(`${order.id || 'pedido'}-${address || 'foodrush'}`));
  const latOffset = ((seed % 90) - 45) / 10000;
  const lngOffset = (((Math.floor(seed / 90) % 90) - 45) / 10000);

  return {
    lat: SANTIAGO_CENTER.lat + latOffset,
    lng: SANTIAGO_CENTER.lng + lngOffset,
    label: address || 'Ubicacion estimada',
  };
};

const buildMidpoint = (origin, destination) => ({
  lat: (origin.lat + destination.lat) / 2 + 0.004,
  lng: (origin.lng + destination.lng) / 2 - 0.003,
});

export const buildFallbackRoute = (origin, destination) => [origin, buildMidpoint(origin, destination), destination];

export const getPointAlongRoute = (route = [], progress = 0) => {
  const points = route.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];

  const clampedProgress = Math.max(0, Math.min(1, Number(progress) || 0));
  const segmentDistances = [];
  let totalDistance = 0;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const distance = Math.hypot(current.lat - previous.lat, current.lng - previous.lng);
    segmentDistances.push(distance);
    totalDistance += distance;
  }

  if (totalDistance <= 0) return points[0];

  let targetDistance = totalDistance * clampedProgress;
  for (let index = 1; index < points.length; index += 1) {
    const distance = segmentDistances[index - 1];
    if (targetDistance > distance) {
      targetDistance -= distance;
      continue;
    }

    const ratio = distance === 0 ? 0 : targetDistance / distance;
    const previous = points[index - 1];
    const current = points[index];
    return {
      lat: previous.lat + (current.lat - previous.lat) * ratio,
      lng: previous.lng + (current.lng - previous.lng) * ratio,
    };
  }

  return points[points.length - 1];
};

export const fetchStreetRoute = async (origin, destination, { signal } = {}) => {
  if (!origin || !destination) return null;

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const endpoint = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(endpoint, { signal });

  if (!response.ok) {
    throw new Error('No se pudo calcular la ruta por calles.');
  }

  const payload = await response.json();
  const coordinatesList = payload?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinatesList) || coordinatesList.length < 2) {
    throw new Error('La ruta por calles no devolvio puntos suficientes.');
  }

  return {
    points: coordinatesList.map(([lng, lat]) => ({ lat, lng })),
    distanceMeters: payload.routes[0].distance || 0,
    durationSeconds: payload.routes[0].duration || 0,
    source: 'street',
  };
};

export const getTrackingStage = (statusLabel = '', order = {}) => {
  const source = safeText(order.source).toLowerCase();
  const normalized = safeText(statusLabel).toLowerCase();

  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('entreg')) return 'delivered';
  if (normalized.includes('camino') || normalized.includes('transit')) return 'transit';
  if (normalized.includes('prepar') || normalized.includes('confirm')) return 'preparing';
  if (source === 'local') return 'local';
  return 'pending';
};

export const getTrackingCopy = (stage, order = {}) => {
  if (stage === 'cancelled') return 'Pedido cancelado';
  if (stage === 'delivered') return 'Pedido entregado';
  if (stage === 'transit') return 'Repartidor en camino';
  if (stage === 'preparing') return 'Preparando en el local';
  if (stage === 'local') return 'Pendiente de sincronizar';
  return 'Pendiente de confirmacion';
};

export const buildDeliveryRoute = (order = {}, statusLabel = '') => {
  const store = getStoreLocation(order);
  const customer = safeText(order.modo_entrega || order.deliveryMode).toLowerCase() === 'pickup'
    ? store
    : getCustomerLocation(order);
  const stage = getTrackingStage(statusLabel, order);
  const route = buildFallbackRoute(store, customer);

  const progressByStage = {
    local: 0,
    pending: 0,
    preparing: 0.12,
    transit: 0.58,
    delivered: 1,
    cancelled: 0,
  };
  const progress = progressByStage[stage] ?? 0;
  const liveDriverLat = Number(order.driverLocation?.lat);
  const liveDriverLng = Number(order.driverLocation?.lng ?? order.driverLocation?.lon);
  const liveDriver = Number.isFinite(liveDriverLat) && Number.isFinite(liveDriverLng)
    ? { lat: liveDriverLat, lng: liveDriverLng }
    : null;
  const driver = {
    ...(liveDriver || getPointAlongRoute(route, progress)),
    label: stage === 'transit' ? 'Repartidor FoodRush' : 'Preparacion FoodRush',
  };

  return { store, customer, driver, route, stage, progress };
};
