/**
 * Unified URL utilities for CTRL+BLCK
 * Shared between Chrome Extension and Website
 *
 * Guarded against double-declaration: if this file is loaded more than once
 * in the same JavaScript context (common when content scripts share a world),
 * the second load skips the declaration to avoid 'already been declared' errors.
 */
if (!globalThis.CTRL_BLCK_URL_UTILS) {
const URL_UTILS = {
    /**
     * Normalizes a URL or hostname to a consistent format.
     * Removes protocol, path, query, fragment, and leading 'www.'.
     * @param {string} url 
     * @returns {string | null}
     */
    normalizeHostname: function (url) {
        if (!url || typeof url !== 'string') return null;
        try {
            let cleaned = url.trim().toLowerCase();
            // Remove protocol
            cleaned = cleaned.replace(/^https?:\/\//i, '');
            // Remove path and query
            cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
            // Remove leading www.
            if (cleaned.startsWith('www.')) {
                cleaned = cleaned.substring(4);
            }
            return cleaned || null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Validates if a string is a valid domain format (e.g. 'google.com', 'sub.domain.co.uk')
     * @param {string} domain 
     * @returns {boolean}
     */
    isValidDomain: function (domain) {
        if (!domain || typeof domain !== 'string') return false;
        const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
        return domainRegex.test(domain.toLowerCase());
    }
};

// Export for Node/Bundlers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URL_UTILS;
}

// Export for browser/extension globals
globalThis.CTRL_BLCK_URL_UTILS = URL_UTILS;
}
