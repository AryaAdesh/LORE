import { useState, useEffect } from 'react'
import { useStoryStream } from '../hooks/useStoryStream'
import { useNarration } from '../hooks/useNarration'
import PinOverlay from './PinOverlay'
import ChapterTimeline from './ChapterTimeline'

export default function DrillDownPanel({ isOpen, streamUrl, onClose, parentChapterTitle }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { chapters, status, storyId, totalChapters } = useStoryStream(
    isOpen && streamUrl ? streamUrl : null
  )
  const currentChapter = chapters[currentIndex]
  const { isSpeaking, pause, resume } = useNarration(
    currentChapter?.narration_script, true, isOpen
  )

  useEffect(() => { setCurrentIndex(0) }, [streamUrl])

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0,
      width: 420, zIndex: 100,
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 420ms cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'rgba(8, 8, 20, 0.96)',
      backdropFilter: 'blur(24px)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.6)'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', cursor: 'pointer', borderRadius: 8,
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0
        }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Drill-down from · {parentChapterTitle}
          </div>
          <div style={{ fontSize: 14, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chapters[0]?.title || (status === 'generating' ? 'Generating...' : 'Drill-down')}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', borderRadius: 6,
          padding: '4px 10px', fontSize: 12, flexShrink: 0
        }}>✕</button>
      </div>

      {/* Image area — contained, not fixed */}
      <div style={{ position: 'relative', height: 220, flexShrink: 0, background: '#0a0a14', overflow: 'hidden' }}>
        {status === 'generating' && chapters.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '2px solid rgba(124,106,247,0.3)',
              borderTopColor: '#7c6af7',
              animation: 'spin 0.8s linear infinite'
            }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Generating drill-down...</div>
          </div>
        )}
        {currentChapter?.image_url && (
          <img
            key={currentChapter.id}
            src={currentChapter.image_url}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              animation: 'chapter-fade-in 0.6s ease'
            }}
            alt={currentChapter.title}
          />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 60%, rgba(8,8,20,0.95) 100%)'
        }} />
        {/* Chapter title overlay */}
        {currentChapter && (
          <div style={{
            position: 'absolute', bottom: 10, left: 14, right: 14,
            fontSize: 14, fontWeight: 700, color: 'white',
            textShadow: '0 1px 8px rgba(0,0,0,0.8)'
          }}>
            {currentChapter.title}
          </div>
        )}
      </div>

      {/* Narration text */}
      {currentChapter && (
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7,
            maxHeight: 120, overflowY: 'auto'
          }} className="custom-scrollbar">
            {currentChapter.narration_script}
          </div>
          {/* TTS controls */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={isSpeaking ? pause : resume}
              style={{
                background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.3)',
                color: '#a78bfa', borderRadius: 6, padding: '5px 14px',
                fontSize: 12, cursor: 'pointer'
              }}
            >
              {isSpeaking ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
        </div>
      )}

      {/* Pin list */}
      {currentChapter?.pins?.length > 0 && (
        <div style={{ padding: '12px 18px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Concepts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {currentChapter.pins.slice(0, 3).map(pin => (
              <div key={pin.id} style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, cursor: 'default'
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(167,139,250,0.9)', marginBottom: 2 }}>
                  {pin.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {pin.teaser}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapter navigation for multi-chapter drilldowns */}
      {totalChapters > 1 && (
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center',
          padding: '10px 18px', marginTop: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}>
          {Array.from({ length: totalChapters }).map((_, i) => (
            <button key={i} onClick={() => i < chapters.length && setCurrentIndex(i)} style={{
              width: i === currentIndex ? 20 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === currentIndex ? '#7c6af7' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.25s ease'
            }} />
          ))}
        </div>
      )}
    </div>
  )
}
