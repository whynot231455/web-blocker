'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { SYNC_STORAGE_KEYS } from '@/config/sync';

type Provider = 'google' | 'github';

const GUEST_FLAG_KEY = SYNC_STORAGE_KEYS.guestFlag;
const AUTH_TOKEN_KEY = SYNC_STORAGE_KEYS.supabaseAuthToken;

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    // Track whether onAuthStateChange has fired at least once
    const initialEventFired = useRef(false);

    const notifyExtensionSync = () => {
        if (typeof window === 'undefined') return;
        window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
        }, 0);
    };

    const persistSessionToSync = useCallback((session: Session | null) => {
        if (typeof window === 'undefined') return;
        if (session) {
            localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        notifyExtensionSync();
    }, []);

    useEffect(() => {
        let mounted = true;

        // onAuthStateChange fires immediately with INITIAL_SESSION event,
        // providing the persisted session (if any). Using this as the single
        // source of truth avoids the race condition between getSession() and
        // onAuthStateChange() where loading could be set to false before the
        // user is populated.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;

                setUser(session?.user ?? null);

                if (session?.user) {
                    setIsGuest(false);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem(GUEST_FLAG_KEY);
                    }
                } else {
                    const guest =
                        typeof window !== 'undefined' &&
                        localStorage.getItem(GUEST_FLAG_KEY) === 'true';
                    setIsGuest(guest);
                }

                persistSessionToSync(session);

                // Mark loading as done after the first auth event fires.
                // This ensures we never render a "not logged in" state before
                // Supabase has had a chance to restore the persisted session.
                if (!initialEventFired.current) {
                    initialEventFired.current = true;
                    setLoading(false);
                }
            }
        );

        // Fallback: if onAuthStateChange somehow never fires (e.g., no network),
        // resolve loading after a short timeout to avoid infinite spinner.
        const fallbackTimer = setTimeout(() => {
            if (!mounted || initialEventFired.current) return;
            initialEventFired.current = true;
            setLoading(false);
        }, 3000);

        return () => {
            mounted = false;
            clearTimeout(fallbackTimer);
            subscription.unsubscribe();
        };
    }, [persistSessionToSync]);

    const signInWithOAuth = useCallback(async (provider: Provider) => {
        if (typeof window === 'undefined') return { error: null };
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        return { error };
    }, []);

    const signInWithGoogle = useCallback(
        () => signInWithOAuth('google'),
        [signInWithOAuth]
    );

    const signInWithGithub = useCallback(
        () => signInWithOAuth('github'),
        [signInWithOAuth]
    );

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    };

    const signOut = async (): Promise<void> => {
        await supabase.auth.signOut();
        setIsGuest(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(GUEST_FLAG_KEY);
            localStorage.removeItem(SYNC_STORAGE_KEYS.guestSites);
            localStorage.removeItem(SYNC_STORAGE_KEYS.blockedSitesSignature);
            localStorage.removeItem('dailyUnlockLimit');
            localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        notifyExtensionSync();
    };

    const continueAsGuest = () => {
        if (user) return;
        setIsGuest(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_FLAG_KEY, 'true');
        }
        notifyExtensionSync();
    };

    return {
        user,
        isGuest,
        loading,
        signIn,
        signUp,
        signOut,
        continueAsGuest,
        signInWithGoogle,
        signInWithGithub
    };
};
