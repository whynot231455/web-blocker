'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('error');
  });
  const { continueAsGuest, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGuestContinue = () => {
    continueAsGuest();
    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  };

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
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            CONTINUE WITH GOOGLE
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
