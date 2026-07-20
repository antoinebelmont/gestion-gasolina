// Excel Export Service - Standalone Tests
// Run: node tests/unit/excelService.test.js
/* eslint-disable no-console */

// Mock dependencies
let mockDb = {};

const db = {
  getSemanas: includeInactive => (mockDb.getSemanas ? mockDb.getSemanas(includeInactive) : []),
  getSalidasBySemana: id => (mockDb.getSalidasBySemana ? mockDb.getSalidasBySemana(id) : [])
};

// Excel Export Service functions (simplified for testing)
function generateExcelData(semanaId) {
  // Get semana data
  const semanas = db.getSemanas(true);
  const semana = semanas.find(s => s.id === semanaId);
  if (!semana) {
    throw new Error('Semana no encontrada');
  }

  // Get all salidas for the week
  const salidas = db.getSalidasBySemana(semanaId);

  // Calculate totals
  let totalKm = 0;
  let totalCosto = 0;

  const dataRows = salidas.map(s => {
    totalKm += s.kilometros;
    totalCosto += s.costo_total;

    return {
      destino: s.destino,
      chofer: s.chofer_nombre || '-',
      vehiculo: s.vehiculo_nombre,
      fecha: s.fecha,
      km: s.kilometros,
      idaRegreso: s.ida_regreso ? 'Sí' : 'No',
      costo: s.costo_total
    };
  });

  return {
    title: 'PROGRAMACIÓN SEMANAL',
    headers: ['Destino', 'Chofer', 'Vehículo', 'Fecha', 'Km', 'Ida y Regreso', 'Costo'],
    rows: dataRows,
    totales: {
      destino: 'TOTAL',
      chofer: '',
      vehiculo: '',
      fecha: '',
      km: totalKm,
      idaRegreso: '',
      costo: totalCosto
    }
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
    toHaveLength: len => {
      if (actual.length !== len) throw new Error(`Expected length ${len}, got ${actual.length}`);
    },
    toHaveProperty: prop => {
      if (!(prop in actual)) throw new Error(`Expected to have property ${prop}`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeGreaterThan: n => {
      if (actual <= n) throw new Error(`Expected > ${n}, got ${actual}`);
    },
    toContain: item => {
      if (!String(actual).includes(item)) throw new Error(`Expected to contain ${item}`);
    }
  };
}

console.log('\nExcel Export Service Tests');
console.log('='.repeat(50));

// Setup mock data
const setupMockData = () => {
  mockDb = {
    getSemanas: () => [{ id: 1, fecha_inicio: '2025-06-30', activa: true }],
    getSalidasBySemana: () => [
      {
        id: 1,
        semana_id: 1,
        destino: 'PSIQUIATRIA',
        chofer_id: 1,
        vehiculo_id: 1,
        fecha: '2025-07-01',
        kilometros: 30,
        ida_regreso: true,
        costo_total: 125,
        chofer_nombre: 'MIGUEL',
        vehiculo_nombre: 'JETTA'
      },
      {
        id: 2,
        semana_id: 1,
        destino: 'HOSPITAL',
        chofer_id: 2,
        vehiculo_id: 2,
        fecha: '2025-07-02',
        kilometros: 40,
        ida_regreso: false,
        costo_total: 140,
        chofer_nombre: 'RUBEN',
        vehiculo_nombre: '482'
      }
    ]
  };
};

// Test: genera archivo con headers correctos
test('headers correctos: Destino, Chofer, Vehículo, Fecha, Km, Ida y Regreso, Costo', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.headers).toEqual([
    'Destino',
    'Chofer',
    'Vehículo',
    'Fecha',
    'Km',
    'Ida y Regreso',
    'Costo'
  ]);
});

// Test: genera archivo con titulo
test('genera archivo con titulo PROGRAMACIÓN SEMANAL', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.title).toBe('PROGRAMACIÓN SEMANAL');
});

// Test: datos de cada salida correctos
test('datos de cada salida correctos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.rows).toHaveLength(2);
  expect(result.rows[0].destino).toBe('PSIQUIATRIA');
  expect(result.rows[0].chofer).toBe('MIGUEL');
  expect(result.rows[0].vehiculo).toBe('JETTA');
  expect(result.rows[0].fecha).toBe('2025-07-01');
  expect(result.rows[0].km).toBe(30);
  expect(result.rows[0].idaRegreso).toBe('Sí');
  expect(result.rows[0].costo).toBe(125);
});

// Test: totales correctos
test('totales correctos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.totales).toBeTruthy();
  expect(result.totales.destino).toBe('TOTAL');
  expect(result.totales.km).toBe(70);
  expect(result.totales.costo).toBe(265);
});

// Test: chofer vacío se convierte en '-'
test('chofer vacío se convierte en "-"', () => {
  setupMockData();
  mockDb.getSalidasBySemana = () => [
    {
      id: 1,
      semana_id: 1,
      destino: 'CAMION',
      chofer_id: null,
      vehiculo_id: 3,
      fecha: '2025-07-01',
      kilometros: 50,
      ida_regreso: false,
      costo_total: 280,
      chofer_nombre: null,
      vehiculo_nombre: 'CAMION 380'
    }
  ];
  const result = generateExcelData(1);
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].chofer).toBe('-');
});

// Test: Ida y Regreso se formatea como "Sí" o "No"
test('Ida y Regreso formateado como "Sí" o "No"', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.rows).toHaveLength(2);
  expect(result.rows[0].idaRegreso).toBe('Sí');
  expect(result.rows[1].idaRegreso).toBe('No');
});

// Test: lanza error si semana no existe
test('lanza error si semana no existe', () => {
  setupMockData();
  mockDb.getSemanas = () => [];
  let errorThrown = false;
  try {
    generateExcelData(999);
  } catch (e) {
    errorThrown = true;
    expect(e.message).toContain('no encontrada');
  }
  if (!errorThrown) {
    throw new Error('Expected error for non-existent semana');
  }
});

// Test: row vacio tiene totales a 0
test('semana sin salidas tiene totales a 0', () => {
  setupMockData();
  mockDb.getSalidasBySemana = () => [];
  const result = generateExcelData(1);
  expect(result.rows).toHaveLength(0);
  expect(result.totales.km).toBe(0);
  expect(result.totales.costo).toBe(0);
});

// Test: valores numéricos correctos
test('valores numéricos de km y costo correctos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.rows).toHaveLength(2);
  expect(typeof result.rows[0].km).toBe('number');
  expect(typeof result.rows[0].costo).toBe('number');
  expect(typeof result.totales.km).toBe('number');
  expect(typeof result.totales.costo).toBe('number');
});

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
