'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, AuthError } from '@supabase/supabase-js';

const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize guest state from localStorage
        const guestFlag = localStorage.getItem('ctrl_blck_guest');
        if (guestFlag === 'true') {
            setIsGuest(true);
        }

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            // If we have a real user, we're not a guest
            if (session?.user) {
                setIsGuest(false);
                localStorage.removeItem('ctrl_blck_guest');
            }
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsGuest(false);
                localStorage.removeItem('ctrl_blck_guest');
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (
        email: string,
        password: string
    ): Promise<{ error: AuthError | null }> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (
        email: string,
        password: string,
        options?: { data?: Record<string, any> }
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
        localStorage.removeItem('ctrl_blck_guest');
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        localStorage.setItem('ctrl_blck_guest', 'true');
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
