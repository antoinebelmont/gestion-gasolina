import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import log from 'electron-log/main'

let db = null

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'gestion-gasolina.db')

  log.info(`Initializing database at: ${dbPath}`)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations()
  seedIfEmpty()

  log.info('Database initialized successfully')
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    log.info('Database closed')
  }
}

function runMigrations() {
  log.info('Running migrations...')

  // Create migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const appliedMigrations = db
    .prepare('SELECT name FROM migrations')
    .all()
    .map((m) => m.name)

  const migrations = [
    {
      name: '001_initial_schema',
      up: `
        CREATE TABLE IF NOT EXISTS chofers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE COLLATE NOCASE
        );

        CREATE TABLE IF NOT EXISTS vehiculos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
          sin_chofer INTEGER DEFAULT 0,
          rendimiento INTEGER NOT NULL,
          combustible_tipo TEXT NOT NULL CHECK(combustible_tipo IN ('gasolina', 'diesel'))
        );

        CREATE TABLE IF NOT EXISTS costos_combustible (
          id INTEGER PRIMARY KEY,
          tipo TEXT NOT NULL UNIQUE CHECK(tipo IN ('gasolina', 'diesel')),
          precio REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS semanas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_inicio TEXT NOT NULL,
          fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
          activa INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS salidas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          semana_id INTEGER NOT NULL,
          destino TEXT NOT NULL,
          chofer_id INTEGER,
          vehiculo_id INTEGER NOT NULL,
          fecha TEXT NOT NULL,
          kilometros REAL NOT NULL,
          ida_regreso INTEGER DEFAULT 0,
          costo_total REAL,
          FOREIGN KEY (semana_id) REFERENCES semanas(id),
          FOREIGN KEY (chofer_id) REFERENCES chofers(id),
          FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
        );

        CREATE INDEX IF NOT EXISTS idx_salidas_semana ON salidas(semana_id);
        CREATE INDEX IF NOT EXISTS idx_salidas_fecha ON salidas(fecha);
      `
    }
  ]

  for (const migration of migrations) {
    if (!appliedMigrations.includes(migration.name)) {
      log.info(`Applying migration: ${migration.name}`)
      db.exec(migration.up)
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name)
      log.info(`Migration ${migration.name} applied successfully`)
    }
  }
}

function seedIfEmpty() {
  const choferCount = db.prepare('SELECT COUNT(*) as count FROM chofers').get().count

  if (choferCount === 0) {
    log.info('Database is empty, seeding with initial data...')

    // Seed chofers
    const chofers = [
      'MIGUEL',
      'RUBEN',
      'JUAN',
      'NOEMI',
      'BRYAN',
      'JESUS',
      'LEONARDO',
      'GABRIELA',
      'ARMANDO',
      'FIDEL',
      'LUZ MARIA',
      'CELESTE',
      'TALPA',
      'PALOMA',
      'OCTAVIO',
      'ROSA MARIA',
      'IVAN',
      'JOSE DE JESUS',
      'JUAN CARLOS',
      'LUIS FERNANDO',
      'JACOB',
      'PILAR',
      'JORGE',
      'NICOLAS',
      'ALAN'
    ]

    const insertChofer = db.prepare('INSERT INTO chofers (nombre) VALUES (?)')
    for (const nombre of chofers) {
      insertChofer.run(nombre)
    }

    // Seed vehiculos
    const vehiculos = [
      { nombre: 'JETTA', sin_chofer: 0, rendimiento: 6, combustible_tipo: 'gasolina' },
      { nombre: '482', sin_chofer: 0, rendimiento: 8, combustible_tipo: 'diesel' },
      { nombre: '329', sin_chofer: 0, rendimiento: 10, combustible_tipo: 'diesel' },
      { nombre: 'CAMION 380', sin_chofer: 1, rendimiento: 5, combustible_tipo: 'diesel' }
    ]

    const insertVehiculo = db.prepare(
      'INSERT INTO vehiculos (nombre, sin_chofer, rendimiento, combustible_tipo) VALUES (?, ?, ?, ?)'
    )
    for (const v of vehiculos) {
      insertVehiculo.run(v.nombre, v.sin_chofer, v.rendimiento, v.combustible_tipo)
    }

    // Seed costos combustible
    const insertCosto = db.prepare(
      'INSERT INTO costos_combustible (tipo, precio) VALUES (?, ?)'
    )
    insertCosto.run('gasolina', 25.0)
    insertCosto.run('diesel', 28.0)

    log.info('Seed completed successfully')
  }
}

// ─────────────────────────────────────────────────────────────
// CRUD CHOFERS
// ─────────────────────────────────────────────────────────────

export function getChofers() {
  return db.prepare('SELECT id, nombre FROM chofers ORDER BY nombre').all()
}

export function addChofer(nombre) {
  const normalizedNombre = nombre.toUpperCase().trim()
  const stmt = db.prepare('INSERT INTO chofers (nombre) VALUES (?)')
  const result = stmt.run(normalizedNombre)
  return { id: result.lastInsertRowid, nombre: normalizedNombre }
}

export function updateChofer(id, nombre) {
  const normalizedNombre = nombre.toUpperCase().trim()
  const stmt = db.prepare('UPDATE chofers SET nombre = ? WHERE id = ?')
  stmt.run(normalizedNombre, id)
  return { id, nombre: normalizedNombre }
}

export function deleteChofer(id) {
  const stmt = db.prepare('DELETE FROM chofers WHERE id = ?')
  stmt.run(id)
}

// ─────────────────────────────────────────────────────────────
// CRUD VEHÍCULOS
// ─────────────────────────────────────────────────────────────

export function getVehiculos() {
  return db
    .prepare(
      `SELECT id, nombre, sin_chofer, rendimiento, combustible_tipo 
       FROM vehiculos ORDER BY nombre`
    )
    .all()
    .map((v) => ({ ...v, sin_chofer: Boolean(v.sin_chofer) }))
}

export function addVehiculo(data) {
  const normalizedNombre = data.nombre.toUpperCase().trim()
  const stmt = db.prepare(
    `INSERT INTO vehiculos (nombre, sin_chofer, rendimiento, combustible_tipo) 
     VALUES (?, ?, ?, ?)`
  )
  const result = stmt.run(
    normalizedNombre,
    data.sin_chofer ? 1 : 0,
    data.rendimiento,
    data.combustible_tipo
  )
  return {
    id: result.lastInsertRowid,
    nombre: normalizedNombre,
    sin_chofer: Boolean(data.sin_chofer),
    rendimiento: data.rendimiento,
    combustible_tipo: data.combustible_tipo
  }
}

export function updateVehiculo(id, data) {
  const normalizedNombre = data.nombre.toUpperCase().trim()
  const stmt = db.prepare(
    `UPDATE vehiculos 
     SET nombre = ?, sin_chofer = ?, rendimiento = ?, combustible_tipo = ? 
     WHERE id = ?`
  )
  stmt.run(normalizedNombre, data.sin_chofer ? 1 : 0, data.rendimiento, data.combustible_tipo, id)
  return {
    id,
    nombre: normalizedNombre,
    sin_chofer: Boolean(data.sin_chofer),
    rendimiento: data.rendimiento,
    combustible_tipo: data.combustible_tipo
  }
}

export function deleteVehiculo(id) {
  const stmt = db.prepare('DELETE FROM vehiculos WHERE id = ?')
  stmt.run(id)
}

// ─────────────────────────────────────────────────────────────
// CRUD COSTOS COMBUSTIBLE
// ─────────────────────────────────────────────────────────────

export function getCostosCombustible() {
  const rows = db.prepare('SELECT tipo, precio FROM costos_combustible').all()
  const result = {}
  for (const row of rows) {
    result[row.tipo] = row.precio
  }
  return result
}

export function updateCostoCombustible(tipo, precio) {
  const stmt = db.prepare('UPDATE costos_combustible SET precio = ? WHERE tipo = ?')
  stmt.run(precio, tipo)
  return getCostosCombustible()
}

// ─────────────────────────────────────────────────────────────
// CRUD SEMANAS
// ─────────────────────────────────────────────────────────────

export function getSemanas(includeInactive = false) {
  let query = 'SELECT id, fecha_inicio, fecha_creacion, activa FROM semanas'
  if (!includeInactive) {
    query += ' WHERE activa = 1'
  }
  query += ' ORDER BY fecha_inicio DESC'
  return db.prepare(query).all().map((s) => ({ ...s, activa: Boolean(s.activa) }))
}

export function addSemana(fecha_inicio) {
  // Validate that fecha_inicio is a monday
  const date = new Date(fecha_inicio)
  if (date.getUTCDay() !== 1) {
    throw new Error('La fecha de inicio debe ser un lunes')
  }

  const stmt = db.prepare('INSERT INTO semanas (fecha_inicio) VALUES (?)')
  const result = stmt.run(fecha_inicio)
  return {
    id: result.lastInsertRowid,
    fecha_inicio,
    activa: true
  }
}

export function softDeleteSemana(id) {
  const stmt = db.prepare('UPDATE semanas SET activa = 0 WHERE id = ?')
  stmt.run(id)
}

// ─────────────────────────────────────────────────────────────
// CRUD SALIDAS
// ─────────────────────────────────────────────────────────────

function calculateCostoTotal(kilometros, vehiculoId) {
  const vehiculo = db.prepare('SELECT rendimiento, combustible_tipo FROM vehiculos WHERE id = ?').get(vehiculoId)
  if (!vehiculo) {
    throw new Error('Vehículo no encontrado')
  }

  const costos = getCostosCombustible()
  const precio = costos[vehiculo.combustible_tipo]

  if (precio === undefined) {
    throw new Error(`Precio de ${vehiculo.combustible_tipo} no configurado`)
  }

  return Math.round((kilometros / vehiculo.rendimiento) * precio * 100) / 100
}

export function getSalidasBySemana(semanaId) {
  return db
    .prepare(
      `SELECT 
        s.id, s.semana_id, s.destino, s.chofer_id, s.vehiculo_id,
        s.fecha, s.kilometros, s.ida_regreso, s.costo_total,
        c.nombre as chofer_nombre,
        v.nombre as vehiculo_nombre, v.rendimiento as vehiculo_rendimiento,
        v.combustible_tipo as vehiculo_combustible
       FROM salidas s
       LEFT JOIN chofers c ON s.chofer_id = c.id
       JOIN vehiculos v ON s.vehiculo_id = v.id
       WHERE s.semana_id = ?
       ORDER BY s.fecha ASC`
    )
    .all(semanaId)
    .map((s) => ({
      ...s,
      ida_regreso: Boolean(s.ida_regreso),
      chofer_id: s.chofer_id || null
    }))
}

export function addSalida(data) {
  const costo_total = calculateCostoTotal(data.kilometros, data.vehiculo_id)

  const stmt = db.prepare(
    `INSERT INTO salidas (semana_id, destino, chofer_id, vehiculo_id, fecha, kilometros, ida_regreso, costo_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const result = stmt.run(
    data.semana_id,
    data.destino.trim(),
    data.chofer_id || null,
    data.vehiculo_id,
    data.fecha,
    data.kilometros,
    data.ida_regreso ? 1 : 0,
    costo_total
  )

  return {
    id: result.lastInsertRowid,
    semana_id: data.semana_id,
    destino: data.destino.trim(),
    chofer_id: data.chofer_id || null,
    vehiculo_id: data.vehiculo_id,
    fecha: data.fecha,
    kilometros: data.kilometros,
    ida_regreso: Boolean(data.ida_regreso),
    costo_total
  }
}

export function updateSalida(id, data) {
  const costo_total = calculateCostoTotal(data.kilometros, data.vehiculo_id)

  const stmt = db.prepare(
    `UPDATE salidas 
     SET destino = ?, chofer_id = ?, vehiculo_id = ?, fecha = ?, 
         kilometros = ?, ida_regreso = ?, costo_total = ?
     WHERE id = ?`
  )

  stmt.run(
    data.destino.trim(),
    data.chofer_id || null,
    data.vehiculo_id,
    data.fecha,
    data.kilometros,
    data.ida_regreso ? 1 : 0,
    costo_total,
    id
  )

  return {
    id,
    destino: data.destino.trim(),
    chofer_id: data.chofer_id || null,
    vehiculo_id: data.vehiculo_id,
    fecha: data.fecha,
    kilometros: data.kilometros,
    ida_regreso: Boolean(data.ida_regreso),
    costo_total
  }
}

export function deleteSalida(id) {
  const stmt = db.prepare('DELETE FROM salidas WHERE id = ?')
  stmt.run(id)
}

export function getWeekTotals(semanaId) {
  const result = db
    .prepare(
      `SELECT 
        SUM(kilometros) as total_kilometros,
        SUM(costo_total) as total_costo
       FROM salidas WHERE semana_id = ?`
    )
    .get(semanaId)

  return {
    total_kilometros: result.total_kilometros || 0,
    total_costo: result.total_costo || 0
  }
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

export function getWeeklyTotal() {
  // Get current week's Monday
  const now = new Date()
  const day = now.getUTCDay()
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  const monday = new Date(now.setUTCDate(diff))
  monday.setUTCHours(0, 0, 0, 0)
  const mondayStr = monday.toISOString().split('T')[0]

  const result = db
    .prepare(
      `SELECT SUM(s.costo_total) as total
       FROM salidas s
       JOIN semanas sem ON s.semana_id = sem.id
       WHERE sem.fecha_inicio = ? AND sem.activa = 1`
    )
    .get(mondayStr)

  return result.total || 0
}

export function getTotalKilometers() {
  const result = db.prepare('SELECT SUM(kilometros) as total FROM salidas').get()
  return result.total || 0
}

export function getTopChofers(limit = 5) {
  return db
    .prepare(
      `SELECT c.id as chofer_id, c.nombre, COUNT(s.id) as total_salidas
       FROM chofers c
       JOIN salidas s ON c.id = s.chofer_id
       GROUP BY c.id
       ORDER BY total_salidas DESC
       LIMIT ?`
    )
    .all(limit)
}

export function getTopVehiculos(limit = 5) {
  return db
    .prepare(
      `SELECT v.id as vehiculo_id, v.nombre, COUNT(s.id) as total_salidas
       FROM vehiculos v
       JOIN salidas s ON v.id = s.vehiculo_id
       GROUP BY v.id
       ORDER BY total_salidas DESC
       LIMIT ?`
    )
    .all(limit)
}

export function getWeeklyCosts(weeks = 4) {
  return db
    .prepare(
      `SELECT sem.fecha_inicio, sem.id, SUM(s.costo_total) as total
       FROM semanas sem
       JOIN salidas s ON sem.id = s.semana_id
       WHERE sem.activa = 1
       GROUP BY sem.id
       ORDER BY sem.fecha_inicio DESC
       LIMIT ?`
    )
    .all(weeks)
    .map((row) => ({
      semana: row.fecha_inicio,
      fecha_inicio: row.fecha_inicio,
      total: row.total || 0
    }))
}
