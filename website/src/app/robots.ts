import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // App/API endpoints have no search value. Signed-in pages are kept out
        // of the index with noindex tags instead, so crawlers can read them.
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
