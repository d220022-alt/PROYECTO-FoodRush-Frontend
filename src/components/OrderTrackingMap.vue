<!--
  Guia rápida para presentar:
  Mapa que ve el cliente durante el seguimiento. Dibuja local, cliente, repartidor y ruta por calles.
  Buscar en VS Code: mapa tracking, ruta por calles, OSRM, repartidor, cliente.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { buildDeliveryRoute, ensureLeaflet, fetchStreetRoute, getPointAlongRoute, getTrackingCopy } from '../utils/deliveryMap';

const props = defineProps({
  order: {
    type: Object,
    default: null,
  },
  statusLabel: {
    type: String,
    default: '',
  },
});

const mapEl = ref(null);
const isMapReady = ref(false);
const mapError = ref('');
const routeSource = ref('estimated');

let leaflet = null;
let map = null;
let routeLayer = null;
let markerLayer = null;
let routeRequestId = 0;
let routeAbortController = null;

const routeModel = computed(() => (props.order ? buildDeliveryRoute(props.order, props.statusLabel) : null));
const trackingCopy = computed(() => getTrackingCopy(routeModel.value?.stage, props.order || {}));
const canShowDriver = computed(() => !['cancelled', 'delivered'].includes(routeModel.value?.stage));

const createIcon = (iconClass, color = '#D90429') =>
  leaflet.divIcon({
    className: '',
    html: `<div class="foodrush-map-pin" style="--pin-color:${color}"><i class="${iconClass}"></i></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 34],
    popupAnchor: [0, -32],
  });

const clearLayers = () => {
  if (routeLayer) {
    routeLayer.remove();
    routeLayer = null;
  }
  if (markerLayer) {
    markerLayer.remove();
    markerLayer = null;
  }
};

const resolveRoutePoints = async (model, requestId) => {
  routeSource.value = 'estimated';

  try {
    routeAbortController?.abort();
    routeAbortController = new AbortController();
    const streetRoute = await fetchStreetRoute(model.store, model.customer, { signal: routeAbortController.signal });
    if (requestId !== routeRequestId) return null;
    if (streetRoute?.points?.length >= 2) {
      routeSource.value = 'street';
      return streetRoute.points;
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.warn('No se pudo calcular la ruta real, usando estimacion local', error);
    }
  }

  return model.route;
};

// Para presentar: mapa del cliente; intenta ruta por calles y muestra fallback si OSRM falla.
const renderRoute = async () => {
  if (!mapEl.value || !props.order || !leaflet) return;

  await nextTick();
  const requestId = ++routeRequestId;

  if (!map) {
    map = leaflet.map(mapEl.value, {
      zoomControl: false,
      attributionControl: true,
    }).setView([19.4517, -70.697], 13);

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
  }

  clearLayers();

  const model = routeModel.value;
  if (!model) return;

  const resolvedRoute = await resolveRoutePoints(model, requestId);
  if (requestId !== routeRequestId || !resolvedRoute?.length) return;

  const driver = canShowDriver.value
    ? {
        ...getPointAlongRoute(resolvedRoute, model.progress),
        label: model.driver.label,
      }
    : null;
  const routePoints = resolvedRoute.map((point) => [point.lat, point.lng]);
  routeLayer = leaflet.layerGroup().addTo(map);
  markerLayer = leaflet.layerGroup().addTo(map);

  leaflet.polyline(routePoints, {
    color: '#D90429',
    weight: 5,
    opacity: 0.9,
    lineCap: 'round',
  }).addTo(routeLayer);

  leaflet.polyline(routePoints, {
    color: '#F48C06',
    weight: 2,
    opacity: 0.9,
    dashArray: '8 10',
  }).addTo(routeLayer);

  leaflet
    .marker([model.store.lat, model.store.lng], { icon: createIcon('fa-solid fa-store', '#1a1a2e') })
    .addTo(markerLayer)
    .bindPopup(model.store.label);

  leaflet
    .marker([model.customer.lat, model.customer.lng], { icon: createIcon('fa-solid fa-location-dot', '#16a34a') })
    .addTo(markerLayer)
    .bindPopup(model.customer.label || 'Cliente');

  if (driver) {
    leaflet
      .marker([driver.lat, driver.lng], { icon: createIcon('fa-solid fa-motorcycle', '#F48C06') })
      .addTo(markerLayer)
      .bindPopup(driver.label);
  }

  const bounds = leaflet.latLngBounds(routePoints);
  map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  window.setTimeout(() => map?.invalidateSize(), 80);
};

onMounted(async () => {
  try {
    leaflet = await ensureLeaflet();
    isMapReady.value = true;
    await renderRoute();
  } catch (error) {
    console.error('No se pudo cargar OpenStreetMap', error);
    mapError.value = 'No se pudo cargar el mapa ahora mismo.';
  }
});

watch(() => [
  props.order?.id,
  props.statusLabel,
  props.order?.driverLocation?.lat,
  props.order?.driverLocation?.lng,
], () => {
  if (isMapReady.value) void renderRoute();
});

onBeforeUnmount(() => {
  routeAbortController?.abort();
  clearLayers();
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <section class="overflow-hidden rounded-[1.75rem] border border-red-100 bg-white shadow-sm">
    <div class="flex flex-col gap-3 border-b border-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.25em] text-red-500">Mapa en vivo</p>
        <h2 class="mt-1 text-xl font-black text-slate-900">{{ trackingCopy }}</h2>
      </div>
      <div class="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
        OpenStreetMap
      </div>
    </div>

    <div class="relative h-[280px] bg-slate-100 sm:h-[380px]">
      <div ref="mapEl" class="h-full w-full"></div>

      <div v-if="mapError" class="absolute inset-0 flex items-center justify-center bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
        {{ mapError }}
      </div>

      <div class="pointer-events-none absolute left-3 right-3 top-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:left-4 sm:right-auto sm:top-4">
        <p class="text-[11px] font-black uppercase tracking-wide text-slate-400">
          {{ routeSource === 'street' ? 'Ruta por calles' : 'Ruta estimada' }}
        </p>
        <p class="text-sm font-black text-slate-900">Local -> cliente</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
:deep(.leaflet-container) {
  font-family: 'Poppins', sans-serif;
  z-index: 0;
}

:deep(.leaflet-control-attribution) {
  font-size: 10px;
}

:deep(.foodrush-map-pin) {
  align-items: center;
  background: var(--pin-color);
  border: 3px solid #fff;
  border-radius: 9999px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.22);
  color: #fff;
  display: flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

:deep(.foodrush-map-pin i) {
  display: block;
  font-size: 16px;
  line-height: 1;
}
</style>
