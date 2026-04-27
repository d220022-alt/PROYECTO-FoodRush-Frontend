<script setup>
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page" mode="out-in" appear>
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>
