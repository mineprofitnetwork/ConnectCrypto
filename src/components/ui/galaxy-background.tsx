'use client';

import React, { useState, useEffect } from 'react';

/**
 * A reusable galaxy stars background component.
 * Positioned fixed behind all content.
 * Generates stars on the client-side to avoid hydration mismatches.
 */
interface Star {
  id: number;
  top: string;
  left: string;
  size: string;
  opacity: number;
  duration: number;
  delay: number;
}

export function GalaxyBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate stars only on the client after initial hydration
    const generatedStars = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() > 0.8 ? 'w-1 h-1' : 'w-0.5 h-0.5',
      opacity: 0.1 + Math.random() * 0.4,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 5,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] bg-[#050505] overflow-hidden pointer-events-none">
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-white ${star.size}`}
            style={{
              top: star.top,
              left: star.left,
              opacity: star.opacity,
              animation: `pulse ${star.duration}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] opacity-10" />

      {/* Moon Surface Visual Layer */}
      <div className="absolute bottom-0 left-0 w-full h-[300px] pointer-events-none overflow-hidden select-none">
        {/* Main Lunar Curve */}
        <div className="absolute bottom-[-150px] left-[-10%] w-[120%] h-[400px] bg-gradient-to-t from-[#151515] via-[#0a0a0a] to-transparent rounded-[100%] border-t border-white/5 shadow-[0_-20px_50px_rgba(255,255,255,0.02)]" />
        
        {/* Lunar Craters & Texture */}
        <div className="absolute bottom-[20px] left-[15%] w-24 h-12 bg-black/40 rounded-full blur-md transform -rotate-12 opacity-40 border border-white/5" />
        <div className="absolute bottom-[40px] left-[45%] w-32 h-16 bg-black/30 rounded-full blur-lg opacity-30 border border-white/5" />
        <div className="absolute bottom-[10px] left-[70%] w-20 h-10 bg-black/50 rounded-full blur-sm transform rotate-6 opacity-50 border border-white/5" />
        
        {/* Distant Lunar Hills */}
        <div className="absolute bottom-[-20px] left-0 w-full h-24 bg-gradient-to-t from-black to-transparent opacity-80" />
        
        {/* Surface Glow/Atmosphere */}
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-primary/5 to-transparent opacity-20" />
      </div>
    </div>
  );
}
