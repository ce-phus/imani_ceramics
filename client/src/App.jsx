import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Home } from './pages'
import { SplashScreen } from './components'
import { AnimatePresence } from 'framer-motion'

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
  <HelmetProvider>
    <Router>
      {!showSplash && (
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      )}

      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen
            key="splash"
            onFinish={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>
    </Router>
  </HelmetProvider>
);
}

export default App
