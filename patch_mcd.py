# Guia rapida para presentar:
# Script auxiliar del frontend. Sirve para generar o ajustar archivos durante desarrollo, no para la app en produccion.
# Mantener estos comentarios actualizados si cambia el flujo.
content = """<script setup>
import FranchiseUnified from './FranchiseUnified.vue';
</script>

<template>
  <FranchiseUnified slug="mcdonalds" />
</template>
"""

with open("src/views/McDonalds.vue", "w", encoding="utf-8") as f:
    f.write(content)

print("McDonalds.vue is now unified.")
