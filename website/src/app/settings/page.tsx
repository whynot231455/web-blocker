'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Shield, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ExtensionGate } from '@/components/layout/ExtensionGate';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, authLoading, router]);

  if (authLoading || (!user && !isGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  const sections = [
    { title: 'Privacy & Security', icon: Shield, description: 'Manage your data and account security.' },
    { title: 'Appearance', icon: Moon, description: 'Switch between light and dark modes.' },
  ];

  return (
    <ExtensionGate>
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 font-mono">SETTINGS</h2>
            <p className="text-gray-500">CONFIGURE CTRL+BLCK TO SUIT YOUR WORKFLOW.</p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                    <section.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (section.title === 'Privacy & Security') {
                      router.push('/settings/privacy-security');
                    } else if (section.title === 'Appearance') {
                      router.push('/settings/appearance');
                    }
                  }}
                >
                  Manage
                </Button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
    </ExtensionGate>
  );
}
