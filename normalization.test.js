const test = require('node:test');
const assert = require('node:assert');

// Test the shared URL utilities
const URL_UTILS = require('./shared/url-utils.js');
const normalize = URL_UTILS.normalizeHostname;

test('normalizeHostname', async (t) => {
    await t.test('removes protocol', () => {
        assert.strictEqual(normalize('http://example.com'), 'example.com');
        assert.strictEqual(normalize('https://example.com'), 'example.com');
    });

    await t.test('removes www', () => {
        assert.strictEqual(normalize('www.example.com'), 'example.com');
        assert.strictEqual(normalize('http://www.example.com'), 'example.com');
    });

    await t.test('removes path and query', () => {
        assert.strictEqual(normalize('example.com/path?query=1'), 'example.com');
        assert.strictEqual(normalize('http://www.example.com/abc#hash'), 'example.com');
    });

    await t.test('handles subdomains', () => {
        assert.strictEqual(normalize('sub.example.com'), 'sub.example.com');
    });

    await t.test('handles empty/invalid input', () => {
        assert.strictEqual(normalize(''), null);
        assert.strictEqual(normalize(null), null);
        assert.strictEqual(normalize(undefined), null);
    });

    await t.test('handles case sensitivity', () => {
        assert.strictEqual(normalize('EXAMPLE.COM'), 'example.com');
    });
});
