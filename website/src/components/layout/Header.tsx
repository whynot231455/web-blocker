import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export const Header: React.FC = () => {
  const { isGuest } = useAuth();
  return (
    <header className="flex flex-col items-center justify-center pt-16 pb-8 text-center">
      <div className="flex items-center gap-4 mb-3">
        <Image
          src="/icons/logopic1-48.png"
          alt="CTRL+BLCK Logo"
          width={42}
          height={42}
          className="object-contain"
          unoptimized
        />
        <h1 className="text-[28px] font-black uppercase tracking-tighter leading-none">
          CTRL + BLCK
        </h1>
      </div>
      
      <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em] mb-6">
        block all of your distractions instantly
      </p>

      {isGuest && (
        <div className="px-4 py-1.5 bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] rounded-full inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
          Guest Mode (Local Storage Only)
        </div>
      )}
    </header>
  );
};


