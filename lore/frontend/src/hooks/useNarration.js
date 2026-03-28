import { useState, useEffect, useCallback, useRef } from 'react'

// Voices that reliably fire onboundary events (word-level sync)
const BOUNDARY_VOICES = [
  'Google US English',
  'Google UK English Female',
  'Google UK English Male',
  'Samantha',         // macOS built-in — good quality + boundary support
  'Daniel',           // macOS built-in
  'Karen',            // macOS built-in
  'Moira',            // macOS built-in
  'Rishi',            // macOS built-in
]

function pickBestVoice(voices) {
  for (const name of BOUNDARY_VOICES) {
    const v = voices.find(v => v.name === name)
    if (v) return v
  }
  const enLocal = voices.find(v => v.lang.startsWith('en') && !v.default && !v.name.includes('Zarvox'))
  if (enLocal) return enLocal
  return voices.find(v => v.lang.startsWith('en')) || null
}

// ── Global calibration state ──
// After each chapter finishes, we record (totalChars, actualDuration).
// This gives us a measured chars/sec that improves over time.
let calibratedCharsPerSec = null
const calibrationSamples = []

function recordCalibration(totalChars, durationSec) {
  if (durationSec < 1 || totalChars < 20) return // skip degenerate cases
  calibrationSamples.push({ totalChars, durationSec })
  // Use a weighted average of all samples
  let totalC = 0, totalD = 0
  for (const s of calibrationSamples) {
    totalC += s.totalChars
    totalD += s.durationSec
  }
  calibratedCharsPerSec = totalC / totalD
  console.log(`[LORE TTS] 📊 Calibrated: ${calibratedCharsPerSec.toFixed(1)} chars/sec (from ${calibrationSamples.length} chapter(s))`)
}

export function useNarration(script, autoPlay = true, enabled = true, onEndCallback = null) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [charIndex, setCharIndex] = useState(0)

  const onEndCallbackRef = useRef(onEndCallback)
  useEffect(() => { onEndCallbackRef.current = onEndCallback }, [onEndCallback])

  // Refs for the fallback highlight timer
  const fallbackRef = useRef(null)
  const boundaryFiredRef = useRef(false)
  const elapsedRef = useRef(0)
  const segmentStartRef = useRef(0)
  const scriptRef = useRef(script)
  scriptRef.current = script
  const charsPerSecRef = useRef(10)
  const utteranceStartTimeRef = useRef(0) // for calibration: when onstart fired

  // Compute initial estimate; override with calibrated value if available
  useEffect(() => {
    if (script) {
      if (calibratedCharsPerSec) {
        charsPerSecRef.current = calibratedCharsPerSec
      } else {
        // Initial estimate: ~2.17 words/sec at rate 0.88
        const wordCount = script.split(/\s+/).length
        const estDurationSec = wordCount / 2.17
        charsPerSecRef.current = script.length / estDurationSec
      }
    }
  }, [script])

  const stopFallbackTimer = () => {
    if (fallbackRef.current) {
      clearInterval(fallbackRef.current)
      fallbackRef.current = null
    }
    if (segmentStartRef.current) {
      elapsedRef.current += (Date.now() - segmentStartRef.current) / 1000
      segmentStartRef.current = 0
    }
  }

  const startFallbackTimer = () => {
    if (boundaryFiredRef.current) return
    segmentStartRef.current = Date.now()
    fallbackRef.current = setInterval(() => {
      if (boundaryFiredRef.current) {
        clearInterval(fallbackRef.current)
        fallbackRef.current = null
        return
      }
      const currentSegment = (Date.now() - segmentStartRef.current) / 1000
      const totalElapsed = elapsedRef.current + currentSegment
      const estimated = Math.min(Math.floor(totalElapsed * charsPerSecRef.current), scriptRef.current.length)
      setCharIndex(estimated)
    }, 120)
  }

  useEffect(() => {
    if (!script || !window.speechSynthesis || !enabled) {
      window.speechSynthesis?.cancel()
      stopFallbackTimer()
      setCharIndex(0)
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.pause()
    window.speechSynthesis.cancel()
    stopFallbackTimer()
    elapsedRef.current = 0
    boundaryFiredRef.current = false
    setCharIndex(0)
    setIsSpeaking(false)

    const utterance = new SpeechSynthesisUtterance(script)
    window.__lore_active_utterance__ = utterance

    utterance.rate = 0.88
    utterance.pitch = 1.0

    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length) {
        const v = pickBestVoice(voices)
        if (v) {
          utterance.voice = v
          console.log('[LORE TTS] Selected voice:', v.name)
        }
      }
    }
    applyVoice()
    window.speechSynthesis.onvoiceschanged = applyVoice

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        if (!boundaryFiredRef.current) {
          console.log('[LORE TTS] ✅ onboundary firing — switching to precise sync')
        }
        boundaryFiredRef.current = true
        setCharIndex(e.charIndex)
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      utteranceStartTimeRef.current = Date.now()
      startFallbackTimer()
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      stopFallbackTimer()
      setCharIndex(script.length)

      // ── Calibrate: record how long this chapter actually took ──
      if (utteranceStartTimeRef.current) {
        const actualDuration = (Date.now() - utteranceStartTimeRef.current) / 1000
        recordCalibration(script.length, actualDuration)
      }

      if (onEndCallbackRef.current) {
        setTimeout(onEndCallbackRef.current, 1500)
      }
    }

    utterance.onerror = (e) => {
      setIsSpeaking(false)
      stopFallbackTimer()
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        setCharIndex(script.length)
      }
    }

    let cancelled = false
    if (autoPlay) {
      setTimeout(() => {
        if (!cancelled) window.speechSynthesis.speak(utterance)
      }, 450)
    }

    return () => {
      cancelled = true
      stopFallbackTimer()
      window.speechSynthesis.pause()
      window.speechSynthesis.cancel()
    }
  }, [script, enabled, autoPlay])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    stopFallbackTimer()
    setIsSpeaking(false)
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    startFallbackTimer()
    setIsSpeaking(true)
  }, [])

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel()
    stopFallbackTimer()
    setIsSpeaking(false)
  }, [])

  return { isSpeaking, pause, resume, cancel, charIndex }
}
