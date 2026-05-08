<!--
  Guia rápida para presentar:
  Componente raiz. Renderiza la ruta actual y controla botones globales de tema y accesibilidad.
  Buscar en VS Code: shell app, boton tema, boton accesibilidad, modo oscuro, router-view.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AccessibilityMenu from './components/AccessibilityMenu.vue';
import { useTheme } from './services/theme';

const route = useRoute();
const { isDarkMode, toggleTheme } = useTheme();

const routesWithIntegratedTheme = ['/administracion', '/delivery'];
const showGlobalThemeToggle = computed(() =>
  !routesWithIntegratedTheme.some((path) => route.path === path || route.path.startsWith(`${path}/`))
);
const shouldRaiseThemeToggle = computed(() => route.path === '/checkout');
const shouldLowerThemeToggle = computed(() => route.path.startsWith('/tracking'));
const shouldRaiseAccessibility = computed(() => route.path === '/checkout');
const shouldRaiseAccessibilityForSupport = computed(() => route.path === '/support');
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in" appear>
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
  <button
    v-if="showGlobalThemeToggle"
    type="button"
    class="foodrush-theme-toggle"
    :class="{
      'foodrush-theme-toggle--with-accessibility': true,
      'foodrush-theme-toggle--raised': shouldRaiseThemeToggle,
      'foodrush-theme-toggle--tracking': shouldLowerThemeToggle,
    }"
    :aria-label="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
    :title="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
    @click="toggleTheme"
  >
    <i :class="isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
  </button>
  <AccessibilityMenu
    :raised="shouldRaiseAccessibility"
    :support-raised="shouldRaiseAccessibilityForSupport"
  />
</template>
