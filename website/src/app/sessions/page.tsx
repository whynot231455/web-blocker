'use client';

import { useEffect, useState } from 'react';
import type { AccessWindow } from '@/lib/schedule';
import { getAccessWindowState, normalizeAccessWindow, normalizeTimeString } from '@/lib/schedule';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ExtensionGate } from '@/components/layout/ExtensionGate';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useAuth } from '@/hooks/useAuth';
import { useBlockedSites } from '@/hooks/useBlockedSites';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Globe2,
  Plus,
  RefreshCw,
  Save,
  Slash,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

type SiteDraft = {
  enabled: boolean;
  start: string;
  end: string;
};

const DEFAULT_WINDOW: SiteDraft = {
  enabled: true,
  start: '01:00',
  end: '05:00',
};

export default function SessionsPage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const { sites, loading: sitesLoading, error, addSite, deleteSite, updateSiteSchedule } = useBlockedSites();
  const router = useRouter();
  const [nowTick, setNowTick] = useState(Date.now());
  const [newUrl, setNewUrl] = useState('');
  const [newWindow, setNewWindow] = useState<SiteDraft>(DEFAULT_WINDOW);
  const [drafts, setDrafts] = useState<Record<string, SiteDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, authLoading, router]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const site of sites) {
        if (!next[site.id]) {
          next[site.id] = windowToDraft(site.access_window);
        }
      }
      return next;
    });
  }, [sites]);

  if (authLoading || (!user && !isGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  const now = new Date(nowTick);
  const siteStates = sites.map((site) => {
    const effectiveWindow = draftToWindow(drafts[site.id] || windowToDraft(site.access_window));
    const state = getAccessWindowState(effectiveWindow, now);

    return {
      site,
      effectiveWindow,
      state,
      label: getSiteStatusLabel(site.is_active, effectiveWindow, state),
    };
  });

  const totalSites = sites.length;
  const allowedNowCount = siteStates.filter((item) => item.site.is_active !== false && item.state.allowed).length;
  const blockedNowCount = siteStates.filter((item) => item.site.is_active !== false && !item.state.allowed).length;

  const handleAddSite = async () => {
    const url = newUrl.trim();
    const accessWindow = draftToWindow(newWindow);
    const created = await addSite(url, accessWindow);
    if (!created) return;

    setNewUrl('');
    setNewWindow(DEFAULT_WINDOW);
    setStatusMessage(`${created.url} added with its access window.`);
  };

  const handleSaveWindow = async (siteId: string) => {
    const draft = drafts[siteId];
    setSavingId(siteId);
    try {
      const saved = await updateSiteSchedule(siteId, draftToWindow(draft || null));
      if (saved) {
        setDrafts((current) => ({
          ...current,
          [siteId]: windowToDraft(saved.access_window),
        }));
        setStatusMessage(`Saved access window for ${saved.url}.`);
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <ExtensionGate>
      <div className="flex min-h-screen bg-white font-mono text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
          <Header />
          <main className="mx-auto w-full max-w-7xl p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Sessions</h2>
                <p className="mt-3 max-w-2xl text-[11px] font-bold uppercase tracking-widest text-gray-600 leading-relaxed">
                  Each blocked site is only reachable during its saved daily window. If the schedule is missing, disabled, or invalid, the site stays blocked.
                </p>
              </div>

              <div className="min-w-[240px] border-2 border-black bg-white p-4 shadow-[6px_6px_0px_#000]">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Local time</p>
                <p className="mt-2 text-xl font-black uppercase tracking-tighter">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Browser timezone
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className="mb-6 border-2 border-black bg-emerald-100 px-4 py-3 shadow-[4px_4px_0px_#000]">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900">{statusMessage}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 border-2 border-black bg-red-100 px-4 py-3 shadow-[4px_4px_0px_#000]">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-900">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-10">
              <StatsCard title="Blocked Sites" value={totalSites.toString()} icon={Globe2} color="blue" />
              <StatsCard title="Allowed Now" value={allowedNowCount.toString()} icon={CheckCircle2} color="green" />
              <StatsCard title="Blocked Now" value={blockedNowCount.toString()} icon={Slash} color="purple" />
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_#000]">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Add website</h3>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Define the time window before saving. Outside that window, the site remains blocked.
                    </p>
                  </div>
                  <RefreshCw size={16} className="text-gray-400" />
                </div>

                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Website</span>
                    <input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="example.com"
                      className="border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-white"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Allow from</span>
                      <input
                        type="time"
                        value={newWindow.start}
                        onChange={(e) => setNewWindow((current) => ({ ...current, start: normalizeTimeString(e.target.value) || e.target.value }))}
                        className="border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-white"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Allow until</span>
                      <input
                        type="time"
                        value={newWindow.end}
                        onChange={(e) => setNewWindow((current) => ({ ...current, end: normalizeTimeString(e.target.value) || e.target.value }))}
                        className="border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none focus:bg-white"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleAddSite}
                    disabled={!newUrl.trim()}
                    className="inline-flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none"
                  >
                    <Plus size={14} />
                    Add blocked site
                  </button>
                </div>

                <div className="mt-6 border-t-2 border-dashed border-gray-200 pt-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed">
                    Example: 01:00 to 05:00 means the site is accessible only during that daily window. Overnight windows are supported.
                  </p>
                </div>
              </section>

              <section className="border-2 border-black bg-white shadow-[8px_8px_0px_#000]">
                <div className="border-b-2 border-black px-6 py-5">
                  <h3 className="text-sm font-black uppercase tracking-widest">Saved access windows</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Update the window, save it, or disable enforcement for a site.
                  </p>
                </div>

                {sitesLoading ? (
                  <div className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Loading your sites...
                  </div>
                ) : sites.length === 0 ? (
                  <div className="p-10 text-center">
                    <TriangleAlert size={32} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed">
                      No blocked sites yet. Add one above and give it a valid access window.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-gray-100">
                    {siteStates.map(({ site, effectiveWindow, state, label }) => {
                      const draft = drafts[site.id] || windowToDraft(site.access_window);
                      const crossesMidnight = Boolean(effectiveWindow && effectiveWindow.start > effectiveWindow.end);

                      return (
                        <div key={site.id} className="p-5 bg-white transition-colors">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-black uppercase tracking-tight">{site.url}</p>
                                </div>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                  {label.text}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newEnabled = !draft.enabled;
                                    updateSiteSchedule(site.id, effectiveWindow
                                      ? { ...effectiveWindow, enabled: newEnabled }
                                      : { enabled: newEnabled, start: DEFAULT_WINDOW.start, end: DEFAULT_WINDOW.end });
                                    setDrafts((current) => ({
                                      ...current,
                                      [site.id]: {
                                        ...draft,
                                        enabled: newEnabled,
                                      },
                                    }));
                                  }}
                                  className={`relative h-8 w-14 border-2 border-black shadow-[3px_3px_0px_#000] transition-all ${
                                    draft.enabled ? 'bg-black' : 'bg-white'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 h-5 w-5 border-2 border-black bg-white transition-all ${
                                      draft.enabled ? 'right-0.5' : 'left-0.5'
                                    }`}
                                  />
                                </button>
                                <button
                                  onClick={() => deleteSite(site.id)}
                                  className="border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_#000] transition-all hover:bg-red-50"
                                >
                                  <Trash2 size={14} className="inline-block -translate-y-px" />
                                </button>
                              </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="grid gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Allow from</span>
                                  <input
                                    type="time"
                                    value={draft.start}
                                    onChange={(e) => setDrafts((current) => ({
                                      ...current,
                                      [site.id]: {
                                        ...draft,
                                        start: normalizeTimeString(e.target.value) || e.target.value,
                                      },
                                    }))}
                                    className="border-2 border-black bg-white px-3 py-3 text-sm font-bold outline-none focus:bg-white"
                                  />
                                </label>

                                <label className="grid gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Allow until</span>
                                  <input
                                    type="time"
                                    value={draft.end}
                                    onChange={(e) => setDrafts((current) => ({
                                      ...current,
                                      [site.id]: {
                                        ...draft,
                                        end: normalizeTimeString(e.target.value) || e.target.value,
                                      },
                                    }))}
                                    className="border-2 border-black bg-white px-3 py-3 text-sm font-bold outline-none focus:bg-white"
                                  />
                                </label>

                              </div>

                              <button
                                onClick={() => handleSaveWindow(site.id)}
                                disabled={savingId === site.id}
                                className="inline-flex items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none"
                              >
                                <Save size={14} />
                                Save window
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                              <span className="inline-flex items-center gap-2 border-2 border-gray-200 bg-white px-3 py-2">
                                <Clock3 size={12} />
                                {formatWindowLabel(effectiveWindow)}
                              </span>
                              {crossesMidnight && (
                                <span className="inline-flex items-center gap-2 border-2 border-gray-200 bg-white px-3 py-2">
                                  Overnight window
                                </span>
                              )}
                              {!effectiveWindow && (
                                <span className="inline-flex items-center gap-2 border-2 border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                                  No valid window saved. The site stays blocked.
                                </span>
                              )}
                              {state.allowed && site.is_active !== false && (
                                <span className="inline-flex items-center gap-2 border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
                                  <BadgeCheck size={12} />
                                  Accessible now
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
    </ExtensionGate>
  );
}

function draftToWindow(draft: SiteDraft | null | undefined): AccessWindow | null {
  if (!draft) return null;
  const normalized = normalizeAccessWindow({
    enabled: draft.enabled,
    start: draft.start,
    end: draft.end,
  });
  return normalized;
}

function windowToDraft(window: AccessWindow | null | undefined): SiteDraft {
  return {
    enabled: window?.enabled !== false,
    start: window?.start || DEFAULT_WINDOW.start,
    end: window?.end || DEFAULT_WINDOW.end,
  };
}

function formatWindowLabel(window: AccessWindow | null | undefined) {
  if (!window) return 'No schedule saved';
  if (window.enabled === false) return `${window.start} to ${window.end} is disabled`;
  return `${window.start} to ${window.end} local time`;
}

function getSiteStatusLabel(isActive: boolean, window: AccessWindow | null, state: { allowed: boolean }) {
  if (isActive === false) {
    return { state: 'neutral' as const, text: 'Not enforced' };
  }
  if (!window) {
    return { state: 'warning' as const, text: 'Blocked until a valid window is saved' };
  }
  if (!window.enabled) {
    return { state: 'neutral' as const, text: 'Schedule disabled, site blocked' };
  }
  if (state.allowed) {
    return { state: 'success' as const, text: 'Currently accessible' };
  }
  return { state: 'danger' as const, text: 'Blocked until the next allowed time' };
}

