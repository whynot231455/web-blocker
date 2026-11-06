const test = require('node:test');
const assert = require('node:assert');

// Loads the real website/src/lib/browserSupport.ts (type stripping), so this
// tests the shipped code rather than a copy of it.
async function detect(navigatorValue) {
    const { detectEnvironment } = await import('./website/src/lib/browserSupport.ts');
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: navigatorValue, configurable: true });
    try {
        return detectEnvironment();
    } finally {
        if (original) Object.defineProperty(globalThis, 'navigator', original);
        else delete globalThis.navigator;
    }
}

const UA = {
    desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    desktopEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    desktopFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
    desktopSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
    iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
};

test('desktop Chrome and Edge can run the extension', async () => {
    assert.strictEqual(await detect({ userAgent: UA.desktopChrome, maxTouchPoints: 0 }), 'desktop-chrome');
    assert.strictEqual(await detect({ userAgent: UA.desktopEdge, maxTouchPoints: 0 }), 'desktop-chrome');
});

test('desktop non-Chromium browsers are reported as unsupported', async () => {
    assert.strictEqual(await detect({ userAgent: UA.desktopFirefox, maxTouchPoints: 0 }), 'desktop-other');
    assert.strictEqual(await detect({ userAgent: UA.desktopSafari, maxTouchPoints: 0 }), 'desktop-other');
});

test('phones are mobile even when the browser is Chrome', async () => {
    assert.strictEqual(await detect({ userAgent: UA.androidChrome, maxTouchPoints: 5 }), 'mobile');
    assert.strictEqual(await detect({ userAgent: UA.iphoneSafari, maxTouchPoints: 5 }), 'mobile');
});

test('the user-agent client hint marks mobile', async () => {
    assert.strictEqual(
        await detect({ userAgent: UA.desktopChrome, maxTouchPoints: 5, userAgentData: { mobile: true } }),
        'mobile'
    );
});

test('iPadOS, which sends a Mac user agent but has a touch screen, is mobile', async () => {
    assert.strictEqual(await detect({ userAgent: UA.desktopSafari, maxTouchPoints: 5 }), 'mobile');
});

test('a Mac with no touch screen stays desktop', async () => {
    assert.strictEqual(await detect({ userAgent: UA.desktopSafari, maxTouchPoints: 0 }), 'desktop-other');
});
