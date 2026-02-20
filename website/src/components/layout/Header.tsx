import React from 'react';
import Image from 'next/image';

export const Header: React.FC = () => {
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
    </header>
  );
};

export default Header;
