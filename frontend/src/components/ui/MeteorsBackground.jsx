import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const MeteorsBackground = ({ count = 30 }) => {
  const [meteors, setMeteors] = useState([]);

  useEffect(() => {
    // Generate meteor properties on the client to avoid hydration mismatch
    const newMeteors = Array.from({ length: count }).map(() => ({
      id: Math.random(),
      // Start randomly across the top and right side (up to 150vw to cover diagonal paths)
      xStart: Math.floor(Math.random() * 150) + "vw", 
      yStart: -50,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3, // Between 3 and 7 seconds
    }));
    setMeteors(newMeteors);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[0]">
      {/* Texture for depth */}
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      {meteors.map((meteor) => (
        <motion.div
          key={meteor.id}
          initial={{
            opacity: 0,
            x: meteor.xStart,
            y: meteor.yStart,
          }}
          animate={{
            opacity: [0, 1, 0],
            // Move diagonally down and left
            x: `calc(${meteor.xStart} - 1000px)`,
            y: `calc(${meteor.yStart} + 1000px)`,
          }}
          transition={{
            duration: meteor.duration,
            delay: meteor.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          // The head of the meteor
          className="absolute w-[2px] h-[2px] rounded-full bg-white shadow-[0_0_15px_3px_rgba(34,211,238,0.9)] rotate-[225deg]"
        >
          {/* The trailing tail of the meteor */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[1px] w-[150px] bg-gradient-to-r from-cyan-400 to-transparent" />
        </motion.div>
      ))}
    </div>
  );
};
