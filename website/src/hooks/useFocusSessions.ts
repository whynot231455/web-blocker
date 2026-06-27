'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { sanitizeUrl } from '@/lib/url';

export interface FocusSession {
  id: string;
  user_id: string;
  url: string;
  start_time: string;
  end_time?: string | null;
  target_duration: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export type StatsRange = 'today' | 'week' | 'all-time';

export function useFocusSessions() {
  const { isGuest, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    // Wait for auth to initialize on first fetch
    if (authLoading && !hasFetchedRef.current) return;

    try {
      setLoading(true);

      if (!isGuest) {
        setSessions([]);
        setActiveSession(null);
        setLoading(false);
        return;
      }

      let parsed = [];
      try {
        const localData = localStorage.getItem('guest_focus_sessions');
        parsed = localData ? JSON.parse(localData) : [];
      } catch (e) {
        console.error('Failed to parse guest sessions:', e);
      }

      setSessions(parsed);
      const active = parsed.find((s: FocusSession) => s.status === 'active');
      setActiveSession(active || null);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      hasFetchedRef.current = true;
      setLoading(false);
    }
  }, [isGuest, authLoading]);

  useEffect(() => {
    fetchSessions();

    // Listen for sync events from the extension or other tabs
    window.addEventListener('ctrl-blck-sync', fetchSessions as EventListener);
    window.addEventListener('ctrl-blck-ui-refresh', fetchSessions as EventListener);

    return () => {
      window.removeEventListener('ctrl-blck-sync', fetchSessions as EventListener);
      window.removeEventListener('ctrl-blck-ui-refresh', fetchSessions as EventListener);
    };
  }, [fetchSessions]);


  const startSession = async (url: string, durationMinutes: number) => {
    if (!isGuest) return;

    const normalizedUrl = sanitizeUrl(url);
    const now = new Date().toISOString();

    const newSessionData = {
      url: normalizedUrl,
      target_duration: durationMinutes,
      status: 'active' as const,
      start_time: now,
    };

    // Store the previous active session to rollback if needed
    const previousActiveSession = activeSession;

    try {
      const newSession: FocusSession = {
        id: `local_${Math.random().toString(36).substring(2, 11)}`,
        user_id: 'guest',
        ...newSessionData,
        end_time: null,
        created_at: now
      };
      const updated = [newSession, ...sessions];
      setActiveSession(newSession);
      setSessions(updated);
      localStorage.setItem('guest_focus_sessions', JSON.stringify(updated));

      // Notify the content script for immediate sync
      window.dispatchEvent(new CustomEvent('ctrl-blck-sync', {
        detail: { activeSession: newSession }
      }));

      return newSession;
    } catch (error) {
      console.error('Error starting session:', error);
      // Rollback on error
      setActiveSession(previousActiveSession);
      throw error;
    }
  };

  const endSession = async (sessionId: string, status: 'completed' | 'cancelled' = 'completed') => {
      try {
      const updated = sessions.map(s =>
        s.id === sessionId
          ? { ...s, status, end_time: new Date().toISOString() }
          : s
      );
      setSessions(updated);
      setActiveSession(null);
      localStorage.setItem('guest_focus_sessions', JSON.stringify(updated));
      
      // Notify the content script for immediate sync
      window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
      
      return updated.find(s => s.id === sessionId);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  };

  const getStats = (range: StatsRange) => {
    const now = new Date();
    const inRange = (sessionDate: Date) => {
      if (range === 'today') {
        return sessionDate.toDateString() === now.toDateString();
      } else if (range === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      }
      return true; // all-time
    };

    const completedSessions = sessions.filter(s => s.status === 'completed' && inRange(new Date(s.start_time)));
    const activeInRange = activeSession && inRange(new Date(activeSession.start_time));

    const totalSessions = completedSessions.length + (activeInRange ? 1 : 0);

    const completedMinutes = completedSessions.reduce((acc, s) => {
      if (s.end_time) {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        return acc + Math.floor((end - start) / 60000);
      }
      return acc;
    }, 0);

    // If there's an active session, include its live elapsed minutes
    const activeMinutes = activeInRange
      ? Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 60000)
      : 0;

    const totalMinutes = completedMinutes + activeMinutes;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const focusTimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const lastActive = sessions.length > 0 
      ? new Date(sessions[0].start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : 'Never';

    return { totalSessions, focusTimeStr, lastActive };
  };

  return {
    sessions,
    loading,
    activeSession,
    startSession,
    endSession,
    getStats,
    refreshSessions: fetchSessions
  };
}
