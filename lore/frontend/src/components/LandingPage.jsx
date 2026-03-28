import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PromptEnrichPreview from './PromptEnrichPreview';
import { useStoryStore } from '../store/storyStore';
import { PERSONAS } from '../constants/personas';

export default function LandingPage() {
  const [tab, setTab] = useState('type');
  const [rawInput, setRawInput] = useState('');
  const [perspective, setPerspective] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const enrichResult = useStoryStore(s => s.enrichResult);
  const setEnrichResult = useStoryStore(s => s.setEnrichResult);
  const setStreamUrl = useStoryStore(s => s.setStreamUrl);
  const currentPersona = useStoryStore(s => s.currentPersona);
  const setPersona = useStoryStore(s => s.setPersona);
  const navigate = useNavigate();

  const placeholders = [
    "The death of a star", 
    "How CRISPR edits DNA", 
    "The French Revolution", 
    "How the internet works"
  ];
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setPlaceholder(placeholders[i]);
    }, 3000);
    setPlaceholder(placeholders[0]);
    return () => clearInterval(interval);
  }, []);

  const handleEnrich = async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/prompt/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: rawInput })
      });
      const data = await res.json();
      setEnrichResult(data);
    } catch(e) { console.error(e) }
    setLoading(false);
  };

  const startStory = async (finalBrief) => {
    setStreamUrl({
        url: 'http://localhost:8000/story/create',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: finalBrief, perspective: perspective || null })
    });
    navigate('/story/new');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const formData = new FormData();
      formData.append('file', file);
      setStreamUrl({
        url: 'http://localhost:8000/story/upload-pdf',
        method: 'POST',
        body: formData
      });
      navigate('/story/new');
    }
  };

  if (enrichResult) {
    return <PromptEnrichPreview 
      enrichResult={enrichResult} 
      onConfirm={startStory} 
      onBack={() => setEnrichResult(null)} 
    />
  }

  return (
    <div 
      className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center p-8 transition-all"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="text-center mb-12">
        <h1 className="text-7xl font-black tracking-tighter mb-4 bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">LORE</h1>
        <p className="text-xl text-gray-400 font-light">See it. Hear it. Understand it.</p>
      </div>

      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-2 mb-8 backdrop-blur-md">
        <div className="flex border-b border-white/10 mb-4">
          <button className={`flex-1 py-3 font-medium transition-colors ${tab==='type'?'text-white border-b-2 border-purple-500':'text-gray-500 hover:text-gray-300'}`} onClick={() => setTab('type')}>Type</button>
          <button className={`flex-1 py-3 font-medium transition-colors ${tab==='speak'?'text-white border-b-2 border-purple-500':'text-gray-500 hover:text-gray-300'}`} onClick={() => setTab('speak')}>Speak</button>
        </div>

        <div className="p-4">
          {tab === 'type' ? (
            <textarea 
              className="w-full bg-transparent border-none outline-none resize-none text-2xl mb-4 placeholder:text-gray-600 min-h-[100px]"
              placeholder={placeholder}
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
            />
          ) : (
             <div className="min-h-[100px] flex flex-col items-center justify-center">
              <button 
                onClick={() => setIsRecording(!isRecording)} 
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 hover:bg-white/20'}`}
              >
                🎤
              </button>
              <div className="mt-4 text-gray-400">{isRecording ? "Listening..." : "Click to speak"}</div>
            </div>
          )}
          
          <input 
            type="text" 
            placeholder="Tell it as... (optional, e.g. a Greek myth narrator)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mt-4 text-sm outline-none focus:border-purple-500 transition-colors"
            value={perspective}
            onChange={e => setPerspective(e.target.value)}
          />
        </div>
      </div>

      <button 
        onClick={handleEnrich}
        disabled={loading || !rawInput.trim()}
        className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-full text-lg font-medium shadow-lg shadow-purple-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
      >
        {loading ? "Thinking..." : "Begin Story ✦"}
      </button>

      <div style={{ marginTop: 28, marginBottom: 4, width: '100%', maxWidth: 672 }}>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          marginBottom: 14, textAlign: 'center'
        }}>
          Choose your narrator
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PERSONAS.map(persona => (
            <button
              key={persona.id}
              onClick={() => setPersona(persona.id)}
              title={persona.description}
              style={{
                background: currentPersona === persona.id
                  ? 'rgba(124,106,247,0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${currentPersona === persona.id
                  ? 'rgba(124,106,247,0.8)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease', minWidth: 96
              }}
            >
              <span style={{ fontSize: 20 }}>{persona.icon}</span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: currentPersona === persona.id ? '#a78bfa' : 'rgba(255,255,255,0.65)'
              }}>
                {persona.label}
              </span>
              {currentPersona === persona.id && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa' }} />
              )}
            </button>
          ))}
        </div>
        <div style={{
          textAlign: 'center', marginTop: 10, fontSize: 12,
          color: 'rgba(255,255,255,0.3)', minHeight: 16
        }}>
          {PERSONAS.find(p => p.id === currentPersona)?.description}
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-600 border border-dashed border-gray-700 rounded-xl p-6 text-center w-full max-w-2xl bg-white/[0.02]">
        Or drop a PDF here to narrate a document
      </div>
    </div>
  );
}
