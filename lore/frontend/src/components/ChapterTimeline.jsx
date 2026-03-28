import React from 'react';

export default function ChapterTimeline({ chapters, currentIndex, totalExpected, onSelect }) {
  const dots = [];
  
  for (let i = 0; i < totalExpected; i++) {
    const isLoaded = i < chapters?.length;
    const isCurrent = i === currentIndex;
    
    dots.push(
      <div key={i} className="relative group cursor-pointer p-2 -m-2" onClick={() => isLoaded && onSelect(i)}>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isCurrent ? 'w-3 h-3 bg-white shadow-[0_0_10px_white]' : isLoaded ? 'bg-white/60 hover:bg-white/80' : 'bg-white/20'}`} />
        {!isLoaded && (
          <div className="absolute inset-0 m-auto w-2 h-2 bg-transparent border border-white/40 rounded-full animate-ping pointer-events-none" />
        )}
        {isLoaded && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur text-xs text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
            {chapters[i].title}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20 bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full border border-white/5">
      {dots}
    </div>
  );
}
