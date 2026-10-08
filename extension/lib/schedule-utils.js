/**
 * Shared block-window utilities for CTRL+BLCK.
 * Guarded against double-declaration in the extension content-script world.
 *
 * A saved window defines the period during which a site is BLOCKED.
 * Outside the window the site is accessible. No window (or a disabled one)
 * means the site stays blocked at all times.
 */

if (!globalThis.CTRL_BLCK_SCHEDULE_UTILS) {
const MINUTES_PER_DAY = 24 * 60;
const DAYS_PER_WEEK = 7;

/**
 * A normalized block window: the site is blocked between `start` and `end`,
 * optionally only on the listed weekdays (0 = Sunday .. 6 = Saturday; omitted = every day).
 * An overnight window belongs to the day it starts on.
 * @typedef {{ enabled: boolean; start: string; end: string; days?: number[] }} AccessWindow
 */

/**
 * Parse a `"HH:MM"` string into minutes past midnight.
 * @param {unknown} value
 * @returns {number | null} minutes in [0, 1439], or null if not a valid time
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

/**
 * Normalize a time-like value to a zero-padded `"HH:MM"` string.
 * @param {unknown} value
 * @returns {string | null}
 */
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
 * Evaluate a block window against the current time.
 * @param {unknown} window a raw or normalized access-window value
 * @param {Date} [now] the reference time (defaults to now)
 * @returns {{ allowed: boolean; configured: boolean; nextTransitionAt: number | null }}
 *   `allowed` is true when the site is currently accessible; `nextTransitionAt`
 *   is the epoch-ms of the next allowed/blocked flip, or null when unconfigured.
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
 * Build a stable, order-independent fingerprint of a site list (url + active
 * state + window) so callers can cheaply detect whether anything changed.
 * @param {unknown} sites array of site-like objects
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

globalThis.CTRL_BLCK_SCHEDULE_UTILS = SCHEDULE_UTILS;
}
