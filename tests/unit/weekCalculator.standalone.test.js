// WeekCalculator - Standalone Tests
// Run: node tests/unit/weekCalculator.standalone.test.js
/* eslint-disable no-console */

function isMonday(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay() === 1;
}

function getWeekStart(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

function getWeekEnd(dateStr) {
  const weekStart = new Date(getWeekStart(dateStr) + 'T00:00:00');
  weekStart.setDate(weekStart.getDate() + 6);
  return weekStart.toISOString().split('T')[0];
}

function getCurrentWeekStart() {
  return getWeekStart(new Date().toISOString().split('T')[0]);
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
    toMatch: regex => {
      if (!regex.test(actual)) throw new Error(`Expected to match ${regex}, got ${actual}`);
    }
  };
}

console.log('\nWeekCalculator - isMonday');
test('returns true for Monday (2025-06-30)', () => expect(isMonday('2025-06-30')).toBe(true));
test('returns false for Tuesday (2025-07-01)', () => expect(isMonday('2025-07-01')).toBe(false));
test('returns false for Sunday (2025-06-29)', () => expect(isMonday('2025-06-29')).toBe(false));
test('returns false for Wednesday (2025-07-02)', () => expect(isMonday('2025-07-02')).toBe(false));
test('returns false for Saturday (2025-07-05)', () => expect(isMonday('2025-07-05')).toBe(false));

console.log('\nWeekCalculator - getWeekStart');
test('returns Monday for Monday (2025-06-30 → 2025-06-30)', () =>
  expect(getWeekStart('2025-06-30')).toBe('2025-06-30'));
test('returns Monday for Tuesday (2025-07-01 → 2025-06-30)', () =>
  expect(getWeekStart('2025-07-01')).toBe('2025-06-30'));
test('returns Monday for Sunday (2025-06-29 → 2025-06-23)', () =>
  expect(getWeekStart('2025-06-29')).toBe('2025-06-23'));
test('returns Monday for Wednesday (2025-07-02 → 2025-06-30)', () =>
  expect(getWeekStart('2025-07-02')).toBe('2025-06-30'));
test('returns Monday for Saturday (2025-07-05 → 2025-06-30)', () =>
  expect(getWeekStart('2025-07-05')).toBe('2025-06-30'));

console.log('\nWeekCalculator - getWeekEnd');
test('returns Sunday for Monday (2025-06-30 → 2025-07-06)', () =>
  expect(getWeekEnd('2025-06-30')).toBe('2025-07-06'));
test('returns Sunday for Wednesday (2025-07-02 → 2025-07-06)', () =>
  expect(getWeekEnd('2025-07-02')).toBe('2025-07-06'));
test('returns Sunday for Sunday itself (2025-06-29 → 2025-06-29)', () =>
  expect(getWeekEnd('2025-06-29')).toBe('2025-06-29'));

console.log('\nWeekCalculator - getCurrentWeekStart');
test('returns a valid YYYY-MM-DD date string', () =>
  expect(getCurrentWeekStart()).toMatch(/^\d{4}-\d{2}-\d{2}$/));
test('returns current weeks Monday', () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const expectedMonday = new Date(today);
  expectedMonday.setDate(today.getDate() + diff);
  const expected = expectedMonday.toISOString().split('T')[0];
  expect(getCurrentWeekStart()).toBe(expected);
});

console.log('\nWeekCalculator - Consistency');
test('getWeekEnd is 6 days after getWeekStart (2025-06-30)', () => {
  const start = getWeekStart('2025-06-30');
  const end = getWeekEnd('2025-06-30');
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
  if (diffDays !== 6) throw new Error(`Expected 6 days difference, got ${diffDays}`);
});

console.log(`\n${'─'.repeat(40)}`);
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log(`Result: ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

process.exit(failed === 0 ? 0 : 1);
