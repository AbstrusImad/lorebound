import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { PageTransition } from './components/animation/PageTransition'
import { WorldGate } from './pages/WorldGate'
import { CanonAtlas } from './pages/CanonAtlas'
import { LoreForge } from './pages/LoreForge'
import { ContinuityTrial } from './pages/ContinuityTrial'
import { CanonConstellation } from './pages/CanonConstellation'
import { ArtifactHall } from './pages/ArtifactHall'
import { WorldMemory } from './pages/WorldMemory'
import { ValidatorChamber } from './pages/ValidatorChamber'
import { Settings } from './pages/Settings'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<WorldGate />} />
            <Route path="/atlas" element={<CanonAtlas />} />
            <Route path="/forge" element={<LoreForge />} />
            <Route path="/trial" element={<ContinuityTrial />} />
            <Route path="/constellation" element={<CanonConstellation />} />
            <Route path="/hall" element={<ArtifactHall />} />
            <Route path="/memory" element={<WorldMemory />} />
            <Route path="/validators" element={<ValidatorChamber />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<WorldGate />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </AppShell>
  )
}
