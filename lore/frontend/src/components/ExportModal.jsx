import React, { useState } from 'react';

export default function ExportModal({ isOpen, storyId, storyTopic, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleExport = async (type) => {
    setLoading(type);
    try {
      const res = await fetch(`http://localhost:8000/story/${storyId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, export_type: type })
      });
      const data = await res.json();
      setResult(data);
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">✕</button>
        <h2 className="text-3xl font-bold text-white mb-2">Export your story</h2>
        <p className="text-gray-400 mb-8">{storyTopic}</p>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="text-xl font-bold text-white mb-2">Presentation Deck</h3>
            <p className="text-sm text-gray-400 mb-6 flex-1">Export scenes and narration as a visual slide deck.</p>
            {result?.export_type === 'slides' ? (
              <a href={`http://localhost:8000${result.url}`} download className="w-full py-3 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors block font-medium">
                Download Interactive Slides ↓
              </a>
            ) : (
              <button onClick={() => handleExport('slides')} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                {loading === 'slides' ? 'Generating...' : 'Download PowerPoint (.pptx)'}
              </button>
            )}
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-white mb-2">Study Guide</h3>
            <p className="text-sm text-gray-400 mb-6 flex-1">Export a rich document with narration and drill-down concepts.</p>
            {result?.export_type === 'docs' ? (
              <a href={`http://localhost:8000${result.url}`} download className="w-full py-3 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors block font-medium">
                Download .docx ↓
              </a>
            ) : (
              <button onClick={() => handleExport('docs')} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                {loading === 'docs' ? 'Generating...' : 'Download Document (.docx)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
