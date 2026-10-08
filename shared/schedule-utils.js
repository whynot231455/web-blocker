/**
 * Shared block-window utilities for CTRL+BLCK.
 * Used by the website and extension to keep schedule rules identical.
 *
 * A saved window defines the period during which a site is BLOCKED.
 * Outside the window the site is accessible. No window (or a disabled one)
 * means the site stays blocked at all times.
 *
 * A window may also be limited to certain weekdays (`days`, 0 = Sunday ..
 * 6 = Saturday). When `days` is absent the window applies every day. An
 * overnight window belongs to the day it STARTS on: Mon 22:00-06:00 blocks
 * Monday night and the early hours of Tuesday.
 */

const MINUTES_PER_DAY = 24 * 60;
const DAYS_PER_WEEK = 7;

/**
 * @typedef {Object} AccessWindow
 * @property {boolean} enabled
 * @property {string} start
 * @property {string} end
 * @property {number[]} [days]  Weekdays the window applies to (0 = Sunday). Omitted means every day.
 */

/**
 * @typedef {Object} AccessWindowState
 * @property {boolean} allowed  True when the site is accessible (i.e. OUTSIDE the block window).
 * @property {boolean} configured
 * @property {number | null} nextTransitionAt
 */

function parseTimeToMinutes(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function normalizeTimeString(value) {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return null;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Coerce a raw weekday list into a sorted, de-duplicated array of 0-6.
 * Returns null when the list is missing, empty, invalid or covers all seven
 * days, so "every day" has a single canonical representation (no `days`).
 * @param {unknown} value
 * @returns {number[] | null}
 */
function normalizeDays(value) {
  if (!Array.isArray(value)) return null;

  const days = Array.from(new Set(
    value.filter((day) => Number.isInteger(day) && day >= 0 && day < DAYS_PER_WEEK)
  )).sort((a, b) => a - b);

  if (days.length === 0 || days.length === DAYS_PER_WEEK) return null;
  return days;
}

/**
 * @param {unknown} window
 * @returns {AccessWindow | null}
 */
function normalizeAccessWindow(window) {
  if (!window || typeof window !== 'object') return null;

  const raw = /** @type {{ enabled?: unknown; start?: unknown; end?: unknown; days?: unknown }} */ (window);
  const start = normalizeTimeString(typeof raw.start === 'string' ? raw.start : '');
  const end = normalizeTimeString(typeof raw.end === 'string' ? raw.end : '');

  if (!start || !end || start === end) return null;

  const days = normalizeDays(raw.days);

  return {
    enabled: raw.enabled !== false,
    start,
    end,
    ...(days ? { days } : {})
  };
}

/**
 * True when `date` falls inside the block window, honouring the weekday filter.
 * @param {number} startMinutes
 * @param {number} endMinutes
 * @param {number[] | undefined} days
 * @param {Date} date
 */
function isInsideBlockWindow(startMinutes, endMinutes, days, date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const weekday = date.getDay();

  // The weekday the window belongs to (the day it starts on).
  let ownerDay;
  if (startMinutes < endMinutes) {
    if (minutes < startMinutes || minutes >= endMinutes) return false;
    ownerDay = weekday;
  } else if (minutes >= startMinutes) {
    ownerDay = weekday;
  } else if (minutes < endMinutes) {
    ownerDay = (weekday + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  } else {
    return false;
  }

  return !days || days.includes(ownerDay);
}

/**
 * Block-window semantics: a saved window defines the period during which the
 * site is BLOCKED. `allowed` is therefore true when the current time is OUTSIDE
 * the window. A site with no valid/enabled window stays blocked at all times.
 * @param {AccessWindow | null | undefined} window
 * @param {Date} [now]
 * @returns {AccessWindowState}
 */
function getAccessWindowState(window, now = new Date()) {
  const normalized = normalizeAccessWindow(window);
  if (!normalized || normalized.enabled === false) {
    return { allowed: false, configured: Boolean(normalized), nextTransitionAt: null };
  }

  const startMinutes = parseTimeToMinutes(normalized.start);
  const endMinutes = parseTimeToMinutes(normalized.end);
  if (startMinutes === null || endMinutes === null) {
    return { allowed: false, configured: false, nextTransitionAt: null };
  }

  const inWindow = isInsideBlockWindow(startMinutes, endMinutes, normalized.days, now);

  // The state can only flip at a start/end boundary, so scan the boundaries
  // over the coming week for the first one that changes the answer.
  let nextTransitionAt = null;
  const boundaries = [startMinutes, endMinutes].sort((a, b) => a - b);

  scan: for (let offset = 0; offset <= DAYS_PER_WEEK + 1; offset += 1) {
    for (const minutes of boundaries) {
      const boundary = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
        Math.floor(minutes / 60),
        minutes % 60,
        0,
        0
      );
      if (boundary.getTime() <= now.getTime()) continue;
      if (isInsideBlockWindow(startMinutes, endMinutes, normalized.days, boundary) !== inWindow) {
        nextTransitionAt = boundary.getTime();
        break scan;
      }
    }
  }

  return {
    allowed: !inWindow,
    configured: true,
    nextTransitionAt
  };
}

/**
 * @param {Array<{ url?: string | null; is_active?: boolean | null; access_window?: AccessWindow | null }>} sites
 * @returns {string}
 */
function buildBlockedSitesSignature(sites) {
  return Array.from(new Set(
    (Array.isArray(sites) ? sites : [])
      .map((site) => {
        const normalized = site && typeof site === 'object' ? site : null;
        if (!normalized) return null;

        const url = typeof normalized.url === 'string' ? normalized.url.trim().toLowerCase() : '';
        if (!url) return null;

        const accessWindow = normalizeAccessWindow(normalized.access_window);
        // Days are appended only when restricted, so signatures of
        // every-day windows stay identical to those saved before weekdays existed.
        return [
          url,
          normalized.is_active === false ? '0' : '1',
          accessWindow?.enabled === false ? '0' : '1',
          accessWindow?.start || '',
          accessWindow?.end || '',
          ...(accessWindow?.days ? [accessWindow.days.join('')] : [])
        ].join(':');
      })
      .filter(Boolean)
  ))
    .sort()
    .join('|');
}

const SCHEDULE_UTILS = {
  parseTimeToMinutes,
  normalizeTimeString,
  normalizeDays,
  normalizeAccessWindow,
  getAccessWindowState,
  buildBlockedSitesSignature
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCHEDULE_UTILS;
}

if (typeof globalThis !== 'undefined') {
  globalThis.CTRL_BLCK_SCHEDULE_UTILS = SCHEDULE_UTILS;
}
