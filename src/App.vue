<!--
  Guia rapida para presentar:
  Componente raiz. Renderiza la ruta actual.
  Buscar en VS Code: shell app, router-view.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in" appear>
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>
