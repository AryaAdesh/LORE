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
  currentPersona,
  onNarrationEnd // Pass this prop from StoryPlayer
}) {
  // TTS runs whenever Gemini Live is not active — this is the fallback/primary for text+audio
  const { isSpeaking, pause, resume, charIndex } = useNarration(
    chapter?.narration_script,
    true,
    !isLiveActive && !isLiveConnecting,  // enable TTS whenever Live is off (error or not)
    onNarrationEnd // Hook onto the onEnd event of the TTS to tell StoryPlayer to advance
  )

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 300,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
        zIndex: 39,
        pointerEvents: 'none'
      }} />
      
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
          color: isLiveActive ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.8)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 6,
          fontWeight: 600,
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
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
          fontSize: 24,
          color: 'rgba(255,255,255,0.95)',
          fontWeight: 700,
          letterSpacing: '0.02em',
          marginBottom: 10,
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          {chapter?.title}
        </div>

        <div style={{
          fontSize: 18,
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
          ) : (isLiveActive && liveTranscript) ? (
            <span style={{ color: 'white' }}>{liveTranscript}</span>
          ) : (
            <>
              <span style={{ color: 'white' }}>
                {chapter?.narration_script?.slice(0, Math.max(0, charIndex + 1))}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)', transition: 'color 0.1s ease' }}>
                {chapter?.narration_script?.slice(Math.max(0, charIndex + 1))}
              </span>
            </>
          )}
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
              : 'rgba(255,255,255,0.2)'}`,
            color: isLiveActive ? '#c4b5fd' : 'white',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13, cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
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
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', gap: 7,
              whiteSpace: 'nowrap'
            }}
          >
            {isSpeaking ? '⏸ Pause' : '▶ Play'}
          </button>
        )}
      </div>
    </>
  )
}
