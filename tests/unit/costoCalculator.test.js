// Unit tests for CostCalculator

function calculateTotal(kilometros, rendimiento, precioCombustible) {
  if (kilometros <= 0) {
    throw new Error('Kilómetros deben ser mayores a 0')
  }
  if (rendimiento <= 0) {
    throw new Error('Rendimiento debe ser mayor a 0')
  }
  if (precioCombustible < 0) {
    throw new Error('Precio de combustible no puede ser negativo')
  }
  return Math.round((kilometros / rendimiento) * precioCombustible * 100) / 100
}

function validateKilometers(km) {
  if (km === undefined || km === null) {
    return { valid: false, error: 'Kilómetros es requerido' }
  }
  if (typeof km !== 'number' || isNaN(km)) {
    return { valid: false, error: 'Kilómetros debe ser un número' }
  }
  if (km <= 0) {
    return { valid: false, error: 'Kilómetros debe ser mayor a 0' }
  }
  return { valid: true }
}

// ─── Tests ───────────────────────────────────────────────────

describe('CostCalculator', () => {
  describe('calculateTotal', () => {
    test('calculates correctly for gasoline vehicle', () => {
      // JETTA: 30 km / 6 km/l * $25 = $125
      const result = calculateTotal(30, 6, 25)
      expect(result).toBe(125)
    })

    test('calculates correctly for diesel vehicle', () => {
      // 482: 30 km / 8 km/l * $28 = $105
      const result = calculateTotal(30, 8, 28)
      expect(result).toBe(105)
    })

    test('handles decimal kilometers', () => {
      // 30.5 km / 6 km/l * $25 = $126.67
      const result = calculateTotal(30.5, 6, 25)
      expect(result).toBe(126.67)
    })

    test('handles integer kilometers', () => {
      const result = calculateTotal(100, 10, 28)
      expect(result).toBe(280)
    })

    test('throws error for zero kilometers', () => {
      expect(() => calculateTotal(0, 6, 25)).toThrow('Kilómetros deben ser mayores a 0')
    })

    test('throws error for negative kilometers', () => {
      expect(() => calculateTotal(-10, 6, 25)).toThrow('Kilómetros deben ser mayores a 0')
    })

    test('throws error for zero rendimiento', () => {
      expect(() => calculateTotal(30, 0, 25)).toThrow('Rendimiento debe ser mayor a 0')
    })

    test('handles zero precio (free fuel)', () => {
      const result = calculateTotal(30, 6, 0)
      expect(result).toBe(0)
    })

    test('rounds to 2 decimal places', () => {
      // 33 km / 7 km/l * $25 = $117.86 (rounded)
      const result = calculateTotal(33, 7, 25)
      expect(result).toBe(117.86)
    })
  })

  describe('validateKilometers', () => {
    test('returns valid for positive number', () => {
      const result = validateKilometers(30)
      expect(result.valid).toBe(true)
    })

    test('returns valid for decimal number', () => {
      const result = validateKilometers(30.5)
      expect(result.valid).toBe(true)
    })

    test('returns error for zero', () => {
      const result = validateKilometers(0)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Kilómetros debe ser mayor a 0')
    })

    test('returns error for negative', () => {
      const result = validateKilometers(-10)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Kilómetros debe ser mayor a 0')
    })

    test('returns error for undefined', () => {
      const result = validateKilometers(undefined)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Kilómetros es requerido')
    })

    test('returns error for null', () => {
      const result = validateKilometers(null)
      expect(result.valid).toBe(false)
    })

    test('returns error for NaN', () => {
      const result = validateKilometers(NaN)
      expect(result.valid).toBe(false)
    })
  })
})
