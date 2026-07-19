import * as db from '../database/index.js'
import { readFileSync } from 'fs'
import log from 'electron-log/main'

const APP_VERSION = '1.0.0'
const SUPPORTED_VERSION = '1.0'

export function exportWeekToGGW(semanaId) {
  log.info(`Exporting week ${semanaId} to GGW...`)

  // Get semana data
  const semanas = db.getSemanas(true)
  const semana = semanas.find((s) => s.id === semanaId)
  if (!semana) {
    throw new Error('Semana no encontrada')
  }

  // Get all salidas for the week
  const salidas = db.getSalidasBySemana(semanaId)

  // Get used chofers and vehiculos
  const choferIds = [...new Set(salidas.map((s) => s.chofer_id).filter(Boolean))]
  const vehiculoIds = [...new Set(salidas.map((s) => s.vehiculo_id))]

  const chofers = choferIds.map((id) => {
    const allChofers = db.getChofers()
    return allChofers.find((c) => c.id === id)
  }).filter(Boolean)

  const vehiculos = vehiculoIds.map((id) => {
    const allVehiculos = db.getVehiculos()
    return allVehiculos.find((v) => v.id === id)
  }).filter(Boolean)

  // Get costos
  const costos = db.getCostosCombustible()

  // Calculate totals
  const totalKilometros = salidas.reduce((sum, s) => sum + s.kilometros, 0)
  const totalCosto = salidas.reduce((sum, s) => sum + s.costo_total, 0)

  // Build GGW DTO
  const ggwDTO = {
    version: '1.0',
    type: 'week_export',
    metadata: {
      exportDate: new Date().toISOString(),
      appVersion: APP_VERSION,
      weekStart: semana.fecha_inicio
    },
    config: {
      chofers: chofers.map((c) => ({ nombre: c.nombre })),
      vehiculos: vehiculos.map((v) => ({
        nombre: v.nombre,
        combustible_tipo: v.combustible_tipo,
        rendimiento: v.rendimiento,
        sin_chofer: v.sin_chofer
      })),
      costos_combustible: costos
    },
    week: {
      fecha_inicio: semana.fecha_inicio,
      salidas: salidas.map((s) => ({
        destino: s.destino,
        chofer: s.chofer_nombre || null,
        vehiculo: s.vehiculo_nombre,
        fecha: s.fecha,
        kilometros: s.kilometros,
        ida_regreso: s.ida_regreso,
        costo_total: s.costo_total
      })),
      totales: {
        total_kilometros: totalKilometros,
        total_costo: totalCosto
      }
    }
  }

  log.info(`GGW export completed: ${salidas.length} salidas`)
  return ggwDTO
}

export function importWeekFromGGW(filePath) {
  log.info(`Importing week from GGW: ${filePath}`)

  // Read and parse file
  const content = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(content)

  // Validate version
  if (data.version !== SUPPORTED_VERSION) {
    throw new Error(`Versión no soportada: ${data.version}. Se requiere ${SUPPORTED_VERSION}`)
  }

  // Validate structure
  if (!data.metadata || !data.config || !data.week) {
    throw new Error('Estructura de archivo inválida')
  }

  // Process config - upsert chofers
  const choferMap = {}
  for (const choferData of data.config.chofers) {
    const normalizedNombre = choferData.nombre.toUpperCase().trim()
    try {
      // Try to find existing
      const existing = db.getChofers().find(
        (c) => c.nombre.toUpperCase() === normalizedNombre
      )
      if (existing) {
        choferMap[normalizedNombre] = existing.id
      } else {
        const newChofer = db.addChofer(normalizedNombre)
        choferMap[normalizedNombre] = newChofer.id
      }
    } catch (error) {
      log.warn(`Could not process chofer ${normalizedNombre}:`, error.message)
    }
  }

  // Process config - upsert vehiculos
  const vehiculoMap = {}
  for (const vehiculoData of data.config.vehiculos) {
    const normalizedNombre = vehiculoData.nombre.toUpperCase().trim()
    try {
      const existing = db.getVehiculos().find(
        (v) => v.nombre.toUpperCase() === normalizedNombre
      )
      if (existing) {
        vehiculoMap[normalizedNombre] = existing.id
      } else {
        const newVehiculo = db.addVehiculo({
          nombre: normalizedNombre,
          sin_chofer: vehiculoData.sin_chofer || false,
          rendimiento: vehiculoData.rendimiento,
          combustible_tipo: vehiculoData.combustible_tipo
        })
        vehiculoMap[normalizedNombre] = newVehiculo.id
      }
    } catch (error) {
      log.warn(`Could not process vehiculo ${normalizedNombre}:`, error.message)
    }
  }

  // Update costos if provided
  if (data.config.costos_combustible) {
    try {
      if (data.config.costos_combustible.gasolina !== undefined) {
        db.updateCostoCombustible('gasolina', data.config.costos_combustible.gasolina)
      }
      if (data.config.costos_combustible.diesel !== undefined) {
        db.updateCostoCombustible('diesel', data.config.costos_combustible.diesel)
      }
    } catch (error) {
      log.warn('Could not update costos:', error.message)
    }
  }

  // Check if semana exists
  const semanas = db.getSemanas()
  let semanaId
  const existingSemana = semanas.find((s) => s.fecha_inicio === data.week.fecha_inicio)

  if (existingSemana) {
    // Return info for the UI to ask user what to do
    return {
      success: true,
      needsDecision: true,
      message: 'La semana ya existe. ¿Desea reemplazar o fusionar?',
      semanaId: existingSemana.id,
      data: data,
      choferMap: choferMap,
      vehiculoMap: vehiculoMap
    }
  }

  // Create new semana
  const newSemana = db.addSemana(data.week.fecha_inicio)
  semanaId = newSemana.id

  // Import salidas
  const importedSalidas = importSalidas(data.week.salidas, semanaId, choferMap, vehiculoMap)

  log.info(`GGW import completed: ${importedSalidas.length} salidas imported`)
  return {
    success: true,
    message: `Semana importada exitosamente. ${importedSalidas.length} salidas agregadas.`
  }
}

export function mergeOrReplaceWeek(semanaId, data, choferMap, vehiculoMap, mode) {
  if (mode === 'replace') {
    // Soft delete existing semana
    db.softDeleteSemana(semanaId)

    // Create new semana
    const newSemana = db.addSemana(data.week.fecha_inicio)
    semanaId = newSemana.id
  }

  // mode === 'merge' means we keep existing semana and add to it

  const importedSalidas = importSalidas(data.week.salidas, semanaId, choferMap, vehiculoMap)

  return {
    success: true,
    message: `Semana importada exitosamente. ${importedSalidas.length} salidas agregadas.`
  }
}

function importSalidas(salidasData, semanaId, choferMap, vehiculoMap) {
  const imported = []

  for (const salidaData of salidasData) {
    const choferNombre = salidaData.chofer?.toUpperCase().trim()
    const vehiculoNombre = salidaData.vehiculo?.toUpperCase().trim()

    const choferId = choferNombre ? choferMap[choferNombre] : null
    const vehiculoId = vehiculoMap[vehiculoNombre]

    if (!vehiculoId) {
      log.warn(`Vehículo ${salidaData.vehiculo} no encontrado, saltando salida`)
      continue
    }

    try {
      const salida = db.addSalida({
        semana_id: semanaId,
        destino: salidaData.destino,
        chofer_id: choferId,
        vehiculo_id: vehiculoId,
        fecha: salidaData.fecha,
        kilometros: salidaData.kilometros,
        ida_regreso: salidaData.ida_regreso
      })
      imported.push(salida)
    } catch (error) {
      log.warn(`Could not import salida ${salidaData.destino}:`, error.message)
    }
  }

  return imported
}
