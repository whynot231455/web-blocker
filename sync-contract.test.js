const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Guards the shared sync contract against drift: the website reads storage
// keys from shared/sync-contract.json while the extension reads them from
// extension/lib/sync-constants.js (and the generated extension-dev copy).
// A key added in one place but missing in another silently breaks the
// dashboard <-> extension bridge (this is how the sitesEmptiedAt LWW marker
// could have been lost).

const contract = JSON.parse(fs.readFileSync(path.join(__dirname, 'shared', 'sync-contract.json'), 'utf8'));

function loadSyncConstants(relativePath) {
    const modulePath = path.join(__dirname, relativePath);
    // The file sets a global as a side effect, so it must re-run on every load.
    delete require.cache[require.resolve(modulePath)];
    delete globalThis.CTRL_BLCK_SYNC;
    require(modulePath);
    const sync = globalThis.CTRL_BLCK_SYNC;
    delete globalThis.CTRL_BLCK_SYNC;
    assert.ok(sync, `${relativePath} must set globalThis.CTRL_BLCK_SYNC`);
    return sync;
}

test('contract and extension sync-constants share identical storage keys', () => {
    const live = loadSyncConstants('extension/lib/sync-constants.js');
    assert.deepStrictEqual(live.storageKeys, contract.storageKeys);
});

test('contract carries the sitesEmptiedAt LWW intent marker', () => {
    assert.strictEqual(contract.storageKeys.sitesEmptiedAt, 'ctrl_blck_sites_emptied_at');
});

test('dashboard bridge content script only runs on dashboard origins', () => {
    // dashboard-sync.js exposes the block list and session state to the page,
    // so it must never be injected into arbitrary sites.
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'extension', 'manifest.json'), 'utf8'));
    const bridge = manifest.content_scripts.find((script) => script.js.includes('content/dashboard-sync.js'));
    assert.ok(bridge, 'manifest must register content/dashboard-sync.js');
    assert.deepStrictEqual(bridge.matches, contract.dashboardOrigins.map((origin) => `${origin}/*`));
});

test('generated dev extension keeps storage keys in sync', () => {
    const devPath = path.join(__dirname, 'extension-dev', 'lib', 'sync-constants.js');
    if (!fs.existsSync(devPath)) {
        // Dev build is generated (npm run build:extension:dev); skip when absent.
        return;
    }
    const dev = loadSyncConstants('extension-dev/lib/sync-constants.js');
    assert.deepStrictEqual(dev.storageKeys, contract.storageKeys);
});

test('generated dev extension limits the dashboard bridge to its dev origin', () => {
    const devManifestPath = path.join(__dirname, 'extension-dev', 'manifest.json');
    if (!fs.existsSync(devManifestPath)) {
        // Dev build is generated (npm run build:extension:dev); skip when absent.
        return;
    }
    const manifest = JSON.parse(fs.readFileSync(devManifestPath, 'utf8'));
    const dev = loadSyncConstants('extension-dev/lib/sync-constants.js');
    const bridge = manifest.content_scripts.find((script) => script.js.includes('content/dashboard-sync.js'));
    assert.ok(bridge, 'dev manifest must register content/dashboard-sync.js');
    assert.deepStrictEqual(bridge.matches, dev.dashboardOrigins.map((origin) => `${origin}/*`));
});
