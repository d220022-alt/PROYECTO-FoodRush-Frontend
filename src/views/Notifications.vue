<!--
  Guia rapida para presentar:
  Centro de notificaciones. Ordena avisos del pedido y eventos importantes del usuario.
  Buscar en VS Code: notificaciones, leidas, servidor, mergeNotifications, pedido actualizado.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import { buildTenantHeaders } from '../services/operations';
import {
  APP_EVENTS,
  clearNotifications,
  getNotifications,
  getSession,
  markAllNotificationsRead,
  markNotificationRead,
  mergeNotifications,
} from '../services/storage';

const router = useRouter();

const settings = ref({
  email: localStorage.getItem('notif_email') !== 'false',
  push: localStorage.getItem('notif_push') !== 'false',
  sms: localStorage.getItem('notif_sms') === 'true',
  promos: localStorage.getItem('notif_promos') !== 'false',
});

const notifications = ref([]);
const currentEmail = computed(() => getSession().userEmail);
const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length);

const loadNotifications = () => {
  notifications.value = getNotifications(currentEmail.value);
};

// Para presentar: mezcla notificaciones del backend con las guardadas localmente.
const syncServerNotifications = async () => {
  const session = getSession();
  if (!session.isAuthenticated) return;

  try {
    const response = await api.getServerNotifications({ limit: 60 }, buildTenantHeaders(session.tenantId || 1));
    if (response.success !== false) {
      notifications.value = mergeNotifications(response.data || [], currentEmail.value);
    }
  } catch (error) {
    console.warn('No se pudieron sincronizar notificaciones del servidor', error);
  }
};

const goBack = () => router.go(-1);

const openNotification = (notification) => {
  markNotificationRead(notification.id, currentEmail.value);
  loadNotifications();

  if (notification.route) {
    router.push(notification.route);
  }
};

const markAllRead = () => {
  markAllNotificationsRead(currentEmail.value);
  loadNotifications();
};

const clearAll = () => {
  clearNotifications(currentEmail.value);
  loadNotifications();
};

const formatNotificationDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ahora';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

watch(settings, (newVal) => {
  localStorage.setItem('notif_email', newVal.email);
  localStorage.setItem('notif_push', newVal.push);
  localStorage.setItem('notif_sms', newVal.sms);
  localStorage.setItem('notif_promos', newVal.promos);
}, { deep: true });

onMounted(() => {
  loadNotifications();
  void syncServerNotifications();
  window.addEventListener(APP_EVENTS.notificationsChanged, loadNotifications);
});

onBeforeUnmount(() => {
  window.removeEventListener(APP_EVENTS.notificationsChanged, loadNotifications);
});
</script>

<template>
  <div class="min-h-screen bg-[#F5F5F5] pb-10 font-sans">
    <header class="sticky top-0 z-10 flex items-center border-b border-gray-100 bg-[#F5F5F5]/95 p-6 backdrop-blur">
      <button @click="goBack" class="text-2xl text-slate-800 transition hover:text-red-500" aria-label="Volver">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <h1 class="flex-1 text-center text-xl font-bold text-slate-800">Notificaciones</h1>
      <button
        @click="markAllRead"
        class="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-500"
        aria-label="Marcar notificaciones como leidas"
      >
        <i class="fa-regular fa-bell"></i>
        <span
          v-if="unreadCount > 0"
          class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          {{ unreadCount }}
        </span>
      </button>
    </header>

    <main class="mx-auto max-w-lg space-y-6 px-6">
      <section class="rounded-[2rem] bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-1 pb-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-red-500">Centro de alertas</p>
            <h2 class="text-lg font-black text-slate-900">{{ unreadCount }} sin leer</h2>
          </div>
          <button
            v-if="notifications.length > 0"
            @click="clearAll"
            class="rounded-full border border-red-100 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50"
          >
            Limpiar
          </button>
        </div>

        <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center px-5 py-12 text-center">
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
            <i class="fa-regular fa-bell-slash"></i>
          </div>
          <h3 class="text-lg font-black text-slate-900">Todo tranquilo</h3>
          <p class="mt-1 text-sm font-medium text-gray-500">No tienes alertas pendientes.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <button
            v-for="notification in notifications"
            :key="notification.id"
            @click="openNotification(notification)"
            class="flex w-full items-start gap-4 px-1 py-4 text-left transition hover:bg-gray-50"
          >
            <span
              class="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg"
              :class="notification.read ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-500'"
            >
              <i :class="notification.icon"></i>
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm font-black text-slate-800">{{ notification.title }}</span>
                <span v-if="!notification.read" class="h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></span>
              </span>
              <span class="mt-1 block text-xs font-medium leading-5 text-gray-500">{{ notification.message }}</span>
              <span class="mt-2 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                {{ formatNotificationDate(notification.created_at) }}
              </span>
            </span>
            <i v-if="notification.route" class="fa-solid fa-chevron-right mt-4 text-xs text-gray-300"></i>
          </button>
        </div>
      </section>

      <section class="overflow-hidden rounded-[2rem] bg-white shadow-sm">
        <div class="border-b border-gray-100 px-5 py-4">
          <h2 class="text-sm font-black text-slate-800">Preferencias</h2>
        </div>

        <div class="flex items-center justify-between border-b border-gray-100 p-5">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-lg text-blue-500">
              <i class="fa-regular fa-envelope"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800">Correo</p>
              <p class="text-xs text-gray-400">Actualizaciones de pedidos</p>
            </div>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input v-model="settings.email" type="checkbox" class="peer sr-only">
            <span class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></span>
          </label>
        </div>

        <div class="flex items-center justify-between border-b border-gray-100 p-5">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-lg text-orange-500">
              <i class="fa-regular fa-bell"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800">Push</p>
              <p class="text-xs text-gray-400">Alertas en tiempo real</p>
            </div>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input v-model="settings.push" type="checkbox" class="peer sr-only">
            <span class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></span>
          </label>
        </div>

        <div class="flex items-center justify-between p-5">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-lg text-purple-500">
              <i class="fa-solid fa-tag"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800">Promociones</p>
              <p class="text-xs text-gray-400">Ofertas relevantes</p>
            </div>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input v-model="settings.promos" type="checkbox" class="peer sr-only">
            <span class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></span>
          </label>
        </div>
      </section>
    </main>
  </div>
</template>
