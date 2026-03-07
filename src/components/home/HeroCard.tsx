"use client"

import { useCallback, useRef, useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { cn } from "@/lib/utils"

const MAX_TILT = 8
const FLOAT_DURATION = 4
const FLOAT_OFFSET = 14

const BADGES: { label: string; position: string; delay: number }[] = [
  { label: "⚡ Instant Download", position: "top-left", delay: 0 },
  { label: "🛡️ Commercial License", position: "top-right", delay: 0.3 },
  { label: "⭐ 4.9 / 5.0", position: "right-middle", delay: 0.6 },
  { label: "🎮 Unity Ready", position: "bottom-left", delay: 0.9 },
  { label: "🔥 Trending", position: "bottom-right", delay: 1.2 },
]

export function HeroCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) / (rect.width / 2)
      const deltaY = (e.clientY - centerY) / (rect.height / 2)
      const rotateY = Math.max(-MAX_TILT, Math.min(MAX_TILT, deltaX * MAX_TILT))
      const rotateX = Math.max(-MAX_TILT, Math.min(MAX_TILT, -deltaY * MAX_TILT))
      setRotate({ x: rotateX, y: rotateY })
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setRotate({ x: 0, y: 0 })
  }, [])

  return (
    <div
      className="relative w-[350px] shrink-0"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        className="relative"
        animate={{ y: [0, -FLOAT_OFFSET, 0] }}
        transition={{
          duration: FLOAT_DURATION,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: "transform 0.1s ease",
        }}
      >
        <GlassCard className="w-[350px] overflow-hidden border border-border">
          {/* Preview area — 200px */}
          <div
            className="relative flex h-[200px] w-full items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--purple) 0%, #0d0d2b 50%, #0a0a1a 100%)",
            }}
          >
            <span
              className="relative z-10 text-[60px] leading-none"
              style={{
                filter: "drop-shadow(0 0 24px var(--purple-glow))",
              }}
            >
              🐉
            </span>
          </div>

          {/* Body — padding 20px */}
          <div className="p-5">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-purple/20 px-2.5 py-0.5 text-xs font-medium text-purple">
                3D
              </span>
              <span className="rounded-full bg-cyan/20 px-2.5 py-0.5 text-xs font-medium text-cyan">
                Unity
              </span>
            </div>
            <h3 className="font-syne text-lg font-bold text-text-primary">
              Dragon Warrior Pack
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: "var(--cyan)" }}
              />
              <span className="text-sm text-text-muted">PixelForge</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="font-mono text-lg font-semibold"
                style={{
                  background: "linear-gradient(135deg, var(--cyan), var(--purple))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                $24
              </span>
              <span className="text-sm text-text-muted">
                <span className="text-gold">★</span> 4.9
              </span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Micro-badges around the card */}
      {BADGES.map(({ label, position, delay }) => (
        <motion.div
          key={position}
          className={cn(
            "absolute z-20",
            position === "top-left" && "-left-1 -top-2",
            position === "top-right" && "-right-1 -top-2",
            position === "right-middle" && "-right-2 top-1/2 -translate-y-1/2",
            position === "bottom-left" && "-left-1 -bottom-2",
            position === "bottom-right" && "-right-1 -bottom-2"
          )}
          animate={{ y: [0, -FLOAT_OFFSET * 0.5, 0] }}
          transition={{
            duration: FLOAT_DURATION,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          }}
        >
          <span
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              "bg-[rgba(255,255,255,0.03)] backdrop-blur-[12px]",
              "border border-border text-text-primary"
            )}
          >
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
