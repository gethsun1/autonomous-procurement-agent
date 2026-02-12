"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
      },
    },
  };

  return (
    <section className="relative py-16 px-6 md:px-0 text-center z-10 overflow-hidden">
      {/* Dynamic Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[var(--kinetic-teal)]/15 blur-[140px] rounded-full animate-float" />
        <div className="absolute top-20 right-1/4 w-[350px] h-[350px] bg-[var(--electric-violet)]/15 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        className="max-w-5xl mx-auto space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Trust Badges */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-mono tracking-[0.25em] uppercase mb-12"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Zap className="w-3.5 h-3.5 text-[var(--kinetic-teal)]" />
            <span className="text-slate-200 font-bold">SKALE_NET_NODE</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--kinetic-teal)]" />
            <span className="text-slate-200 font-bold">GEMINI_PRO_V1.5</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--cyber-lime)]" />
            <span className="text-slate-200 font-bold">X402_ENCRYPT_ON</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter font-display leading-[0.95] px-4">
            <span className="block mb-3 text-white">Autonomous Procurement,</span>
            <span className="gradient-text-kinetic drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">Executed with Precision</span>
          </h1>
        </motion.div>

        {/* Subline */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light tracking-tight pb-12"
        >
          AI-driven vendor selection with
          <span className="relative inline-block mx-3 font-bold text-[var(--kinetic-teal)] drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            encrypted constraints
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[var(--kinetic-teal)]/50" />
          </span>
          and on-chain settlement.
          Experience the absolute future of trustless commerce.
        </motion.p>
      </motion.div>

      {/* Sophisticated Divider */}
      <motion.div
        className="mt-32 relative w-full max-w-5xl mx-auto h-[1px]"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 1 }}
        transition={{ delay: 1, duration: 1.5, ease: "circOut" }}
      >
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-[var(--kinetic-teal)] to-transparent opacity-50 shadow-[0_0_20px_var(--kinetic-teal)]" />
        <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 rounded-full bg-[var(--kinetic-teal)] shadow-[0_0_20px_var(--kinetic-teal)]" />
      </motion.div>
    </section>
  );
}
