'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Clock, History, Calendar, Play, ChevronDown } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useFocusSessions, StatsRange } from '@/hooks/useFocusSessions';
import { useBlockedSites } from '@/hooks/useBlockedSites';
import { TimerDisplay } from '@/components/dashboard/TimerDisplay';
import { SessionItem } from '@/components/dashboard/SessionItem';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SessionsPage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const { 
    sessions, 
    loading: sessionsLoading, 
    activeSession, 
    startSession, 
    endSession, 
    getStats 
  } = useFocusSessions();
  const { sites, loading: sitesLoading } = useBlockedSites();
  const [range, setRange] = useState<StatsRange>('today');
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({});
  const router = useRouter();

  // Auth guard — redirect to login if not authenticated and not a guest
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

  const stats = getStats(range);

  const handleStartSession = async (url: string) => {
    const duration = selectedDurations[url] || 25;
    try {
      await startSession(url, duration);
    } catch {
      alert('Failed to start session. Make sure you are logged in and the database is connected.');
    }
  };

  const handleDurationChange = (url: string, duration: number) => {
    setSelectedDurations(prev => ({ ...prev, [url]: duration }));
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-mono">
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: '84px' }}>
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          {/* Header & Stats Toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Focus Sessions</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Reclaim your time, one site at a time.
              </p>
            </div>
            
            <div className="relative inline-block">
              <select 
                value={range}
                onChange={(e) => setRange(e.target.value as StatsRange)}
                className="appearance-none bg-white border-2 border-black px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_#000] focus:outline-none cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="all-time">All Time</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatsCard title="Total Sessions" value={stats.totalSessions.toString()} icon={History} color="blue" />
            <StatsCard title="Focus Time" value={stats.focusTimeStr} icon={Clock} color="purple" />
            <StatsCard title="Last Active" value={stats.lastActive} icon={Calendar} color="green" />
          </div>

          {/* Active Session Timer */}
          {activeSession && (
            <div className="mb-10 bg-black text-white p-8 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Currently Focusing</p>
                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-1">{activeSession.url}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Session in progress
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <TimerDisplay 
                    startTime={activeSession.start_time} 
                    targetDurationMinutes={activeSession.target_duration}
                    onComplete={() => endSession(activeSession.id, 'completed')}
                  />
                </div>

                <button 
                  onClick={() => endSession(activeSession.id, 'cancelled')}
                  className="bg-white text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest border-2 border-white hover:bg-transparent hover:text-white transition-all active:translate-x-[2px] active:translate-y-[2px]"
                >
                  Cancel Session
                </button>
              </div>
              {/* Decorative background text */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 text-9xl font-black text-white/5 pointer-events-none select-none uppercase italic">
                FOCUS
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Start Session / URL List */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest">Start a Session</h3>
              </div>
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] overflow-hidden">
                {sitesLoading ? (
                  <div className="p-8 text-center animate-pulse text-[10px] font-bold uppercase text-gray-400">Loading your sites...</div>
                ) : sites.length === 0 ? (
                  <div className="p-8 text-center text-[10px] font-bold uppercase text-gray-400">
                    No sites in your block list. <br />
                    Add some in the Dashboard first!
                  </div>
                ) : (
                  <div className="divide-y-2 divide-gray-100">
                    {sites.map((site, index) => (
                      <div key={`${site.id}-${index}`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-black">{site.url}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Select duration</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <select 
                            value={selectedDurations[site.url] || 25}
                            onChange={(e) => handleDurationChange(site.url, parseInt(e.target.value))}
                            className="bg-gray-100 border-2 border-transparent p-2 text-[10px] font-bold focus:border-black outline-none transition-all"
                          >
                            <option value={1}>1 min</option>
                            <option value={5}>5 mins</option>
                            <option value={15}>15 mins</option>
                            <option value={25}>25 mins</option>
                            <option value={45}>45 mins</option>
                            <option value={60}>60 mins</option>
                          </select>
                          <button 
                            onClick={() => handleStartSession(site.url)}
                            disabled={!!activeSession}
                            className={`p-3 border-2 border-black transition-all ${
                              activeSession 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                            }`}
                          >
                            <Play size={16} fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Recent History */}
            <section>
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Recent History</h3>
              <div className="bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                {sessionsLoading ? (
                  <div className="p-8 text-center animate-pulse text-[10px] font-bold uppercase text-gray-400">Loading history...</div>
                ) : sessions.length === 0 ? (
                  <div className="p-12 text-center">
                    <History size={32} className="mx-auto mb-4 text-gray-200" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                      No sessions recorded yet. <br />
                      Start a focus mode to see your data here!
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    {sessions.map((session, index) => (
                      <SessionItem key={`${session.id}-${index}`} session={session} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
