export const PERSONAS = [
  {
    id: 'documentary',
    label: 'Documentary',
    icon: '🎬',
    description: 'David Attenborough — slow, reverent, profound',
    voiceName: 'Charon'
  },
  {
    id: 'excited',
    label: 'Science Comm.',
    icon: '⚡',
    description: 'Fast-paced, enthusiastic, full of energy',
    voiceName: 'Puck'
  },
  {
    id: 'poetic',
    label: 'Cosmic Poet',
    icon: '✨',
    description: 'Carl Sagan — philosophical, vast, deeply human',
    voiceName: 'Charon'
  },
  {
    id: 'child',
    label: 'For Kids',
    icon: '🌟',
    description: 'Simple words, analogies, pure wonder',
    voiceName: 'Kore'
  },
  {
    id: 'myth',
    label: 'Greek Myth',
    icon: '⚜️',
    description: 'Epic, dramatic, forces as characters',
    voiceName: 'Fenrir'
  }
]

export const PERSONA_LABELS = Object.fromEntries(
  PERSONAS.map(p => [p.id, p.label])
)
