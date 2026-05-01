<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ensureLeaflet, SANTIAGO_CENTER } from '../utils/deliveryMap';

const props = defineProps({
  zones: {
    type: Array,
    default: () => [],
  },
  selectedZoneId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select-zone']);

const mapEl = ref(null);
let leaflet = null;
let map = null;
let zoneLayer = null;

const renderZones = () => {
  if (!leaflet || !map || !zoneLayer) return;
  zoneLayer.clearLayers();

  const bounds = [];
  props.zones.forEach((zone) => {
    const lat = Number(zone.center?.lat);
    const lng = Number(zone.center?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const isSelected = zone.id === props.selectedZoneId;
    const color = zone.color || '#f97316';
    const radius = Math.max(500, Number(zone.radiusKm || 1) * 1000);
    const center = [lat, lng];

    leaflet
      .circle(center, {
        radius,
        color,
        weight: isSelected ? 4 : 2,
        fillColor: color,
        fillOpacity: zone.active === false ? 0.06 : 0.15,
        opacity: zone.active === false ? 0.35 : 0.9,
      })
      .on('click', () => emit('select-zone', zone.id))
      .addTo(zoneLayer);

    leaflet
      .marker(center)
      .on('click', () => emit('select-zone', zone.id))
      .bindPopup(`<strong>${zone.name}</strong><br>${zone.etaMin} min · $${zone.deliveryFee}`)
      .addTo(zoneLayer);

    bounds.push(center);
  });

  if (bounds.length > 0) {
    map.fitBounds(leaflet.latLngBounds(bounds), { padding: [28, 28], maxZoom: 13 });
  } else {
    map.setView([SANTIAGO_CENTER.lat, SANTIAGO_CENTER.lng], 12);
  }
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
  zoneLayer = leaflet.layerGroup().addTo(map);
  renderZones();
};

onMounted(() => {
  void initMap();
});

onBeforeUnmount(() => {
  if (map) map.remove();
  map = null;
  zoneLayer = null;
});

watch(
  () => [props.zones, props.selectedZoneId],
  () => {
    renderZones();
  },
  { deep: true },
);
</script>

<template>
  <div ref="mapEl" class="admin-zones-map"></div>
</template>

<style scoped>
.admin-zones-map {
  min-height: 360px;
  height: 100%;
  width: 100%;
}

:deep(.leaflet-container) {
  min-height: 360px;
  height: 100%;
  width: 100%;
  font-family: inherit;
}

:deep(.leaflet-control-attribution) {
  font-size: 10px;
}
</style>
