"use client";

import { motion } from "framer-motion";

export default function BackgroundMesh() {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            <svg
                className="absolute top-0 left-0 w-full h-full opacity-[0.25]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="grid"
                        width="45"
                        height="45"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 45 0 L 0 0 0 45"
                            fill="none"
                            stroke="var(--kinetic-teal)"
                            strokeWidth="1"
                            strokeOpacity="0.4"
                        />
                    </pattern>
                    <radialGradient id="mesh-gradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--kinetic-teal)" stopOpacity="0.25" />
                        <stop offset="60%" stopColor="var(--electric-violet)" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Animated Orbs with higher vibrancy */}
                <motion.circle
                    cx="15%"
                    cy="20%"
                    r="450"
                    fill="url(#mesh-gradient)"
                    animate={{
                        cx: ["15%", "22%", "15%"],
                        cy: ["20%", "28%", "20%"],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.circle
                    cx="85%"
                    cy="80%"
                    r="550"
                    fill="url(#mesh-gradient)"
                    animate={{
                        cx: ["85%", "78%", "85%"],
                        cy: ["80%", "72%", "80%"],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </svg>

            {/* Scanning Line - More intense */}
            <motion.div
                className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--kinetic-teal)] to-transparent opacity-40 shadow-[0_0_20px_var(--kinetic-teal)]"
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
}
