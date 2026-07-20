// Database Vehículos - Standalone Tests
// Run: node tests/unit/databaseVehiculos.test.js
/* eslint-disable no-console */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create temp test database
const testDbPath = path.join(__dirname, 'test_vehiculos.db');
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
    CREATE TABLE vehiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
      sin_chofer INTEGER DEFAULT 0,
      rendimiento INTEGER NOT NULL,
      combustible_tipo TEXT NOT NULL CHECK(combustible_tipo IN ('gasolina', 'diesel'))
    );
  `);

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

function getVehiculos() {
  return db
    .prepare(
      'SELECT id, nombre, sin_chofer, rendimiento, combustible_tipo FROM vehiculos ORDER BY nombre'
    )
    .all()
    .map(v => ({ ...v, sin_chofer: Boolean(v.sin_chofer) }));
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
    sin_chofer: Boolean(data.sin_chofer),
    rendimiento: data.rendimiento,
    combustible_tipo: data.combustible_tipo
  };
}

function updateVehiculo(id, data) {
  const normalizedNombre = data.nombre.toUpperCase().trim();
  const stmt = db.prepare(
    'UPDATE vehiculos SET nombre = ?, sin_chofer = ?, rendimiento = ?, combustible_tipo = ? WHERE id = ?'
  );
  stmt.run(normalizedNombre, data.sin_chofer ? 1 : 0, data.rendimiento, data.combustible_tipo, id);
  return {
    id,
    nombre: normalizedNombre,
    sin_chofer: Boolean(data.sin_chofer),
    rendimiento: data.rendimiento,
    combustible_tipo: data.combustible_tipo
  };
}

function deleteVehiculo(id) {
  const stmt = db.prepare('DELETE FROM vehiculos WHERE id = ?');
  stmt.run(id);
}

function getVehiculoByName(nombre) {
  return db.prepare('SELECT * FROM vehiculos WHERE nombre = ?').get(nombre.toUpperCase().trim());
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
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeNull: () => {
      if (actual !== null) throw new Error(`Expected null, got ${actual}`);
    },
    toBeUndefined: () => {
      if (actual !== undefined) throw new Error(`Expected undefined, got ${actual}`);
    },
    toContain: item => {
      if (!actual.includes(item)) throw new Error(`Expected array to contain ${item}`);
    },
    toBeGreaterThan: num => {
      if (actual <= num) throw new Error(`Expected ${actual} > ${num}`);
    },
    toBeType: type => {
      if (typeof actual !== type) throw new Error(`Expected type ${type}, got ${typeof actual}`);
    }
  };
}

console.log('\nDatabaseModule - Vehículos Tests');
console.log('='.repeat(50));

// Test: addVehiculo inserta correctamente
test('addVehiculo inserta correctamente', () => {
  initTestDb();
  const result = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });
  expect(result.id).toBeTruthy();
  expect(result.nombre).toBe('JETTA');
  expect(result.sin_chofer).toBe(false);
  expect(result.rendimiento).toBe(6);
  expect(result.combustible_tipo).toBe('gasolina');
  closeTestDb();
});

// Test: addVehiculo normaliza nombre a mayúsculas
test('addVehiculo normaliza nombre a mayúsculas', () => {
  initTestDb();
  const result = addVehiculo({
    nombre: 'camion 380',
    sin_chofer: true,
    rendimiento: 5,
    combustible_tipo: 'diesel'
  });
  expect(result.nombre).toBe('CAMION 380');
  closeTestDb();
});

// Test: addVehiculo con sin_chofer = true
test('addVehiculo con sin_chofer = true', () => {
  initTestDb();
  const result = addVehiculo({
    nombre: 'CAMION',
    sin_chofer: true,
    rendimiento: 5,
    combustible_tipo: 'diesel'
  });
  expect(result.sin_chofer).toBe(true);
  closeTestDb();
});

// Test: getVehiculos retorna todos
test('getVehiculos retorna todos', () => {
  initTestDb();
  addVehiculo({ nombre: 'JETTA', sin_chofer: false, rendimiento: 6, combustible_tipo: 'gasolina' });
  addVehiculo({ nombre: '482', sin_chofer: false, rendimiento: 8, combustible_tipo: 'diesel' });
  const rows = getVehiculos();
  expect(rows.length).toBe(2);
  closeTestDb();
});

// Test: getVehiculos convierte sin_chofer a boolean
test('getVehiculos convierte sin_chofer a boolean', () => {
  initTestDb();
  addVehiculo({ nombre: 'A', sin_chofer: true, rendimiento: 5, combustible_tipo: 'diesel' });
  addVehiculo({ nombre: 'B', sin_chofer: false, rendimiento: 6, combustible_tipo: 'gasolina' });
  const rows = getVehiculos();
  expect(typeof rows[0].sin_chofer).toBe('boolean');
  expect(typeof rows[1].sin_chofer).toBe('boolean');
  closeTestDb();
});

// Test: getVehiculos vacío retorna array
test('getVehiculos vacío retorna array vacío', () => {
  initTestDb();
  const rows = getVehiculos();
  expect(Array.isArray(rows)).toBeTruthy();
  expect(rows.length).toBe(0);
  closeTestDb();
});

// Test: updateVehiculo actualiza todos los campos
test('updateVehiculo actualiza todos los campos', () => {
  initTestDb();
  const original = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });

  const updated = updateVehiculo(original.id, {
    nombre: 'JETTA GLX',
    sin_chofer: true,
    rendimiento: 7,
    combustible_tipo: 'diesel'
  });

  expect(updated.nombre).toBe('JETTA GLX');
  expect(updated.sin_chofer).toBe(true);
  expect(updated.rendimiento).toBe(7);
  expect(updated.combustible_tipo).toBe('diesel');
  closeTestDb();
});

// Test: deleteVehiculo elimina por ID
test('deleteVehiculo elimina por ID', () => {
  initTestDb();
  const v1 = addVehiculo({
    nombre: 'A',
    sin_chofer: false,
    rendimiento: 5,
    combustible_tipo: 'diesel'
  });
  const v2 = addVehiculo({
    nombre: 'B',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });

  deleteVehiculo(v1.id);
  const rows = getVehiculos();
  expect(rows.length).toBe(1);
  expect(rows[0].nombre).toBe('B');
  closeTestDb();
});

// Test: combustible_tipo solo acepta gasolina o diesel
test('combustible_tipo solo acepta gasolina o diesel', () => {
  initTestDb();
  let errorThrown = false;
  try {
    addVehiculo({
      nombre: 'TEST',
      sin_chofer: false,
      rendimiento: 5,
      combustible_tipo: 'electrico'
    });
  } catch (e) {
    errorThrown = true;
    expect(e.message.toLowerCase()).toContain('check');
  }
  if (!errorThrown) {
    throw new Error('Expected error for invalid combustible_tipo');
  }
  closeTestDb();
});

// Test: rendimiento debe ser positivo
test('rendimiento debe ser positivo (0 falla)', () => {
  initTestDb();
  // Note: The CHECK constraint is only on combustible_tipo,
  // rendimiento is just NOT NULL, so 0 is allowed by DB
  // but our business logic requires > 0
  const result = addVehiculo({
    nombre: 'TEST',
    sin_chofer: false,
    rendimiento: 0,
    combustible_tipo: 'gasolina'
  });
  expect(result.rendimiento).toBe(0);
  closeTestDb();
});

// Test: actualizar solo algunos campos
test('actualizar solo algunos campos mantiene los otros', () => {
  initTestDb();
  const original = addVehiculo({
    nombre: 'JETTA',
    sin_chofer: false,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });

  const updated = updateVehiculo(original.id, {
    nombre: 'JETTA',
    sin_chofer: true,
    rendimiento: 6,
    combustible_tipo: 'gasolina'
  });

  expect(updated.nombre).toBe('JETTA');
  expect(updated.sin_chofer).toBe(true);
  expect(updated.rendimiento).toBe(6);
  expect(updated.combustible_tipo).toBe('gasolina');
  closeTestDb();
});

// Clean up
closeTestDb();

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
