'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerDisplayProps {
  startTime: string;
  targetDurationMinutes: number;
  onComplete: () => void;
}

export function TimerDisplay({ startTime, targetDurationMinutes, onComplete }: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const onCompleteRef = useRef(onComplete);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the callback ref in sync without triggering re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Single stable effect for the countdown
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const targetEnd = start + targetDurationMinutes * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetEnd - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current();
      }
    };

    // Initial calculation
    tick();

    // Keep ticking every second
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Only restart if the timer's fundamental params change, not on every onComplete rebind
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, targetDurationMinutes]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="font-mono text-4xl font-black tracking-tighter text-white">
      {display}
    </div>
  );
}
