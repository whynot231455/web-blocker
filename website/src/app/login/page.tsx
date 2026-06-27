'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { continueAsGuest } = useAuth();
  const router = useRouter();

  const handleGuestContinue = () => {
    continueAsGuest();
    router.push('/dashboard');
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

        {/* Accounts Coming Soon Banner */}
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 text-yellow-800 text-center" style={{ fontSize: '8px', lineHeight: '1.8' }}>
          <strong style={{ fontSize: '9px' }}>🔧 ACCOUNTS COMING SOON</strong>
          <p className="mt-1" style={{ fontSize: '7px', color: '#92400E' }}>
            Sign-in via Google / GitHub and email registration aren't ready yet.<br />
            Use guest mode to start blocking sites right away — your data stays local until accounts launch.
          </p>
        </div>

        <div className="space-y-4">
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
