// Excel Export Service - Standalone Tests
// Run: node tests/unit/excelService.test.js
/* eslint-disable no-console */

const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MESES = [
  '',
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE'
];

function formatDateSpanish(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const dia = DIAS[date.getDay()];
  const num = date.getDate();
  const mes = MESES[date.getMonth() + 1];
  const anio = date.getFullYear();
  return `${dia} ${num} DE ${mes} DE ${anio}`;
}

function groupByDate(salidas) {
  const groups = {};
  for (const s of salidas) {
    if (!groups[s.fecha]) {
      groups[s.fecha] = [];
    }
    groups[s.fecha].push(s);
  }
  return groups;
}

let mockDb = {};

const db = {
  getSemanas: includeInactive => (mockDb.getSemanas ? mockDb.getSemanas(includeInactive) : []),
  getSalidasBySemana: id => (mockDb.getSalidasBySemana ? mockDb.getSalidasBySemana(id) : []),
  getCostosCombustible: () =>
    mockDb.getCostosCombustible ? mockDb.getCostosCombustible() : { gasolina: 25, diesel: 28 }
};

function generateExcelData(semanaId) {
  const semanas = db.getSemanas(true);
  const semana = semanas.find(s => s.id === semanaId);
  if (!semana) {
    throw new Error('Semana no encontrada');
  }

  const salidas = db.getSalidasBySemana(semanaId);
  const costos = db.getCostosCombustible();

  const byDate = groupByDate(salidas);
  const dates = Object.keys(byDate).sort();

  let weekTotalKm = 0;
  let weekTotalCosto = 0;

  const days = dates.map(date => {
    const daySalidas = byDate[date];

    const rows = daySalidas.map(s => {
      weekTotalKm += s.kilometros;
      weekTotalCosto += s.costo_total;
      const choferText = s.chofer_nombre
        ? `${s.chofer_nombre}-${s.vehiculo_nombre}`
        : `${s.vehiculo_nombre}`;
      const idaRegresoText = s.ida_regreso ? ' (salida y regreso)' : '';
      return {
        destino: s.destino,
        choferVehiculo: `${choferText}${idaRegresoText}`,
        rendimiento: s.vehiculo_rendimiento,
        diesel: costos.diesel || 0,
        gasolina: costos.gasolina || 0,
        km: s.kilometros,
        costo: s.costo_total
      };
    });

    const dayTotal = rows.reduce((sum, r) => sum + r.costo, 0);

    return {
      title: `Programacion del dia ${formatDateSpanish(date)}`,
      headers: [
        'RENDIMIENTO\nKILOMETROS\nX LITRO',
        'COSTO LITRO\nDISEL',
        'COSTO LITRO\nGASOLINA',
        'TOTAL\nKILOMETROS',
        'MONTO EN\nDINERO'
      ],
      rows,
      dayTotal,
      costoCombustible: { diesel: costos.diesel || 0, gasolina: costos.gasolina || 0 }
    };
  });

  const vehicleWeekTotals = {};
  for (const s of db.getSalidasBySemana(semanaId)) {
    const key = s.vehiculo_nombre;
    if (!vehicleWeekTotals[key]) vehicleWeekTotals[key] = 0;
    vehicleWeekTotals[key] += s.costo_total;
  }
  const vehicleRows = Object.keys(vehicleWeekTotals)
    .sort()
    .map(vName => ({ vehiculo: vName, costo: vehicleWeekTotals[vName] }));

  return {
    days,
    weekTotal: { km: weekTotalKm, costo: weekTotalCosto },
    vehicleRows
  };
}

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
      if (!String(actual).includes(item)) throw new Error(`Expected to contain "${item}"`);
    },
    toMatch: pattern => {
      if (!pattern.test(String(actual))) throw new Error(`Expected ${actual} to match ${pattern}`);
    }
  };
}

console.log('\nExcel Export Service Tests');
console.log('='.repeat(50));

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
        vehiculo_nombre: 'JETTA',
        vehiculo_rendimiento: 6,
        vehiculo_combustible: 'gasolina'
      },
      {
        id: 2,
        semana_id: 1,
        destino: 'HOSPITAL',
        chofer_id: 2,
        vehiculo_id: 2,
        fecha: '2025-07-01',
        kilometros: 40,
        ida_regreso: false,
        costo_total: 140,
        chofer_nombre: 'RUBEN',
        vehiculo_nombre: '482',
        vehiculo_rendimiento: 8,
        vehiculo_combustible: 'diesel'
      },
      {
        id: 3,
        semana_id: 1,
        destino: 'CAMION',
        chofer_id: null,
        vehiculo_id: 4,
        fecha: '2025-07-02',
        kilometros: 50,
        ida_regreso: true,
        costo_total: 280,
        chofer_nombre: null,
        vehiculo_nombre: 'CAMION 380',
        vehiculo_rendimiento: 5,
        vehiculo_combustible: 'diesel'
      }
    ],
    getCostosCombustible: () => ({ gasolina: 25, diesel: 28 })
  };
};

test('agrupa salidas por fecha', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.days).toHaveLength(2);
});

test('cada día tiene título con formato Programacion del dia', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.days[0].title).toContain('Programacion del dia');
  expect(result.days[0].title).toContain('MARTES');
  expect(result.days[0].title).toContain('JULIO');
  expect(result.days[0].title).toContain('2025');
  expect(result.days[1].title).toContain('MIÉRCOLES');
});

test('cada día tiene headers correctos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.days[0].headers).toEqual([
    'RENDIMIENTO\nKILOMETROS\nX LITRO',
    'COSTO LITRO\nDISEL',
    'COSTO LITRO\nGASOLINA',
    'TOTAL\nKILOMETROS',
    'MONTO EN\nDINERO'
  ]);
});

test('filas de datos tienen formato correcto', () => {
  setupMockData();
  const result = generateExcelData(1);
  const firstRow = result.days[0].rows[0];
  expect(firstRow.destino).toBe('PSIQUIATRIA');
  expect(firstRow.choferVehiculo).toBe('MIGUEL-JETTA (salida y regreso)');
  expect(firstRow.rendimiento).toBe(6);
  expect(firstRow.km).toBe(30);
  expect(firstRow.costo).toBe(125);
});

test('chofer null muestra solo vehículo con salida y regreso', () => {
  setupMockData();
  const result = generateExcelData(1);
  const camionRow = result.days[1].rows[0];
  expect(camionRow.choferVehiculo).toBe('CAMION 380 (salida y regreso)');
  expect(camionRow.destino).toBe('CAMION');
});

test('ida y regreso se omite cuando es false', () => {
  setupMockData();
  const result = generateExcelData(1);
  const noIdaRow = result.days[0].rows[1];
  expect(noIdaRow.choferVehiculo).toBe('RUBEN-482');
});

test('costo combustible de configuración usado en datos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.days[0].costoCombustible.diesel).toBe(28);
  expect(result.days[0].costoCombustible.gasolina).toBe(25);
  expect(result.days[0].rows[0].diesel).toBe(28);
  expect(result.days[0].rows[0].gasolina).toBe(25);
});

test('totales de semana correctos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.weekTotal.km).toBe(120);
  expect(result.weekTotal.costo).toBe(545);
});

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

test('semana sin salidas tiene totales a 0', () => {
  setupMockData();
  mockDb.getSalidasBySemana = () => [];
  const result = generateExcelData(1);
  expect(result.days).toHaveLength(0);
  expect(result.weekTotal.km).toBe(0);
  expect(result.weekTotal.costo).toBe(0);
});

test('valores numéricos correctos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(typeof result.days[0].rows[0].km).toBe('number');
  expect(typeof result.days[0].rows[0].costo).toBe('number');
  expect(typeof result.weekTotal.km).toBe('number');
  expect(typeof result.weekTotal.costo).toBe('number');
});

test('formato fecha español día correcto', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.days[0].title).toMatch(/Programacion del dia\s+MARTES 1 DE JULIO DE 2025/);
  expect(result.days[1].title).toMatch(/Programacion del dia\s+MIÉRCOLES 2 DE JULIO DE 2025/);
});

test('totales semanales por vehículo correctos', () => {
  setupMockData();
  const result = generateExcelData(1);
  expect(result.vehicleRows).toHaveLength(3);
  const jetta = result.vehicleRows.find(v => v.vehiculo === 'JETTA');
  const v482 = result.vehicleRows.find(v => v.vehiculo === '482');
  const camion380 = result.vehicleRows.find(v => v.vehiculo === 'CAMION 380');
  expect(jetta.costo).toBe(125);
  expect(v482.costo).toBe(140);
  expect(camion380.costo).toBe(280);
});

test('suma de totales semanales por vehículo igual al total de semana', () => {
  setupMockData();
  const result = generateExcelData(1);
  const sumVehicles = result.vehicleRows.reduce((sum, v) => sum + v.costo, 0);
  expect(sumVehicles).toBe(545);
  expect(sumVehicles).toBe(result.weekTotal.costo);
});

console.log('\n' + '='.repeat(50));
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
