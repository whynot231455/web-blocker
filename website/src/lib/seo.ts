import type { Metadata } from 'next';

/**
 * Metadata for signed-in / utility pages that should never appear in search
 * results. Uses a noindex tag (rather than robots.txt) so crawlers can read it.
 */
export function privateMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  };
}

/** Serialises JSON-LD safely for use inside an inline <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\u003c');
}
