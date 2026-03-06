"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { cn } from "@/lib/utils"

const FLOAT_DURATION_CARD = 3
const BADGES = [
  { label: "Unity ✓", position: "top-left", delay: 0, duration: 2.8 },
  { label: "4.9 ★", position: "top-right", delay: 0.2, duration: 3.2 },
  { label: "$12", position: "bottom-left", delay: 0.4, duration: 2.6 },
  { label: "2.3k downloads", position: "bottom-right", delay: 0.6, duration: 3.4 },
] as const

export function HeroAssetCard() {
  const { scrollY } = useScroll()
  const parallaxY = useTransform(scrollY, [0, 400], [0, -36])

  return (
    <div className="absolute right-4 top-1/2 z-10 hidden w-[280px] shrink-0 lg:block xl:right-12 xl:w-[320px]">
      <motion.div
        style={{ y: parallaxY }}
        className="relative"
      >
        {/* Floating card */}
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{
            duration: FLOAT_DURATION_CARD,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="relative"
        >
          <GlassCard className="overflow-hidden">
            {/* Placeholder preview */}
            <div
              className="aspect-video w-full bg-[var(--color-border)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(108,71,255,0.15) 0%, rgba(0,212,255,0.08) 50%, rgba(255,45,120,0.1) 100%)",
              }}
            />
            <div className="p-3 sm:p-4">
              <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
                Stylized Environment Pack
              </h3>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                by PixelForge
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-cyan)]">
                  $12
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <span className="text-[var(--color-pink)]">★</span> 4.9 (128)
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Badges around the card */}
        {BADGES.map(({ label, position, delay, duration }) => (
          <motion.div
            key={position}
            className={cn(
              "absolute z-20",
              position === "top-left" && "-left-2 -top-2",
              position === "top-right" && "-right-2 -top-2",
              position === "bottom-left" && "-bottom-2 -left-2",
              position === "bottom-right" && "-bottom-2 -right-2"
            )}
            animate={{ y: [-8, 8, -8] }}
            transition={{
              duration,
              repeat: Infinity,
              repeatType: "reverse",
              delay,
            }}
          >
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                "bg-[var(--color-bg-card)] backdrop-blur-md",
                "border border-[var(--color-border)]",
                "text-[var(--color-text)]"
              )}
            >
              {label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
