"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { name: "2D Sprites", slug: "2d-sprites", emoji: "🖼️", count: 1240 },
  { name: "3D Models", slug: "3d-models", emoji: "🎮", count: 3180 },
  { name: "Audio", slug: "audio", emoji: "🎵", count: 890 },
  { name: "UI Kits", slug: "ui-kits", emoji: "🧩", count: 456 },
  { name: "Mods", slug: "mods", emoji: "⚙️", count: 720 },
  { name: "VFX & Shaders", slug: "vfx-shaders", emoji: "✨", count: 534 },
]

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function CategoriesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.15 })

  return (
    <section className="px-4 py-24" aria-labelledby="categories-heading">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          ref={ref}
          id="categories-heading"
          className="text-center text-2xl font-bold text-[var(--color-text)] sm:text-3xl"
          initial={isInView ? false : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          Browse by category
        </motion.h2>
        <motion.p
          className="mx-auto mt-2 max-w-xl text-center text-[var(--color-text-muted)]"
          initial={isInView ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Find assets for your next project
        </motion.p>

        <motion.div
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {CATEGORIES.map((cat) => (
            <motion.div key={cat.slug} variants={item}>
              <Link href={`/assets?category=${cat.slug}`} className="block">
                <GlassCard
                  className={cn(
                    "group relative transition-shadow duration-300",
                    "hover:-translate-y-[4px] hover:shadow-[0_0_24px_rgba(108,71,255,0.2),0_0_48px_rgba(0,212,255,0.08)]",
                    "hover:border-[rgba(108,71,255,0.35)]"
                  )}
                >
                  <div className="flex items-start gap-4 p-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl",
                        "bg-gradient-to-br from-[var(--color-purple)]/30 to-[var(--color-cyan)]/20"
                      )}
                    >
                      {cat.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-cyan)] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                        {cat.count.toLocaleString()} assets
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
