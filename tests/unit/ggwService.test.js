// GGW Export/Import Service - Standalone Tests
// Run: node tests/unit/ggwService.test.js
/* eslint-disable no-console */

// Mock dependencies
let mockDb = {};
const mockLog = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

const readFileSync = data => data;

// Mock the modules
const db = {
  getSemanas: includeInactive => (mockDb.getSemanas ? mockDb.getSemanas(includeInactive) : []),
  getSalidasBySemana: id => (mockDb.getSalidasBySemana ? mockDb.getSalidasBySemana(id) : []),
  getChofers: () => (mockDb.getChofers ? mockDb.getChofers() : []),
  getVehiculos: () => (mockDb.getVehiculos ? mockDb.getVehiculos() : []),
  getCostosCombustible: () =>
    mockDb.getCostosCombustible ? mockDb.getCostosCombustible() : { gasolina: 25, diesel: 28 },
  addChofer: nombre => (mockDb.addChofer ? mockDb.addChofer(nombre) : { id: 1, nombre }),
  addVehiculo: data => (mockDb.addVehiculo ? mockDb.addVehiculo(data) : { id: 1, ...data }),
  updateCostoCombustible: (tipo, precio) => {
    if (mockDb.updateCostoCombustible) mockDb.updateCostoCombustible(tipo, precio);
  },
  addSemana: fecha => (mockDb.addSemana ? mockDb.addSemana(fecha) : { id: 1, fecha_inicio: fecha }),
  softDeleteSemana: id => {
    if (mockDb.softDeleteSemana) mockDb.softDeleteSemana(id);
  },
  addSalida: data => (mockDb.addSalida ? mockDb.addSalida(data) : { id: 1, ...data })
};

// GGW Service functions (simplified for testing)
const APP_VERSION = '1.0.0';
const SUPPORTED_VERSION = '1.0';

function exportWeekToGGW(semanaId) {
  // Get semana data
  const semanas = db.getSemanas(true);
  const semana = semanas.find(s => s.id === semanaId);
  if (!semana) {
    throw new Error('Semana no encontrada');
  }

  // Get all salidas for the week
  const salidas = db.getSalidasBySemana(semanaId);

  // Get used chofers and vehiculos
  const choferIds = [...new Set(salidas.map(s => s.chofer_id).filter(Boolean))];
  const vehiculoIds = [...new Set(salidas.map(s => s.vehiculo_id))];

  const chofers = choferIds
    .map(id => {
      const allChofers = db.getChofers();
      return allChofers.find(c => c.id === id);
    })
    .filter(Boolean);

  const vehiculos = vehiculoIds
    .map(id => {
      const allVehiculos = db.getVehiculos();
      return allVehiculos.find(v => v.id === id);
    })
    .filter(Boolean);

  // Get costos
  const costos = db.getCostosCombustible();

  // Calculate totals
  const totalKilometros = salidas.reduce((sum, s) => sum + s.kilometros, 0);
  const totalCosto = salidas.reduce((sum, s) => sum + s.costo_total, 0);

  // Build GGW DTO
  return {
    version: '1.0',
    type: 'week_export',
    metadata: {
      exportDate: new Date().toISOString(),
      appVersion: APP_VERSION,
      weekStart: semana.fecha_inicio
    },
    config: {
      chofers: chofers.map(c => ({ nombre: c.nombre })),
      vehiculos: vehiculos.map(v => ({
        nombre: v.nombre,
        combustible_tipo: v.combustible_tipo,
        rendimiento: v.rendimiento,
        sin_chofer: v.sin_chofer
      })),
      costos_combustible: costos
    },
    week: {
      fecha_inicio: semana.fecha_inicio,
      salidas: salidas.map(s => ({
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
  };
}

function validateGGWImport(data) {
  if (data.version !== SUPPORTED_VERSION) {
    throw new Error(`Versión no soportada: ${data.version}. Se requiere ${SUPPORTED_VERSION}`);
  }

  if (!data.metadata || !data.config || !data.week) {
    throw new Error('Estructura de archivo inválida');
  }

  return true;
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
    toContain: item => {
      if (!JSON.stringify(actual).includes(item)) throw new Error(`Expected to contain ${item}`);
    },
    toHaveProperty: prop => {
      if (!(prop in actual)) throw new Error(`Expected to have property ${prop}`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeGreaterThan: n => {
      if (actual <= n) throw new Error(`Expected > ${n}, got ${actual}`);
    }
  };
}

console.log('\nGGW Service Tests');
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
    ],
    getChofers: () => [
      { id: 1, nombre: 'MIGUEL' },
      { id: 2, nombre: 'RUBEN' }
    ],
    getVehiculos: () => [
      { id: 1, nombre: 'JETTA', combustible_tipo: 'gasolina', rendimiento: 6, sin_chofer: false },
      { id: 2, nombre: '482', combustible_tipo: 'diesel', rendimiento: 8, sin_chofer: false }
    ],
    getCostosCombustible: () => ({ gasolina: 25, diesel: 28 })
  };
};

// Test: genera JSON válido
test('genera JSON con version 1.0', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.version).toBe('1.0');
});

// Test: genera JSON con type week_export
test('genera JSON con type week_export', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.type).toBe('week_export');
});

// Test: incluye metadata correcta
test('incluye metadata con exportDate y appVersion', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.metadata).toHaveProperty('exportDate');
  expect(result.metadata).toHaveProperty('appVersion');
  expect(result.metadata.appVersion).toBe('1.0.0');
  expect(result.metadata.weekStart).toBe('2025-06-30');
});

// Test: incluye config con chofers
test('incluye config con chofers usados', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.config).toHaveProperty('chofers');
  expect(result.config.chofers.length).toBe(2);
  expect(result.config.chofers[0].nombre).toBe('MIGUEL');
});

// Test: incluye config con vehiculos
test('incluye config con vehiculos usados', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.config).toHaveProperty('vehiculos');
  expect(result.config.vehiculos.length).toBe(2);
  expect(result.config.vehiculos[0].nombre).toBe('JETTA');
  expect(result.config.vehiculos[0].combustible_tipo).toBe('gasolina');
});

// Test: incluye week con salidas
test('incluye week con salidas', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.week).toHaveProperty('salidas');
  expect(result.week.salidas.length).toBe(2);
  expect(result.week.salidas[0].destino).toBe('PSIQUIATRIA');
  expect(result.week.salidas[0].kilometros).toBe(30);
});

// Test: incluye totales calculados
test('incluye totales calculados correctamente', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.week.totales).toHaveProperty('total_kilometros');
  expect(result.week.totales).toHaveProperty('total_costo');
  expect(result.week.totales.total_kilometros).toBe(70);
  expect(result.week.totales.total_costo).toBe(265);
});

// Test: incluye costos de combustible
test('incluye costos de combustible', () => {
  setupMockData();
  const result = exportWeekToGGW(1);
  expect(result.config).toHaveProperty('costos_combustible');
  expect(result.config.costos_combustible.gasolina).toBe(25);
  expect(result.config.costos_combustible.diesel).toBe(28);
});

// Test: lanza error si semana no existe
test('lanza error si semana no existe', () => {
  setupMockData();
  mockDb.getSemanas = () => [];
  let errorThrown = false;
  try {
    exportWeekToGGW(999);
  } catch (e) {
    errorThrown = true;
    expect(e.message).toContain('no encontrada');
  }
  if (!errorThrown) {
    throw new Error('Expected error for non-existent semana');
  }
});

// Test: validacion rechaza version invalida
test('valida version - rechaza version invalida', () => {
  const invalidData = {
    version: '2.0',
    metadata: {},
    config: {},
    week: {}
  };
  let errorThrown = false;
  try {
    validateGGWImport(invalidData);
  } catch (e) {
    errorThrown = true;
    expect(e.message).toContain('Versión no soportada');
  }
  if (!errorThrown) {
    throw new Error('Expected error for invalid version');
  }
});

// Test: validacion rechaza estructura invalida
test('valida estructura - rechaza sin metadata', () => {
  const invalidData = {
    version: '1.0',
    config: {},
    week: {}
  };
  let errorThrown = false;
  try {
    validateGGWImport(invalidData);
  } catch (e) {
    errorThrown = true;
    expect(e.message).toContain('inválida');
  }
  if (!errorThrown) {
    throw new Error('Expected error for invalid structure');
  }
});

// Test: validacion acepta estructura valida
test('valida estructura - acepta estructura valida', () => {
  const validData = {
    version: '1.0',
    metadata: { exportDate: '2025-07-01', appVersion: '1.0.0' },
    config: { chofers: [], vehiculos: [], costos_combustible: {} },
    week: { fecha_inicio: '2025-06-30', salidas: [], totales: {} }
  };
  const result = validateGGWImport(validData);
  expect(result).toBe(true);
});

// Test: salida incluye chofer null si no hay chofer
test('salida incluye chofer null si no hay chofer', () => {
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
  const result = exportWeekToGGW(1);
  expect(result.week.salidas[0].chofer).toBe(null);
});

// Test: vehiculo incluye sin_chofer
test('vehiculo incluye sin_chofer', () => {
  setupMockData();
  mockDb.getVehiculos = () => [
    { id: 1, nombre: 'JETTA', combustible_tipo: 'gasolina', rendimiento: 6, sin_chofer: false },
    { id: 2, nombre: '482', combustible_tipo: 'diesel', rendimiento: 8, sin_chofer: false },
    { id: 3, nombre: 'CAMION 380', combustible_tipo: 'diesel', rendimiento: 5, sin_chofer: true }
  ];
  mockDb.getSalidasBySemana = () => [
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
      id: 3,
      semana_id: 1,
      destino: 'OBRA',
      chofer_id: null,
      vehiculo_id: 3,
      fecha: '2025-07-02',
      kilometros: 50,
      ida_regreso: false,
      costo_total: 280,
      chofer_nombre: null,
      vehiculo_nombre: 'CAMION 380'
    }
  ];
  const result = exportWeekToGGW(1);
  expect(result.config.vehiculos.find(v => v.nombre === 'CAMION 380').sin_chofer).toBe(true);
});

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
