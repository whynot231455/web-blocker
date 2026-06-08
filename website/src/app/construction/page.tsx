'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, HardHat, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ConstructionPage() {
  const { continueAsGuest } = useAuth();
  const router = useRouter();

  const handleGuestContinue = () => {
    continueAsGuest();
    router.push('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white p-4"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      <div
        className="w-full max-w-lg p-8 bg-white border-4 border-black"
        style={{ boxShadow: '10px 10px 0px #000' }}
      >
        {/* Animated warning stripe */}
        <div className="w-full h-6 bg-yellow-400 border-2 border-black mb-6 overflow-hidden relative flex items-center justify-around select-none">
          <div className="absolute inset-0 repeating-stripe opacity-20"></div>
          <span className="text-[8px] font-bold text-black animate-pulse">▲ WARNING ▲ UNDER CONSTRUCTION ▲ WARNING ▲</span>
        </div>

        {/* Header / Brand */}
        <div className="flex flex-col items-center mb-8 gap-4 text-center">
          <div className="p-4 bg-red-100 border-2 border-black rounded-full" style={{ boxShadow: '4px 4px 0px #000' }}>
            <HardHat size={40} className="text-red-500 animate-bounce" />
          </div>
          <h1 style={{ fontSize: '16px', letterSpacing: '0.1em', lineHeight: '1.5' }} className="text-black">
            UNDER CONSTRUCTION
          </h1>
          <p style={{ fontSize: '9px', color: '#6B7280', lineHeight: '1.6' }} className="mt-2">
            Social logins (Google & GitHub) are currently offline.
          </p>
        </div>

        {/* Details Box */}
        <div 
          className="p-4 bg-gray-50 border-2 border-black mb-6"
          style={{ boxShadow: '4px 4px 0px #000' }}
        >
          <div className="flex items-start gap-3 mb-2">
            <Compass size={18} className="text-black shrink-0 mt-1" />
            <h2 className="text-[10px] font-bold text-black">
              GUEST MODE IS ACTIVE!
            </h2>
          </div>
          <p className="text-[8px] text-gray-600 leading-loose">
            You do not need an account to use CTRL+BLCK. You can explore all features, block websites, and manage schedules instantly using Guest Mode.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGuestContinue}
            className="w-full py-4 bg-[#FF4141] text-white border-2 border-black hover:bg-red-600 transition-colors flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            ENTER GUEST MODE 🚀
          </button>

          <Link
            href="/login"
            className="w-full py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
            style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
          >
            <ArrowLeft size={16} />
            BACK TO SIGN IN
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[7px] text-gray-400 uppercase tracking-widest leading-loose">
          CTRL+BLCK Productive Ecosystem © 2026
        </p>
      </div>

      <style jsx global>{`
        .repeating-stripe {
          background: repeating-linear-gradient(
            -45deg,
            #000,
            #000 10px,
            #fbbf24 10px,
            #fbbf24 20px
          );
        }
      `}</style>
    </div>
  );
}
