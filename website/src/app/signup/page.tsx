'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);
    
    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(email, password);
    
    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
    } else {
      setInfo("Account created! You can now log in.");
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      setIsLoading(false);
    }
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
          <img
            src="/icons/logopic1-48.png"
            alt="Logo"
            className="w-12 h-12"
          />
          <h1 style={{ fontSize: '14px', letterSpacing: '0.1em' }}>
            CTRL + BLCK
          </h1>
          <p style={{ fontSize: '8px', color: '#555', textAlign: 'center' }}>
            create your account
          </p>
        </Link>

        {/* Info / Error banners */}
        {info && (
          <div className="mb-4 p-3 bg-green-50 border border-green-400 text-green-700" style={{ fontSize: '8px', lineHeight: '1.5' }}>
            {info}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-400 text-red-700" style={{ fontSize: '8px', lineHeight: '1.5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4 mb-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL"
              disabled={isLoading}
              className="w-full p-4 bg-white text-black border-2 border-black focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400"
              style={{ fontSize: '10px', letterSpacing: '0.1em' }}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              disabled={isLoading}
              className="w-full p-4 bg-white text-black border-2 border-black focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400"
              style={{ fontSize: '10px', letterSpacing: '0.1em' }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors disabled:opacity-50"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            {isLoading ? 'CREATING...' : 'SIGN UP'}
          </button>
        </form>

        <div className="text-center mb-6">
          <Link href="/login" className="text-[8px] text-gray-500 hover:text-black underline transition-colors leading-loose">
            Already have an account? Log in here
          </Link>
        </div>

        <p className="mt-4 text-center text-[8px] text-gray-400 uppercase tracking-widest leading-loose">
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
