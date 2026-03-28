import { useState, useEffect, useRef } from 'react'
import PinOverlay from './PinOverlay'

const KB_ANIMATIONS = ['ken-burns-1', 'ken-burns-2', 'ken-burns-3', 'ken-burns-4']

export default function SceneView({ chapter, storyId, onPinClick }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [prevImageUrl, setPrevImageUrl] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [kbAnim, setKbAnim] = useState('ken-burns-1')
  const containerRef = useRef(null)
  const prevChapterId = useRef(null)

  useEffect(() => {
    if (!chapter || !storyId) return
    // Pick a different KB animation each chapter
    const idx = chapter.index % KB_ANIMATIONS.length
    setKbAnim(KB_ANIMATIONS[idx])

    // If chapter changed, keep old image visible during transition
    if (prevChapterId.current && prevChapterId.current !== chapter.id) {
      setPrevImageUrl(imageUrl)
      setIsLoaded(false)
    }
    prevChapterId.current = chapter.id

    // Fetch image
    if (chapter.video_url) {
      setImageUrl(chapter.video_url)
      setIsLoaded(true)
      return
    }

    fetch(`http://localhost:8000/story/${storyId}/chapter/${chapter.id}/image`)
      .then(r => r.json())
      .then(data => {
        setImageUrl(data.image_url)
      })
      .catch(console.error)
  }, [chapter?.id, storyId])

  const handleImageLoad = () => {
    setIsLoaded(true)
    // Clear prev image after fade completes
    setTimeout(() => setPrevImageUrl(null), 900)
  }

  const isVideo = chapter?.video_url && imageUrl === chapter.video_url

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0,
        overflow: 'hidden',
        background: '#080810'
      }}
    >
      {/* Previous image — stays visible during transition */}
      {prevImageUrl && (
        <img
          src={prevImageUrl}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 900ms ease',
            zIndex: 1
          }}
          alt=""
        />
      )}

      {/* Current image/video with Ken Burns */}
      {isVideo ? (
        <video
          key={imageUrl}
          src={imageUrl}
          autoPlay muted loop
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 900ms ease',
            zIndex: 2
          }}
          onLoadedData={handleImageLoad}
        />
      ) : imageUrl ? (
        <img
          key={chapter?.id}
          src={imageUrl}
          onLoad={handleImageLoad}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 900ms ease',
            transformOrigin: 'center center',
            animation: isLoaded
              ? `${kbAnim} 30s ease-in-out forwards`
              : 'none',
            zIndex: 2
          }}
          alt={chapter?.title || ''}
        />
      ) : null}

      {/* Top gradient — UI readability */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 140,
        background: 'linear-gradient(to bottom, rgba(8,8,16,0.7) 0%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none'
      }} />

      {/* Bottom gradient — narration readability */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 220,
        background: 'linear-gradient(to top, rgba(8,8,16,0.9) 0%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none'
      }} />

      {/* Pin overlay — sits above gradients */}
      {chapter && isLoaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
          <PinOverlay
            pins={chapter.pins || []}
            containerRef={containerRef}
            onPinClick={onPinClick}
          />
        </div>
      )}
    </div>
  )
}
