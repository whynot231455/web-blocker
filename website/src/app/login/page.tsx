'use client';

import React from 'react';
import { Github, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { signInWithGoogle, signInWithGithub, continueAsGuest } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const { error } = await signInWithGithub();
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    router.push('/dashboard');
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white"
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
            sign in to continue
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.27 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            GOOGLE
          </button>

          <button
            onClick={handleGithubSignIn}
            disabled={isLoading}
            className="w-full py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            <Github size={18} />
            GITHUB
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-[2px] bg-gray-200"></div>
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">OR</span>
            <div className="flex-1 h-[2px] bg-gray-200"></div>
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

        <p className="mt-8 text-center text-[8px] text-gray-400 uppercase tracking-widest leading-loose">
          Secure authentication powered by Supabase
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
