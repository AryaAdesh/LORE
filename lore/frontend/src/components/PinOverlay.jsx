import React, { useRef, useState } from 'react';

export default function PinOverlay({ pins, onPinClick }) {
  const containerRef = useRef(null);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [loadingPinId, setLoadingPinId] = useState(null);

  const handleClick = (pin) => {
    setLoadingPinId(pin.id);
    onPinClick(pin);
  };

  return (
    <div className="absolute inset-0 pointer-events-none" ref={containerRef}>
      <style>{`
        @keyframes pulse-pin {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.8)); }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .pin-pulse { animation: pulse-pin 2s infinite ease-in-out; }
      `}</style>
      {pins.map((pin, i) => {
        const x = pin.x_pct * 100;
        const y = pin.y_pct * 100;
        const delay = i * 300;
        const isHovered = hoveredPin === pin.id;
        const isLoading = loadingPinId === pin.id;

        return (
          <div 
            key={pin.id}
            className="absolute pointer-events-auto"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setHoveredPin(pin.id)}
            onMouseLeave={() => setHoveredPin(null)}
          >
            <button 
              onClick={() => handleClick(pin)}
              className="relative w-8 h-8 flex items-center justify-center group outline-none"
              style={{ animationDelay: `${delay}ms` }}
            >
              <div className="absolute w-4 h-4 bg-white/80 rounded-full pin-pulse group-hover:bg-white transition-colors" />
              {isLoading && (
                <svg className="animate-spin relative -top-6 w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
            
            <div 
              className={`absolute top-0 -translate-y-[calc(100%+16px)] w-64 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 pointer-events-none transition-all duration-300 origin-bottom ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              style={{
                left: pin.x_pct > 0.7 ? 'auto' : '50%',
                right: pin.x_pct > 0.7 ? '0' : 'auto',
                transform: pin.x_pct > 0.7 ? 'translateY(-100%)' : 'translate(-50%, -100%)',
                marginTop: '-16px'
              }}
            >
              <div className="font-bold text-white text-sm mb-1">{pin.label}</div>
              <div className="text-xs text-gray-300 leading-snug">{pin.teaser}</div>
              <div 
                className="absolute bottom-0 translate-y-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-black/60" 
                style={{
                  left: pin.x_pct > 0.7 ? 'auto' : '50%',
                  right: pin.x_pct > 0.7 ? '12px' : 'auto',
                  transform: pin.x_pct > 0.7 ? 'none' : 'translateX(-50%)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
