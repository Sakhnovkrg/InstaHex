import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ColorPickerConfig {
  magnifierSize: number
  zoomLevel: number
  magnifierOffset: number
  colorInfoHeight: number
}

const DEFAULT_CONFIG: ColorPickerConfig = {
  magnifierSize: 150,
  zoomLevel: 10,
  magnifierOffset: 20,
  colorInfoHeight: 45,
}

export function useColorPicker(config: Partial<ColorPickerConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const pixelCount = Math.floor(cfg.magnifierSize / cfg.zoomLevel)

  const canvas = ref<HTMLCanvasElement | null>(null)
  const magnifierCanvas = ref<HTMLCanvasElement | null>(null)

  const mouseX = ref(0)
  const mouseY = ref(0)
  const currentColor = ref('#000000')
  const isReady = ref(false)
  const dpr = ref(1)

  let ctx: CanvasRenderingContext2D | null = null

  const magnifierPosition = computed(() => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    const fitsRight = mouseX.value + cfg.magnifierOffset + cfg.magnifierSize <= screenWidth
    const fitsBottom =
      mouseY.value + cfg.magnifierOffset + cfg.magnifierSize + cfg.colorInfoHeight <= screenHeight

    return {
      x: fitsRight
        ? mouseX.value + cfg.magnifierOffset
        : mouseX.value - cfg.magnifierOffset - cfg.magnifierSize,
      y: fitsBottom
        ? mouseY.value + cfg.magnifierOffset
        : mouseY.value - cfg.magnifierOffset - cfg.magnifierSize,
    }
  })

  function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  }

  function handleScreenshot(data: string) {
    const screenshotImage = new Image()
    screenshotImage.onload = () => {
      if (canvas.value) {
        canvas.value.width = screenshotImage.width
        canvas.value.height = screenshotImage.height
        canvas.value.style.width = window.innerWidth + 'px'
        canvas.value.style.height = window.innerHeight + 'px'

        ctx = canvas.value.getContext('2d', { willReadFrequently: true })
        ctx?.drawImage(screenshotImage, 0, 0)
        isReady.value = true
      }
    }
    screenshotImage.src = data
  }

  function updateMagnifier() {
    if (!ctx || !magnifierCanvas.value || !canvas.value) return

    const magCtx = magnifierCanvas.value.getContext('2d')
    if (!magCtx) return

    const imgX = Math.floor(mouseX.value * dpr.value)
    const imgY = Math.floor(mouseY.value * dpr.value)
    const halfPixels = Math.floor(pixelCount / 2)

    magCtx.clearRect(0, 0, cfg.magnifierSize, cfg.magnifierSize)

    // Draw zoomed pixels
    for (let y = 0; y < pixelCount; y++) {
      for (let x = 0; x < pixelCount; x++) {
        const srcX = imgX + (x - halfPixels)
        const srcY = imgY + (y - halfPixels)

        if (srcX >= 0 && srcX < canvas.value.width && srcY >= 0 && srcY < canvas.value.height) {
          const pixel = ctx.getImageData(srcX, srcY, 1, 1).data
          magCtx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
        } else {
          magCtx.fillStyle = '#000'
        }

        magCtx.fillRect(x * cfg.zoomLevel, y * cfg.zoomLevel, cfg.zoomLevel, cfg.zoomLevel)
      }
    }

    // Draw grid
    magCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    magCtx.lineWidth = 0.5
    for (let i = 0; i <= pixelCount; i++) {
      magCtx.beginPath()
      magCtx.moveTo(i * cfg.zoomLevel, 0)
      magCtx.lineTo(i * cfg.zoomLevel, cfg.magnifierSize)
      magCtx.stroke()

      magCtx.beginPath()
      magCtx.moveTo(0, i * cfg.zoomLevel)
      magCtx.lineTo(cfg.magnifierSize, i * cfg.zoomLevel)
      magCtx.stroke()
    }

    // Highlight center pixel
    const centerOffset = halfPixels * cfg.zoomLevel
    magCtx.strokeStyle = '#fff'
    magCtx.lineWidth = 2
    magCtx.strokeRect(centerOffset, centerOffset, cfg.zoomLevel, cfg.zoomLevel)

    // Get center pixel color
    if (imgX >= 0 && imgX < canvas.value.width && imgY >= 0 && imgY < canvas.value.height) {
      const pixel = ctx.getImageData(imgX, imgY, 1, 1).data
      currentColor.value = rgbToHex(pixel[0], pixel[1], pixel[2])
    }
  }

  function handleMouseMove(e: MouseEvent) {
    mouseX.value = e.clientX
    mouseY.value = e.clientY
    updateMagnifier()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      window.electronAPI.closePicker()
    }
  }

  function pickColor() {
    window.electronAPI.pickColor(currentColor.value)
  }

  onMounted(() => {
    dpr.value = window.devicePixelRatio || 1
    window.electronAPI.onScreenshot(handleScreenshot)
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  function setMagnifierCanvas(canvasEl: HTMLCanvasElement) {
    magnifierCanvas.value = canvasEl
  }

  return {
    // Refs
    canvas,
    magnifierCanvas,
    mouseX,
    mouseY,
    currentColor,
    isReady,

    // Computed
    magnifierPosition,

    // Config
    config: cfg,
    pixelCount,

    // Methods
    handleMouseMove,
    pickColor,
    setMagnifierCanvas,
  }
}
