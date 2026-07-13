import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import Backdrop from './components/Backdrop'
import SerumTransition, { PageFade } from './components/PageTransition'
import { GooFilterDefs } from './components/LiquidBackdrop'
import Home from './pages/Home'
import FormulaLab from './pages/FormulaLab'
import SkinGarden from './pages/SkinGarden'
import ProductMuseum from './pages/ProductMuseum'
import FindADupe from './pages/FindADupe'
import About from './pages/About'
import Quiz from './pages/Quiz'

export default function App() {
  const location = useLocation()

  return (
    <div className="grain theming relative min-h-screen">
      <GooFilterDefs />
      <Backdrop />
      <Nav />
      <SerumTransition />
      <main className="relative z-10">
        <AnimatePresence mode="popLayout" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageFade><Home /></PageFade>} />
            <Route path="/formula-lab" element={<PageFade><FormulaLab /></PageFade>} />
            <Route path="/skin-garden" element={<PageFade><SkinGarden /></PageFade>} />
            <Route path="/product-museum" element={<PageFade><ProductMuseum /></PageFade>} />
            <Route path="/find-a-dupe" element={<PageFade><FindADupe /></PageFade>} />
            <Route path="/about" element={<PageFade><About /></PageFade>} />
            <Route path="/build" element={<PageFade><Quiz /></PageFade>} />
            <Route path="*" element={<PageFade><Home /></PageFade>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
