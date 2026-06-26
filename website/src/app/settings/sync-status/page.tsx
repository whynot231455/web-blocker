'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { ArrowLeft, BadgeCheck, CircleAlert, Clock3, Database, Download, RefreshCw, ShieldCheck, Unplug } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ExtensionGate } from '@/components/layout/ExtensionGate';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useExtensionSyncStatus, type ExtensionSyncStatus } from '@/hooks/useExtensionSyncStatus';
import { useRouter } from 'next/navigation';

export default function SyncStatusPage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const { syncStatus, refresh } = useExtensionSyncStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, authLoading, router]);

  const display = useMemo(() => getDisplay(syncStatus), [syncStatus]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
    refresh();
    window.setTimeout(() => {
      refresh();
      setIsRefreshing(false);
    }, 600);
  };

  if (authLoading || (!user && !isGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <ExtensionGate>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <button
                  onClick={() => router.push('/settings')}
                  className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to settings
                </button>
                <h2 className="text-2xl font-bold text-gray-900 font-mono">Extension Sync Status</h2>
                <p className="text-gray-500">Check whether the dashboard and Chrome extension are talking to each other.</p>
              </div>
              <Button variant="secondary" onClick={handleRefresh} isLoading={isRefreshing || syncStatus.state === 'checking'}>
                <RefreshCw size={16} className="mr-2" />
                Refresh Sync
              </Button>
            </div>

            <section className={`mb-8 border-2 border-black shadow-[8px_8px_0px_#000] p-6 ${display.bannerClass}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 border-2 border-black bg-white text-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                    <display.icon size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Status</p>
                    <h3 className="mt-2 text-lg font-black uppercase tracking-widest">{display.title}</h3>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest leading-relaxed">{display.description}</p>
                  </div>
                </div>
                {syncStatus.state === 'not_installed' && (
                  <Button variant="primary" onClick={() => router.push('/install')}>
                    <Download size={16} className="mr-2" />
                    Install Extension
                  </Button>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              <StatusCard
                icon={Unplug}
                label="Extension"
                value={syncStatus.installed ? 'Installed' : syncStatus.state === 'checking' ? 'Checking' : 'Not Detected'}
                detail={syncStatus.installed ? 'Content script is responding.' : 'Dashboard cannot reach the extension.'}
              />
              <StatusCard
                icon={ShieldCheck}
                label="Sync Mode"
                value={display.mode}
                detail={display.modeDetail}
              />
              <StatusCard
                icon={Database}
                label="Blocked Sites"
                value={syncStatus.state === 'checking' ? '...' : String(syncStatus.blockedSiteCount)}
                detail="Count currently stored in the extension."
              />
              <StatusCard
                icon={Clock3}
                label="Last Sync"
                value={formatSyncTime(syncStatus.lastSyncedAt)}
                detail={syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).toLocaleString() : 'No sync timestamp yet.'}
              />
              <StatusCard
                icon={BadgeCheck}
                label="Active Session"
                value={syncStatus.activeSession?.url || 'None'}
                detail={syncStatus.activeSession ? 'Temporary access is active.' : 'No active focus override.'}
              />
            </div>

            {syncStatus.error && (
              <section className="mt-8 bg-red-50 border-2 border-black shadow-[8px_8px_0px_#000] p-6">
                <div className="flex items-start gap-3">
                  <CircleAlert size={20} className="shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-red-800">Latest Sync Error</h3>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest leading-relaxed text-red-700">
                      {syncStatus.error}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </ExtensionGate>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-5 min-h-[156px]">
      <div className="w-10 h-10 border-2 border-black bg-blue-50 flex items-center justify-center shadow-[3px_3px_0px_#000] mb-4">
        <Icon size={18} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-black uppercase tracking-widest text-gray-900 break-words">{value}</p>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed">{detail}</p>
    </div>
  );
}

function getDisplay(status: ExtensionSyncStatus) {
  if (status.state === 'checking') {
    return {
      icon: RefreshCw,
      title: 'Checking Extension',
      description: 'Looking for the CTRL+BLCK extension and its latest sync snapshot.',
      mode: 'Checking',
      modeDetail: 'Waiting for extension response.',
      bannerClass: 'bg-white text-black',
    };
  }

  if (status.state === 'not_installed') {
    return {
      icon: Unplug,
      title: 'Extension Not Detected',
      description: 'Install or enable the Chrome extension to sync blocked sites with your browser.',
      mode: 'Offline',
      modeDetail: 'No extension connection is available.',
      bannerClass: 'bg-red-50 text-red-800',
    };
  }

  if (status.state === 'guest_local') {
    return {
      icon: ShieldCheck,
      title: 'Guest Mode',
      description: 'Your extension is synced with local guest data on this device.',
      mode: 'Guest',
      modeDetail: 'Blocked sites are stored locally.',
      bannerClass: 'bg-amber-100 text-black',
    };
  }

  if (status.state === 'error') {
    return {
      icon: CircleAlert,
      title: 'Sync Needs Attention',
      description: 'The extension responded, but the latest sync attempt failed.',
      mode: status.hasSession ? 'Account' : 'Disconnected',
      modeDetail: status.hasSession ? 'Account sync needs refresh.' : 'No valid account session is active.',
      bannerClass: 'bg-red-50 text-red-800',
    };
  }

  if (status.state === 'not_authenticated') {
    return {
      icon: Unplug,
      title: 'Not Synchronized',
      description: 'The extension is installed, but no account or guest sync is active.',
      mode: 'Signed Out',
      modeDetail: 'Sign in or continue as guest to sync.',
      bannerClass: 'bg-white text-black',
    };
  }

  return {
    icon: BadgeCheck,
    title: 'Synced with Dashboard',
    description: 'Your blocked sites are synced between the dashboard and Chrome extension.',
    mode: 'Account',
    modeDetail: 'Dashboard account sync is active.',
    bannerClass: 'bg-green-100 text-green-900',
  };
}

function formatSyncTime(value: string | null) {
  if (!value) return 'Never';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
