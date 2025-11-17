const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile: async () => ipcRenderer.invoke('open-file-dialog'),
  saveExplanation: async (payload) => ipcRenderer.invoke('save-explanation', payload),
  onTriggerOpenFile: (callback) => ipcRenderer.on('trigger-open-file', callback),
  onTriggerSave: (callback) => ipcRenderer.on('trigger-save', callback)
});
