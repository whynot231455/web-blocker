const test = require('node:test');
const assert = require('node:assert');

// Mirrors website/src/lib/guestRedirect.ts (hasGuestSitesForRedirect +
// getSafeReturnTo). The TS module cannot be required by the root node:test
// runner (it uses the `@/` path alias), so this file characterizes the exact
// rule with a storage stub. Keep both in sync if the rule ever changes.

const GUEST_FLAG = 'ctrl_blck_guest';
const GUEST_SITES = 'ctrl_blck_sites';

function makeStorage(entries = {}) {
    const store = new Map(Object.entries(entries));
    return {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value))
    };
}

function hasGuestSitesForRedirect(storage) {
    try {
        if (storage.getItem(GUEST_FLAG) !== 'true') return false;
        const raw = storage.getItem(GUEST_SITES);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return false;
        return parsed.some((site) => typeof site === 'object' && site !== null && Boolean(site.url));
    } catch {
        return false;
    }
}

function getSafeReturnTo(raw, fallback = '/dashboard') {
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
    return fallback;
}

test('guest with saved sites redirects', () => {
    const storage = makeStorage({
        [GUEST_FLAG]: 'true',
        [GUEST_SITES]: JSON.stringify([{ url: 'x.com' }, { url: 'reddit.com' }])
    });
    assert.strictEqual(hasGuestSitesForRedirect(storage), true);
});

test('guest flag without sites does not redirect', () => {
    const storage = makeStorage({ [GUEST_FLAG]: 'true', [GUEST_SITES]: '[]' });
    assert.strictEqual(hasGuestSitesForRedirect(storage), false);
});

test('sites without guest flag do not redirect', () => {
    const storage = makeStorage({ [GUEST_SITES]: JSON.stringify([{ url: 'x.com' }]) });
    assert.strictEqual(hasGuestSitesForRedirect(storage), false);
});

test('corrupt stored JSON never redirects and never throws', () => {
    const storage = makeStorage({ [GUEST_FLAG]: 'true', [GUEST_SITES]: '{not-json' });
    assert.strictEqual(hasGuestSitesForRedirect(storage), false);
});

test('entries without URLs do not count as saved sites', () => {
    const storage = makeStorage({
        [GUEST_FLAG]: 'true',
        [GUEST_SITES]: JSON.stringify([{ id: 'local_abc' }, { url: '' }])
    });
    assert.strictEqual(hasGuestSitesForRedirect(storage), false);
});

test('safe return target passes through same-origin paths', () => {
    assert.strictEqual(getSafeReturnTo('/dashboard'), '/dashboard');
    assert.strictEqual(getSafeReturnTo('/settings/privacy-security'), '/settings/privacy-security');
});

test('safe return target rejects open redirects and empties', () => {
    assert.strictEqual(getSafeReturnTo('//evil.com/phish'), '/dashboard');
    assert.strictEqual(getSafeReturnTo('https://evil.com'), '/dashboard');
    assert.strictEqual(getSafeReturnTo(null), '/dashboard');
    assert.strictEqual(getSafeReturnTo(''), '/dashboard');
});
