import { useState, useEffect } from 'react'

export default function BranchSelector({ storyId, chapter, onBranchChosen, onContinue }) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [choosing, setChoosing] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!storyId || !chapter) return
    setLoading(true)
    setVisible(false)
    setBranches([])

    fetch(`http://localhost:8000/story/${storyId}/chapter/${chapter.id}/branches`)
      .then(r => r.json())
      .then(data => {
        setBranches(data.branches || [])
        setLoading(false)
        setTimeout(() => setVisible(true), 400)
      })
      .catch(() => setLoading(false))
  }, [storyId, chapter?.id])

  const handleBranch = (branch) => {
    setChoosing(branch.label)
    onBranchChosen(branch.prompt_seed, branch.label)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '20px'})`,
      opacity: visible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      maxWidth: 680, width: '90%'
    }}>
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4
      }}>
        Where to next?
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {loading && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Generating paths...
          </div>
        )}
        {branches.map((branch, i) => (
          <button
            key={i}
            onClick={() => handleBranch(branch)}
            disabled={!!choosing}
            title={branch.teaser}
            style={{
              background: choosing === branch.label
                ? 'rgba(124, 106, 247, 0.4)'
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${choosing === branch.label
                ? 'rgba(124,106,247,0.8)'
                : 'rgba(255,255,255,0.15)'}`,
              color: 'white',
              padding: '10px 18px',
              borderRadius: 24,
              cursor: choosing ? 'default' : 'pointer',
              fontSize: 13,
              lineHeight: 1.4,
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease',
              maxWidth: 220,
              textAlign: 'center',
              animation: `fade-in 0.4s ease ${i * 0.12}s both`
            }}
          >
            {choosing === branch.label ? '✦ Generating...' : branch.label}
          </button>
        ))}
      </div>

      <button
        onClick={onContinue}
        style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          fontSize: 12, marginTop: 2,
          textDecoration: 'underline',
          textDecorationColor: 'rgba(255,255,255,0.15)'
        }}
      >
        Continue the main story →
      </button>
    </div>
  )
}
