const test = require('node:test');
const assert = require('node:assert');

require('./extension/lib/url-utils.js');
require('./extension/lib/schedule-utils.js');
require('./extension/lib/sync-constants.js');
require('./extension/lib/guest-site-store.js');

const store = globalThis.CTRL_BLCK_GUEST_SITE_STORE;

test('guest site records normalize and project active blockers', () => {
    const projection = store.project([
        { url: 'https://www.youtube.com/watch?v=1', is_active: true },
        { url: 'reddit.com', is_active: false },
        { url: 'youtube.com', is_active: false }
    ]);

    assert.deepStrictEqual(projection.urls, []);
    assert.strictEqual(projection.sites.length, 2);
    assert.ok(projection.signature.includes('youtube.com:0:1::'));
    assert.ok(projection.signature.includes('reddit.com:0:1::'));
});

test('legacy URLs migrate into canonical active records with schedules', () => {
    const records = store.fromLegacyUrls(['example.com'], {
        'example.com': { enabled: true, start: '09:00', end: '17:00' }
    });
    const projection = store.project(records);

    assert.deepStrictEqual(projection.urls, ['example.com']);
    assert.deepStrictEqual(projection.schedules, {
        'example.com': { enabled: true, start: '09:00', end: '17:00' }
    });
    assert.strictEqual(projection.signature, 'example.com:1:1:09:00:17:00');
});

test('popup deletion projection cannot retain a removed site', () => {
    const before = store.normalizeSites([{ url: 'youtube.com' }, { url: 'news.ycombinator.com' }]);
    const after = store.project(before.filter((site) => site.url !== 'youtube.com'));

    assert.deepStrictEqual(after.urls, ['news.ycombinator.com']);
    assert.strictEqual(after.signature.includes('youtube.com'), false);
});
