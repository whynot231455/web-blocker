/**
 * Shared access-window utilities for CTRL+BLCK.
 * Guarded against double-declaration in the extension content-script world.
 */

if (!globalThis.CTRL_BLCK_SCHEDULE_UTILS) {
const MINUTES_PER_DAY = 24 * 60;

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

function normalizeAccessWindow(window) {
    if (!window || typeof window !== 'object') return null;

    const raw = /** @type {{ enabled?: unknown; start?: unknown; end?: unknown }} */ (window);
    const start = normalizeTimeString(typeof raw.start === 'string' ? raw.start : '');
    const end = normalizeTimeString(typeof raw.end === 'string' ? raw.end : '');

    if (!start || !end || start === end) return null;

    return {
        enabled: raw.enabled !== false,
        start,
        end
    };
}

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

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const crossesMidnight = startMinutes > endMinutes;
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    let allowed = false;
    let nextTransitionAt = null;

    if (crossesMidnight) {
        allowed = currentMinutes >= startMinutes || currentMinutes < endMinutes;
        if (allowed) {
            if (currentMinutes >= startMinutes) {
                const tomorrow = new Date(dayStart);
                tomorrow.setDate(tomorrow.getDate() + 1);
                nextTransitionAt = tomorrow.getTime() + (endMinutes * 60 * 1000);
            } else {
                nextTransitionAt = dayStart.getTime() + (endMinutes * 60 * 1000);
            }
        } else {
            nextTransitionAt = dayStart.getTime() + (startMinutes * 60 * 1000);
        }
    } else {
        allowed = currentMinutes >= startMinutes && currentMinutes < endMinutes;
        if (allowed) {
            nextTransitionAt = dayStart.getTime() + (endMinutes * 60 * 1000);
        } else if (currentMinutes < startMinutes) {
            nextTransitionAt = dayStart.getTime() + (startMinutes * 60 * 1000);
        } else {
            const tomorrow = new Date(dayStart);
            tomorrow.setDate(tomorrow.getDate() + 1);
            nextTransitionAt = tomorrow.getTime() + (startMinutes * 60 * 1000);
        }
    }

    return {
        allowed,
        configured: true,
        nextTransitionAt
    };
}

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
                    accessWindow?.end || ''
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
    normalizeAccessWindow,
    getAccessWindowState,
    buildBlockedSitesSignature
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SCHEDULE_UTILS;
}

globalThis.CTRL_BLCK_SCHEDULE_UTILS = SCHEDULE_UTILS;
}
