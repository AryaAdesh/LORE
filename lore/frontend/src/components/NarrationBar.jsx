import { useNarration } from '../hooks/useNarration'
import { PERSONA_LABELS } from '../constants/personas'

export default function NarrationBar({
  chapter,
  storyId,
  isLiveActive,
  isLiveConnecting,
  onToggleLive,
  liveTranscript,
  liveError,
  currentPersona
}) {
  // TTS runs whenever Gemini Live is not active — this is the fallback/primary for text+audio
  const { isSpeaking, pause, resume, charIndex } = useNarration(
    chapter?.narration_script,
    true,
    !isLiveActive && !isLiveConnecting  // enable TTS whenever Live is off (error or not)
  )

  // Text to show: Live transcript streams in word-by-word, otherwise TTS charIndex slice
  const visibleText = (isLiveActive && liveTranscript)
    ? liveTranscript
    : chapter?.narration_script?.slice(0, charIndex + 1) || ''

  return (
    <>
      {/* ── Lower-third: bottom-left, text on gradient, no card ── */}
      <div style={{
        position: 'fixed',
        bottom: 72, left: 40,
        maxWidth: 620,
        zIndex: 40,
        pointerEvents: 'none',
        animation: 'lower-third-in 0.5s ease'
      }}>
        {/* Persona + chapter label */}
        <div style={{
          fontSize: 11,
          color: isLiveActive ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.35)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 6,
          fontWeight: 500,
          transition: 'color 0.4s ease'
        }}>
          {PERSONA_LABELS[currentPersona] || 'Documentary'} narrator
          {isLiveConnecting && (
            <span style={{ marginLeft: 10, color: '#7c6af7' }}>
              {'◉ connecting'}
            </span>
          )}
        </div>

        {/* Chapter title */}
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.55)',
          fontWeight: 600,
          letterSpacing: '0.02em',
          marginBottom: 10
        }}>
          {chapter?.title}
        </div>

        {/* Narration text — word-by-word */}
        <div style={{
          fontSize: 20,
          color: 'white',
          lineHeight: 1.55,
          fontWeight: 400,
          maxWidth: 580,
          textShadow: '0 2px 12px rgba(0,0,0,0.9)',
          minHeight: 62
        }}>
          {isLiveConnecting ? (
            <span style={{ color: 'rgba(167,139,250,0.6)', fontSize: 16 }}>
              Preparing narrator...
            </span>
          ) : visibleText}
        </div>
      </div>

      {/* ── Controls: bottom-right, minimal ── */}
      <div style={{
        position: 'fixed',
        bottom: 72, right: 24,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8
      }}>
        <button
          onClick={onToggleLive}
          style={{
            background: isLiveActive
              ? 'rgba(124,106,247,0.2)'
              : 'rgba(0,0,0,0.5)',
            border: `1px solid ${isLiveActive
              ? 'rgba(124,106,247,0.6)'
              : 'rgba(255,255,255,0.15)'}`,
            color: isLiveActive ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
            borderRadius: 20,
            padding: '7px 16px',
            fontSize: 12, cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isLiveConnecting ? '#7c6af7'
              : isLiveActive ? '#a78bfa'
              : 'rgba(255,255,255,0.25)',
            animation: (isLiveConnecting || isLiveActive)
              ? 'pulse-pin 1s ease infinite' : 'none'
          }} />
          {isLiveConnecting ? 'Connecting...'
            : isLiveActive ? 'Pause narrator'
            : 'Resume narrator'}
        </button>

        {/* TTS fallback controls — only visible when Live is off and tts is speaking */}
        {!isLiveActive && !isLiveConnecting && isSpeaking !== undefined && (
          <button
            onClick={isSpeaking ? pause : resume}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)',
              borderRadius: 20, padding: '5px 14px',
              fontSize: 11, cursor: 'pointer',
              backdropFilter: 'blur(8px)'
            }}
          >
            {isSpeaking ? '⏸ Pause' : '▶ Play'}
          </button>
        )}
      </div>
    </>
  )
}
