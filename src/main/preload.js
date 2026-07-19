import { contextBridge, ipcRenderer } from 'electron'

// Expose API to renderer process
contextBridge.exposeInMainWorld('api', {
  // Chofers
  db: {
    chofers: {
      getAll: () => ipcRenderer.invoke('db:chofers:getAll'),
      create: (data) => ipcRenderer.invoke('db:chofers:create', data),
      update: (data) => ipcRenderer.invoke('db:chofers:update', data),
      delete: (id) => ipcRenderer.invoke('db:chofers:delete', id)
    },

    // Vehículos
    vehiculos: {
      getAll: () => ipcRenderer.invoke('db:vehiculos:getAll'),
      create: (data) => ipcRenderer.invoke('db:vehiculos:create', data),
      update: (data) => ipcRenderer.invoke('db:vehiculos:update', data),
      delete: (id) => ipcRenderer.invoke('db:vehiculos:delete', id)
    },

    // Costos
    costos: {
      get: () => ipcRenderer.invoke('db:costos:get'),
      update: (data) => ipcRenderer.invoke('db:costos:update', data)
    },

    // Semanas
    semanas: {
      getAll: () => ipcRenderer.invoke('db:semanas:getAll'),
      create: (data) => ipcRenderer.invoke('db:semanas:create', data),
      delete: (id) => ipcRenderer.invoke('db:semanas:delete', id)
    },

    // Salidas
    salidas: {
      getBySemana: (semanaId) => ipcRenderer.invoke('db:salidas:getBySemana', semanaId),
      create: (data) => ipcRenderer.invoke('db:salidas:create', data),
      update: (data) => ipcRenderer.invoke('db:salidas:update', data),
      delete: (id) => ipcRenderer.invoke('db:salidas:delete', id)
    },

    // Dashboard
    dashboard: {
      getWeeklyTotal: () => ipcRenderer.invoke('db:dashboard:getWeeklyTotal'),
      getTotalKilometers: () => ipcRenderer.invoke('db:dashboard:getTotalKilometers'),
      getTopChofers: (limit) => ipcRenderer.invoke('db:dashboard:getTopChofers', limit),
      getTopVehiculos: (limit) => ipcRenderer.invoke('db:dashboard:getTopVehiculos', limit),
      getWeeklyCosts: (weeks) => ipcRenderer.invoke('db:dashboard:getWeeklyCosts', weeks)
    }
  },

  // File operations
  file: {
    export: {
      ggw: (semanaId) => ipcRenderer.invoke('file:export:ggw', semanaId),
      xlsx: (semanaId) => ipcRenderer.invoke('file:export:xlsx', semanaId)
    },
    import: {
      ggw: () => ipcRenderer.invoke('file:import:ggw')
    }
  }
})
