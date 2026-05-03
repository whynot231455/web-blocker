import type { NextConfig } from "next";
import { fileURLToPath } from "url";

import path from "path";

const websiteRoot = fileURLToPath(new URL(".", import.meta.url));
const monorepoRoot = path.resolve(websiteRoot, "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            // Note: 'unsafe-inline' is required for Next.js inline styles.
            // For maximum security in production, consider using CSP nonces.
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://*.supabase.co;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https://*.supabase.co https://www.google.com https://*.google.com https://*.gstatic.com https://icon.horse;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google.com https://*.google.com https://*.gstatic.com;
              frame-src 'self' https://*.supabase.co;
              frame-ancestors 'none';
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
