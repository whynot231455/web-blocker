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
// 2026-01-05 is a Monday.
function on(day, hour, minute = 0) {
  return new Date(2026, 0, 4 + day, hour, minute, 0, 0);
}

test('days restrict a window to the selected weekdays only', () => {
  const weekdays = { enabled: true, start: '09:00', end: '17:00', days: [1, 3] }; // Mon, Wed

  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(weekdays, on(1, 12)).allowed, false); // Mon inside
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(weekdays, on(1, 18)).allowed, true);  // Mon outside time
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(weekdays, on(2, 12)).allowed, true);  // Tue inside time, wrong day
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(weekdays, on(3, 12)).allowed, false); // Wed inside
});

test('next transition skips unselected days', () => {
  const monday = { enabled: true, start: '09:00', end: '17:00', days: [1] };

  // Tuesday noon: next flip is the following Monday 09:00.
  assert.strictEqual(
    SCHEDULE_UTILS.getAccessWindowState(monday, on(2, 12)).nextTransitionAt,
    on(8, 9).getTime()
  );
  // Monday noon: blocking ends at 17:00 the same day.
  assert.strictEqual(
    SCHEDULE_UTILS.getAccessWindowState(monday, on(1, 12)).nextTransitionAt,
    on(1, 17).getTime()
  );
});

test('overnight window with days belongs to the day it starts on', () => {
  const mondayNight = { enabled: true, start: '22:00', end: '06:00', days: [1] };

  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(mondayNight, on(1, 23)).allowed, false); // Mon 23:00
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(mondayNight, on(2, 3)).allowed, false);  // Tue 03:00 (Mon's tail)
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(mondayNight, on(2, 23)).allowed, true);  // Tue 23:00
  assert.strictEqual(SCHEDULE_UTILS.getAccessWindowState(mondayNight, on(1, 3)).allowed, true);   // Mon 03:00 (Sun's tail)
});

test('normalizeDays collapses missing, invalid and full-week lists to every day', () => {
  assert.strictEqual(SCHEDULE_UTILS.normalizeDays(undefined), null);
  assert.strictEqual(SCHEDULE_UTILS.normalizeDays([]), null);
  assert.strictEqual(SCHEDULE_UTILS.normalizeDays(['a', 9, -1]), null);
  assert.strictEqual(SCHEDULE_UTILS.normalizeDays([0, 1, 2, 3, 4, 5, 6]), null);
  assert.deepStrictEqual(SCHEDULE_UTILS.normalizeDays([5, 1, 1, 3]), [1, 3, 5]);

  const normalized = SCHEDULE_UTILS.normalizeAccessWindow({ start: '09:00', end: '17:00', days: [0, 1, 2, 3, 4, 5, 6] });
  assert.deepStrictEqual(normalized, { enabled: true, start: '09:00', end: '17:00' });
});

test('signature is unchanged for every-day windows and differs when days differ', () => {
  const everyDay = [{ url: 'a.com', access_window: { enabled: true, start: '09:00', end: '17:00' } }];
  const monOnly = [{ url: 'a.com', access_window: { enabled: true, start: '09:00', end: '17:00', days: [1] } }];
  const tueOnly = [{ url: 'a.com', access_window: { enabled: true, start: '09:00', end: '17:00', days: [2] } }];

  assert.strictEqual(SCHEDULE_UTILS.buildBlockedSitesSignature(everyDay), 'a.com:1:1:09:00:17:00');
  assert.notStrictEqual(SCHEDULE_UTILS.buildBlockedSitesSignature(monOnly), SCHEDULE_UTILS.buildBlockedSitesSignature(everyDay));
  assert.notStrictEqual(SCHEDULE_UTILS.buildBlockedSitesSignature(monOnly), SCHEDULE_UTILS.buildBlockedSitesSignature(tueOnly));
});
