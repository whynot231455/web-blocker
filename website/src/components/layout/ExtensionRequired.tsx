'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Download, Monitor, RefreshCw } from 'lucide-react';
import type { ClientEnvironment } from '@/lib/browserSupport';

// Older versions let "I've installed it" skip the extension check for good by
// storing this flag. It is no longer honored and is cleared on mount.
const LEGACY_EXTENSION_ACK_KEY = 'ctrl_blck_extension_acknowledged';
// Set just before the button reloads the page so this screen can say the check
// ran and still found nothing.
const RECHECK_KEY = 'ctrl_blck_extension_recheck';

const BUTTON_STYLE = {
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '0.1em',
  boxShadow: '4px 4px 0px #000',
} as const;

/**
 * Full-page "you can't continue yet" screen, shown before a user starts
 * signing in (login page) and in place of the protected pages (dashboard etc.).
 *
 * - desktop-chrome: the extension is missing, so offer the install.
 * - desktop-other: a browser that cannot run Chrome extensions.
 * - mobile: phones and tablets cannot install Chrome extensions at all.
 */
export function ExtensionRequired({ environment }: { environment: ClientEnvironment }) {
  // True when the user just pressed "Check Again" and the reload found nothing.
  const [recheckFailed] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.sessionStorage.getItem(RECHECK_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.removeItem(RECHECK_KEY);
      window.localStorage.removeItem(LEGACY_EXTENSION_ACK_KEY);
    } catch {
      // Storage can be blocked; nothing to clean up then.
    }
  }, []);

  const isMobile = environment === 'mobile';
  const isUnsupported = environment === 'desktop-other';
  const canInstall = !isMobile && !isUnsupported;

  const heading = isMobile ? 'Desktop Chrome Only' : isUnsupported ? 'Chrome Required' : 'Extension Required';
  const body = isMobile
    ? 'CTRL+BLCK is a Chrome extension, so it is only available in Chrome on a computer (Windows, Mac or Linux). It does not work on phones or tablets. Open this site on your computer to get started.'
    : isUnsupported
      ? 'CTRL+BLCK only works on Chrome and Chromium-based browsers (Edge, Brave, Arc). Please switch browsers to continue.'
      : 'CTRL+BLCK needs the Chrome extension to block sites. Install it from GitHub and reload this page.';

  return (
    <div
      className="theme-static-light min-h-screen flex items-center justify-center bg-white px-4 py-8"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      <div
        className="w-full max-w-md p-6 sm:p-8 bg-white border-2 border-black text-center"
        style={{ boxShadow: '6px 6px 0px #000' }}
      >
        {/* Logo */}
        <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
          <Image
            src="/icons/logopic1-48.png"
            alt="CTRL+BLCK Logo"
            width={48}
            height={48}
            className="mx-auto"
            unoptimized
          />
        </Link>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-black text-white flex items-center justify-center border-2 border-black mb-6">
          {isMobile ? <Monitor size={32} /> : isUnsupported ? <AlertTriangle size={32} /> : <Download size={32} />}
        </div>

        {/* Heading */}
        <h1 className="uppercase tracking-tight mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
          {heading}
        </h1>

        {/* Body */}
        <p className="text-gray-600 uppercase tracking-widest leading-loose mb-8" style={{ fontSize: '8px' }}>
          {body}
        </p>

        {/* CTAs */}
        <div className="space-y-4">
          {canInstall && (
            <>
              <Link
                href="/install"
                className="block w-full py-4 bg-black text-white border-2 border-black text-center uppercase tracking-widest transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900"
                style={BUTTON_STYLE}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Download size={14} />
                  Install Extension
                </span>
              </Link>

              <button
                onClick={() => {
                  // Reload so the extension check runs again. The next screen only
                  // opens if the extension answers; otherwise this one comes back.
                  try {
                    window.sessionStorage.setItem(RECHECK_KEY, 'true');
                  } catch {
                    // Without storage the reload still re-checks, just silently.
                  }
                  window.location.reload();
                }}
                className="block w-full py-4 bg-white text-black border-2 border-black text-center uppercase tracking-widest transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-50"
                style={BUTTON_STYLE}
              >
                {/* The label is kept short enough to stay on one line; a wrapped label
                    fills the row and pushes the icon to the far left. */}
                <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                  <RefreshCw size={14} className="shrink-0" />
                  Installed? Check Again
                </span>
              </button>

              {recheckFailed && (
                <p className="text-red-600 uppercase tracking-widest leading-loose" style={{ fontSize: '8px' }}>
                  Extension not detected. Make sure it is installed and enabled, then check again.
                </p>
              )}
            </>
          )}

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-black hover:opacity-70 transition-opacity mt-6"
            style={{ fontSize: '8px', letterSpacing: '0.1em' }}
          >
            <ArrowLeft size={12} />
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
