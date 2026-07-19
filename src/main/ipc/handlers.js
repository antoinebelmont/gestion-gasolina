import { ipcMain, dialog } from 'electron'
import { writeFileSync } from 'fs'
import log from 'electron-log/main'
import * as db from '../database/index.js'
import { exportWeekToGGW, importWeekFromGGW } from '../services/ggwService.js'
import { exportWeekToExcel } from '../services/excelService.js'

export function registerAllHandlers() {
  log.info('Registering IPC handlers...')

  // ─── Chofers ────────────────────────────────────────────────
  ipcMain.handle('db:chofers:getAll', async () => {
    try {
      return { success: true, data: db.getChofers() }
    } catch (error) {
      log.error('Error getting chofers:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:chofers:create', async (_, data) => {
    try {
      const chofer = db.addChofer(data.nombre)
      return { success: true, data: chofer }
    } catch (error) {
      log.error('Error creating chofer:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:chofers:update', async (_, data) => {
    try {
      const chofer = db.updateChofer(data.id, data.nombre)
      return { success: true, data: chofer }
    } catch (error) {
      log.error('Error updating chofer:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:chofers:delete', async (_, id) => {
    try {
      db.deleteChofer(id)
      return { success: true }
    } catch (error) {
      log.error('Error deleting chofer:', error)
      return { success: false, error: error.message }
    }
  })

  // ─── Vehículos ─────────────────────────────────────────────
  ipcMain.handle('db:vehiculos:getAll', async () => {
    try {
      return { success: true, data: db.getVehiculos() }
    } catch (error) {
      log.error('Error getting vehiculos:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:vehiculos:create', async (_, data) => {
    try {
      const vehiculo = db.addVehiculo(data)
      return { success: true, data: vehiculo }
    } catch (error) {
      log.error('Error creating vehiculo:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:vehiculos:update', async (_, data) => {
    try {
      const vehiculo = db.updateVehiculo(data.id, data)
      return { success: true, data: vehiculo }
    } catch (error) {
      log.error('Error updating vehiculo:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:vehiculos:delete', async (_, id) => {
    try {
      db.deleteVehiculo(id)
      return { success: true }
    } catch (error) {
      log.error('Error deleting vehiculo:', error)
      return { success: false, error: error.message }
    }
  })

  // ─── Costos ────────────────────────────────────────────────
  ipcMain.handle('db:costos:get', async () => {
    try {
      return { success: true, data: db.getCostosCombustible() }
    } catch (error) {
      log.error('Error getting costos:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:costos:update', async (_, data) => {
    try {
      // Update both gasoline and diesel
      if (data.gasolina !== undefined) {
        db.updateCostoCombustible('gasolina', data.gasolina)
      }
      if (data.diesel !== undefined) {
        db.updateCostoCombustible('diesel', data.diesel)
      }
      return { success: true, data: db.getCostosCombustible() }
    } catch (error) {
      log.error('Error updating costos:', error)
      return { success: false, error: error.message }
    }
  })

  // ─── Semanas ───────────────────────────────────────────────
  ipcMain.handle('db:semanas:getAll', async () => {
    try {
      return { success: true, data: db.getSemanas() }
    } catch (error) {
      log.error('Error getting semanas:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:semanas:create', async (_, data) => {
    try {
      const semana = db.addSemana(data.fecha_inicio)
      return { success: true, data: semana }
    } catch (error) {
      log.error('Error creating semana:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:semanas:delete', async (_, id) => {
    try {
      db.softDeleteSemana(id)
      return { success: true }
    } catch (error) {
      log.error('Error deleting semana:', error)
      return { success: false, error: error.message }
    }
  })

  // ─── Salidas ───────────────────────────────────────────────
  ipcMain.handle('db:salidas:getBySemana', async (_, semanaId) => {
    try {
      return { success: true, data: db.getSalidasBySemana(semanaId) }
    } catch (error) {
      log.error('Error getting salidas:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:salidas:create', async (_, data) => {
    try {
      const salida = db.addSalida(data)
      return { success: true, data: salida }
    } catch (error) {
      log.error('Error creating salida:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:salidas:update', async (_, data) => {
    try {
      const salida = db.updateSalida(data.id, data)
      return { success: true, data: salida }
    } catch (error) {
      log.error('Error updating salida:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:salidas:delete', async (_, id) => {
    try {
      db.deleteSalida(id)
      return { success: true }
    } catch (error) {
      log.error('Error deleting salida:', error)
      return { success: false, error: error.message }
    }
  })

  // ─── Dashboard ─────────────────────────────────────────────
  ipcMain.handle('db:dashboard:getWeeklyTotal', async () => {
    try {
      return { success: true, data: db.getWeeklyTotal() }
    } catch (error) {
      log.error('Error getting weekly total:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:dashboard:getTotalKilometers', async () => {
    try {
      return { success: true, data: db.getTotalKilometers() }
    } catch (error) {
      log.error('Error getting total kilometers:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:dashboard:getTopChofers', async (_, limit) => {
    try {
      return { success: true, data: db.getTopChofers(limit) }
    } catch (error) {
      log.error('Error getting top chofers:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:dashboard:getTopVehiculos', async (_, limit) => {
    try {
      return { success: true, data: db.getTopVehiculos(limit) }
    } catch (error) {
      log.error('Error getting top vehiculos:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:dashboard:getWeeklyCosts', async (_, weeks) => {
    try {
      return { success: true, data: db.getWeeklyCosts(weeks) }
    } catch (error) {
      log.error('Error getting weekly costs:', error)
      return { success: false, error: error.message }
    }
  })

  // ─── File Operations ───────────────────────────────────────
  ipcMain.handle('file:export:ggw', async (_, semanaId) => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Exportar semana',
        defaultPath: `semana-${semanaId}.ggw`,
        filters: [{ name: 'GGW Files', extensions: ['ggw'] }]
      })

      if (result.canceled) {
        return { success: false, canceled: true }
      }

      const ggwData = exportWeekToGGW(semanaId)
      writeFileSync(result.filePath, JSON.stringify(ggwData, null, 2), 'utf-8')

      return { success: true, filePath: result.filePath }
    } catch (error) {
      log.error('Error exporting GGW:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('file:export:xlsx', async (_, semanaId) => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Exportar a Excel',
        defaultPath: `semana-${semanaId}.xlsx`,
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      })

      if (result.canceled) {
        return { success: false, canceled: true }
      }

      await exportWeekToExcel(semanaId, result.filePath)

      return { success: true, filePath: result.filePath }
    } catch (error) {
      log.error('Error exporting XLSX:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('file:import:ggw', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Importar semana',
        filters: [{ name: 'GGW Files', extensions: ['ggw'] }],
        properties: ['openFile']
      })

      if (result.canceled) {
        return { success: false, canceled: true }
      }

      const importResult = importWeekFromGGW(result.filePaths[0])
      return importResult
    } catch (error) {
      log.error('Error importing GGW:', error)
      return { success: false, error: error.message }
    }
  })

  log.info('All IPC handlers registered successfully')
}
