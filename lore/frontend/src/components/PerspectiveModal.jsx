import React, { useState } from 'react';

export default function PerspectiveModal({ isOpen, storyId, onClose, onStoryReplace }) {
  const [custom, setCustom] = useState('');
  
  if (!isOpen) return null;

  const handleApply = async (p) => {
    try {
      onStoryReplace({
        url: `http://localhost:8000/story/${storyId}/perspective`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, perspective: p })
      });
      onClose();
    } catch(e) {}
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" onClick={onClose}>
      <div className="bg-[#0f0f16] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl transform scale-100" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">Retell this story as...</h2>
        
        <div className="flex flex-wrap gap-3 mb-6">
          {['a 10-year-old', 'a Greek myth narrator', 'an electron', 'a documentary from 2150'].map(p => (
            <button key={p} onClick={() => handleApply(p)} className="px-4 py-2 bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/50 rounded-full text-purple-200 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40">
              {p}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Custom perspective..." 
            value={custom}
            onChange={e => setCustom(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500"
            onKeyDown={e => e.key === 'Enter' && custom && handleApply(custom)}
          />
          <button 
            disabled={!custom.trim()}
            onClick={() => handleApply(custom)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Transform Story
          </button>
        </div>
      </div>
    </div>
  );
}
