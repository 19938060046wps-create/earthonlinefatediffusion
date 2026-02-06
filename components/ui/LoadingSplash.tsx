import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const LoadingSplash: React.FC = () => {
    // Particles with animation config & depth
    const [particles] = useState(Array.from({ length: 120 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 5,
        duration: Math.random() * 20 + 10,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.7 ? 'bg-indigo-300' : 'bg-white',
        blur: Math.random() > 0.5 ? 'blur-[1px]' : 'blur-none'
    })));

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050507] text-white overflow-hidden flex flex-col items-center justify-center font-sans">
            <style>{`
            @keyframes float-particle {
                0% { transform: translate(0, 0); }
                50% { transform: translate(-10px, 15px); }
                100% { transform: translate(0, 0); }
            }
          `}</style>

            {/* Background Particles */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-[#0B0B15] to-[#1a1a2e] z-0"></div>

                {/* Particles */}
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className={`absolute rounded-full ${p.color} ${p.blur}`}
                        style={{
                            left: `${p.left}%`,
                            top: `${p.top}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            opacity: p.opacity,
                            animation: `float-particle ${p.duration}s infinite ease-in-out`,
                            animationDelay: `-${p.delay}s`
                        }}
                    ></div>
                ))}

                {/* Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-50">
                    <div className="w-[15vw] h-[15vw] rounded-full border-2 border-amber-500/40 animate-[ping_4s_linear_infinite] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-[35vw] h-[35vw] rounded-full border-2 border-gray-500/30 animate-[ping_6s_linear_infinite_1s] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                </div>
            </div>

            {/* Logo Content */}
            <motion.div
                layoutId="logo-text"
                className="relative z-10 flex flex-col items-center space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <h1 className="text-[42px] font-bold tracking-tight text-center drop-shadow-2xl bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
                    微量玄妙
                </h1>
                <div className="flex flex-col items-center space-y-2">
                    <p className="text-[#9da1b9] text-[11px] font-mono tracking-widest uppercase text-center opacity-90">
                        Powered by FateDiffusion™ Model
                    </p>
                    <div className="h-px w-12 bg-white/40 my-2"></div>
                    <p className="text-gray-300 text-xs font-normal tracking-wide text-center">
                        基于扩散算法的生成式命理计算引擎
                    </p>
                </div>

                {/* Loader */}
                <div className="mt-8 relative flex items-center justify-center">
                    <div className="absolute w-8 h-8 border-2 border-white/20 rounded-full"></div>
                    <div className="w-8 h-8 border-t-2 border-white rounded-full animate-spin"></div>
                    <div className="absolute w-12 h-12 bg-white/5 rounded-full animate-pulse"></div>
                </div>
            </motion.div>
        </div>
    );
};
