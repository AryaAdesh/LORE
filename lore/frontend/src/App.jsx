import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import StoryPlayer from './components/StoryPlayer' // Note: This will be implemented in Phase 6, stub for now

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/story/:storyId" element={<StoryPlayer />} />
        <Route path="/story/new" element={<StoryPlayer />} />
      </Routes>
    </BrowserRouter>
  )
}
