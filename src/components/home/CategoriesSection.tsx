"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
  Image,
  Box,
  Music,
  Layout,
  Puzzle,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  {
    name: "2D Sprites",
    slug: "2d-sprites",
    gradient: "linear-gradient(135deg, #4f0599, #7857ff)",
    icon: Image,
    count: 1240,
  },
  {
    name: "3D Models",
    slug: "3d-models",
    gradient: "linear-gradient(135deg, #005c97, #06d6ff)",
    icon: Box,
    count: 3180,
  },
  {
    name: "Audio",
    slug: "audio",
    gradient: "linear-gradient(135deg, #c2185b, #f72585)",
    icon: Music,
    count: 890,
  },
  {
    name: "UI Kits",
    slug: "ui-kits",
    gradient: "linear-gradient(135deg, #e65100, #ffd60a)",
    icon: Layout,
    count: 456,
  },
  {
    name: "Mods",
    slug: "mods",
    gradient: "linear-gradient(135deg, #1b5e20, #00e676)",
    icon: Puzzle,
    count: 720,
  },
  {
    name: "VFX",
    slug: "vfx",
    gradient: "linear-gradient(135deg, #b71c1c, #ff6d00)",
    icon: Sparkles,
    count: 534,
  },
] as const

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function CategoriesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  return (
    <section className="px-4 py-24" aria-labelledby="categories-heading">
      <div className="mx-auto max-w-6xl">
        <div ref={ref} className="text-center">
          <p
            className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted"
            style={{ letterSpacing: "3px" }}
          >
            EXPLORE
          </p>
          <h2
            id="categories-heading"
            className="mt-2 font-syne text-3xl font-bold text-text-primary sm:text-4xl"
          >
            Find What You{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                background: "linear-gradient(90deg, var(--purple), var(--cyan))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              Need
            </span>
          </h2>
        </div>

        <motion.div
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <motion.div key={cat.slug} variants={item}>
                <Link href={`/assets?category=${cat.slug}`} className="block">
                  <motion.div
                    className={cn(
                      "group relative flex h-[160px] items-center gap-4 overflow-hidden rounded-2xl p-5",
                      "transition-shadow duration-300"
                    )}
                    style={{ background: cat.gradient }}
                    whileHover={{
                      y: -6,
                      boxShadow:
                        "0 20px 40px rgba(0,0,0,0.25), 0 0 32px var(--purple-glow)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-syne font-bold text-white">
                        {cat.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-white/80">
                        {cat.count.toLocaleString()} assets
                      </p>
                    </div>
                    <ArrowRight
                      className="h-6 w-6 shrink-0 text-white/90 transition-transform group-hover:translate-x-1"
                      strokeWidth={2}
                    />
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
