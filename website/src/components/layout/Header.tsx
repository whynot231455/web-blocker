import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export const Header: React.FC = () => {
  const { isGuest } = useAuth();
  return (
    <header className="flex flex-col items-center justify-center pt-10 pb-6 text-center">
      <div className="flex items-center gap-5 mb-5">
          <Image
            src="/icons/logopic1-48.png"
            alt="CTRL+BLCK Logo"
            width={56}
            height={56}
            className="object-contain"
            onError={() => {}}
            unoptimized
          />
        <h1 style={{ fontSize: '26px', letterSpacing: '0.15em', fontWeight: 'bold', lineHeight: 1.2 }}>
          CTRL + BLCK
        </h1>
      </div>
      <p style={{ fontSize: '12px', letterSpacing: '0.1em', color: '#000', marginTop: '4px' }}>
        block all of your distractions instantly
      </p>
      {isGuest && (
        <div 
          className="mt-4 px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full inline-block uppercase font-bold tracking-widest"
          style={{ fontSize: '8px' }}
        >
          ● Guest Mode (Local Storage Only)
        </div>
      )}
    </header>
  );
};

export default Header;
