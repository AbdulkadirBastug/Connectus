const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const sudo = require('sudo-prompt');

let mainWindow;
let tray;

// --- Main Window Creation ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build/icon.png'), // Set window icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.removeMenu(); // Remove default menu bar

  // Instead of quitting, hide the window to the tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      new Notification({
        title: 'Connectus is running',
        body: 'You can find the app in the system tray.'
      }).show();
    }
    return false;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  mainWindow = createWindow();

  // --- Tray Icon Setup ---
  tray = new Tray(path.join(__dirname, 'assets/icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App', click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit', click: () => {
        app.isQuitting = true; // Set a flag to allow quitting
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Connectus');
  tray.setContextMenu(contextMenu);

  // Show the window when the tray icon is clicked
  tray.on('click', () => {
    mainWindow.show();
  });

  // Send server list to renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    try {
      const servers = JSON.parse(fs.readFileSync(path.join(__dirname, 'servers.json'), 'utf-8'));
      mainWindow.webContents.send('server-list', servers);
    } catch (err) {
      console.error('Error reading servers.json:', err);
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // --- VPN Logic ---
  let isConnected = false;
  const userDataPath = app.getPath('userData');
  const stableConfigPath = path.join(userDataPath, 'wg0-client.conf');
  // Read the client's private key from the secure file
  let clientPrivateKey;
  try {
    const identity = JSON.parse(fs.readFileSync(path.join(__dirname, 'client-identity.json'), 'utf-8'));
    clientPrivateKey = identity.privateKey;
  } catch (err) {
    console.error('CRITICAL: Could not read client-identity.json:', err);
   
    app.quit();
  }

  const sudoOptions = {
    name: 'SecureNet VPN'
  };

  ipcMain.on('vpn-connect', (event, server) => {
    if (!server && !isConnected) {
      console.error('Connect event received without a server selected.');
      return;
    }

    const disconnectCommand = `wireguard /uninstalltunnelservice wg0-client`;

    if (isConnected) {
      // --- Disconnect ---
      sudo.exec(disconnectCommand, sudoOptions, (error) => {
        if (error) {
          mainWindow.webContents.send('vpn-status-changed', { isConnected: true, message: 'Error disconnecting' });
          return;
        }

        isConnected = false;
        mainWindow.webContents.send('vpn-status-changed', { isConnected: false, message: 'Disconnected' });
      });
    } else {
      // --- Connect ---
      const configContent = `[Interface]\nPrivateKey = ${clientPrivateKey}\nAddress = 10.0.0.2/32\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = ${server.publicKey}\nEndpoint = ${server.endpoint}\nAllowedIPs = 0.0.0.0/0`;
      try {
        fs.writeFileSync(stableConfigPath, configContent);
      } catch (err) {
        mainWindow.webContents.send('vpn-status-changed', { isConnected: false, message: 'Config Write Failed' });
        return;
      }
      const command = `wireguard /installtunnelservice "${stableConfigPath}"`;
      sudo.exec(command, sudoOptions, (error) => {
        if (error) {
          mainWindow.webContents.send('vpn-status-changed', { isConnected: false, message: 'Connection Failed' });
          return;
        }

        isConnected = true;
        mainWindow.webContents.send('vpn-status-changed', { isConnected: true, message: `Connected to ${server.name}` });
      });
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    // On Windows, closing all windows does not quit the app if the tray icon is present
  } else {
    app.quit();
  }
});