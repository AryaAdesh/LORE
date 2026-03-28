import React from 'react';

export default function PromptEnrichPreview({ enrichResult, onConfirm, onBack }) {
  const [brief, setBrief] = React.useState(enrichResult.enriched_brief);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: "'Inter', 'Google Sans', -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Back button — top left */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: 28, left: 28,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '8px 18px',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 2
        }}
      >
        ← Change topic
      </button>

      <div style={{ maxWidth: 640, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Label */}
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10,
          fontWeight: 600
        }}>
          LORE understood your topic as
        </div>

        {/* Enriched topic title */}
        <h1 style={{
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: 20,
          lineHeight: 1.15,
          background: 'linear-gradient(135deg, #e0e0ff 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {enrichResult.enriched_topic}
        </h1>

        {/* Perspective badge */}
        {enrichResult.suggested_perspective && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            background: 'rgba(124,106,247,0.12)',
            border: '1px solid rgba(124,106,247,0.3)',
            borderRadius: 100,
            marginBottom: 28,
            fontSize: 13,
            color: '#c4b5fd',
            fontWeight: 500
          }}>
            <span style={{ fontSize: 14 }}>🎭</span>
            Told as: {enrichResult.suggested_perspective}
          </div>
        )}

        {/* Story brief card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '24px 24px 20px',
          marginBottom: 32,
          boxShadow: '0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
        }}>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 12,
            fontWeight: 600
          }}>
            Story brief
          </div>
          <textarea
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 15,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              minHeight: 130,
              fontFamily: 'inherit'
            }}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
        </div>

        {/* CTA button */}
        <button
          onClick={() => onConfirm(brief)}
          style={{
            width: '100%',
            padding: '18px 32px',
            background: 'linear-gradient(135deg, #7c6af7 0%, #6366f1 100%)',
            border: 'none',
            borderRadius: 16,
            color: 'white',
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 4px 24px rgba(124,106,247,0.3), 0 0 0 1px rgba(124,106,247,0.15)',
            letterSpacing: '0.02em'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          ✦ Begin Story
        </button>
      </div>
    </div>
  );
}
