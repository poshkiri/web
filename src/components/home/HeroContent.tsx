"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const WORDS = ["Epic 3D Models", "Pro Sound Packs", "Stunning VFX", "Clean UI Kits"]

const STAGGER_DELAY = 0.1
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER_DELAY, delayChildren: 0 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function HeroContent({ className }: { className?: string }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        setVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className={cn(
        "relative z-10 mx-auto max-w-4xl px-4 pt-16 pb-24 text-left sm:pt-24 sm:pb-32 lg:text-left",
        className
      )}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Badge — pill, gradient border, pulsing dot */}
      <motion.div variants={item} className="flex justify-center lg:justify-start">
        <div
          className="relative inline-flex rounded-full p-[1px]"
          style={{
            background: "linear-gradient(90deg, var(--purple), var(--cyan))",
          }}
        >
          <span
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              "bg-bg-deep backdrop-blur-md text-text-primary"
            )}
          >
            <span
              className="relative h-2 w-2 shrink-0 rounded-full"
              style={{ background: "var(--cyan)" }}
            >
              <span
                className="absolute inset-0 animate-ping rounded-full opacity-75"
                style={{ background: "var(--cyan)" }}
              />
            </span>
            ✦ Trusted by 12,000+ Game Developers
          </span>
        </div>
      </motion.div>

      {/* 2. Headline — 3 lines, Syne 900, 80–96px desktop */}
      <motion.h1
        variants={item}
        className="font-syne mt-6 text-5xl font-extrabold leading-[1.1] tracking-[-3px] sm:text-6xl md:text-7xl lg:text-[80px] xl:text-[96px]"
        style={{ letterSpacing: "-3px" }}
      >
        <span className="block text-[#f0eeff]">Build Games</span>
        <span
          className="block bg-clip-text text-transparent"
          style={{
            background: "linear-gradient(90deg, var(--purple), var(--cyan))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          With Assets
        </span>
        <span
          className="block text-transparent"
          style={{
            WebkitTextStroke: "2px #f0eeff",
            color: "transparent",
            paintOrder: "stroke fill",
          }}
        >
          That Slap.
        </span>
      </motion.h1>

      {/* 3. Typewriter line */}
      <motion.p
        variants={item}
        className="mt-6 text-lg text-text-muted sm:text-xl"
      >
        Currently featuring:{" "}
        <span className="relative inline-block min-w-[200px] text-text-primary">
          <span
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.3s ease",
              background: "linear-gradient(90deg, #7857ff, #06d6ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {WORDS[index]}
          </span>
        </span>
      </motion.p>

      {/* 4. Description — DM Sans, 17px, muted, max-width 440px */}
      <motion.p
        variants={item}
        className="mt-6 max-w-[440px] text-[17px] leading-relaxed text-text-muted"
      >
        3D models, textures, sound packs, and ready-to-use assets for Unity,
        Unreal, and Godot. Created by pros, for indie devs.
      </motion.p>

      {/* 5. CTA buttons */}
      <motion.div
        variants={item}
        className="mt-10 flex flex-wrap items-center gap-3"
      >
        <motion.button
          type="button"
          onClick={() => router.push("/assets")}
          className="rounded-[14px] px-9 py-4 text-base font-semibold text-white transition-transform duration-200"
          style={{
            background: "linear-gradient(90deg, var(--purple), var(--cyan))",
            boxShadow: "0 0 40px var(--purple-glow)",
          }}
          whileHover={{
            y: -2,
            boxShadow: "0 0 56px var(--purple-glow)",
          }}
          whileTap={{ scale: 0.98 }}
        >
          Explore Assets →
        </motion.button>
        <motion.button
          type="button"
          onClick={() => router.push("/upload")}
          className="rounded-[14px] border px-9 py-4 text-base font-semibold text-text-primary backdrop-blur-[8px] transition-colors duration-200"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
          }}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          whileTap={{ scale: 0.98 }}
        >
          Sell Your Work
        </motion.button>
      </motion.div>

      {/* 6. Metrics — JetBrains Mono, vertical dividers */}
      <motion.div
        variants={item}
        className="mt-14 flex flex-wrap items-center justify-center gap-0 lg:justify-start"
      >
        <span className="font-mono text-sm font-medium text-text-primary">
          10K+ Assets
        </span>
        <span
          className="mx-4 h-4 w-px shrink-0 self-center"
          style={{ background: "rgba(255,255,255,0.15)" }}
        />
        <span className="font-mono text-sm font-medium text-text-primary">
          500+ Sellers
        </span>
        <span
          className="mx-4 h-4 w-px shrink-0 self-center"
          style={{ background: "rgba(255,255,255,0.15)" }}
        />
        <span className="font-mono text-sm font-medium text-text-primary">
          4.9★ Rating
        </span>
      </motion.div>
    </motion.div>
  )
}
