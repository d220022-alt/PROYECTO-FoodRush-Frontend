<!--
  Guia rápida para presentar:
  Mapa operativo de administracion. Muestra pedidos activos, repartidores y seleccion en tiempo real.
  Buscar en VS Code: mapa administracion, pedidos en vivo, Leaflet, marcadores, repartidor.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { buildDeliveryRoute, ensureLeaflet, SANTIAGO_CENTER } from '../utils/deliveryMap';
import { normalizeStatusKey } from '../services/operations';

const props = defineProps({
  orders: {
    type: Array,
    default: () => [],
  },
  selectedOrderId: {
    type: [String, Number],
    default: '',
  },
});

const emit = defineEmits(['select-order']);

const mapEl = ref(null);
const mapError = ref('');
let leaflet = null;
let map = null;
let ordersLayer = null;
let selectedLayer = null;
let resizeObserver = null;
let invalidateTimer = null;

const statusMeta = {
  pendiente: { label: 'Pendiente', color: '#f59e0b', icon: 'fa-receipt' },
  preparando: { label: 'Preparando', color: '#2563eb', icon: 'fa-store' },
  'en camino': { label: 'En camino', color: '#f97316', icon: 'fa-motorcycle' },
  entregado: { label: 'Entregado', color: '#22c55e', icon: 'fa-check' },
  cancelado: { label: 'Cancelado', color: '#ef4444', icon: 'fa-ban' },
};

const escapeHtml = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getOrderKey = (order = {}) => normalizeStatusKey(order.statusKey || order.statusLabel || order.estado?.codigo || order.estado?.descripcion);
const getMeta = (order = {}) => statusMeta[getOrderKey(order)] || statusMeta.pendiente;
const isSelected = (order = {}) => String(order.id) === String(props.selectedOrderId);
const hasDriver = (order = {}) => Boolean(order.driverName || order.driverEmail || order.deliveryAssignment?.driverName || order.deliveryAssignment?.driverId);

const buildCurrentPoint = (order = {}, index = 0) => {
  const route = buildDeliveryRoute(order, order.statusLabel || order.statusKey);
  const statusKey = getOrderKey(order);
  const jitter = ((index % 5) - 2) / 12000;

  if (statusKey === 'en camino') return route.driver || route.store;
  if (statusKey === 'preparando') return route.store;
  if (statusKey === 'pendiente') {
    return {
      ...route.customer,
      lat: route.customer.lat + jitter,
      lng: route.customer.lng - jitter,
    };
  }

  return route.customer || route.store;
};

const createIcon = ({ color = '#f97316', icon = 'fa-location-dot', selected = false, muted = false } = {}) => leaflet.divIcon({
  className: '',
  html: `
    <span class="admin-live-pin${selected ? ' is-selected' : ''}${muted ? ' is-muted' : ''}" style="--pin-color: ${color}">
      <i class="fa-solid ${icon}"></i>
    </span>
  `,
  iconSize: selected ? [46, 46] : [34, 34],
  iconAnchor: selected ? [23, 23] : [17, 17],
  popupAnchor: [0, -18],
});

const buildPopup = (order = {}) => {
  const meta = getMeta(order);
  return `
    <div class="admin-live-popup">
      <strong>Pedido #${escapeHtml(order.id)}</strong>
      <span>${escapeHtml(order.tenantName)} - ${escapeHtml(meta.label)}</span>
      <small>${escapeHtml(order.customerName)}<br>${escapeHtml(order.address)}</small>
      <small>${escapeHtml(order.driverName || order.deliveryAssignment?.driverName || (hasDriver(order) ? 'Delivery asignado' : 'Sin delivery'))}</small>
    </div>
  `;
};

const fitToBounds = (points = [], selectedOnly = false) => {
  if (!leaflet || !map) return;
  const validPoints = points.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));

  if (validPoints.length === 0) {
    map.setView([SANTIAGO_CENTER.lat, SANTIAGO_CENTER.lng], 12);
    return;
  }

  const bounds = leaflet.latLngBounds(validPoints.map((point) => [point.lat, point.lng]));
  map.fitBounds(bounds, {
    padding: selectedOnly ? [64, 64] : [38, 38],
    maxZoom: selectedOnly ? 14 : 13,
  });
};

const renderSelectedOrder = (order = {}) => {
  if (!order || !leaflet || !selectedLayer) return [];

  const routeData = buildDeliveryRoute(order, order.statusLabel || order.statusKey);
  const meta = getMeta(order);
  const routePoints = routeData.route || [];
  const bounds = [routeData.store, routeData.customer, routeData.driver, ...routePoints];

  if (routePoints.length > 1) {
    leaflet.polyline(routePoints.map((point) => [point.lat, point.lng]), {
      color: meta.color,
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(selectedLayer);
  }

  leaflet
    .marker([routeData.store.lat, routeData.store.lng], {
      icon: createIcon({ color: '#111827', icon: 'fa-store', selected: true }),
    })
    .bindPopup(`<strong>${escapeHtml(order.tenantName || 'Local')}</strong><br>Local de salida`)
    .addTo(selectedLayer);

  leaflet
    .marker([routeData.customer.lat, routeData.customer.lng], {
      icon: createIcon({ color: '#22c55e', icon: 'fa-location-dot', selected: true }),
    })
    .bindPopup(`<strong>${escapeHtml(order.customerName || 'Cliente')}</strong><br>${escapeHtml(order.address || 'Direccion')}`)
    .addTo(selectedLayer);

  const shouldShowDriver = getOrderKey(order) === 'en camino' || hasDriver(order);
  if (routeData.driver && shouldShowDriver) {
    leaflet
      .marker([routeData.driver.lat, routeData.driver.lng], {
        icon: createIcon({ color: meta.color, icon: 'fa-motorcycle', selected: true }),
      })
      .bindPopup(`<strong>${escapeHtml(order.driverName || order.deliveryAssignment?.driverName || 'Repartidor')}</strong><br>${escapeHtml(meta.label)}`)
      .addTo(selectedLayer);
  }

  return bounds;
};

const renderOrders = () => {
  if (!leaflet || !map || !ordersLayer || !selectedLayer) return;

  ordersLayer.clearLayers();
  selectedLayer.clearLayers();

  const points = [];
  props.orders.forEach((order, index) => {
    const meta = getMeta(order);
    const point = buildCurrentPoint(order, index);
    if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lng)) return;

    points.push(point);

    if (!isSelected(order)) {
      leaflet
        .marker([point.lat, point.lng], {
          icon: createIcon({ color: meta.color, icon: meta.icon, muted: !hasDriver(order) && getOrderKey(order) === 'preparando' }),
        })
        .on('click', () => emit('select-order', String(order.id)))
        .bindPopup(buildPopup(order))
        .addTo(ordersLayer);
    }
  });

  const selectedOrder = props.orders.find((order) => isSelected(order));
  if (selectedOrder) {
    const selectedBounds = renderSelectedOrder(selectedOrder);
    fitToBounds(selectedBounds, true);
    return;
  }

  fitToBounds(points);
};

const invalidateMapSize = () => {
  if (!map || !mapEl.value) return;
  if (invalidateTimer) window.clearTimeout(invalidateTimer);

  invalidateTimer = window.setTimeout(() => {
    const { width, height } = mapEl.value.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    map.invalidateSize();
    renderOrders();
  }, 80);
};

const initMap = async () => {
  if (!mapEl.value || map) return;
  leaflet = await ensureLeaflet();
  map = leaflet.map(mapEl.value, {
    center: [SANTIAGO_CENTER.lat, SANTIAGO_CENTER.lng],
    zoom: 12,
    zoomControl: false,
    scrollWheelZoom: false,
  });

  leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
  ordersLayer = leaflet.layerGroup().addTo(map);
  selectedLayer = leaflet.layerGroup().addTo(map);
  await nextTick();
  invalidateMapSize();
};

onMounted(() => {
  void initMap().catch((error) => {
    console.error('No se pudo cargar el mapa administrativo', error);
    mapError.value = 'No se pudo cargar el mapa ahora mismo.';
  });

  if (window.ResizeObserver && mapEl.value) {
    resizeObserver = new ResizeObserver(() => invalidateMapSize());
    resizeObserver.observe(mapEl.value);
  }
});

onBeforeUnmount(() => {
  if (invalidateTimer) window.clearTimeout(invalidateTimer);
  resizeObserver?.disconnect();
  if (map) map.remove();
  map = null;
  ordersLayer = null;
  selectedLayer = null;
});

watch(
  () => [props.orders, props.selectedOrderId],
  () => {
    invalidateMapSize();
  },
  { deep: true },
);
</script>

<template>
  <div class="relative h-full min-h-[30rem] overflow-hidden bg-slate-100">
    <div ref="mapEl" class="admin-live-orders-map"></div>
    <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
      {{ mapError }}
    </div>
  </div>
</template>

<style scoped>
.admin-live-orders-map {
  min-height: 30rem;
  height: 100%;
  width: 100%;
}

:deep(.leaflet-container) {
  min-height: 30rem;
  height: 100%;
  width: 100%;
  font-family: inherit;
  z-index: 0;
}

:deep(.leaflet-control-attribution) {
  font-size: 10px;
}

:deep(.admin-live-pin) {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 3px solid #ffffff;
  border-radius: 999px;
  background: var(--pin-color, #f97316);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.24);
  font-size: 13px;
}

:deep(.admin-live-pin.is-selected) {
  width: 46px;
  height: 46px;
  border-width: 4px;
  box-shadow:
    0 0 0 8px rgba(34, 197, 94, 0.14),
    0 20px 34px rgba(15, 23, 42, 0.28);
  font-size: 16px;
}

:deep(.admin-live-pin.is-muted) {
  opacity: 0.72;
}

:deep(.admin-live-popup) {
  display: grid;
  gap: 4px;
  min-width: 180px;
  color: #0f172a;
  font-family: inherit;
}

:deep(.admin-live-popup strong) {
  font-size: 13px;
}

:deep(.admin-live-popup span),
:deep(.admin-live-popup small) {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}
</style>
