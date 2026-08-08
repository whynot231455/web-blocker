/**
 * Builds the DEV variant of the extension.
 *
 * Copies extension/ -> extension-dev/ and rewrites only the deltas:
 *   - manifest name / icons / default_title -> Ctrl+Blck DEV + logopic1-dev-*
 *   - dashboardOrigins / defaultDashboardOrigin -> localhost only
 *   - externally_connectable -> localhost only
 *   - popup logo -> logopic1-dev-128.png
 *   - config.js copied from extension/lib/config.js (same Supabase project)
 *
 * The live extension stays the single source of truth. Run this after editing
 * extension/ to refresh the dev build:
 *   npm run build:extension:dev
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'extension');
const DEST = path.join(ROOT, 'extension-dev');

const DEV_EXTENSION_NAME = 'Ctrl+Blck DEV';
const DEV_ORIGIN = 'http://localhost:3000';
const DEV_ICON_PREFIX = 'logopic1-dev';
const LIVE_ICON_PREFIX = 'logopic1';
const DEV_ICON_SIZES = [16, 32, 48, 128];

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

function build() {
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

  manifest.externally_connectable = {
    matches: [`${DEV_ORIGIN}/*`]
  };

  writeJson(manifestPath, manifest);
  console.log('  Updated manifest.json (name, icons, externally_connectable)');

  // 3. Rewrite lib/sync-constants.js (dashboardOrigins / defaultDashboardOrigin)
  const syncConstantsPath = path.join(DEST, 'lib', 'sync-constants.js');
  let syncConstants = fs.readFileSync(syncConstantsPath, 'utf8');
  syncConstants = syncConstants.replace(
    /dashboardOrigins:\s*\[[^\]]*\]/,
    `dashboardOrigins: ['${DEV_ORIGIN}']`
  );
  syncConstants = syncConstants.replace(
    /defaultDashboardOrigin:\s*'[^']*'/,
    `defaultDashboardOrigin: '${DEV_ORIGIN}'`
  );
  fs.writeFileSync(syncConstantsPath, syncConstants);
  console.log('  Updated lib/sync-constants.js (dashboardOrigins -> localhost only)');

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

  // 5. Copy config.js (same Supabase project)
  const srcConfig = path.join(SRC, 'lib', 'config.js');
  const destConfig = path.join(DEST, 'lib', 'config.js');
  if (fs.existsSync(srcConfig)) {
    fs.copyFileSync(srcConfig, destConfig);
    console.log('  Copied lib/config.js (same Supabase project)');
  } else {
    console.warn('  WARNING: extension/lib/config.js not found. Run "npm run config:extension" first.');
  }

  console.log('\nDone. Load extension-dev/ in Chrome (Load unpacked) for local development.');
}

build();
