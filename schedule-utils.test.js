const test = require('node:test');
const assert = require('node:assert');

const SCHEDULE_UTILS = require('./shared/schedule-utils.js');

const window = { enabled: true, start: '09:00', end: '17:00' };

function at(hour, minute = 0) {
  return new Date(2026, 0, 5, hour, minute, 0, 0);
}

test('non-crossing block window blocks only inside the window', () => {
  // 09:00-17:00: allowed outside, blocked inside
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(window, at(8)).allowed, true);
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(window, at(9)).allowed, false);
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(window, at(12)).allowed, false);
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(window, at(16, 59)).allowed, false);
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(window, at(17)).allowed, true);
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(window, at(18)).allowed, true);
});

test('non-crossing block window reports the next transition boundary', () => {
  const dayStart = new Date(2026, 0, 5, 0, 0, 0, 0);
  const tomorrow = new Date(2026, 0, 6, 0, 0, 0, 0);

  // Inside the window (12:00) -> next transition at end (17:00)
  assert.strictEqual(
    SCHEDULE_UTILS.getAccessWindowState(window, at(12)).nextTransitionAt,
    dayStart.getTime() + 17 * 60 * 60 * 1000
  );
  // Before the window (08:00) -> next transition at start (09:00)
  assert.strictEqual(
    SCHEDULE_UTILS.getAccessWindowState(window, at(8)).nextTransitionAt,
    dayStart.getTime() + 9 * 60 * 60 * 1000
  );
  // After the window (18:00) -> next transition at start tomorrow (09:00)
  assert.strictEqual(
    SCHEDULE_UTILS.getAccessWindowState(window, at(18)).nextTransitionAt,
    tomorrow.getTime() + 9 * 60 * 60 * 1000
  );
});

test('no window keeps the site blocked', () => {
  const state = SCHEDULE_UTILS.getAccessWindowState(null, at(12));
  assert.strictEqual(state.allowed, false);
  assert.strictEqual(state.configured, false);
  assert.strictEqual(state.nextTransitionAt, null);
});

test('disabled window keeps the site blocked', () => {
  const state = SCHEDULE_UTILS.getAccessWindowState(
    { enabled: false, start: '09:00', end: '17:00' },
    at(8)
  );
  assert.strictEqual(state.allowed, false);
  assert.strictEqual(state.configured, true);
  assert.strictEqual(state.nextTransitionAt, null);
});

test('overnight block window (22:00-06:00) blocks overnight and allows the day', () => {
  const overnight = { enabled: true, start: '22:00', end: '06:00' };
  const dayStart = new Date(2026, 0, 5, 0, 0, 0, 0);
  const tomorrow = new Date(2026, 0, 6, 0, 0, 0, 0);

  // 23:00 -> blocked, next transition at 06:00 tomorrow
  const late = SCHEDULE_UTILS.getAccessWindowState(overnight, at(23));
  assert.strictEqual(late.allowed, false);
  assert.strictEqual(late.nextTransitionAt, tomorrow.getTime() + 6 * 60 * 60 * 1000);

  // 03:00 -> blocked, next transition at 06:00 today
  const early = SCHEDULE_UTILS.getAccessWindowState(overnight, at(3));
  assert.strictEqual(early.allowed, false);
  assert.strictEqual(early.nextTransitionAt, dayStart.getTime() + 6 * 60 * 60 * 1000);

  // 12:00 (allowed gap) -> allowed, next transition at 22:00 today
  const midday = SCHEDULE_UTILS.getAccessWindowState(overnight, at(12));
  assert.strictEqual(midday.allowed, true);
  assert.strictEqual(midday.nextTransitionAt, dayStart.getTime() + 22 * 60 * 60 * 1000);
});