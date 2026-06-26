'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ExtensionGate } from '@/components/layout/ExtensionGate';
import { useAuth } from '@/hooks/useAuth';
import { useBlockedSites } from '@/hooks/useBlockedSites';
import { SYNC_STORAGE_KEYS } from '@/config/sync';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  RefreshCw,
  Download,
  Trash2,
  LogOut,
  Database,
  Globe2,
  BadgeCheck,
  Clock3,
  ArrowLeft,
} from 'lucide-react';

export default function PrivacySecurityPage() {
  const { user, isGuest, loading: authLoading, signOut } = useAuth();
  const { sites, refresh } = useBlockedSites();
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, authLoading, router]);

  const summary = useMemo(() => {
    const blockedCount = sites.length;
    const modeLabel = isGuest ? 'Guest mode' : 'Synced account';
    const privacyLabel = isGuest
      ? 'Stored locally on this device'
      : 'Synced to your account and extension';

    return { blockedCount, modeLabel, privacyLabel };
  }, [isGuest, sites.length]);

  const handleRefreshSync = async () => {
    setIsRefreshing(true);
    setStatus('');
    try {
      await refresh();
      window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
      setStatus('Privacy data refreshed successfully.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleExportData = () => {
    const payload = {
      mode: isGuest ? 'guest' : 'authenticated',
      blockedSites: sites,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ctrl-blck-privacy-export.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Export started.');
  };

  const handleClearGuestData = () => {
    localStorage.removeItem(SYNC_STORAGE_KEYS.guestSites);
    localStorage.removeItem(SYNC_STORAGE_KEYS.guestFlag);
    window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
    setStatus('Guest data cleared from this device.');
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
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <button
                  onClick={() => router.push('/settings')}
                  className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to settings
                </button>
                <h2 className="text-2xl font-bold text-gray-900 font-mono">Privacy &amp; Security</h2>
                <p className="text-gray-500">Control how CTRL+BLCK stores, syncs, and protects your data.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-2 border-2 border-black bg-white shadow-[4px_4px_0px_#000] text-[10px] font-black uppercase tracking-widest">
                  <BadgeCheck size={14} />
                  Protected
                </span>
              </div>
            </div>

            {status && (
              <div className="mb-6 bg-green-100 border-2 border-black shadow-[4px_4px_0px_#000] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-900">{status}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              <StatusCard icon={Database} label="Data Mode" value={summary.modeLabel} detail={summary.privacyLabel} />
              <StatusCard icon={Globe2} label="Blocked Sites" value={String(summary.blockedCount)} detail="Sites currently in your block list." />
              <StatusCard icon={Clock3} label="Session Security" value={isGuest ? 'Local only' : 'Signed in'} detail={isGuest ? 'No account sync is active.' : 'Your session is tied to your account.'} />
              <StatusCard icon={Shield} label="Protection" value="Active" detail="Your dashboard and extension are connected securely." />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <section className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-blue-50 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Privacy Controls</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">What is stored and where it lives</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <InfoRow title="Blocked List Privacy" text="Your blocked URLs stay tied to your account or local guest session. They are never public." />
                  <InfoRow title="Guest Mode Privacy" text="When you browse as a guest, your blocked list stays on this device only." />
                  <InfoRow title="Sync Scope" text="Only block-list data is synced so the extension can enforce your settings across devices." />
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={handleExportData}>
                    <Download size={16} className="mr-2" />
                    Export data
                  </Button>
                  <Button variant="ghost" onClick={handleRefreshSync} isLoading={isRefreshing}>
                    <RefreshCw size={16} className="mr-2" />
                    Refresh sync
                  </Button>
                </div>
              </section>

              <section className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-purple-50 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Security Actions</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Keep access under control</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <InfoRow title="Signed-In State" text={isGuest ? 'You are using guest mode. Sign in to sync across devices.' : 'You are signed in and your account is active.'} />
                  <InfoRow title="Connection Safety" text="We use secure connections for dashboard and sync traffic." />
                  <InfoRow title="Account Access" text="Use sign out to end your current session on this browser." />
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button variant="secondary" onClick={handleRefreshSync}>
                    <RefreshCw size={16} className="mr-2" />
                    Check status
                  </Button>
                  <Button variant="danger" onClick={handleSignOut}>
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </Button>
                </div>
              </section>
            </div>

            <section className="mt-8 bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-amber-100 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Danger Zone</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Destructive actions for local privacy control</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <DangerCard
                  title="Clear Guest Data"
                  text="Remove locally stored guest sites from this device."
                  action={
                    <Button variant="secondary" onClick={handleClearGuestData} disabled={!isGuest}>
                      Clear local data
                    </Button>
                  }
                />
                <DangerCard
                  title="Export Before Leaving"
                  text="Download a copy of your blocked list before signing out."
                  action={
                    <Button variant="ghost" onClick={handleExportData}>
                      Export now
                    </Button>
                  }
                />
                <DangerCard
                  title="Session Reset"
                  text="Refresh your sync state if the extension seems out of date."
                  action={
                    <Button variant="secondary" onClick={handleRefreshSync} isLoading={isRefreshing}>
                      <RefreshCw size={16} className="mr-2" />
                      Resync
                    </Button>
                  }
                />
              </div>
            </section>
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
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
          <p className="mt-2 text-lg font-black text-gray-900">{value}</p>
        </div>
        <div className="w-10 h-10 border-2 border-black bg-blue-50 flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed">{detail}</p>
    </div>
  );
}

function InfoRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-2 border-black bg-gray-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{title}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed">{text}</p>
    </div>
  );
}

function DangerCard({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <div className="border-2 border-black bg-red-50 shadow-[4px_4px_0px_#000] p-4 flex flex-col justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-red-800">{title}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-red-700 leading-relaxed">{text}</p>
      </div>
      <div>{action}</div>
    </div>
  );
}
