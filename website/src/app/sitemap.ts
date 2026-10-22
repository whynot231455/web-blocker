import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

// Bump when page content meaningfully changes.
const LAST_MODIFIED = new Date('2026-10-08');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/install`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified: LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
