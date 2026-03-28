import { create } from 'zustand'

export const useStoryStore = create((set, get) => ({
  currentStory: null,
  currentChapterIndex: 0,
  isPlaying: false,
  drilldownStory: null,
  isDrilldownOpen: false,
  streamUrl: null,
  enrichResult: null,
  currentPersona: 'documentary',

  setStory: (story) => set({ currentStory: story }),
  addChapter: (chapter) => set(state => ({
    currentStory: {
      ...state.currentStory,
      chapters: [...(state.currentStory?.chapters || []), chapter]
    }
  })),
  setChapterIndex: (index) => set({ currentChapterIndex: index }),
  nextChapter: () => set(state => ({
    currentChapterIndex: Math.min(
      state.currentChapterIndex + 1,
      (state.currentStory?.chapters?.length || 1) - 1
    )
  })),
  openDrilldown: (subStory) => set({ drilldownStory: subStory, isDrilldownOpen: true }),
  closeDrilldown: () => set({ isDrilldownOpen: false, drilldownStory: null }),
  setStreamUrl: (url) => set({ streamUrl: url }),
  setEnrichResult: (result) => set({ enrichResult: result }),
  setPersona: (persona) => set({ currentPersona: persona }),
  reset: () => set({
    currentStory: null, currentChapterIndex: 0,
    drilldownStory: null, isDrilldownOpen: false,
    streamUrl: null, enrichResult: null,
    currentPersona: 'documentary'
  })
}))

