import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
    auth: {
        // Persist the session in localStorage (default) — fine for a web app
        persistSession: true,
        // Automatically refresh the token before it expires
        autoRefreshToken: true,
    },
});
