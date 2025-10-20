// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  connect: (server) => ipcRenderer.send('vpn-connect', server),
  onVPNStatusChanged: (callback) => ipcRenderer.on('vpn-status-changed', (event, ...args) => callback(...args)),
  onServerList: (callback) => ipcRenderer.on('server-list', (event, ...args) => callback(...args))
});