import { useState, useEffect } from 'react';

const MESSAGES = [
  "Planning your story arc...",
  "Generating visuals...",
  "Writing narration...",
  "Placing spatial pins...",
  "Almost ready..."
]

export default function LoadingCinematic({ chapters, totalChapters, status, onComplete }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 2200)
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
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'fixed', inset: 0, zIndex: 200
    }}>
      {/* Progress bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'rgba(255,255,255,0.06)'
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #7c6af7, #a78bfa)',
          transition: 'width 0.6s ease'
        }} />
      </div>

      {/* LORE wordmark */}
      <div style={{
        fontSize: 64, fontWeight: 700, letterSpacing: '0.15em',
        background: 'linear-gradient(135deg, #ffffff 0%, #7c6af7 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: 32
      }}>
        LORE
      </div>

      {/* Spinner */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid rgba(124,106,247,0.2)',
        borderTop: '2px solid #7c6af7',
        animation: 'spin 0.8s linear infinite',
        marginBottom: 24
      }} />

      {/* Status message */}
      <div style={{
        fontSize: 14, color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.05em', minHeight: 20,
        animation: 'fade-in 0.4s ease'
      }}>
        {status === 'error' ? 'Something went wrong — please try again' : MESSAGES[msgIndex]}
      </div>

      {/* Chapter count */}
      {totalChapters > 0 && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 12 }}>
          {chapters.length} of {totalChapters} chapters ready
        </div>
      )}
    </div>
  )
}
