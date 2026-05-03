'use client';

import { useState, useEffect } from 'react';

interface TimerDisplayProps {
  startTime: string;
  targetDurationMinutes: number;
  onComplete: () => void;
}

export function TimerDisplay({ startTime, targetDurationMinutes, onComplete }: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<number>(targetDurationMinutes * 60);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const targetEnd = start + targetDurationMinutes * 60 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((targetEnd - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, targetDurationMinutes, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const seconds = timeLeft % 60;

  return (
    <div className="font-mono text-4xl font-black tracking-tighter text-white">
      {String(hours).padStart(2, '0')}:
      {String(remainingMinutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </div>
  );
}
