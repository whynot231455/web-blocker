'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');

    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            router.replace(`/login?error=${encodeURIComponent(error)}`);
            return;
        }

        const code = searchParams.get('code');

        // OAuth uses PKCE in current Supabase clients. Explicitly exchange the
        // authorization code rather than relying on automatic URL detection.
        if (code) {
            void supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
                if (exchangeError) {
                    router.replace(`/login?error=${encodeURIComponent(exchangeError.message)}`);
                } else {
                    router.replace('/dashboard');
                }
            });
            return;
        }

        // Keep the fragment-based fallback for any existing implicit-flow links.
        let attempts = 0;
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/dashboard');
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
