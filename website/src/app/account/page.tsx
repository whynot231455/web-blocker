'use client';

import { useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BadgeCheck, Clock3, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ExtensionGate } from '@/components/layout/ExtensionGate';
import { useRouter } from 'next/navigation';
import { useBlockedSites } from '@/hooks/useBlockedSites';
import { getAccessWindowState } from '@/lib/schedule';

export default function AccountPage() {
  const { isGuest, loading } = useAuth();
  const router = useRouter();
  const { sites } = useBlockedSites();

  const summary = useMemo(() => {
    const now = new Date();
    const activeSites = sites.filter((site) => site.is_active !== false);
    const scheduledSites = activeSites.filter((site) => Boolean(site.access_window)).length;
    const allowedNow = activeSites.filter((site) => getAccessWindowState(site.access_window || null, now).allowed).length;
    const blockedNow = activeSites.length - allowedNow;

    return {
      totalSites: activeSites.length,
      scheduledSites,
      allowedNow,
      blockedNow,
    };
  }, [sites]);

  useEffect(() => {
    if (!loading && !isGuest) {
      router.push('/login');
    }
  }, [isGuest, loading, router]);

  if (loading || !isGuest) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-xl font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <ExtensionGate>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
          <Header />
          <main className="p-8 max-w-3xl mx-auto w-full flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-4 border-white shadow-md mb-6">
              <User size={40} />
            </div>

            <h2 className="text-2xl font-black font-mono uppercase tracking-tight mb-2">
              You&apos;re in Guest Mode
            </h2>
            <p className="text-gray-500 text-center mb-10 max-w-sm">
              You&apos;re using Ctrl+Blck in guest mode. Your blocked sites and
              access windows are stored locally in your browser.
            </p>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 w-full max-w-lg mb-10 text-center">
              <div className="h-14 w-14 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔧</span>
              </div>
              <h3 className="font-black uppercase tracking-widest text-sm mb-2">
                Accounts Are Coming
              </h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                We&apos;re building the full account system. For now, everything works
                locally in guest mode and stays on this device.
              </p>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-[10px] text-yellow-700 font-bold uppercase tracking-widest">
                  🚧 Sign-up &amp; sign-in will be available in a future update
                </p>
              </div>
            </div>

            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 w-full max-w-lg">
              <h4 className="font-black uppercase tracking-widest text-xs text-gray-500 mb-4">
                Current Guest Access
              </h4>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-500 flex items-center gap-2">
                  <Shield size={14} /> Blocked Sites
                </span>
                <span className="font-bold">{summary.totalSites}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock3 size={14} /> Access Windows
                </span>
                <span className="font-bold">{summary.scheduledSites}</span>
              </div>
              <div className="flex justify-between text-sm mt-3">
                <span className="text-gray-500 flex items-center gap-2">
                  <BadgeCheck size={14} /> Allowed Now
                </span>
                <span className="font-bold">{summary.allowedNow}</span>
              </div>
              <div className="flex justify-between text-sm mt-3">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock3 size={14} /> Blocked Now
                </span>
                <span className="font-bold">{summary.blockedNow}</span>
              </div>
              <p className="text-xs text-amber-600 mt-4 border-t pt-3">
                ⚠️ Guest data is stored locally and will be lost if you clear your browser storage.
              </p>
            </div>
          </main>
        </div>
      </div>
    </ExtensionGate>
  );
}
