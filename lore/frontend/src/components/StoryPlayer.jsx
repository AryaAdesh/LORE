import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStoryStore } from '../store/storyStore'
import { useStoryStream } from '../hooks/useStoryStream'
import { useGeminiLive } from '../hooks/useGeminiLive'
import SceneView from './SceneView'
import ChapterTimeline from './ChapterTimeline'
import NarrationBar from './NarrationBar'
import DrillDownPanel from './DrillDownPanel'
import PerspectiveModal from './PerspectiveModal'
import ExportModal from './ExportModal'
import LoadingCinematic from './LoadingCinematic'
import BranchSelector from './BranchSelector'

export default function StoryPlayer() {
  const { storyId: urlStoryId } = useParams()
  const navigate = useNavigate()
  const { streamUrl, reset, openDrilldown, isDrilldownOpen, currentPersona } = useStoryStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [storyId, setStoryId] = useState(urlStoryId || null)
  const [showPerspective, setShowPerspective] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [drilldownStreamUrl, setDrilldownStreamUrl] = useState(null)
  const [showBranches, setShowBranches] = useState(false)
  const [extraChapters, setExtraChapters] = useState([])
  const autoAdvanceTimer = useRef(null)
  const branchTimer = useRef(null)

  const { chapters: streamedChapters, status, storyId: streamStoryId, totalChapters } = useStoryStream(streamUrl)
  const resolvedStoryId = storyId || streamStoryId

  // Merge streamed chapters with any branch-generated chapters
  const chapters = [...streamedChapters, ...extraChapters]
  const currentChapter = chapters[currentIndex]

  // Gemini Live hook — connected to current chapter, auto-starts with selected persona
  const { isActive: liveActive, isConnecting: liveConnecting, toggle: toggleLive, transcript: liveTranscript, error: liveError } =
    useGeminiLive(resolvedStoryId, currentChapter?.id, currentPersona, true)

  // Auto-advance after narration ends (timer-based fallback)
  useEffect(() => {
    if (!currentChapter || liveActive || liveConnecting || showBranches) return
    clearTimeout(autoAdvanceTimer.current)
    const duration = (currentChapter.duration_seconds || 30) * 1000
    autoAdvanceTimer.current = setTimeout(() => {
      if (currentIndex < chapters.length - 1) {
        setCurrentIndex(i => i + 1)
      }
    }, duration + 2000)
    return () => clearTimeout(autoAdvanceTimer.current)
  }, [currentIndex, currentChapter, liveActive, liveConnecting, showBranches, chapters.length])

  // Store storyId when stream resolves it
  useEffect(() => {
    if (streamStoryId && !storyId) setStoryId(streamStoryId)
  }, [streamStoryId])

  // Called by NarrationBar when narration finishes
  const handleNarrationEnd = useCallback(() => {
    if (currentIndex >= chapters.length - 1) {
      // No more pre-generated chapters — show branch selector after short delay
      branchTimer.current = setTimeout(() => setShowBranches(true), 1500)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }, [currentIndex, chapters.length])

  // Clean up branch timer on unmount / chapter change
  useEffect(() => {
    return () => clearTimeout(branchTimer.current)
  }, [currentIndex])

  // Handle pin click → drilldown
  const handlePinClickSimple = async (pin) => {
    if (!resolvedStoryId || !currentChapter) return
    try {
      const res = await fetch(`http://localhost:8000/story/${resolvedStoryId}/drilldown-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: resolvedStoryId,
          chapter_id: currentChapter.id,
          pin_id: pin.id
        })
      })
      const { sub_story_id } = await res.json()
      setDrilldownStreamUrl(`http://localhost:8000/story/stream/${sub_story_id}`)
      openDrilldown({ id: sub_story_id })
    } catch (e) {
      console.error('Drilldown failed:', e)
    }
  }

  // Handle branch selection
  const handleBranchChosen = async (branchPromptSeed) => {
    setShowBranches(false)
    try {
      const response = await fetch(`http://localhost:8000/story/${resolvedStoryId}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: resolvedStoryId,
          chapter_id: currentChapter.id,
          branch_prompt: branchPromptSeed
        })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let newChapterIndex = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        for (const line of text.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.chapter_index !== undefined) {
                newChapterIndex = data.chapter_index
              }
            } catch { /* ignore */ }
          }
        }
      }

      // Fetch updated story to get the new chapter
      if (newChapterIndex !== null) {
        const storyRes = await fetch(`http://localhost:8000/story/${resolvedStoryId}`)
        const storyData = await storyRes.json()
        const existingIds = new Set(streamedChapters.map(c => c.id).concat(extraChapters.map(c => c.id)))
        const newOnes = (storyData.chapters || []).filter(c => !existingIds.has(c.id))
        setExtraChapters(prev => [...prev, ...newOnes])
        setCurrentIndex(newChapterIndex)
      }
    } catch (e) {
      console.error('Branch failed:', e)
    }
  }

  if (status === 'idle' || status === 'connecting') {
    return <LoadingCinematic chapters={[]} totalChapters={0} status="connecting" onComplete={() => {}} />
  }

  if (status === 'generating' || status === 'error') {
    return (
      <LoadingCinematic
        chapters={chapters}
        totalChapters={totalChapters}
        status={status}
        onComplete={() => {}}
      />
    )
  }

  // status === 'ready'
  if (!currentChapter) return null

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#080810', position: 'relative', overflow: 'hidden' }}>

      {/* Full-bleed scene */}
      <SceneView
        chapter={currentChapter}
        storyId={resolvedStoryId}
        onPinClick={handlePinClickSimple}
      />

      {/* Chapter timeline */}
      <ChapterTimeline
        chapters={chapters}
        currentIndex={currentIndex}
        totalExpected={totalChapters}
        onSelect={setCurrentIndex}
      />

      {/* Narration bar */}
      <NarrationBar
        chapter={currentChapter}
        isLiveActive={liveActive}
        isLiveConnecting={liveConnecting}
        onToggleLive={toggleLive}
        liveTranscript={liveTranscript}
        liveError={liveError}
        currentPersona={currentPersona}
      />

      {/* Branch selector */}
      {showBranches && currentChapter && (
        <BranchSelector
          storyId={resolvedStoryId}
          chapter={currentChapter}
          onBranchChosen={handleBranchChosen}
          onContinue={() => {
            setShowBranches(false)
            if (currentIndex < chapters.length - 1) {
              setCurrentIndex(i => i + 1)
            }
          }}
        />
      )}

      {/* Top-right button cluster */}
      <div style={{
        position: 'fixed', top: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 50
      }}>
        <button onClick={() => setShowPerspective(true)} style={topBtnStyle}>
          Retell as...
        </button>
        <button onClick={() => setShowExport(true)} style={topBtnStyle}>
          Export ↗
        </button>
        <button
          onClick={() => { reset(); navigate('/') }}
          style={{ ...topBtnStyle, opacity: 0.5, fontSize: 12 }}
        >
          ← New Story
        </button>
      </div>

      {/* Drill-down panel */}
      <DrillDownPanel
        isOpen={isDrilldownOpen}
        streamUrl={drilldownStreamUrl}
        onClose={() => useStoryStore.getState().closeDrilldown()}
        parentChapterTitle={currentChapter.title}
      />

      {/* Modals */}
      {showPerspective && (
        <PerspectiveModal
          isOpen={showPerspective}
          storyId={resolvedStoryId}
          onClose={() => setShowPerspective(false)}
          onStoryReplace={(newStreamUrl) => {
            useStoryStore.getState().setStreamUrl(newStreamUrl)
            setCurrentIndex(0)
            setShowPerspective(false)
            window.location.reload()
          }}
        />
      )}

      {showExport && (
        <ExportModal
          isOpen={showExport}
          storyId={resolvedStoryId}
          storyTopic={chapters[0]?.title || 'Your Story'}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

const topBtnStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'white',
  padding: '8px 16px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  backdropFilter: 'blur(8px)',
  whiteSpace: 'nowrap'
}
