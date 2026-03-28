import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PromptEnrichPreview from './PromptEnrichPreview';
import { useStoryStore } from '../store/storyStore';
import { PERSONAS } from '../constants/personas';

export default function LandingPage() {
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
    "How CRISPR edits a genome",
    "Walk me through the French Revolution",
    "How does the internet work?"
  ];

  const recognitionRef = useRef(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setPlaceholder(placeholders[i]);
    }, 3000);
    setPlaceholder(placeholders[0]);
    return () => clearInterval(interval);
  }, []);

  // Handle Speech Recognition for the mic button
  useEffect(() => {
    if (isRecording) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition. Please try Chrome or Safari.");
        setIsRecording(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      let baseTranscript = rawInput.trim();

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalSegment = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSegment += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalSegment) {
          baseTranscript += (baseTranscript ? ' ' : '') + finalSegment;
        }
        setRawInput(baseTranscript + (interimTranscript ? ' ' + interimTranscript : ''));
      };

      recognition.onerror = (e) => {
        console.error("Speech recognition error:", e);
        if (e.error !== 'no-speech') setIsRecording(false);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
    } else {
      if (recognitionRef.current) recognitionRef.current.stop();
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [isRecording]);

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
    } catch (e) { console.error(e) }
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
      style={{
        minHeight: '100vh',
        background: '#080810',
        backgroundImage: 'radial-gradient(ellipse 140% 100% at 50% -30%, rgba(124,106,247,0.02) 0%, transparent 80%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: "'Inter', 'Google Sans', -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}
    >

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: 80,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          marginBottom: 4,
          background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #6366f1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1
        }}>LORE</h1>
        <p style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.35)',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 16
        }}>Live, Orchestrated, Reactive Encyclopaedia</p>
        <p style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.45)',
          fontWeight: 300,
          letterSpacing: '0.06em'
        }}>See it. Hear it. Understand it.</p>
      </div>

      {/* Main input card */}
      <div style={{
        width: '100%',
        maxWidth: 640,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '32px 28px 24px',
        marginBottom: 28,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 1
      }}>
        <textarea
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: 22,
            color: 'white',
            fontWeight: 400,
            lineHeight: 1.5,
            minHeight: 100,
            fontFamily: 'inherit'
          }}
          placeholder={placeholder}
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleEnrich();
            }
          }}
        />

        {/* Mic button */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 20px' }}>
          <button
            onClick={() => setIsRecording(!isRecording)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 24px',
              borderRadius: 100,
              border: isRecording
                ? '1px solid rgba(239,68,68,0.5)'
                : '1px solid rgba(255,255,255,0.12)',
              background: isRecording
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(255,255,255,0.04)',
              color: isRecording ? '#f87171' : 'rgba(255,255,255,0.55)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              animation: isRecording ? 'pulse 1.5s ease infinite' : 'none',
              boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.2)' : 'none'
            }}
          >
            <span style={{ fontSize: 18 }}>🎤</span>
            {isRecording ? "Listening..." : "Click to speak"}
          </button>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)',
          marginBottom: 16
        }} />

        {/* Perspective input */}
        <input
          type="text"
          placeholder="Tell it as... (optional, e.g. a Greek myth narrator)"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '14px 18px',
            fontSize: 14,
            color: 'white',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s ease'
          }}
          value={perspective}
          onChange={e => setPerspective(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(124,106,247,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
      </div>

      {/* CTA Button */}
      <button
        onClick={handleEnrich}
        disabled={loading || !rawInput.trim()}
        style={{
          padding: '16px 48px',
          background: loading ? 'rgba(124,106,247,0.3)' : 'linear-gradient(135deg, #7c6af7 0%, #6366f1 100%)',
          border: 'none',
          borderRadius: 100,
          color: 'white',
          fontSize: 17,
          fontWeight: 600,
          cursor: loading || !rawInput.trim() ? 'not-allowed' : 'pointer',
          opacity: !rawInput.trim() ? 0.4 : 1,
          transition: 'all 0.25s ease',
          boxShadow: rawInput.trim() && !loading
            ? '0 4px 24px rgba(124,106,247,0.35), 0 0 0 1px rgba(124,106,247,0.2)'
            : 'none',
          transform: rawInput.trim() && !loading ? 'scale(1)' : 'scale(0.98)',
          letterSpacing: '0.02em',
          position: 'relative',
          zIndex: 1
        }}
        onMouseEnter={e => { if (rawInput.trim() && !loading) e.target.style.transform = 'scale(1.04)' }}
        onMouseLeave={e => { e.target.style.transform = rawInput.trim() && !loading ? 'scale(1)' : 'scale(0.98)' }}
      >
        {loading ? "Thinking..." : "Begin Story ✦"}
      </button>

      {/* Narrator selector */}
      <div style={{ marginTop: 36, width: '100%', maxWidth: 640, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 10, color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: 16, textAlign: 'center', fontWeight: 600
        }}>
          Choose your narrator
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PERSONAS.map(persona => (
            <button
              key={persona.id}
              onClick={() => setPersona(persona.id)}
              title={persona.description}
              style={{
                background: currentPersona === persona.id
                  ? 'rgba(124,106,247,0.18)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${currentPersona === persona.id
                  ? 'rgba(124,106,247,0.6)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                transition: 'all 0.2s ease', minWidth: 90,
                transform: currentPersona === persona.id ? 'translateY(-2px)' : 'none',
                boxShadow: currentPersona === persona.id
                  ? '0 4px 16px rgba(124,106,247,0.15)' : 'none'
              }}
            >
              <span style={{ fontSize: 22 }}>{persona.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: currentPersona === persona.id ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                letterSpacing: '0.02em'
              }}>
                {persona.label}
              </span>
              {currentPersona === persona.id && (
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                  boxShadow: '0 0 6px rgba(167,139,250,0.6)'
                }} />
              )}
            </button>
          ))}
        </div>
        <div style={{
          textAlign: 'center', marginTop: 12, fontSize: 12,
          color: 'rgba(255,255,255,0.25)', minHeight: 18, fontStyle: 'italic'
        }}>
          {PERSONAS.find(p => p.id === currentPersona)?.description}
        </div>
      </div>

      {/* Footer Quote */}
      <div style={{
        marginTop: 48,
        padding: '0 32px',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        textAlign: 'center',
        width: '100%',
        maxWidth: 640,
        position: 'relative',
        zIndex: 1,
        fontStyle: 'italic',
        letterSpacing: '0.02em',
        lineHeight: 1.6
      }}>
        "Deep down, we are all storytellers. LORE just gives us the engine to make those stories come alive."
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        textarea::placeholder {
          color: rgba(255,255,255,0.2);
          transition: opacity 0.4s ease;
        }
        input::placeholder {
          color: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  );
}
