'use client';

import { useCallback, useEffect, useState } from 'react';
import { useExtensionDetected } from './useExtensionDetected';

export type ExtensionSyncState = 'checking' | 'synced' | 'guest_local' | 'not_authenticated' | 'error' | 'not_installed';

export interface ExtensionSyncStatus {
  installed: boolean;
  state: ExtensionSyncState;
  isGuest: boolean;
  hasSession: boolean;
  blockedSiteCount: number;
  lastSyncedAt: string | null;
  error: string | null;
  activeSession: {
    url: string;
    start_time: string | null;
    target_duration: number | null;
  } | null;
}

const REQUEST_EVENT = 'ctrl-blck-sync-status-request';
const RESPONSE_EVENT = 'ctrl-blck-sync-status-response';

const initialStatus: ExtensionSyncStatus = {
  installed: false,
  state: 'checking',
  isGuest: false,
  hasSession: false,
  blockedSiteCount: 0,
  lastSyncedAt: null,
  error: null,
  activeSession: null,
};

export function useExtensionSyncStatus() {
  const { status: extensionStatus } = useExtensionDetected();
  const [syncStatus, setSyncStatus] = useState<ExtensionSyncStatus>(initialStatus);

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    setSyncStatus((current) => ({
      ...current,
      state: current.installed ? current.state : 'checking',
    }));
    window.dispatchEvent(new CustomEvent('ctrl-blck-ping'));
    window.dispatchEvent(new CustomEvent(REQUEST_EVENT));
  }, []);

  useEffect(() => {
    if (extensionStatus === 'not_installed') {
      setSyncStatus({
        ...initialStatus,
        installed: false,
        state: 'not_installed',
      });
    }

    if (extensionStatus === 'installed') {
      setSyncStatus((current) => ({
        ...current,
        installed: true,
        state: current.state === 'checking' || current.state === 'not_installed' ? 'checking' : current.state,
      }));
      refresh();
    }
  }, [extensionStatus, refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResponse = (event: Event) => {
      const detail = (event as CustomEvent<Partial<ExtensionSyncStatus>>).detail;
      setSyncStatus({
        installed: detail?.installed === true,
        state: normalizeState(detail?.state),
        isGuest: detail?.isGuest === true,
        hasSession: detail?.hasSession === true,
        blockedSiteCount: typeof detail?.blockedSiteCount === 'number' ? detail.blockedSiteCount : 0,
        lastSyncedAt: typeof detail?.lastSyncedAt === 'string' ? detail.lastSyncedAt : null,
        error: typeof detail?.error === 'string' ? detail.error : null,
        activeSession: detail?.activeSession?.url
          ? {
              url: detail.activeSession.url,
              start_time: detail.activeSession.start_time || null,
              target_duration: detail.activeSession.target_duration || null,
            }
          : null,
      });
    };

    const handlePong = () => {
      setSyncStatus((current) => ({ ...current, installed: true }));
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT));
    };

    window.addEventListener(RESPONSE_EVENT, handleResponse);
    window.addEventListener('ctrl-blck-pong', handlePong);
    refresh();

    const timeout = window.setTimeout(() => {
      setSyncStatus((current) => {
        if (current.installed || current.state !== 'checking') return current;
        return { ...initialStatus, state: 'not_installed' };
      });
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(RESPONSE_EVENT, handleResponse);
      window.removeEventListener('ctrl-blck-pong', handlePong);
    };
  }, [refresh]);

  return { syncStatus, refresh };
}

function normalizeState(state: unknown): ExtensionSyncState {
  if (state === 'synced' || state === 'guest_local' || state === 'not_authenticated' || state === 'error') {
    return state;
  }
  return 'checking';
}
