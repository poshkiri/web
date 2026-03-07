"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { GlowButton } from "@/components/ui/GlowButton"
import { cn } from "@/lib/utils"

const ROTATING_WORDS = ["Epic", "Premium", "Stunning"]
const TYPE_DELAY_MS = 100
const DELETE_DELAY_MS = 80
const PAUSE_BETWEEN_WORDS_MS = 1500

const container = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: i * 0.1 },
  }),
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export function HeroContent({ className }: { className?: string }) {
  const router = useRouter()
  const [wordIndex, setWordIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const word = ROTATING_WORDS[wordIndex]

    const run = () => {
      if (isDeleting) {
        if (displayText.length === 0) {
          // Слово стёрто — пауза, потом следующее слово
          const nextIndex = (wordIndex + 1) % ROTATING_WORDS.length
          const timeoutId = setTimeout(() => {
            setWordIndex(nextIndex)
            setIsDeleting(false)
          }, PAUSE_BETWEEN_WORDS_MS)
          return timeoutId
        }
        // Стираем по букве
        const timeoutId = setTimeout(() => {
          setDisplayText(word.slice(0, displayText.length - 1))
        }, DELETE_DELAY_MS)
        return timeoutId
      }

      // Печатаем
      if (displayText === word) {
        // Слово напечатано — пауза, потом стирание
        const timeoutId = setTimeout(() => {
          setIsDeleting(true)
        }, PAUSE_BETWEEN_WORDS_MS)
        return timeoutId
      }
      // Добавляем букву
      const timeoutId = setTimeout(() => {
        setDisplayText(word.slice(0, displayText.length + 1))
      }, TYPE_DELAY_MS)
      return timeoutId
    }

    const timeoutId = run()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [wordIndex, displayText, isDeleting])

  return (
    <motion.div
      className={cn(
        "relative z-10 mx-auto max-w-4xl px-4 pt-16 pb-24 text-center sm:pt-24 sm:pb-32",
        className
      )}
      variants={container}
      initial="hidden"
      animate="visible"
      custom={0}
    >
      {/* 1. Badge */}
      <motion.div variants={item} className="flex justify-center lg:justify-start">
        <div
          className={cn(
            "relative inline-flex rounded-full p-[1px]",
            "bg-gradient-to-r from-[var(--color-purple)] via-[var(--color-cyan)] to-[var(--color-purple)]"
          )}
        >
          <span
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              "bg-[var(--color-bg-card)] backdrop-blur-md",
              "text-[var(--color-text)]"
            )}
          >
            ✦ The #1 Marketplace for Game Creators
          </span>
        </div>
      </motion.div>

      {/* 2. Headline with typewriter word */}
      <motion.h1
        variants={item}
        className="mt-8 text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl md:text-6xl"
      >
        Fuel Your Game With{" "}
        <span className="relative inline-block min-w-[140px] text-left sm:min-w-[180px]">
          <span className="bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-cyan)] bg-clip-text text-transparent">
            {displayText}
          </span>
          <span
            className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-[var(--color-cyan)] align-baseline"
            aria-hidden
          />
          {/* Invisible spacer so layout doesn't jump */}
          <span className="invisible" aria-hidden>
            {ROTATING_WORDS.reduce((a, b) => (a.length >= b.length ? a : b), "")}
          </span>
        </span>
        {" "}Assets
      </motion.h1>

      {/* 3. Subtitle */}
      <motion.p
        variants={item}
        className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-text-muted)] sm:text-xl"
      >
        3D models, textures, sound packs, and ready-to-use assets for Unity, Unreal, and Godot. Created by pros, for indie devs.
      </motion.p>

      {/* 4. CTA buttons */}
      <motion.div
        variants={item}
        className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
      >
        <GlowButton variant="primary" onClick={() => router.push("/assets")}>
          Browse Assets
        </GlowButton>
        <GlowButton variant="ghost" onClick={() => router.push("/upload")}>
          Sell Assets
        </GlowButton>
      </motion.div>

      {/* 5. Social proof */}
      <motion.div
        variants={item}
        className="mt-14 flex items-center justify-center gap-3 lg:justify-start"
      >
        <div className="flex -space-x-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "h-9 w-9 rounded-full border-2 border-[var(--color-bg)]",
                "bg-[var(--color-border)] flex items-center justify-center",
                "text-xs font-medium text-[var(--color-text-muted)]"
              )}
              title={`Developer ${i}`}
            >
              {String.fromCodePoint(0x1f466 + (i % 3))}
            </div>
          ))}
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text)]">12,000+</span> developers already building
        </p>
      </motion.div>
    </motion.div>
  )
}
