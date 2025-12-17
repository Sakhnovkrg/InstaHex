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

let tray: Tray | null = null
let pickerWindow: BrowserWindow | null = null
let aboutWindow: BrowserWindow | null = null

function createTray() {
  const iconPath = join(__dirname, 'static', 'icon.ico')
  tray = new Tray(iconPath)
  tray.setToolTip('InstaHex')

  updateTrayMenu()

  tray.on('click', () => {
    startColorPicker()
  })
}

function updateTrayMenu() {
  const isAutoLaunch = app.getLoginItemSettings().openAtLogin

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Launch at startup',
      type: 'checkbox',
      checked: isAutoLaunch,
      click: () => {
        app.setLoginItemSettings({
          openAtLogin: !isAutoLaunch,
        })
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

  // Capture screenshot
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height },
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
    pickerWindow?.webContents.send('screenshot', screenshot)
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

  aboutWindow = new BrowserWindow({
    title: 'About',
    icon: join(__dirname, 'static', 'icon.ico'),
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
