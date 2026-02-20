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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
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
        password: string
    ): Promise<{ error: AuthError | Error | null }> => {
        const passwordError = validatePassword(password);
        if (passwordError) {
            return { error: new Error(passwordError) };
        }
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    };

    const signOut = async (): Promise<void> => {
        await supabase.auth.signOut();
    };

    return { user, loading, signIn, signUp, signOut };
};
