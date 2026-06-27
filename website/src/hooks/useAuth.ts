'use client';

import { useState, useEffect } from 'react';
import { SYNC_STORAGE_KEYS } from '@/config/sync';

export const useAuth = () => {
    const [user] = useState<null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(SYNC_STORAGE_KEYS.guestFlag) === 'true';
    });
    const loading = false;

    const notifyExtensionSync = () => {
        if (typeof window === 'undefined') return;
        window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
        }, 0);
    };

    useEffect(() => {
        notifyExtensionSync();
    }, []);

    const accountUnavailable = async () => ({
        error: new Error('Accounts are coming soon. Guest mode is the only available option right now.')
    });

    const signOut = async (): Promise<void> => {
        setIsGuest(false);
        localStorage.removeItem(SYNC_STORAGE_KEYS.guestFlag);
        localStorage.removeItem(SYNC_STORAGE_KEYS.guestSites);
        localStorage.removeItem(SYNC_STORAGE_KEYS.blockedSitesSignature);
        localStorage.removeItem('dailyUnlockLimit');
        notifyExtensionSync();
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        localStorage.setItem(SYNC_STORAGE_KEYS.guestFlag, 'true');
        notifyExtensionSync();
    };

    return {
        user,
        isGuest,
        loading,
        signIn: accountUnavailable,
        signUp: accountUnavailable,
        signOut,
        continueAsGuest,
        signInWithGoogle: accountUnavailable,
        signInWithGithub: accountUnavailable
    };
};
