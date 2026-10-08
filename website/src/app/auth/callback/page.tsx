'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');

    useEffect(() => {
        // Preserve the caller's return target through the OAuth round trip.
        // Must be a same-origin path — the code URL is attacker-influenced.
        const rawReturnTo = searchParams.get('returnTo');
        const returnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
            ? rawReturnTo
            : '/dashboard';
        const loginWithError = (message: string) =>
            router.replace(`/login?error=${encodeURIComponent(message)}&returnTo=${encodeURIComponent(returnTo)}`);

        const error = searchParams.get('error');
        if (error) {
            // Supabase puts the human-readable cause in error_description.
            loginWithError(searchParams.get('error_description') || error);
            return;
        }

        const code = searchParams.get('code');

        // OAuth uses PKCE in current Supabase clients. Explicitly exchange the
        // authorization code rather than relying on automatic URL detection.
        if (code) {
            void supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
                if (exchangeError) {
                    loginWithError(exchangeError.message);
                } else {
                    router.replace(returnTo);
                }
            });
            return;
        }

        // Keep the fragment-based fallback for any existing implicit-flow links.
        let attempts = 0;
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace(returnTo);
                return;
            }
            if (++attempts < 10) {
                setTimeout(check, 150);
            } else {
                // Fall back — something went wrong; send user back to login
                setStatus('error');
                router.replace('/login?error=Session%20not%20established');
            }
        };
        check();
    }, [router, searchParams]);

    return (
        <div
            className="theme-static-light min-h-screen flex items-center justify-center bg-white"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
            <p style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                {status === 'loading' ? 'SIGNING YOU IN...' : 'SOMETHING WENT WRONG'}
            </p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense>
            <AuthCallback />
        </Suspense>
    );
}
