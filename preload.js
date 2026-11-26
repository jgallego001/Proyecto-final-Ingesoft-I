const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  run: (method, ...args) => ipcRenderer.invoke('nexo', method, ...args)
});
