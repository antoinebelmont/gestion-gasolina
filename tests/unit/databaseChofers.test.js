// Database Chofers - Standalone Tests
// Run: node tests/unit/databaseChofers.test.js
/* eslint-disable no-console */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create temp test database
const testDbPath = path.join(__dirname, 'test_chofers.db');
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

function getChofers() {
  return db.prepare('SELECT id, nombre FROM chofers ORDER BY nombre').all();
}

function addChofer(nombre) {
  const normalizedNombre = nombre.toUpperCase().trim();
  const stmt = db.prepare('INSERT INTO chofers (nombre) VALUES (?)');
  const result = stmt.run(normalizedNombre);
  return { id: result.lastInsertRowid, nombre: normalizedNombre };
}

function updateChofer(id, nombre) {
  const normalizedNombre = nombre.toUpperCase().trim();
  const stmt = db.prepare('UPDATE chofers SET nombre = ? WHERE id = ?');
  stmt.run(normalizedNombre, id);
  return { id, nombre: normalizedNombre };
}

function deleteChofer(id) {
  const stmt = db.prepare('DELETE FROM chofers WHERE id = ?');
  stmt.run(id);
}

function getChoferByName(nombre) {
  return db
    .prepare('SELECT id, nombre FROM chofers WHERE nombre = ?')
    .get(nombre.toUpperCase().trim());
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
    toMatchObject: expected => {
      for (const key of Object.keys(expected)) {
        if (actual[key] !== expected[key]) {
          throw new Error(`Expected ${key} to be ${expected[key]}, got ${actual[key]}`);
        }
      }
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
    }
  };
}

console.log('\nDatabaseModule - Chofers Tests');
console.log('='.repeat(50));

// Test: addChofer inserta correctamente
test('addChofer inserta correctamente', () => {
  initTestDb();
  const result = addChofer('Miguel');
  expect(result.id).toBeTruthy();
  expect(result.nombre).toBe('MIGUEL');
  const rows = getChofers();
  expect(rows.length).toBe(1);
  expect(rows[0].nombre).toBe('MIGUEL');
  closeTestDb();
});

// Test: addChofer normaliza a mayúsculas
test('addChofer normaliza a mayúsculas', () => {
  initTestDb();
  const result1 = addChofer('juan');
  expect(result1.nombre).toBe('JUAN');

  const result2 = addChofer('  PEDRO  ');
  expect(result2.nombre).toBe('PEDRO');

  const result3 = addChofer('Rosa María');
  expect(result3.nombre).toBe('ROSA MARÍA');
  closeTestDb();
});

// Test: getChofers retorna todos
test('getChofers retorna todos los chofers', () => {
  initTestDb();
  addChofer('ANA');
  addChofer('BERTHA');
  addChofer('CARLOS');
  const rows = getChofers();
  expect(rows.length).toBe(3);
  closeTestDb();
});

// Test: getChofers los retorna ordenados
test('getChofers retorna chofers ordenados', () => {
  initTestDb();
  addChofer('ZARA');
  addChofer('ALBERTO');
  addChofer('MIGUEL');
  const rows = getChofers();
  expect(rows[0].nombre <= rows[1].nombre).toBeTruthy();
  closeTestDb();
});

// Test: updateChofer actualiza
test('updateChofer actualiza nombre', () => {
  initTestDb();
  addChofer('MIGUEL');
  const chofer = getChoferByName('MIGUEL');
  const result = updateChofer(chofer.id, 'Miguel Angel');
  expect(result.nombre).toBe('MIGUEL ANGEL');

  const updated = getChoferByName('MIGUEL ANGEL');
  expect(updated).toBeTruthy();

  const old = getChoferByName('MIGUEL');
  expect(old).toBeUndefined();
  closeTestDb();
});

// Test: deleteChofer elimina
test('deleteChofer elimina por ID', () => {
  initTestDb();
  addChofer('CARLOS');
  addChofer('DANIEL');
  const rowsBefore = getChofers();
  const toDelete = rowsBefore[0];
  deleteChofer(toDelete.id);

  const rowsAfter = getChofers();
  expect(rowsAfter.length).toBe(rowsBefore.length - 1);

  const deleted = rowsAfter.find(r => r.id === toDelete.id);
  expect(deleted).toBeUndefined();
  closeTestDb();
});

// Test: chofer duplicado lanza error
test('chofer duplicado lanza error', () => {
  initTestDb();
  addChofer('JUAN');
  let errorThrown = false;
  try {
    addChofer('JUAN'); // Duplicate
  } catch (e) {
    errorThrown = true;
    expect(e.message.toLowerCase()).toContain('unique');
  }
  if (!errorThrown) {
    throw new Error('Expected error for duplicate chofer');
  }
  closeTestDb();
});

// Test: agregar múltiples chofers únicos
test('agregar múltiples chofers únicos', () => {
  initTestDb();
  const names = ['ANA', 'BERTHA', 'CARLOS', 'DANIEL'];
  for (const name of names) {
    const result = addChofer(name);
    expect(result.nombre).toBe(name);
  }
  const rows = getChofers();
  expect(rows.length).toBe(4);
  closeTestDb();
});

// Test: getChofers vacío retorna array
test('getChofers vacío retorna array vacío', () => {
  initTestDb();
  const rows = getChofers();
  expect(Array.isArray(rows)).toBeTruthy();
  expect(rows.length).toBe(0);
  closeTestDb();
});

// Test: updateChofer de ID inexistente no lanza error
test('updateChofer de ID inexistente', () => {
  initTestDb();
  const result = updateChofer(99999, 'NOMBRE');
  expect(result.id).toBe(99999);
  expect(result.nombre).toBe('NOMBRE');
  closeTestDb();
});

// Test: deleteChofer de ID inexistente no lanza error
test('deleteChofer de ID inexistente no lanza error', () => {
  initTestDb();
  let errorThrown = false;
  try {
    deleteChofer(99999);
  } catch (e) {
    errorThrown = true;
  }
  if (errorThrown) {
    throw new Error('Should not throw error for non-existent ID');
  }
  closeTestDb();
});

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
