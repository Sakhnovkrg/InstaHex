import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  screen,
  desktopCapturer,
  clipboard,
  shell,
} from 'electron'
import { join } from 'path'
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { homedir } from 'os'

let tray: Tray | null = null
let pickerWindow: BrowserWindow | null = null
let aboutWindow: BrowserWindow | null = null

// Linux autostart helpers
function getLinuxAutostartPath(): string {
  return join(homedir(), '.config', 'autostart', 'instahex.desktop')
}

function getLinuxAutoLaunch(): boolean {
  if (process.platform !== 'linux') return false
  return existsSync(getLinuxAutostartPath())
}

function setLinuxAutoLaunch(enable: boolean): void {
  if (process.platform !== 'linux') return

  const autostartDir = join(homedir(), '.config', 'autostart')
  const desktopPath = getLinuxAutostartPath()

  if (enable) {
    if (!existsSync(autostartDir)) {
      mkdirSync(autostartDir, { recursive: true })
    }
    const desktopEntry = `[Desktop Entry]
Type=Application
Name=InstaHex
Exec=${process.execPath}
Icon=instahex
Terminal=false
Categories=Utility;
`
    writeFileSync(desktopPath, desktopEntry)
  } else {
    if (existsSync(desktopPath)) {
      unlinkSync(desktopPath)
    }
  }
}

function isAutoLaunchEnabled(): boolean {
  if (process.platform === 'linux') {
    return getLinuxAutoLaunch()
  }
  return app.getLoginItemSettings().openAtLogin
}

function setAutoLaunch(enable: boolean): void {
  if (process.platform === 'linux') {
    setLinuxAutoLaunch(enable)
  } else {
    app.setLoginItemSettings({ openAtLogin: enable })
  }
}

function createTray() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const iconPath = join(__dirname, 'static', iconName)
  tray = new Tray(iconPath)
  tray.setToolTip('InstaHex')

  updateTrayMenu()

  tray.on('click', () => {
    startColorPicker()
  })
}

function updateTrayMenu() {
  const isAutoLaunch = isAutoLaunchEnabled()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Launch at startup',
      type: 'checkbox',
      checked: isAutoLaunch,
      click: () => {
        setAutoLaunch(!isAutoLaunch)
        updateTrayMenu()
      },
    },
    { type: 'separator' },
    {
      label: 'About',
      click: () => {
        openAboutWindow()
      },
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit()
      },
    },
  ])

  tray?.setContextMenu(contextMenu)
}

async function startColorPicker() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size
  const scaleFactor = primaryDisplay.scaleFactor

  // Use physical pixels for screenshot to handle DPI scaling
  const physicalWidth = Math.floor(width * scaleFactor)
  const physicalHeight = Math.floor(height * scaleFactor)

  // Capture screenshot
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: physicalWidth, height: physicalHeight },
  })

  const primarySource = sources[0]
  if (!primarySource) return

  const screenshot = primarySource.thumbnail.toDataURL()

  // Create fullscreen window
  pickerWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2]
    pickerWindow.loadURL(`http://localhost:${rendererPort}`)
  } else {
    pickerWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'))
  }

  pickerWindow.webContents.once('did-finish-load', () => {
    pickerWindow?.webContents.send('screenshot', screenshot, scaleFactor)
  })

  pickerWindow.on('closed', () => {
    pickerWindow = null
  })
}

app.whenReady().then(() => {
  createTray()
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

ipcMain.on('message', (event, message) => {
  console.log(message)
})

ipcMain.on('pick-color', (_event, color: string) => {
  clipboard.writeText(color)
  pickerWindow?.close()
})

ipcMain.on('close-picker', () => {
  pickerWindow?.close()
})

ipcMain.on('open-external', (_event, url: string) => {
  shell.openExternal(url)
})

ipcMain.on('close-about', () => {
  aboutWindow?.close()
})

ipcMain.on('get-window-type', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win === pickerWindow) {
    event.returnValue = 'picker'
  } else if (win === aboutWindow) {
    event.returnValue = 'about'
  } else {
    event.returnValue = 'picker'
  }
})

function openAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus()
    return
  }

  const aboutIconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  aboutWindow = new BrowserWindow({
    title: 'About',
    icon: join(__dirname, 'static', aboutIconName),
    width: 300,
    height: 330,
    resizable: false,
    maximizable: false,
    minimizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  aboutWindow.setMenu(null)

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2]
    aboutWindow.loadURL(`http://localhost:${rendererPort}/#about`)
  } else {
    aboutWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'), {
      hash: 'about',
    })
  }

  aboutWindow.on('closed', () => {
    aboutWindow = null
  })
}
