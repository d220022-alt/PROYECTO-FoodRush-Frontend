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
