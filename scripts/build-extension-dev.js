/**
 * Builds the DEV variant of the extension.
 *
 * Copies extension/ -> extension-dev/ and rewrites only the deltas:
 *   - manifest name / icons / default_title -> Ctrl+Blck DEV + logopic1-dev-*
 *   - dashboardOrigins / defaultDashboardOrigin -> localhost only
 *   - externally_connectable -> localhost only
 *   - dashboard-sync.js content script matches -> localhost only
 *   - popup logo -> logopic1-dev-128.png
 *   - cloud sync OFF: no Supabase URL/key, cloudSyncEnabled=false, stub
 *     config.js. The dev extension is local-only, so nothing it does (add,
 *     delete, clear) can reach the database the live site (Vercel) reads.
 *
 * The live extension stays the single source of truth. Run this after editing
 * extension/ to refresh the dev build:
 *   npm run build:extension:dev
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'extension');
const DEFAULT_DEST = path.join(ROOT, 'extension-dev');

const DEV_EXTENSION_NAME = 'Ctrl+Blck DEV';
const DEV_ORIGIN = 'http://localhost:3000';
const DEV_ICON_PREFIX = 'logopic1-dev';
const LIVE_ICON_PREFIX = 'logopic1';
const DEV_ICON_SIZES = [16, 32, 48, 128];

// Hosts of the live deployment (Vercel site + its Supabase project). None
// of them may survive in the dev build's manifest or config, otherwise dev and
// live are connected again.
const LIVE_MARKERS = ['ctrl-blck.vercel.app', 'oufqvdkybwwdxobjchze.supabase.co'];

function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function build(DEST = process.env.EXTENSION_DEV_OUT || DEFAULT_DEST) {
  console.log('Building DEV extension...');

  if (!fs.existsSync(SRC)) {
    console.error(`Error: source extension folder not found at ${SRC}`);
    process.exit(1);
  }

  const missingIcons = DEV_ICON_SIZES
    .filter((size) => !fs.existsSync(path.join(SRC, 'assets', 'icons', `${DEV_ICON_PREFIX}-${size}.png`)));
  if (missingIcons.length > 0) {
    console.warn(
      `WARNING: missing dev icons: ${missingIcons.map((s) => `${DEV_ICON_PREFIX}-${s}.png`).join(', ')}. ` +
      'The dev build will reference these files; add them to extension/assets/icons/ to avoid broken icons.'
    );
  }

  // 1. Clean + copy source tree
  fs.rmSync(DEST, { recursive: true, force: true });
  copyRecursive(SRC, DEST);
  console.log(`  Copied ${SRC} -> ${DEST}`);

  // 2. Rewrite manifest.json
  const manifestPath = path.join(DEST, 'manifest.json');
  const manifest = readJson(manifestPath);
  manifest.name = DEV_EXTENSION_NAME;
  manifest.action = manifest.action || {};
  manifest.action.default_title = DEV_EXTENSION_NAME;

  const devIcons = {};
  for (const size of DEV_ICON_SIZES) {
    devIcons[String(size)] = `assets/icons/${DEV_ICON_PREFIX}-${size}.png`;
  }
  manifest.icons = devIcons;
  manifest.action.default_icon = devIcons;

  // No Supabase access in dev: drop the live project's explicit host grant.
  manifest.host_permissions = (manifest.host_permissions || [])
    .filter((host) => !host.includes('.supabase.co'));

  manifest.externally_connectable = {
    matches: [`${DEV_ORIGIN}/*`]
  };

  // The dashboard bridge content script only runs on the dashboard origin.
  for (const script of manifest.content_scripts || []) {
    if ((script.js || []).includes('content/dashboard-sync.js')) {
      script.matches = [`${DEV_ORIGIN}/*`];
    }
  }

  writeJson(manifestPath, manifest);
  console.log('  Updated manifest.json (name, icons, externally_connectable, dashboard-sync matches, no Supabase host)');

  // 3. Rewrite lib/sync-constants.js (dashboard origins + cloud sync off)
  const syncConstantsPath = path.join(DEST, 'lib', 'sync-constants.js');
  let syncConstants = fs.readFileSync(syncConstantsPath, 'utf8');
  const rewrites = [
    [/dashboardOrigins:\s*\[[^\]]*\]/, `dashboardOrigins: ['${DEV_ORIGIN}']`],
    [/defaultDashboardOrigin:\s*'[^']*'/, `defaultDashboardOrigin: '${DEV_ORIGIN}'`],
    // Cut the cloud link: no live Supabase URL/key fallback, sync switched off.
    [/supabaseUrl:[^\r\n]*,/, "supabaseUrl: '',"],
    [/supabaseKey:[^\r\n]*,/, "supabaseKey: '',"],
    [/cloudSyncEnabled:\s*true/, 'cloudSyncEnabled: false']
  ];
  for (const [pattern, replacement] of rewrites) {
    if (!pattern.test(syncConstants)) {
      console.error(
        `Error: lib/sync-constants.js no longer matches ${pattern}; refusing to build a dev ` +
        'extension that could reach the live site or its database.'
      );
      process.exit(1);
    }
    syncConstants = syncConstants.replace(pattern, replacement);
  }
  fs.writeFileSync(syncConstantsPath, syncConstants);
  console.log('  Updated lib/sync-constants.js (localhost only, cloud sync disabled)');

  // 4. Rewrite popup/popup.html logo reference
  const popupPath = path.join(DEST, 'popup', 'popup.html');
  if (fs.existsSync(popupPath)) {
    let popup = fs.readFileSync(popupPath, 'utf8');
    popup = popup.replace(
      new RegExp(`../assets/icons/${LIVE_ICON_PREFIX}-128\\.png`, 'g'),
      `../assets/icons/${DEV_ICON_PREFIX}-128.png`
    );
    fs.writeFileSync(popupPath, popup);
    console.log('  Updated popup/popup.html (logo -> dev icon)');
  }

  // 5. Stub config.js. The live Supabase credentials are deliberately NOT copied.
  fs.mkdirSync(path.join(DEST, 'lib'), { recursive: true });
  fs.writeFileSync(
    path.join(DEST, 'lib', 'config.js'),
    '/** DEV build: cloud sync is disabled, so there are no Supabase credentials. */\n' +
    "globalThis.CTRL_BLCK_CONFIG = { supabaseUrl: '', supabaseKey: '' };\n"
  );
  console.log('  Wrote stub lib/config.js (no Supabase credentials)');

  // 6. Verify nothing points at the live deployment.
  for (const file of ['manifest.json', 'lib/sync-constants.js', 'lib/config.js']) {
    const content = fs.readFileSync(path.join(DEST, file), 'utf8');
    const leaked = LIVE_MARKERS.filter((marker) => content.includes(marker));
    if (leaked.length > 0) {
      console.error(`Error: dev build ${file} still references the live deployment (${leaked.join(', ')}).`);
      process.exit(1);
    }
  }
  console.log('  Verified: no reference to the live site or its database');

  console.log('\nDone. Load extension-dev/ in Chrome (Load unpacked) for local development.');
}

if (require.main === module) {
  build();
}

module.exports = { build, LIVE_MARKERS };
