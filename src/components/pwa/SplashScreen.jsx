import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
    }, 1500); // Display for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#006d77] via-[#0f7e8a] to-[#005f69] text-white overflow-hidden"
    >
      {/* Background Shapes */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute w-[500px] h-[500px] rounded-full bg-white blur-[100px] opacity-10 -top-20 -left-20"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
           duration: 12,
          repeat: Infinity,
            ease: "linear",
        }}
        className="absolute w-[400px] h-[400px] rounded-full bg-[#83c5be] blur-[80px] opacity-20 bottom-0 right-0"
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="mb-6 relative"
        >
            <div className="w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3">
                 <img src="/cortex2.png" alt="Cortex Logo" className="w-16 h-16 object-contain" />
            </div>
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute -right-2 -top-2 w-6 h-6 bg-yellow-400 rounded-full shadow-lg border-2 border-white"
            />
        </motion.div>

        {/* Text Reveal */}
        <div className="flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-center"
          >
            Cortex
          </motion.h1>
          <motion.p
             initial={{ opacity: 0 }}
             animate={{ opacity: 0.9 }}
             transition={{ delay: 1, duration: 0.8 }}
             className="text-lg md:text-xl font-medium text-white/90 tracking-wide"
          >
            Stay Organized. Stay Calm.
          </motion.p>
        </div>

        {/* Loading Bar */}
         <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "120px", opacity: 1 }}
          transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
          className="h-1 bg-white/50 rounded-full mt-10 overflow-hidden"
        >
             <motion.div 
                 className="h-full bg-white"
                 animate={{ x: [-120, 120] }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
             />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
