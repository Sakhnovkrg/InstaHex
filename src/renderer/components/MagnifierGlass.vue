<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  x: number
  y: number
  size: number
  color: string
}>()

const emit = defineEmits<{
  canvasReady: [canvas: HTMLCanvasElement]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (canvasRef.value) {
    emit('canvasReady', canvasRef.value)
  }
})
</script>

<template>
  <div
    class="magnifier"
    :style="{
      left: x + 'px',
      top: y + 'px',
      width: size + 'px',
      height: size + 'px',
    }"
  >
    <canvas ref="canvasRef" :width="size" :height="size" class="magnifier-canvas"></canvas>
    <div class="color-info">
      <div class="color-preview" :style="{ backgroundColor: color }"></div>
      <span class="color-hex">{{ color.toUpperCase() }}</span>
    </div>
  </div>
</template>

<style scoped>
.magnifier {
  position: fixed;
  pointer-events: none;
  border: 3px solid #fff;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.magnifier-canvas {
  display: block;
  border-radius: 50%;
}

.color-info {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 6px 12px;
  border-radius: 6px;
  white-space: nowrap;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.color-hex {
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
}
</style>
