import { contextBridge, ipcRenderer, shell } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  onScreenshot: (callback: (screenshot: string) => void) => {
    ipcRenderer.on('screenshot', (_event, screenshot) => callback(screenshot))
  },
  pickColor: (color: string) => ipcRenderer.send('pick-color', color),
  closePicker: () => ipcRenderer.send('close-picker'),
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  closeAbout: () => ipcRenderer.send('close-about'),
  getWindowType: () => ipcRenderer.sendSync('get-window-type'),
})
