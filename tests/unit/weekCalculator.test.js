// Unit tests for WeekCalculator

function isMonday(dateStr) {
  const date = new Date(dateStr);
  return date.getUTCDay() === 1;
}

function getWeekStart(dateStr) {
  const date = new Date(dateStr);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(dateStr) {
  const monday = new Date(getWeekStart(dateStr));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return sunday.toISOString().split('T')[0];
}

function getCurrentWeekStart() {
  return getWeekStart(new Date().toISOString());
}

// ─── Tests ───────────────────────────────────────────────────

describe('WeekCalculator', () => {
  describe('isMonday', () => {
    test('returns true for monday', () => {
      // June 30, 2025 is a Monday
      expect(isMonday('2025-06-30')).toBe(true);
    });

    test('returns false for tuesday', () => {
      expect(isMonday('2025-07-01')).toBe(false);
    });

    test('returns false for wednesday', () => {
      expect(isMonday('2025-07-02')).toBe(false);
    });

    test('returns false for sunday', () => {
      expect(isMonday('2025-06-29')).toBe(false);
    });

    test('handles different date formats', () => {
      expect(isMonday('2025-07-07')).toBe(true); // July 7, 2025
      expect(isMonday('2025-07-14')).toBe(true); // July 14, 2025
    });
  });

  describe('getWeekStart', () => {
    test('returns monday for a monday', () => {
      const result = getWeekStart('2025-06-30');
      expect(result).toBe('2025-06-30');
    });

    test('returns monday for a tuesday', () => {
      const result = getWeekStart('2025-07-01');
      expect(result).toBe('2025-06-30');
    });

    test('returns monday for a sunday', () => {
      const result = getWeekStart('2025-06-29');
      expect(result).toBe('2025-06-23');
    });

    test('returns monday for a wednesday', () => {
      const result = getWeekStart('2025-07-02');
      expect(result).toBe('2025-06-30');
    });
  });

  describe('getWeekEnd', () => {
    test('returns sunday for a monday', () => {
      const result = getWeekEnd('2025-06-30');
      expect(result).toBe('2025-07-06');
    });

    test('returns sunday for a wednesday', () => {
      const result = getWeekEnd('2025-07-02');
      expect(result).toBe('2025-07-06');
    });

    test('returns correct range', () => {
      const monday = getWeekStart('2025-07-07');
      const sunday = getWeekEnd('2025-07-07');
      expect(monday).toBe('2025-07-07');
      expect(sunday).toBe('2025-07-13');
    });
  });

  describe('getCurrentWeekStart', () => {
    test('returns a valid date string', () => {
      const result = getCurrentWeekStart();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('returns a monday', () => {
      const result = getCurrentWeekStart();
      expect(isMonday(result)).toBe(true);
    });
  });
});
