import { useState, useEffect, useCallback } from 'react'

// Priority-ranked list of premium voices across browsers
const PREFERRED_VOICES = [
  // Chrome/Edge on Mac & Windows
  'Google UK English Male',
  'Google US English',
  'Google UK English Female',
  // macOS Safari/Chrome built-in premium voices
  'Samantha',
  'Daniel',
  'Karen',
  'Moira',
  'Rishi',
  // Edge neural voices
  'Microsoft Guy Online (Natural)',
  'Microsoft Aria Online (Natural)',
  'Microsoft Davis Online (Natural)',
]

function pickBestVoice(voices) {
  // Try priority list first
  for (const name of PREFERRED_VOICES) {
    const v = voices.find(v => v.name === name)
    if (v) return v
  }
  // Fallback: any non-default English voice (usually better than auto-selected)
  const enLocal = voices.find(v => v.lang.startsWith('en') && !v.default)
  if (enLocal) return enLocal
  // Last resort: any English voice
  return voices.find(v => v.lang.startsWith('en')) || null
}

export function useNarration(script, autoPlay = true, enabled = true) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (!script || !window.speechSynthesis || !enabled) return
    window.speechSynthesis.cancel()
    setCharIndex(0)

    const utterance = new SpeechSynthesisUtterance(script)
    utterance.rate = 0.88
    utterance.pitch = 1.0

    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length) {
        const v = pickBestVoice(voices)
        if (v) utterance.voice = v
      }
    }

    applyVoice()
    // Voices may not be loaded yet — re-apply on change
    window.speechSynthesis.onvoiceschanged = applyVoice

    utterance.onboundary = (e) => setCharIndex(e.charIndex)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    if (autoPlay) setTimeout(() => window.speechSynthesis.speak(utterance), 300)
    return () => window.speechSynthesis.cancel()
  }, [script, enabled])

  const pause = useCallback(() => { window.speechSynthesis.pause(); setIsSpeaking(false) }, [])
  const resume = useCallback(() => { window.speechSynthesis.resume(); setIsSpeaking(true) }, [])
  const cancel = useCallback(() => { window.speechSynthesis.cancel(); setIsSpeaking(false) }, [])

  return { isSpeaking, pause, resume, cancel, charIndex }
}
