import React from 'react';

export default function PromptEnrichPreview({ enrichResult, onConfirm, onBack }) {
  const [brief, setBrief] = React.useState(enrichResult.enriched_brief);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#080810] text-white">
      <div className="animate-in fade-in zoom-in duration-500 max-w-2xl w-full">
        <div className="text-gray-400 mb-2 uppercase tracking-wide text-sm">LORE understood your topic as:</div>
        <h1 className="text-4xl font-bold mb-6">{enrichResult.enriched_topic}</h1>
        
        {enrichResult.suggested_perspective && (
          <div className="inline-block px-3 py-1 bg-purple-900/50 text-purple-200 border border-purple-700/50 rounded-full mb-6 text-sm">
            Told as: {enrichResult.suggested_perspective}
          </div>
        )}
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 cursor-text">
          <div className="text-sm text-gray-400 mb-2">Story brief</div>
          <textarea
            className="w-full bg-transparent border-none outline-none resize-none text-gray-200 leading-relaxed min-h-[120px]"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => onConfirm(brief)}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white font-medium flex-1 transition-all shadow-lg shadow-purple-900/20"
          >
            ✦ Begin Story
          </button>
          <button 
            onClick={onBack}
            className="px-8 py-3 border border-white/20 hover:bg-white/5 rounded-lg text-white font-medium transition-colors"
          >
            ← Change topic
          </button>
        </div>
      </div>
    </div>
  );
}
