'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
        setIsLoading(false);
      } else {
        setInfo('Account created! Check your email for a confirmation link before signing in.');
        setIsLoading(false);
        setMode('signin');
      }
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
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <Shield size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '14px', letterSpacing: '0.1em' }}>
            CTRL + BLCK
          </h1>
          <p style={{ fontSize: '8px', color: '#555', textAlign: 'center' }}>
            {mode === 'signin' ? 'sign in to your account' : 'create a new account'}
          </p>
        </div>

        {/* Info / Error banners */}
        {info && (
          <div className="mb-4 p-3 bg-green-50 border border-green-400 text-green-700" style={{ fontSize: '8px' }}>
            {info}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-400 text-red-700" style={{ fontSize: '8px' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '8px', fontWeight: 'bold' }}>EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-3 border-2 border-black focus:outline-none focus:ring-0"
              style={{ fontSize: '9px' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '8px', fontWeight: 'bold' }}>PASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-3 border-2 border-black focus:outline-none focus:ring-0"
              style={{ fontSize: '9px' }}
            />
            {mode === 'signup' && (
              <span style={{ fontSize: '7px', color: '#888' }}>
                At least 8 characters
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            style={{ fontSize: '8px', letterSpacing: '0.1em' }}
          >
            {isLoading ? 'LOADING...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
            style={{ fontSize: '8px', color: '#555', textDecoration: 'underline' }}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
