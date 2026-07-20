// Database Salidas - Standalone Tests
// Run: node tests/unit/databaseSalidas.test.js
/* eslint-disable no-console */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create temp test database
const testDbPath = path.join(__dirname, 'test_salidas.db');
let db;

function initTestDb() {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  db = new Database(testDbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE chofers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE COLLATE NOCASE
    );

    CREATE TABLE vehiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
      sin_chofer INTEGER DEFAULT 0,
      rendimiento INTEGER NOT NULL,
      combustible_tipo TEXT NOT NULL CHECK(combustible_tipo IN ('gasolina', 'diesel'))
    );

    CREATE TABLE costos_combustible (
      id INTEGER PRIMARY KEY,
      tipo TEXT NOT NULL UNIQUE CHECK(tipo IN ('gasolina', 'diesel')),
      precio REAL NOT NULL
    );

    CREATE TABLE semanas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_inicio TEXT NOT NULL,
      activa INTEGER DEFAULT 1
    );

    CREATE TABLE salidas (
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
  `);

  // Seed costos
  db.prepare('INSERT INTO costos_combustible (tipo, precio) VALUES (?, ?)').run('gasolina', 25);
  db.prepare('INSERT INTO costos_combustible (tipo, precio) VALUES (?, ?)').run('diesel', 28);

  return db;
}

function closeTestDb() {
  if (db) {
    db.close();
    db = null;
  }
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}

// ─── CRUD Functions ───────────────────────────────────────────

function getCostosCombustible() {
  const rows = db.prepare('SELECT tipo, precio FROM costos_combustible').all();
  const result = {};
  for (const row of rows) {
    result[row.tipo] = row.precio;
  }
  return result;
}

function addChofer(nombre) {
  const normalizedNombre = nombre.toUpperCase().trim();
  const stmt = db.prepare('INSERT INTO chofers (nombre) VALUES (?)');
  const result = stmt.run(normalizedNombre);
  return { id: result.lastInsertRowid, nombre: normalizedNombre };
}

function addVehiculo(data) {
  const normalizedNombre = data.nombre.toUpperCase().trim();
  const stmt = db.prepare(
    'INSERT INTO vehiculos (nombre, sin_chofer, rendimiento, combustible_tipo) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(
    normalizedNombre,
    data.sin_chofer ? 1 : 0,
    data.rendimiento,
    data.combustible_tipo
  );
  return {
    id: result.lastInsertRowid,
    nombre: normalizedNombre,
    rendimiento: data.rendimiento,
    combustible_tipo: data.combustible_tipo
  };
}

function addSemana(fecha_inicio) {
  const stmt = db.prepare('INSERT INTO semanas (fecha_inicio) VALUES (?)');
  const result = stmt.run(fecha_inicio);
  return { id: result.lastInsertRowid, fecha_inicio, activa: true };
}

function getSalidasBySemana(semanaId) {
  return db
    .prepare(
      `SELECT s.*, c.nombre as chofer_nombre, v.nombre as vehiculo_nombre, v.rendimiento as vehiculo_rendimiento
       FROM salidas s
       LEFT JOIN chofers c ON s.chofer_id = c.id
       JOIN vehiculos v ON s.vehiculo_id = v.id
       WHERE s.semana_id = ?
       ORDER BY s.fecha ASC`
    )
    .all(semanaId)
    .map(s => ({
      ...s,
      ida_regreso: Boolean(s.ida_regreso),
      chofer_id: s.chofer_id || null
    }));
}

function calculateCostoTotal(kilometros, vehiculoId) {
  const vehiculo = db
    .prepare('SELECT rendimiento, combustible_tipo FROM vehiculos WHERE id = ?')
    .get(vehiculoId);
  const costos = getCostosCombustible();
  const precio = costos[vehiculo.combustible_tipo];
  return Math.round((kilometros / vehiculo.rendimiento) * precio * 100) / 100;
}

function addSalida(data) {
  const costo_total = calculateCostoTotal(data.kilometros, data.vehiculo_id);
  const stmt = db.prepare(
    `INSERT INTO salidas (semana_id, destino, chofer_id, vehiculo_id, fecha, kilometros, ida_regreso, costo_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.semana_id,
    data.destino.trim(),
    data.chofer_id || null,
    data.vehiculo_id,
    data.fecha,
    data.kilometros,
    data.ida_regreso ? 1 : 0,
    costo_total
  );
  return { id: result.lastInsertRowid, costo_total };
}

function updateSalida(id, data) {
  const costo_total = calculateCostoTotal(data.kilometros, data.vehiculo_id);
  const stmt = db.prepare(
    'UPDATE salidas SET destino = ?, chofer_id = ?, vehiculo_id = ?, fecha = ?, kilometros = ?, ida_regreso = ?, costo_total = ? WHERE id = ?'
  );
  stmt.run(
    data.destino.trim(),
    data.chofer_id || null,
    data.vehiculo_id,
    data.fecha,
    data.kilometros,
    data.ida_regreso ? 1 : 0,
    costo_total,
    id
  );
  return { id, costo_total };
}

function deleteSalida(id) {
  const stmt = db.prepare('DELETE FROM salidas WHERE id = ?');
  stmt.run(id);
}

function getWeekTotals(semanaId) {
  const result = db
    .prepare(
      'SELECT SUM(kilometros) as total_kilometros, SUM(costo_total) as total_costo FROM salidas WHERE semana_id = ?'
    )
    .get(semanaId);
  return {
    total_kilometros: result.total_kilometros || 0,
    total_costo: result.total_costo || 0
  };
}

// ─── Tests ───────────────────────────────────────────────────

let passed = 0,
  failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe: expected => {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    },
    toEqual: expected => {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeCloseTo: (expected, decimals) => {
      const actualRounded = Number(actual.toFixed(decimals));
      const expectedRounded = Number(expected.toFixed(decimals));
      if (actualRounded !== expectedRounded)
        throw new Error(`Expected ~${expected}, got ${actual}`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeUndefined: () => {
      if (actual !== undefined) throw new Error(`Expected undefined, got ${actual}`);
    },
    toBeGreaterThan: num => {
      if (actual <= num) throw new Error(`Expected ${actual} > ${num}`);
    }
  };
}

console.log('\nDatabaseModule - Salidas Tests');
console.log('='.repeat(50));

// Test: addSalida calcula costo_total correctamente
test('addSalida calcula costo_total correctamente', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const semana = addSemana('2025-06-30');
  const salida = addSalida({
    semana_id: semana.id,
    destino: 'PSIQUIATRIA',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  // 30 km / 6 km/l * $25 = $125
  expect(salida.costo_total).toBeCloseTo(125, 2);
  closeTestDb();
});

// Test: addSalida con diesel calcula correctamente
test('addSalida con diesel calcula correctamente', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: '482',
    sin_chofer: false,
    rendimiento: 8,
    combustible_tipo: 'diesel'
  });
  const semana = addSemana('2025-06-30');
  const salida = addSalida({
    semana_id: semana.id,
    destino: 'HOSPITAL',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  // 30 km / 8 km/l * $28 = $105
  expect(salida.costo_total).toBeCloseTo(105, 2);
  closeTestDb();
});

// Test: addSalida con ida_regreso
test('addSalida con ida_regreso no afecta costo', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const semana = addSemana('2025-06-30');
  const salida = addSalida({
    semana_id: semana.id,
    destino: 'PSIQUIATRIA',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: true
  });
  // El costo debe ser el mismo - ida_regreso es informativo
  expect(salida.costo_total).toBeCloseTo(125, 2);
  closeTestDb();
});

// Test: getSalidasBySemana retorna salidas ordenadas por fecha
test('getSalidasBySemana retorna salidas ordenadas por fecha ASC', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const semana = addSemana('2025-06-30');

  // Agregar en orden no cronológico
  addSalida({
    semana_id: semana.id,
    destino: 'C',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-03',
    kilometros: 30,
    ida_regreso: false
  });
  addSalida({
    semana_id: semana.id,
    destino: 'A',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  addSalida({
    semana_id: semana.id,
    destino: 'B',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-02',
    kilometros: 30,
    ida_regreso: false
  });

  const salidas = getSalidasBySemana(semana.id);
  expect(salidas.length).toBe(3);
  expect(salidas[0].destino).toBe('A');
  expect(salidas[1].destino).toBe('B');
  expect(salidas[2].destino).toBe('C');
  closeTestDb();
});

// Test: updateSalida recalcula costo_total
test('updateSalida recalcula costo_total si cambia kilometros', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const semana = addSemana('2025-06-30');
  const salida = addSalida({
    semana_id: semana.id,
    destino: 'PSIQUIATRIA',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  expect(salida.costo_total).toBeCloseTo(125, 2);

  // Actualizar a 60 km
  const updated = updateSalida(salida.id, {
    semana_id: semana.id,
    destino: 'PSIQUIATRIA',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 60,
    ida_regreso: false
  });
  expect(updated.costo_total).toBeCloseTo(250, 2);
  closeTestDb();
});

// Test: updateSalida recalcula si cambia vehículo
test('updateSalida recalcula costo_total si cambia vehiculo', () => {
  initTestDb();
  const v1 = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const v2 = addVehiculo({
    nombre: '482',
    sin_chofer: false,
    rendimiento: 8,
    combustible_tipo: 'diesel'
  });
  const semana = addSemana('2025-06-30');

  const salida = addSalida({
    semana_id: semana.id,
    destino: 'PSIQUIATRIA',
    chofer_id: null,
    vehiculo_id: v1.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  expect(salida.costo_total).toBeCloseTo(125, 2);

  // Cambiar a vehículo diesel
  const updated = updateSalida(salida.id, {
    semana_id: semana.id,
    destino: 'PSIQUIATRIA',
    chofer_id: null,
    vehiculo_id: v2.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  expect(updated.costo_total).toBeCloseTo(105, 2);
  closeTestDb();
});

// Test: deleteSalida elimina por ID
test('deleteSalida elimina por ID', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const semana = addSemana('2025-06-30');
  const s1 = addSalida({
    semana_id: semana.id,
    destino: 'A',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  addSalida({
    semana_id: semana.id,
    destino: 'B',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-02',
    kilometros: 30,
    ida_regreso: false
  });

  deleteSalida(s1.id);
  const salidas = getSalidasBySemana(semana.id);
  expect(salidas.length).toBe(1);
  expect(salidas[0].destino).toBe('B');
  closeTestDb();
});

// Test: getWeekTotals suma correctamente
test('getWeekTotals suma km y costo_total', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const semana = addSemana('2025-06-30');

  addSalida({
    semana_id: semana.id,
    destino: 'A',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });
  addSalida({
    semana_id: semana.id,
    destino: 'B',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-02',
    kilometros: 60,
    ida_regreso: false
  });

  const totals = getWeekTotals(semana.id);
  expect(totals.total_kilometros).toBeCloseTo(90, 2);
  expect(totals.total_costo).toBeCloseTo(375, 2); // (30+60) * 25/6 = 375
  closeTestDb();
});

// Test: getWeekTotals retorna 0 si no hay salidas
test('getWeekTotals retorna 0 si no hay salidas', () => {
  initTestDb();
  const semana = addSemana('2025-06-30');
  const totals = getWeekTotals(semana.id);
  expect(totals.total_kilometros).toBe(0);
  expect(totals.total_costo).toBe(0);
  closeTestDb();
});

// Test: getSalidasBySemana incluye datos de vehículo
test('getSalidasBySemana incluye datos de vehiculo', () => {
  initTestDb();
  const vehiculo = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  const semana = addSemana('2025-06-30');
  addSalida({
    semana_id: semana.id,
    destino: 'PSIQUIATRIA',
    chofer_id: null,
    vehiculo_id: vehiculo.id,
    fecha: '2025-07-01',
    kilometros: 30,
    ida_regreso: false
  });

  const salidas = getSalidasBySemana(semana.id);
  expect(salidas[0].vehiculo_nombre).toBe('JETTA');
  expect(salidas[0].vehiculo_rendimiento).toBe(6);
  closeTestDb();
});

// Clean up
closeTestDb();

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
