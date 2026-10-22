/**
 * Single source of truth for site-wide SEO values.
 * Set NEXT_PUBLIC_SITE_URL when the site moves to a custom domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ctrl-blck.vercel.app').replace(/\/$/, '');

export const SITE_NAME = 'CTRL+BLCK';

export const SITE_TITLE = 'CTRL+BLCK | Website Blocker & Focus Mode Chrome Extension';

export const SITE_DESCRIPTION =
  'Free website blocker and focus mode extension for Chrome. Block distracting sites all day or only on the days and hours you choose, with optional cloud sync.';

export const GITHUB_URL = 'https://github.com/whynot231455/web-blocker';
