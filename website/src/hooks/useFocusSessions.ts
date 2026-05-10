'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
  const { user, isGuest, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    // Wait for auth to initialize on first fetch
    if (authLoading && !hasFetchedRef.current) return;

    try {
      setLoading(true);

      if (isGuest) {
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
        setLoading(false);
        return;
      }

      if (!user) {
        setSessions([]);
        setActiveSession(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
      
      // Check for an active session
      const active = data?.find(s => s.status === 'active');
      setActiveSession(active || null);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      hasFetchedRef.current = true;
      setLoading(false);
    }
  }, [user, isGuest, authLoading]);

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
    if (!user && !isGuest) return;

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
      if (isGuest) {
        const newSession: FocusSession = {
          id: `local_${Math.random().toString(36).substring(2, 11)}`,
          user_id: 'guest',
          ...newSessionData,
          end_time: null,
          created_at: now
        };
        const updated = [newSession, ...sessions];
        setSessions(updated);
        setActiveSession(newSession);
        localStorage.setItem('guest_focus_sessions', JSON.stringify(updated));
        
        // Notify the content script for immediate sync
        window.dispatchEvent(new CustomEvent('ctrl-blck-sync', { 
            detail: { activeSession: newSession } 
        }));
        
        return newSession;
      }

      // Optimistic Update for authenticated users
      const optimisticSession: FocusSession = {
        id: `temp_${Date.now()}`,
        user_id: user?.id || '',
        ...newSessionData,
        end_time: null,
        created_at: now
      };

      setActiveSession(optimisticSession);
      setSessions(prev => [optimisticSession, ...prev]);

      // Notify the extension immediately with optimistic data
      window.dispatchEvent(new CustomEvent('ctrl-blck-sync', { 
          detail: { activeSession: optimisticSession } 
      }));

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert([{ ...newSessionData, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;
      
      // Update with the real data from Supabase (to get the real ID and timestamps)
      setActiveSession(data);
      setSessions(prev => prev.map(s => s.id === optimisticSession.id ? data : s));
      
      // Re-dispatch with final data if needed (usually optimistic is enough for the timer)
      window.dispatchEvent(new CustomEvent('ctrl-blck-sync', { 
          detail: { activeSession: data } 
      }));
      
      return data;
    } catch (error) {
      console.error('Error starting session:', error);
      // Rollback on error
      setActiveSession(previousActiveSession);
      setSessions(prev => prev.filter(s => !s.id.startsWith('temp_')));
      throw error;
    }
  };

  const endSession = async (sessionId: string, status: 'completed' | 'cancelled' = 'completed') => {
    try {
      if (isGuest) {
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
      }

      const { data, error } = await supabase
        .from('focus_sessions')
        .update({
          status,
          end_time: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      setActiveSession(null);
      setSessions(prev => prev.map(s => (s.id === sessionId ? data : s)));
      
      // Notify the content script for immediate sync
      window.dispatchEvent(new CustomEvent('ctrl-blck-sync'));
      
      return data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  };

  const getStats = (range: StatsRange) => {
    const now = new Date();
    const filteredSessions = sessions.filter(s => {
      if (s.status !== 'completed') return false;
      const sessionDate = new Date(s.start_time);
      
      if (range === 'today') {
        return sessionDate.toDateString() === now.toDateString();
      } else if (range === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      }
      return true; // all-time
    });

    const totalSessions = filteredSessions.length;
    const totalMinutes = filteredSessions.reduce((acc, s) => {
      if (s.end_time) {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        return acc + Math.floor((end - start) / 60000);
      }
      return acc;
    }, 0);

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
