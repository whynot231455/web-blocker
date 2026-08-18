'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BadgeCheck, Clock3, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ExtensionGate } from '@/components/layout/ExtensionGate';
import { useRouter } from 'next/navigation';
import { useBlockedSites } from '@/hooks/useBlockedSites';
import { getAccessWindowState } from '@/lib/schedule';
import { SignOutModal } from '@/components/auth/SignOutModal';

export default function AccountPage() {
  const { user, isGuest, loading: authLoading, signOut, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { sites } = useBlockedSites();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

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
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, authLoading, router]);

  if (authLoading || (!user && !isGuest)) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-xl font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.name || user?.email || 'Your Account';
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  const handleSignOutConfirm = async () => {
    await signOut();
    router.push('/login');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      setGoogleError(signInError.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <ExtensionGate>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
          <Header />
          <main className="p-8 max-w-3xl mx-auto w-full flex flex-col items-center justify-start" style={{ minHeight: 'calc(100vh - 72px)' }}>
            {user ? (
              <>
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-4 border-white shadow-md mb-6 overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <User size={40} />
                  )}
                </div>

                <h2 className="text-2xl font-black font-mono uppercase tracking-tight mb-2 text-center">
                  {displayName}
                </h2>
                <p className="text-gray-500 text-center mb-4 max-w-sm break-all">
                  {user.email}
                </p>

                <div className="px-4 py-1.5 bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] rounded-full inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-widest mb-10">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                  Synced Account
                </div>

                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 w-full max-w-lg mb-6">
                  <h4 className="font-black uppercase tracking-widest text-xs text-gray-500 mb-4">
                    Account
                  </h4>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BadgeCheck size={14} /> Sync
                    </span>
                    <span className="font-bold">Active</span>
                  </div>
                  {memberSince && (
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Shield size={14} /> Member Since
                      </span>
                      <span className="font-bold">{memberSince}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-4 border-t pt-3">
                    Your blocked sites and focus sessions are synced to your account and enforced by the extension across devices.
                  </p>
                </div>

                <button
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="w-full max-w-lg py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
                  style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
                >
                  <LogOut size={16} />
                  SIGN OUT
                </button>
              </>
            ) : (
              <>
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
                  <div className="h-14 w-14 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">🔑</span>
                  </div>
                  <h3 className="font-black uppercase tracking-widest text-sm mb-2">
                    Sync Your Account
                  </h3>
                  <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                    Sign in with Google to sync your blocked sites and focus
                    sessions across devices.
                  </p>
                  {googleError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-400 text-red-700 text-[10px]">
                      {googleError}
                    </div>
                  )}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                    style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.1em', boxShadow: '4px 4px 0px #000' }}
                  >
                    CONTINUE WITH GOOGLE
                  </button>
                  <div className="border-t border-gray-200 pt-4 mt-5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      🔒 Your data stays private and secure
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
              </>
            )}
          </main>
        </div>
      </div>
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOutConfirm}
      />
    </ExtensionGate>
  );
}
