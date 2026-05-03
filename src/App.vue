<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from './services/theme';

const route = useRoute();
const { isDarkMode, toggleTheme } = useTheme();

const routesWithIntegratedTheme = new Set(['administracion', 'delivery']);
const showGlobalThemeToggle = computed(() => !routesWithIntegratedTheme.has(String(route.name || '')));
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
    :aria-label="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
    :title="isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
    @click="toggleTheme"
  >
    <i :class="isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
  </button>
</template>
