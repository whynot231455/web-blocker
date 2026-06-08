'use client';

import { useState, useEffect, useRef } from 'react';
import { EXTENSION_ID } from '@/config/sync';

declare const chrome: any;

export type ExtensionStatus = 'checking' | 'installed' | 'not_installed';

/**
 * Probes for the CTRL+BLCK Chrome extension using two strategies:
 *
 * 1. **chrome.runtime.sendMessage** (via `externally_connectable`) — works
 *    regardless of the extension's assigned ID, as long as the manifest
 *    includes the website's origin. This is the primary method.
 * 2. **fetch detect.json** — fallback using the hardcoded extension ID (for
 *    older extension builds that don't have `externally_connectable`).
 *
 * Can be skipped entirely during local development by setting
 * NEXT_PUBLIC_SKIP_EXTENSION_CHECK=true in .env.local.
 */
export function useExtensionDetected() {
  const [status, setStatus] = useState<ExtensionStatus>('checking');
  const checkedRef = useRef(false);

  useEffect(() => {
    // Dev-mode bypass
    if (process.env.NEXT_PUBLIC_SKIP_EXTENSION_CHECK === 'true') {
      queueMicrotask(() => setStatus('installed'));
      return;
    }

    // Avoid double-firing in StrictMode
    if (checkedRef.current) return;
    checkedRef.current = true;

    let cancelled = false;
    let isDetected = false;

    const markInstalled = () => {
      isDetected = true;
      if (!cancelled) setStatus('installed');
    };

    const handlePong = () => {
      markInstalled();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ctrl-blck-pong', handlePong);
    }

    async function probe() {
      // Check DOM dataset attribute first (e.g. if content script loaded earlier)
      if (typeof document !== 'undefined' && document.documentElement.dataset.ctrlBlckInstalled === 'true') {
        markInstalled();
        return;
      }

      // Dispatch custom event to ping the content script
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ctrl-blck-ping'));
      }

      // Wait a short duration (100ms) to see if we get a pong response
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (isDetected) return;

      // ── Strategy 1: chrome.runtime.sendMessage (externally_connectable) ──
      // The manifest declares this website's origin in externally_connectable.
      // We must specify the EXTENSION_ID to target the correct extension from the webpage.
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        try {
          const response = await new Promise<{ installed: boolean } | undefined>(
            (resolve) => {
              chrome.runtime.sendMessage(
                EXTENSION_ID,
                { action: 'ping' },
                (response: any) => {
                  // Must check lastError to suppress Chrome's net::ERR_FAILED log
                  if (chrome.runtime.lastError) {
                    resolve(undefined);
                    return;
                  }
                  resolve(response);
                },
              );
              // Timeout 1.5s — if no extension responds, fall through
              setTimeout(() => resolve(undefined), 1500);
            },
          );

          if (response?.installed === true) {
            markInstalled();
            return;
          }
        } catch {
          // Extension unreachable via externally_connectable — try fallback
        }
      }

      if (isDetected) return;

      // ── Strategy 2: fetch detect.json by hardcoded extension ID ──
      try {
        const res = await fetch(
          `chrome-extension://${EXTENSION_ID}/assets/detect.json`,
          { signal: AbortSignal.timeout(1500) },
        );
        if (!cancelled && !isDetected) {
          setStatus(res.ok ? 'installed' : 'not_installed');
        }
        return;
      } catch {
        if (!cancelled && !isDetected) setStatus('not_installed');
      }
    }

    probe();

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('ctrl-blck-pong', handlePong);
      }
    };
  }, []);

  return { status };
}
