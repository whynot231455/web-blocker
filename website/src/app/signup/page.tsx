'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
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
            accounts — coming soon
          </p>
        </Link>

        {/* Coming Soon Card */}
        <div className="border-2 border-black p-6 text-center mb-6" style={{ boxShadow: '4px 4px 0px #000' }}>
          <div className="h-16 w-16 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔧</span>
          </div>

          <h2 className="font-black uppercase tracking-widest text-sm mb-3">
            Account Sign-Up Isn&apos;t Ready Yet
          </h2>
          <p className="text-[8px] text-gray-500 leading-loose mb-4">
            We&apos;re building out the full account system — sign-up, cloud sync, and more.
          </p>

          <div className="bg-gray-50 border-2 border-gray-200 p-4 text-left mb-4">
            <h3 className="font-black uppercase tracking-widest text-[8px] mb-2 text-gray-700">
              ✅ What&apos;s available now
            </h3>
            <ul className="text-[7px] text-gray-600 leading-loose space-y-1">
              <li>• Guest mode — block sites instantly</li>
              <li>• Local focus timer &amp; session tracking</li>
              <li>• Full dashboard &amp; settings</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 text-left mb-4">
            <h3 className="font-black uppercase tracking-widest text-[8px] mb-2 text-yellow-700">
              🚧 Coming later
            </h3>
            <ul className="text-[7px] text-yellow-700 leading-loose space-y-1">
              <li>• Email &amp; password registration</li>
              <li>• Cloud sync across devices</li>
              <li>• Subscription plans</li>
            </ul>
          </div>

          <Link href="/login">
            <button
              className="w-full py-4 bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors"
              style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
            >
              CONTINUE AS GUEST
            </button>
          </Link>
        </div>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-[8px] text-black hover:opacity-70 transition-opacity"
            style={{ letterSpacing: '0.1em' }}
          >
            <ArrowLeft size={12} />
            BACK TO LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
