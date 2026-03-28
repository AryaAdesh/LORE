import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Gemini Live — narration-only mode (no mic).
 * Backend sends the narration script as text → Gemini speaks it → we play PCM audio.
 * No AudioWorklet, no microphone permission needed.
 */
export function useGeminiLive(storyId, chapterId, persona = 'documentary', autoStart = false) {
  const [isActive, setIsActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const playbackCtxRef = useRef(null)
  const audioQueueRef = useRef([])
  const isPlayingRef = useRef(false)
  const startedRef = useRef(false)

  // Decode raw 16-bit PCM (24 kHz) and play it
  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true
    const audioData = audioQueueRef.current.shift()
    try {
      const ctx = playbackCtxRef.current
      if (!ctx || ctx.state === 'closed') { isPlayingRef.current = false; return }
      if (ctx.state === 'suspended') await ctx.resume()

      const int16 = new Int16Array(audioData)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0

      const audioBuf = ctx.createBuffer(1, float32.length, 24000)
      audioBuf.copyToChannel(float32, 0)
      const src = ctx.createBufferSource()
      src.buffer = audioBuf
      src.connect(ctx.destination)
      src.onended = () => { isPlayingRef.current = false; playNextInQueue() }
      src.start()
    } catch (e) {
      console.error('[GeminiLive] Playback error:', e)
      isPlayingRef.current = false
      playNextInQueue()
    }
  }, [])

  const stop = useCallback(() => {
    wsRef.current?.close()
    playbackCtxRef.current?.close()
    wsRef.current = null
    playbackCtxRef.current = null
    audioQueueRef.current = []
    isPlayingRef.current = false
    startedRef.current = false
    setIsActive(false)
    setIsConnecting(false)
    setTranscript('')
  }, [])

  const start = useCallback(async () => {
    if (!storyId || !chapterId) return
    setError(null)
    setTranscript('')
    setIsConnecting(true)

    try {
      // Narration-only: no mic, just a 24 kHz playback context
      const playbackCtx = new AudioContext({ sampleRate: 24000 })
      playbackCtxRef.current = playbackCtx

      const ws = new WebSocket(
        `ws://localhost:8000/ws/live/${storyId}/${chapterId}?persona=${persona}`
      )
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnecting(false)
        setIsActive(true)
        // Backend will automatically send narration prompt and stream audio back
      }

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          const buf = await event.data.arrayBuffer()
          audioQueueRef.current.push(buf)
          playNextInQueue()
        } else {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'transcript')
              setTranscript(prev => prev ? prev + ' ' + msg.text : msg.text)
            if (msg.type === 'error') { setError(msg.message); stop() }
          } catch {}
        }
      }

      ws.onerror = () => {
        setError('Voice connection failed')
        setIsConnecting(false)
        stop()
      }
      ws.onclose = () => stop()

    } catch (err) {
      setIsConnecting(false)
      setError(err.message)
      setIsActive(false)
    }
  }, [storyId, chapterId, persona, stop, playNextInQueue])

  // AUTO-START on mount
  useEffect(() => {
    if (!autoStart || !storyId || !chapterId || startedRef.current) return
    startedRef.current = true
    const t = setTimeout(start, 1200)
    return () => clearTimeout(t)
  }, [autoStart, storyId, chapterId, start])

  // Restart when chapter changes while active
  const prevChapterRef = useRef(null)
  useEffect(() => {
    if (!chapterId) return
    if (prevChapterRef.current && prevChapterRef.current !== chapterId && (isActive || isConnecting)) {
      stop()
      startedRef.current = false
      setTimeout(() => { startedRef.current = true; start() }, 600)
    }
    prevChapterRef.current = chapterId
  }, [chapterId])

  const toggle = useCallback(() => {
    if (isActive || isConnecting) stop()
    else start()
  }, [isActive, isConnecting, start, stop])

  return { isActive, isConnecting, toggle, transcript, error }
}
