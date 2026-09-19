const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('immich', {
  loadPeople: (connection) => ipcRenderer.invoke('load-people', connection),
  getLogPath: () => ipcRenderer.invoke('log-path')
});
