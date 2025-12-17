/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  sendMessage: (message: string) => void
  onScreenshot: (callback: (screenshot: string) => void) => void
  pickColor: (color: string) => void
  closePicker: () => void
  openExternal: (url: string) => void
  closeAbout: () => void
  getWindowType: () => 'picker' | 'about'
}

declare global {
  interface Window {
    electronAPI: ElectronApi
  }
}
