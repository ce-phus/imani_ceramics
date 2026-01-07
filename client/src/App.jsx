import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Home, BookingPolicyUI, BookingUI, PotteryProcess, Quiz } from './pages'
import { SplashScreen, Navbar, Footer } from './components'
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
        <>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<BookingUI />} />
          <Route path="/booking-policy" element={<BookingPolicyUI />} />
          <Route path="/pottery-process" element={<PotteryProcess />} />
          <Route path="/qa" element={<Quiz />} />
        </Routes>
        <Footer />
        </>
        
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
