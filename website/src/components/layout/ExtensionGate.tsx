'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { useExtensionDetected } from '@/hooks/useExtensionDetected';

const GITHUB_REPO_URL = 'https://github.com/whynot231455/web-blocker';
const EXTENSION_ACK_KEY = 'ctrl_blck_extension_acknowledged';

/**
 * Detects the user's browser to show tailored messaging.
 * Returns 'chrome' for Chromium-based browsers that support extensions,
 * or 'unsupported' for everything else.
 */
function detectBrowser(): 'chrome' | 'unsupported' {
  if (typeof navigator === 'undefined') return 'chrome';
  const ua = navigator.userAgent.toLowerCase();
  // Chromium-based browsers (Chrome, Edge, Brave, Opera, Arc, etc.)
  if (ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg')) {
    return 'chrome';
  }
  return 'unsupported';
}

/**
 * Wraps protected pages (dashboard, sessions, settings, account).
 * Blocks rendering until the extension is confirmed installed.
 */
export function ExtensionGate({ children }: { children: React.ReactNode }) {
  const { status } = useExtensionDetected();
  const browser = detectBrowser();

  // ── Allow bypass if user previously acknowledged the extension ──
  const acknowledged =
    typeof window !== 'undefined' &&
    window.localStorage.getItem(EXTENSION_ACK_KEY) === 'true';

  const isInstalled = status === 'installed' || acknowledged;

  // ── Checking state ────────────────────────────────────────────────
  if (status === 'checking' && !acknowledged) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  // ── Extension found (or acknowledged) — render page normally ──
  if (isInstalled) {
    return <>{children}</>;
  }

  // ── Not installed — gate UI ───────────────────────────────────────
  const isUnsupported = browser === 'unsupported';

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white px-4"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      <div
        className="w-full max-w-md p-8 bg-white border-2 border-black text-center"
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
          {isUnsupported ? <AlertTriangle size={32} /> : <Download size={32} />}
        </div>

        {/* Heading */}
        <h1
          className="uppercase tracking-tight mb-4"
          style={{ fontSize: '14px', lineHeight: '1.6' }}
        >
          {isUnsupported ? 'Chrome Required' : 'Extension Required'}
        </h1>

        {/* Body */}
        <p
          className="text-gray-600 uppercase tracking-widest leading-loose mb-8"
          style={{ fontSize: '8px' }}
        >
          {isUnsupported
            ? 'CTRL+BLCK only works on Chrome and Chromium-based browsers (Edge, Brave, Arc). Please switch browsers to continue.'
            : 'CTRL+BLCK needs the Chrome extension to block sites. Install it from GitHub and reload this page.'}
        </p>

        {/* CTAs */}
        <div className="space-y-4">
          {!isUnsupported && (
            <>
              <Link
                href="/install"
                className="block w-full py-4 bg-black text-white border-2 border-black text-center uppercase tracking-widest transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-900"
                style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Download size={14} />
                  Install Extension
                </span>
              </Link>

              <button
                onClick={() => {
                  // Store acknowledgment so the gate is bypassed on future visits
                  window.localStorage.setItem(EXTENSION_ACK_KEY, 'true');
                  // Navigate to the dashboard
                  window.location.href = '/dashboard';
                }}
                className="w-full py-4 bg-white text-black border-2 border-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-50 flex items-center justify-center gap-2"
                style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
              >
                <RefreshCw size={14} />
                I&apos;ve Installed It — Go to Dashboard
              </button>
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
