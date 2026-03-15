'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * A real-time timer component that displays Indian Standard Time (IST).
 * Uses useEffect to avoid hydration mismatches.
 */
export function ISTTimer() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Avoid hydration mismatch by not rendering anything on the server
  if (!time) return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full opacity-20">
      <Clock className="w-3 h-3" />
      <span className="text-[9px] font-bold font-mono uppercase tracking-widest">IST --:--:--</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full animate-in fade-in duration-500">
      <Clock className="w-3 h-3 text-primary animate-pulse" />
      <span className="text-[9px] font-bold font-mono text-white/70 uppercase tracking-widest">
        IST {time}
      </span>
    </div>
  );
}
