'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { User, Shield, Award, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useBlockedSites } from '@/hooks/useBlockedSites';

export default function AccountPage() {
  const { user, isGuest, loading, signOut } = useAuth();
  const router = useRouter();
  const { getStats } = useFocusSessions();
  const { sites } = useBlockedSites();
  const allTimeStats = getStats('all-time');

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Auth guard — only redirect if not a real user AND not a guest
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-xl font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  // ─── Guest view ───────────────────────────────────────────────────────────
  if (isGuest && !user) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
          <Header />
          <main className="p-8 max-w-3xl mx-auto w-full flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
            {/* Guest avatar */}
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-4 border-white shadow-md mb-6">
              <User size={40} />
            </div>

            <h2 className="text-2xl font-black font-mono uppercase tracking-tight mb-2">
              You&apos;re in Guest Mode
            </h2>
            <p className="text-gray-500 text-center mb-10 max-w-sm">
              Create a free account to save your blocked sites, track focus sessions, and sync across devices.
            </p>

            {/* CTA cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mb-10">
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-[#FF4141] flex items-center justify-center">
                  <UserPlus size={22} className="text-white" />
                </div>
                <h3 className="font-black uppercase tracking-widest text-sm">Create Account</h3>
                <p className="text-xs text-gray-500">Free forever. Save your settings and sync everywhere.</p>
                <Button
                  variant="primary"
                  className="w-full mt-2"
                  onClick={() => router.push('/signup')}
                >
                  Sign Up Free
                </Button>
              </div>

              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center">
                  <LogIn size={22} className="text-white" />
                </div>
                <h3 className="font-black uppercase tracking-widest text-sm">Already Have One?</h3>
                <p className="text-xs text-gray-500">Sign in to restore your account and blocked sites.</p>
                <Button
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={() => router.push('/login')}
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Guest quick stats */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-6 w-full max-w-lg">
              <h4 className="font-black uppercase tracking-widest text-xs text-gray-500 mb-4">
                Current Guest Session
              </h4>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-500 flex items-center gap-2">
                  <Shield size={14} /> Sites Blocked
                </span>
                <span className="font-bold">{sites.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock size={14} /> Total Focus
                </span>
                <span className="font-bold">{allTimeStats.focusTimeStr}</span>
              </div>
              <p className="text-xs text-amber-600 mt-4 border-t pt-3">
                ⚠️ Guest data is stored locally and will be lost if you clear your browser storage.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ─── Authenticated user view ───────────────────────────────────────────────
  const displayName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name}`
    : user?.email?.split('@')[0] || 'User';

  const userInitial = displayName.charAt(0).toUpperCase();
  const fullName = user?.user_metadata?.full_name || displayName;
  const email = user?.email || 'N/A';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 font-mono">My Account</h2>
            <p className="text-gray-500">Manage your profile and subscription.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-4 border-white shadow-md mx-auto mb-4 text-3xl">
                  {userInitial}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-500">Free Account</p>
                <Button className="w-full mt-6" variant="primary">Edit Profile</Button>
                <Button
                  className="w-full mt-2"
                  variant="danger"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2"><Clock size={14} /> Total Focus</span>
                    <span className="font-medium">{allTimeStats.focusTimeStr}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2"><Shield size={14} /> Sites Blocked</span>
                    <span className="font-medium">{sites.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <User size={20} className="text-blue-500" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Full Name</label>
                    <p className="text-gray-900 font-medium pb-2 border-b">{fullName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email Address</label>
                    <p className="text-gray-900 font-medium pb-2 border-b">{email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <Award size={20} className="text-purple-500" />
                  Subscription Plan
                </h3>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div>
                    <h4 className="font-bold text-purple-900">Free Plan</h4>
                    <p className="text-sm text-purple-700">Basic blocking features included.</p>
                  </div>
                  <Button variant="secondary" className="bg-white hover:bg-white/90 border-purple-200 text-purple-600">Upgrade to Pro</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const Clock = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
