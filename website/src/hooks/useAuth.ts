'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, AuthError } from '@supabase/supabase-js';
import { SYNC_STORAGE_KEYS } from '@/config/sync';

const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(SYNC_STORAGE_KEYS.guestFlag) === 'true';
    });
    const [loading, setLoading] = useState(true);

    const notifyExtensionSync = () => {
        if (typeof window === 'undefined') return;
        // Defer one tick so Supabase/localStorage updates settle before the bridge reads them.
        window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
        }, 0);
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            // If we have a real user, we're not a guest
            if (session?.user) {
                setIsGuest(false);
                localStorage.removeItem(SYNC_STORAGE_KEYS.guestFlag);
            }
            setLoading(false);
            notifyExtensionSync();
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsGuest(false);
                localStorage.removeItem(SYNC_STORAGE_KEYS.guestFlag);
            }
            setLoading(false);
            notifyExtensionSync();
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (
        email: string,
        password: string
    ): Promise<{ error: AuthError | null }> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) notifyExtensionSync();
        return { error };
    };

    const signUp = async (
        email: string,
        password: string,
        options?: { data?: Record<string, unknown> }
    ): Promise<{ data: User | null; error: AuthError | Error | null }> => {
        const passwordError = validatePassword(password);
        if (passwordError) {
            return { data: null, error: new Error(passwordError) };
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: options
        });
        return { data: data.user, error };
    };

    const signOut = async (): Promise<void> => {
        await supabase.auth.signOut();
        setIsGuest(false);
        localStorage.removeItem(SYNC_STORAGE_KEYS.guestFlag);
        localStorage.removeItem(SYNC_STORAGE_KEYS.guestSites);
        notifyExtensionSync();
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        localStorage.setItem(SYNC_STORAGE_KEYS.guestFlag, 'true');
        notifyExtensionSync();
    };

    const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
        return { error };
    };

    const signInWithGithub = async (): Promise<{ error: AuthError | null }> => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
        return { error };
    };

    return { user, isGuest, loading, signIn, signUp, signOut, continueAsGuest, signInWithGoogle, signInWithGithub };
};
