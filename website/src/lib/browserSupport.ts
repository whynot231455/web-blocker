export type ClientEnvironment = 'desktop-chrome' | 'desktop-other' | 'mobile';

/**
 * Works out whether this browser can run the CTRL+BLCK extension.
 *
 * Phones and tablets cannot install Chrome extensions at all, so they are
 * reported separately from desktop browsers that are merely not Chromium.
 * Call this on the client only (after mount); on the server it assumes desktop
 * Chrome so nothing is hidden from the first render.
 */
export function detectEnvironment(): ClientEnvironment {
  if (typeof navigator === 'undefined') return 'desktop-chrome';

  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  const ua = nav.userAgent.toLowerCase();

  if (nav.userAgentData?.mobile) return 'mobile';
  if (/android|iphone|ipad|ipod|mobile|windows phone/.test(ua)) return 'mobile';
  // iPadOS reports a desktop Mac user agent but has a touch screen.
  if (ua.includes('macintosh') && nav.maxTouchPoints > 1) return 'mobile';

  // Chromium-based desktop browsers (Chrome, Edge, Brave, Opera, Arc, etc.)
  if (ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg')) {
    return 'desktop-chrome';
  }
  return 'desktop-other';
}
