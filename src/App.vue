<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from './services/theme';

const route = useRoute();
const { isDarkMode, toggleTheme } = useTheme();

const routesWithIntegratedTheme = ['/administracion', '/delivery'];
const showGlobalThemeToggle = computed(() =>
  !routesWithIntegratedTheme.some((path) => route.path === path || route.path.startsWith(`${path}/`))
);
const shouldRaiseThemeToggle = computed(() => route.path === '/checkout');
const shouldLowerThemeToggle = computed(() => route.path.startsWith('/tracking'));
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
      'foodrush-theme-toggle--raised': shouldRaiseThemeToggle,
      'foodrush-theme-toggle--tracking': shouldLowerThemeToggle,
    }"
    :aria-label="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
    :title="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
    @click="toggleTheme"
  >
    <i :class="isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
  </button>
</template>
