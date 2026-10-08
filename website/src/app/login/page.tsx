'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { hasGuestSitesForRedirect } from '@/lib/guestRedirect';
import { GitHubIcon, GoogleIcon } from '@/components/auth/ProviderIcons';

export default function LoginPage() {
  const [pendingProvider, setPendingProvider] = React.useState<'google' | 'github' | null>(null);
  const isLoading = pendingProvider !== null;
  const [error, setError] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('error');
  });
  const { user, isGuest, loading, continueAsGuest, signInWithGoogle, signInWithGithub } = useAuth();
  const router = useRouter();

  // Same-origin return target (e.g. /dashboard from the dashboard guard).
  // Never trust raw query input: must be a path, never // or a scheme.
  const returnTo = React.useMemo(() => {
    if (typeof window === 'undefined') return '/dashboard';
    const raw = new URLSearchParams(window.location.search).get('returnTo');
    return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
  }, []);

  // A returning visitor whose Google/GitHub session is still valid should never see
  // the login form — send them straight to the dashboard. useAuth restores the
  // persisted Supabase session before `loading` clears, so this also covers
  // "the browser remembers I logged in before". Returning guests with saved
  // sites skip the form too (see hasGuestSitesForRedirect).
  React.useEffect(() => {
    if (!loading && user) {
      router.replace(returnTo);
      return;
    }
    if (!loading && !user && isGuest && hasGuestSitesForRedirect()) {
      router.replace(returnTo);
    }
  }, [loading, user, isGuest, router, returnTo]);

  const handleGuestContinue = () => {
    continueAsGuest();
    router.replace(returnTo);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setPendingProvider(provider);
    setError(null);
    const { error: signInError } = provider === 'github'
      ? await signInWithGithub()
      : await signInWithGoogle();
    if (signInError) {
      setError(signInError.message);
      setPendingProvider(null);
    }
  };

  // While the persisted session is being restored — or a redirect to the
  // dashboard is already queued — don't flash the login form.
  if (loading || user) {
    return (
      <div
        className="theme-static-light min-h-screen flex items-center justify-center bg-white"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        <p style={{ fontSize: '8px', letterSpacing: '0.1em' }}>LOADING...</p>
      </div>
    );
  }

  return (
    <div
      className="theme-static-light min-h-screen flex items-center justify-center bg-white"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      <div
        className="w-full max-w-md p-8 bg-white border-2 border-black"
        style={{ boxShadow: '6px 6px 0px #000' }}
      >
        {/* Header */}
        <Link href="/" className="flex flex-col items-center mb-8 gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/icons/logopic1-48.png"
            alt="Logo"
            width={48}
            height={48}
            className="w-12 h-12"
            unoptimized
          />
          <h1 style={{ fontSize: '14px', letterSpacing: '0.1em' }}>
            CTRL + BLCK
          </h1>
          <p style={{ fontSize: '8px', color: '#555', textAlign: 'center' }}>
            get started below
          </p>
        </Link>

        {/* Info / Error banners */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-400 text-red-700" style={{ fontSize: '8px' }}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
            className="w-full py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            <GoogleIcon size={14} />
            {pendingProvider === 'google' ? 'REDIRECTING...' : 'CONTINUE WITH GOOGLE'}
          </button>

          <button
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading}
            className="w-full py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            <GitHubIcon size={14} />
            {pendingProvider === 'github' ? 'REDIRECTING...' : 'CONTINUE WITH GITHUB'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t-2 border-gray-200" />
            <span className="text-[8px] text-gray-400" style={{ letterSpacing: '0.1em' }}>OR</span>
            <div className="flex-1 border-t-2 border-gray-200" />
          </div>

          <button
            onClick={handleGuestContinue}
            disabled={isLoading}
            className="w-full py-4 bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            CONTINUE AS GUEST
          </button>
        </div>

        <p className="mt-6 text-center text-[7px] text-gray-400 uppercase tracking-widest leading-loose">
          Guest data is stored locally in your browser.
        </p>

        <div className="mt-8 flex justify-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-[8px] text-black hover:opacity-70 transition-opacity"
            style={{ letterSpacing: '0.1em' }}
          >
            <ArrowLeft size={12} />
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
