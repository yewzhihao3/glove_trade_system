const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getEnv: () => process.env.NODE_ENV
});
