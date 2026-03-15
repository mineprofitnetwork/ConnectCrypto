import React from 'react';

export const USDTOriginalLogo = ({ className = "w-32 h-32" }: { className?: string }) => {
  return (
    <div className={`relative ${className} group`}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Tether Green Background */}
        <circle cx="100" cy="100" r="100" fill="#26A17B" />
        
        {/* Inner White Ring */}
        <circle cx="100" cy="100" r="85" stroke="white" strokeWidth="2" strokeOpacity="0.2" fill="none" />

        {/* Tether Symbol (T) */}
        <path 
          d="M60 60H140V85H115V150H85V85H60V60Z" 
          fill="white" 
        />
        <ellipse cx="100" cy="90" rx="55" ry="15" stroke="white" strokeWidth="8" fill="none" />
      </svg>
    </div>
  );
};
