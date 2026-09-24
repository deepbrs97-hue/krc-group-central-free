const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('krcDesktop', {
  openExternal: (url) => ipcRenderer.invoke('krc-open-external', url)
});
