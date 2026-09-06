import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { extensionAuthStorage } from '@/lib/extensionAuthStorage';

// Use placeholders if variables are missing to prevent crash during build/prerender
const supabaseUrl = env.supabase.url || 'https://placeholder.supabase.co';
const supabaseKey = env.supabase.anonKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        // Persist the session in localStorage (default) — fine for a web app
        persistSession: true,
        // Automatically refresh the token before it expires
        autoRefreshToken: true,
        // localStorage-backed, but on first load it also adopts a fresher
        // session from the extension (which refreshes the token on its own
        // while the dashboard is closed) so supabase-js never tries to refresh
        // an already-rotated token and sign the user out.
        storage: extensionAuthStorage,
    },
});
