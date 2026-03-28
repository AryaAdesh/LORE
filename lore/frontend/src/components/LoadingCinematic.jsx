import { useState, useEffect } from 'react';

const MESSAGES = [
  "Planning your story arc...",
  "Crafting visuals for each scene...",
  "Writing narration scripts...",
  "Placing knowledge pins...",
  "Polishing the experience...",
  "Almost ready..."
]

export default function LoadingCinematic({ chapters, totalChapters, status, onComplete }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (status === 'ready') {
      setTimeout(onComplete, 600)
    }
  }, [status, onComplete])

  const progress = totalChapters > 0 ? (chapters.length / totalChapters) : 0

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#080810',
      backgroundImage: 'radial-gradient(ellipse 110% 70% at 50% 50%, rgba(124,106,247,0.035) 0%, transparent 80%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'fixed', inset: 0, zIndex: 200,
      fontFamily: "'Inter', 'Google Sans', -apple-system, sans-serif"
    }}>
      {/* Progress bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'rgba(255,255,255,0.04)'
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #7c6af7, #a78bfa, #818cf8)',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 12px rgba(124,106,247,0.4)'
        }} />
      </div>

      {/* LORE wordmark */}
      <div style={{
        fontSize: 72, fontWeight: 900, letterSpacing: '-0.03em',
        background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #6366f1 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: 40,
        lineHeight: 1.1
      }}>
        LORE
      </div>

      {/* Animated ring spinner */}
      <div style={{
        width: 44, height: 44,
        borderRadius: '50%',
        border: '2px solid rgba(124,106,247,0.1)',
        borderTop: '2px solid #7c6af7',
        animation: 'spin 1s linear infinite',
        marginBottom: 32,
        boxShadow: '0 0 16px rgba(124,106,247,0.15)'
      }} />

      {/* Status message */}
      <div style={{
        fontSize: 15, color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.04em', minHeight: 22,
        fontWeight: 400,
        transition: 'opacity 0.3s ease'
      }}>
        {status === 'error' ? (
          <span style={{ color: 'rgba(239,68,68,0.7)' }}>Something went wrong — please try again</span>
        ) : MESSAGES[msgIndex]}
      </div>

      {/* Chapter progress */}
      {totalChapters > 0 && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 12, color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: 600
          }}>
            {chapters.length} of {totalChapters} chapters
          </div>

          {/* Chapter dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: totalChapters }).map((_, i) => (
              <div key={i} style={{
                width: i < chapters.length ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i < chapters.length
                  ? 'linear-gradient(135deg, #7c6af7, #a78bfa)'
                  : 'rgba(255,255,255,0.08)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: i < chapters.length ? '0 0 8px rgba(124,106,247,0.3)' : 'none'
              }} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
