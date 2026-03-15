import React from 'react';

export const USDTGoldLogo = ({ className = "w-32 h-32" }: { className?: string }) => {
  return (
    <div className={`relative ${className} group`}>
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl group-hover:bg-yellow-500/40 transition-all duration-700" />
      
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        {/* Coin Base with Gradient */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDB933" />
            <stop offset="50%" stopColor="#F7931A" />
            <stop offset="100%" stopColor="#B87333" />
          </linearGradient>
          <radialGradient id="shine" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Rim */}
        <circle cx="100" cy="100" r="95" fill="url(#goldGradient)" stroke="#8B4513" strokeWidth="2" />
        <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Inner Circle */}
        <circle cx="100" cy="100" r="75" fill="url(#goldGradient)" stroke="#8B4513" strokeWidth="1" />
        
        {/* Tether Symbol (T) */}
        <path 
          d="M65 70H135V90H110V140H90V90H65V70Z" 
          fill="#50AF95" 
          className="drop-shadow-lg"
        />
        <ellipse cx="100" cy="95" rx="45" ry="12" stroke="#50AF95" strokeWidth="6" fill="none" />

        {/* Detail Circuitry Lines */}
        <path d="M150 100H175 M145 80H170 M145 120H170" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        
        {/* Reflective Shine Layer */}
        <circle cx="100" cy="100" r="95" fill="url(#shine)" pointerEvents="none" />
      </svg>
      
      {/* 3D Depth Effect */}
      <div className="absolute inset-0 rounded-full border-b-4 border-r-4 border-black/20 pointer-events-none" />
    </div>
  );
};
