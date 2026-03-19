/**
 * Centralized environment variable configuration.
 * This file ensures that all required environment variables are present at runtime.
 * 
 * IMPORTANT: In Next.js, environment variables prefixed with NEXT_PUBLIC_ MUST be
 * accessed via their literal property names (e.g., process.env.NEXT_PUBLIC_URL)
 * for the compiler to statically replace them with their values in the browser.
 */

export const env = {
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || (() => {
            if (typeof window !== 'undefined') console.error('Missing: NEXT_PUBLIC_SUPABASE_URL');
            return '';
        })(),
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (() => {
            if (typeof window !== 'undefined') console.error('Missing: NEXT_PUBLIC_SUPABASE_ANON_KEY');
            return '';
        })(),
    },
} as const;

// Server-side validation
if (typeof window === 'undefined') {
    if (!env.supabase.url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    if (!env.supabase.anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}
