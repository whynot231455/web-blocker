// Wrapper for shared URL utilities
// Import from shared to ensure consistency with the extension
// Note: In a production environment, we'd use a workspace/package for this.

// Using a type-safe wrapper around the shared logic
import URL_UTILS from '../../../shared/url-utils';

export function sanitizeUrl(raw: string): string {
  return URL_UTILS.normalizeHostname(raw) || '';
}

export function isValidDomain(domain: string): boolean {
  return URL_UTILS.isValidDomain(domain);
}
