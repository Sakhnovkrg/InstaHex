<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useColorPicker } from './composables/useColorPicker'
import MagnifierGlass from './components/MagnifierGlass.vue'
import Crosshair from './components/Crosshair.vue'
import AboutView from './views/AboutView.vue'

const windowType = ref<'picker' | 'about'>('picker')

onMounted(() => {
  if (window.location.hash === '#about') {
    windowType.value = 'about'
  }
})

const {
  canvas,
  mouseX,
  mouseY,
  currentColor,
  magnifierPosition,
  config,
  handleMouseMove,
  pickColor,
  setMagnifierCanvas,
} = useColorPicker()
</script>

<template>
  <AboutView v-if="windowType === 'about'" />

  <div v-else class="picker-container" @mousemove="handleMouseMove" @click="pickColor">
    <canvas ref="canvas" class="screenshot"></canvas>

    <MagnifierGlass
      :x="magnifierPosition.x"
      :y="magnifierPosition.y"
      :size="config.magnifierSize"
      :color="currentColor"
      @canvas-ready="setMagnifierCanvas"
    />

    <Crosshair :x="mouseX" :y="mouseY" />
  </div>
</template>

<style scoped>
.picker-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  cursor: crosshair;
  overflow: hidden;
}

.screenshot {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
