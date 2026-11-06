'use client';

import React, { useSyncExternalStore } from 'react';
import { useExtensionDetected } from '@/hooks/useExtensionDetected';
import { detectEnvironment } from '@/lib/browserSupport';
import { ExtensionRequired } from '@/components/layout/ExtensionRequired';

/**
 * Wraps protected pages (dashboard, sessions, settings, account).
 * Blocks rendering until the extension is confirmed installed.
 */
export function ExtensionGate({ children }: { children: React.ReactNode }) {
  const { status } = useExtensionDetected();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  // Keep the first server render and the first client render identical.
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  const environment = detectEnvironment();

  // Phones and tablets can never install the extension, so skip the probe.
  if (environment === 'mobile') {
    return <ExtensionRequired environment={environment} />;
  }

  // ── Checking state ────────────────────────────────────────────────
  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  // ── Extension found — render page normally ──
  // The extension must actually answer; there is no way to skip the check.
  if (status === 'installed') {
    return <>{children}</>;
  }

  // ── Not installed — gate UI ───────────────────────────────────────
  return <ExtensionRequired environment={environment} />;
}
