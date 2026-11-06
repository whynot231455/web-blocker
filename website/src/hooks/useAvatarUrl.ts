'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const readAvatarUrl = (session: Session | null): string | null => {
    const url = session?.user?.user_metadata?.avatar_url;
    return typeof url === 'string' && url.length > 0 ? url : null;
};

/**
 * Read-only view of the signed-in user's profile picture.
 *
 * Deliberately separate from `useAuth`: that hook persists the session for the
 * extension and notifies it on every mount, which a purely visual component
 * like the sidebar must not repeat.
 */
export const useAvatarUrl = (): string | null => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        void supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) setAvatarUrl(readAvatarUrl(session));
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setAvatarUrl(readAvatarUrl(session));
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return avatarUrl;
};
