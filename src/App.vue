<!--
  Guia rapida para presentar:
  Componente raiz. Renderiza la ruta actual y mantiene el acceso global de accesibilidad.
  Buscar en VS Code: shell app, boton accesibilidad, router-view.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AccessibilityMenu from './components/AccessibilityMenu.vue';

const route = useRoute();
const shouldRaiseAccessibility = computed(() => route.path === '/checkout');
const shouldRaiseAccessibilityForSupport = computed(() => route.path === '/support');
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in" appear>
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
  <AccessibilityMenu
    :raised="shouldRaiseAccessibility"
    :support-raised="shouldRaiseAccessibilityForSupport"
  />
</template>
