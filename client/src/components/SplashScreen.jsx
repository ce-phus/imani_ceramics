import { motion } from 'framer-motion';

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 overflow-hidden"
    >
      {/* Subtle Studio Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 via-gray-100 to-teal-50/10" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-32 w-80 h-80 bg-amber-100/20 rounded-full blur-3xl" />
      </div>

      {/* Wheel & Clay Setup */}
      <div className="relative">
        {/* Modern Wheel Head (Aluminum) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="relative w-96 h-96 rounded-full bg-gradient-to-br from-gray-300 via-gray-100 to-gray-400 shadow-2xl"
          style={{
            boxShadow: `
              inset 0 30px 60px rgba(255,255,255,0.4),
              inset 0 -20px 40px rgba(0,0,0,0.1),
              0 30px 80px rgba(0,0,0,0.3),
              0 0 0 8px #a0a0a0
            `,
          }}
        >
          {/* Bat Pins */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-gray-600 rounded-full shadow-inner"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-135px)`,
              }}
            />
          ))}

          {/* Wet Clay Formation Stages */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 origin-bottom"
            initial={{ scaleY: 0.5, scaleX: 1.2, height: "8rem" }}
            animate={{
              // Stage 1: Centering & Coning (0-1.5s)
              // Stage 2: Opening (1.5-2.5s)
              // Stage 3: Pulling walls (2.5-4s)
              scaleY: [0.5, 1.8, 1.6, 1.8, 1.7],
              scaleX: [1.2, 0.9, 0.85, 0.75, 0.78],
              height: ["8rem", "16rem", "17rem", "18rem", "17.5rem"],
            }}
            transition={{
              duration: 4,
              times: [0, 0.35, 0.5, 0.75, 1],
              ease: "easeInOut",
            }}
          >
            <div
              className="w-full h-full rounded-t-full relative overflow-hidden"
              style={{
                background: "radial-gradient(circle at 35% 35%, #f0ebe8 0%, #d7ccc8 25%, #bcaaa4 50%, #a1887f 80%, #795548 100%)",
                boxShadow: `
                  inset -20px -30px 50px rgba(121,85,72,0.5),
                  inset 15px 30px 50px rgba(0,0,0,0.3),
                  0 20px 50px rgba(0,0,0,0.4)
                `,
              }}
            >
              {/* Dynamic Wet Sheen */}
              <motion.div
                className="absolute inset-0 rounded-t-full"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                style={{
                  background: "radial-gradient(circle at 25% 40%, rgba(255,255,255,0.7) 0%, transparent 60%)",
                  opacity: 0.5,
                }}
              />

              {/* Running Slip Water */}
              <motion.div
                className="absolute inset-x-4 top-1/4 h-full bg-gradient-to-b from-transparent via-blue-300/30 to-blue-400/40 blur-md"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Finger Grooves (moving upward) */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-6 right-6 h-10 bg-stone-900/30 rounded-full blur-lg"
                  animate={{ top: [`${15 + i * 18}%`, `${55 + i * 12}%`] }}
                  transition={{ duration: 4, delay: i * 0.4 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Realistic Potter's Hands (Covered in Slip) */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none">
            {/* Left Hand (Bracing Outside) */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [-8, 8, -8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-8 top-12 w-32 h-40"
            >
              <div className="w-full h-full bg-gradient-to-b from-stone-300/90 to-stone-500/90 rounded-full shadow-2xl blur-sm"
                style={{ clipPath: "ellipse(55% 45% at 50% 60%)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-700/50 to-transparent rounded-full" />
            </motion.div>

            {/* Right Hand (Inside with Thumb Opening) */}
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [8, -8, 8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute -right-10 top-10 w-36 h-44"
            >
              <div className="w-full h-full bg-gradient-to-b from-stone-300/90 to-stone-500/90 rounded-full shadow-2xl blur-sm"
                style={{ clipPath: "ellipse(50% 40% at 50% 65%)" }}
              />
              {/* Thumb pressing in */}
              <motion.div
                className="absolute bottom-16 left-8 w-12 h-16 bg-stone-700/60 rounded-full blur-md"
                animate={{ scaleY: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Wet Clay & Water Splatter Particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-full blur-md"
              style={{
                background: i % 4 === 0 ? "#a1887f" : "rgba(120,180,255,0.7)",
                left: "50%",
                top: "50%",
              }}
              animate={{
                x: [(Math.random() - 0.5) * 500, (Math.random() - 0.5) * 800],
                y: [(Math.random() - 0.9) * 300 - 150, 600],
                scale: [0, 1.4, 0],
                opacity: [0, 0.9, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>

        {/* Splash Basin */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 h-24 bg-gradient-to-b from-blue-200/50 to-blue-300/30 rounded-full blur-xl shadow-inner" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 1.2 }}
        className="absolute bottom-52 text-center"
      >
        <h1 className="text-7xl font-bold text-stone-800 tracking-tight">IMANI</h1>
        <p className="text-3xl text-stone-600 mt-3 tracking-widest">CERAMIC STUDIO</p>
      </motion.div>

      {/* Progress Stages */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="flex justify-between text-stone-700 font-medium mb-4">
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, times: [0, 0.25, 1] }}>Centering</motion.span>
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, times: [0.25, 0.5, 1] }}>Coning</motion.span>
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, times: [0.5, 0.75, 1] }}>Opening</motion.span>
          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, times: [0.75, 1, 1] }}>Pulling</motion.span>
        </div>
        <div className="h-3 bg-stone-300/70 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-stone-600 to-amber-700"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
          >
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-2xl"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;