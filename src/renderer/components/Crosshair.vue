<script setup lang="ts">
defineProps<{
  x: number
  y: number
}>()
</script>

<template>
  <div class="crosshair-h" :style="{ top: y + 'px' }"></div>
  <div class="crosshair-v" :style="{ left: x + 'px' }"></div>
</template>

<style scoped>
.crosshair-h,
.crosshair-v {
  position: fixed;
  background: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  z-index: 999;
}

.crosshair-h {
  left: 0;
  width: 100%;
  height: 1px;
}

.crosshair-v {
  top: 0;
  width: 1px;
  height: 100%;
}
</style>
