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
    delete globalThis.CTRL_BLCK_SYNC;
    require(path.join(__dirname, relativePath));
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

test('generated dev extension keeps storage keys in sync', () => {
    const devPath = path.join(__dirname, 'extension-dev', 'lib', 'sync-constants.js');
    if (!fs.existsSync(devPath)) {
        // Dev build is generated (npm run build:extension:dev); skip when absent.
        return;
    }
    const dev = loadSyncConstants('extension-dev/lib/sync-constants.js');
    assert.deepStrictEqual(dev.storageKeys, contract.storageKeys);
});
