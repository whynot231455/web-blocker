'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ComponentType } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ExtensionGate } from '@/components/layout/ExtensionGate';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { MoonStar, SunMedium, ArrowLeft, Palette, Sparkles } from 'lucide-react';

const THEME_STORAGE_KEY = 'ctrl-blck-theme';

type ThemeMode = 'light' | 'dark';

export default function AppearancePage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, authLoading, router]);

  useEffect(() => {
    setMounted(true);
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;
    const initialTheme: ThemeMode = saved === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.ctrlBlckTheme = theme;
    document.body.dataset.ctrlBlckTheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(new CustomEvent('ctrl-blck-theme-change', { detail: { theme } }));
  }, [mounted, theme]);

  const themeStyles: CSSProperties = useMemo(() => {
    return theme === 'dark'
      ? {
          background: '#000000',
          color: '#f9fafb',
        }
      : {
          background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          color: '#111827',
        };
  }, [theme]);

  if (authLoading || (!user && !isGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <ExtensionGate>
      <div className="flex min-h-screen" style={themeStyles}>
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <button
              onClick={() => router.push('/settings')}
              className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
            >
              <ArrowLeft size={14} />
              Back to settings
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold font-mono">Appearance</h2>
              <p className="text-gray-500">Choose the visual mode that fits your workflow.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-blue-50 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Theme Selector</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Switch between light and dark</p>
                  </div>
                </div>

                <label className="block text-[10px] font-black uppercase tracking-widest mb-2">
                  Color Mode
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as ThemeMode)}
                  className="w-full appearance-none border-2 border-black bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_#000] focus:outline-none"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>

                <div className="mt-6 space-y-3">
                  <InfoRow
                    icon={SunMedium}
                    title="Light mode"
                    text="Bright, high-contrast surfaces with a clean look for daytime work."
                    active={theme === 'light'}
                  />
                  <InfoRow
                    icon={MoonStar}
                    title="Dark mode"
                    text="Lower-glare visuals for late-night focus sessions and darker environments."
                    active={theme === 'dark'}
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setTheme('light')}
                    className="flex-1"
                    disabled={theme === 'light'}
                  >
                    Light
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setTheme('dark')}
                    className="flex-1"
                    disabled={theme === 'dark'}
                  >
                    Dark
                  </Button>
                </div>
              </section>

              <section
                className="border-2 border-black shadow-[8px_8px_0px_#000] p-6"
                style={{
                  background: theme === 'dark' ? '#0b0b0b' : '#ffffff',
                  color: theme === 'dark' ? '#f9fafb' : '#111827',
                }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]" style={{ background: theme === 'dark' ? '#1a1a1a' : '#eff6ff' }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Live Preview</h3>
                    <p className="text-[10px] uppercase tracking-widest opacity-70">See how CTRL+BLCK feels right now</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-black p-4 shadow-[4px_4px_0px_#000]" style={{ background: theme === 'dark' ? '#000000' : '#f8fafc' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2">Dashboard card</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                      Your blocked sites, stats, and controls will feel like this.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <PreviewTile label="Surface" value={theme === 'dark' ? 'True black' : 'Bright white'} />
                    <PreviewTile label="Text" value={theme === 'dark' ? 'Soft white' : 'Ink black'} />
                    <PreviewTile label="Accent" value={theme === 'dark' ? 'White edge' : 'Blue pop'} />
                    <PreviewTile label="Mood" value={theme === 'dark' ? 'Low light' : 'High contrast'} />
                  </div>

                  <div className="border-2 border-black p-4 shadow-[4px_4px_0px_#000]" style={{ background: theme === 'dark' ? '#1a1a1a' : '#dbeafe' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest">Current selection</p>
                    <p className="mt-2 text-sm font-black uppercase tracking-widest">{theme} mode</p>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </ExtensionGate>
  );
}

function InfoRow({
  icon: Icon,
  title,
  text,
  active,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  text: string;
  active: boolean;
}) {
  return (
    <div
      className={`border-2 border-black px-4 py-3 shadow-[4px_4px_0px_#000] ${active ? 'bg-blue-50' : 'bg-gray-50'}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Icon size={16} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest">{title}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-70">{text}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000]">
      <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-widest">{value}</p>
    </div>
  );
}
