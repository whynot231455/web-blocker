const test = require('node:test');
const assert = require('node:assert');

// Characterization of the last-writer-wins rule shared by the push path
// (syncDashboardToExtension) and the pull path (syncExtensionToDashboard) in
// extension/content/dashboard-sync.js, with intent minted/stripped in
// extension/background/background.js (replaceGuestSites sets sitesEmptiedAt,
// clearExtensionSessionState strips it).
//
// Rule: an empty extension state may overwrite a non-empty dashboard ONLY
// with explicit empty intent (sitesEmptiedAt >= dashboardUpdatedAt, set
// solely by the popup's replaceGuestSites([]) CLEAR ALL / delete-last-site
// flow). Otherwise the newer timestamp alone must never wipe, and ties
// (strict `>`) must never wipe.
//
// Keep this matrix in sync with the guards if the rule ever changes.

/**
 * @param {object} args
 * @param {number} args.extSites extension site count
 * @param {number} args.dashSites dashboard site count
 * @param {number} args.extUpdatedAt extension sitesUpdatedAt
 * @param {number} args.dashUpdatedAt dashboard sitesUpdatedAt
 * @param {number} args.extEmptiedAt extension sitesEmptiedAt (0 = no intent)
 * @param {boolean} args.signaturesDiffer
 */
function extensionMayOverwriteDashboard({
    extSites,
    dashSites,
    extUpdatedAt,
    dashUpdatedAt,
    extEmptiedAt,
    signaturesDiffer
}) {
    if (!signaturesDiffer) return false;
    const emptyWithoutIntent =
        extSites === 0 &&
        dashSites > 0 &&
        !(extEmptiedAt > 0 && extEmptiedAt >= dashUpdatedAt);
    if (emptyWithoutIntent) return false;
    return extUpdatedAt > dashUpdatedAt;
}

test('seeded placeholder empty (0-tie, signatures differ) never wipes', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 0, dashSites: 2,
            extUpdatedAt: 0, dashUpdatedAt: 0,
            extEmptiedAt: 0, signaturesDiffer: true
        }),
        false
    );
});

test('spurious timestamped empty without intent never wipes a newer dashboard', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 0, dashSites: 2,
            extUpdatedAt: 2000, dashUpdatedAt: 1000,
            extEmptiedAt: 0, signaturesDiffer: true
        }),
        false
    );
});

test('explicit popup CLEAR ALL (intent >= dashboard time) overwrites', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 0, dashSites: 2,
            extUpdatedAt: 2000, dashUpdatedAt: 1000,
            extEmptiedAt: 2000, signaturesDiffer: true
        }),
        true
    );
});

test('stale intent (dashboard mutated after the clear) does not wipe', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 0, dashSites: 3,
            extUpdatedAt: 3000, dashUpdatedAt: 4000,
            extEmptiedAt: 2000, signaturesDiffer: true
        }),
        false
    );
});

test('non-empty extension newer than dashboard still wins', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 1, dashSites: 2,
            extUpdatedAt: 2000, dashUpdatedAt: 1000,
            extEmptiedAt: 0, signaturesDiffer: true
        }),
        true
    );
});

test('non-empty extension older than dashboard never reverts it', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 1, dashSites: 2,
            extUpdatedAt: 1000, dashUpdatedAt: 2000,
            extEmptiedAt: 0, signaturesDiffer: true
        }),
        false
    );
});

test('equal timestamps with differing signatures never wipe (strict >)', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 1, dashSites: 1,
            extUpdatedAt: 1000, dashUpdatedAt: 1000,
            extEmptiedAt: 0, signaturesDiffer: true
        }),
        false
    );
});

test('matching signatures never trigger a write', () => {
    assert.strictEqual(
        extensionMayOverwriteDashboard({
            extSites: 2, dashSites: 2,
            extUpdatedAt: 2000, dashUpdatedAt: 1000,
            extEmptiedAt: 0, signaturesDiffer: false
        }),
        false
    );
});
