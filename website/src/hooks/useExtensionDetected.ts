'use client';

import { useState, useEffect } from 'react';
import { EXTENSION_ID } from '@/config/sync';

export type ExtensionStatus = 'checking' | 'installed' | 'not_installed';

/**
 * Probes for the CTRL+BLCK Chrome extension by fetching a web-accessible
 * resource (`detect.json`) from the extension's origin.
 *
 * Can be skipped entirely during local development by setting
 * NEXT_PUBLIC_SKIP_EXTENSION_CHECK=true in .env.local.
 */
export function useExtensionDetected() {
  const [status, setStatus] = useState<ExtensionStatus>('checking');

  useEffect(() => {
    // Dev-mode bypass — defer setState to avoid calling it synchronously
    // inside the effect body (react-hooks/set-state-in-effect)
    if (process.env.NEXT_PUBLIC_SKIP_EXTENSION_CHECK === 'true') {
      queueMicrotask(() => setStatus('installed'));
      return;
    }

    const controller = new AbortController();

    async function probe() {
      try {
        const res = await fetch(
          `chrome-extension://${EXTENSION_ID}/assets/detect.json`,
          { signal: AbortSignal.timeout(1500) }
        );
        setStatus(res.ok ? 'installed' : 'not_installed');
      } catch {
        setStatus('not_installed');
      }
    }

    probe();

    return () => controller.abort();
  }, []);

  return { status };
}
