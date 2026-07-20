// CostCalculator - Standalone Tests
// Run: node tests/unit/costoCalculator.standalone.test.js
/* eslint-disable no-console */

function calculateTotal(kilometros, rendimiento, precioCombustible) {
  if (kilometros <= 0) throw new Error('Kilómetros deben ser mayores a 0');
  if (rendimiento <= 0) throw new Error('Rendimiento debe ser mayor a 0');
  if (precioCombustible < 0) throw new Error('Precio de combustible no puede ser negativo');
  return Math.round((kilometros / rendimiento) * precioCombustible * 100) / 100;
}

function validateKilometers(km) {
  if (km === undefined || km === null) return { valid: false, error: 'Kilómetros es requerido' };
  if (typeof km !== 'number' || isNaN(km))
    return { valid: false, error: 'Kilómetros debe ser un número' };
  if (km <= 0) return { valid: false, error: 'Kilómetros debe ser mayor a 0' };
  return { valid: true };
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
    }
  };
}

console.log('\nCostCalculator - calculateTotal');
test('calculates correctly for gasoline vehicle (30km/6kmL/$25 = $125)', () =>
  expect(calculateTotal(30, 6, 25)).toBe(125));
test('calculates correctly for diesel vehicle (30km/8kmL/$28 = $105)', () =>
  expect(calculateTotal(30, 8, 28)).toBe(105));
test('handles decimal kilometers (30.5km/6kmL/$25 = $127.08)', () =>
  expect(calculateTotal(30.5, 6, 25)).toBe(127.08));
test('handles large distances (100km/10kmL/$28 = $280)', () =>
  expect(calculateTotal(100, 10, 28)).toBe(280));
test('rounds to 2 decimal places (33km/7kmL/$25 = $117.86)', () =>
  expect(calculateTotal(33, 7, 25)).toBe(117.86));
test('handles zero precio (free fuel = $0)', () => expect(calculateTotal(30, 6, 0)).toBe(0));
test('throws for zero kilometers', () => {
  try {
    calculateTotal(0, 6, 25);
    throw new Error('Did not throw');
  } catch (e) {
    if (e.message !== 'Kilómetros deben ser mayores a 0') throw e;
  }
});
test('throws for negative kilometers', () => {
  try {
    calculateTotal(-10, 6, 25);
    throw new Error('Did not throw');
  } catch (e) {
    if (e.message !== 'Kilómetros deben ser mayores a 0') throw e;
  }
});
test('throws for zero rendimiento', () => {
  try {
    calculateTotal(30, 0, 25);
    throw new Error('Did not throw');
  } catch (e) {
    if (e.message !== 'Rendimiento debe ser mayor a 0') throw e;
  }
});
test('throws for negative rendimiento', () => {
  try {
    calculateTotal(30, -5, 25);
    throw new Error('Did not throw');
  } catch (e) {
    if (e.message !== 'Rendimiento debe ser mayor a 0') throw e;
  }
});

console.log('\nCostCalculator - validateKilometers');
test('valid for positive number', () => expect(validateKilometers(30)).toEqual({ valid: true }));
test('valid for decimal number', () => expect(validateKilometers(30.5)).toEqual({ valid: true }));
test('invalid for zero', () =>
  expect(validateKilometers(0)).toEqual({ valid: false, error: 'Kilómetros debe ser mayor a 0' }));
test('invalid for undefined', () =>
  expect(validateKilometers(undefined)).toEqual({
    valid: false,
    error: 'Kilómetros es requerido'
  }));
test('invalid for null', () =>
  expect(validateKilometers(null)).toEqual({ valid: false, error: 'Kilómetros es requerido' }));
test('invalid for NaN', () =>
  expect(validateKilometers(NaN)).toEqual({
    valid: false,
    error: 'Kilómetros debe ser un número'
  }));
test('invalid for negative', () =>
  expect(validateKilometers(-5)).toEqual({ valid: false, error: 'Kilómetros debe ser mayor a 0' }));

console.log(`\n${'─'.repeat(40)}`);
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
