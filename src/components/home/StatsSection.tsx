"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const STATS = [
  { value: 10247, display: "10K+", label: "Assets", icon: "🎮" },
  { value: 5891, display: "5.8K+", label: "Developers", icon: "👾" },
  { value: 487, display: "487+", label: "Sellers", icon: "🛠️" },
  { value: 2400000, display: "$2.4M+", label: "Paid to Creators", icon: "💰" },
]

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true)
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return { count, ref }
}

function formatCount(count: number, value: number): string {
  if (value >= 1_000_000) {
    return "$" + (count / 1_000_000).toFixed(1) + "M+"
  }
  return count.toLocaleString() + "+"
}

function StatBlock({
  stat,
  showDivider,
}: {
  stat: (typeof STATS)[number]
  showDivider: boolean
}) {
  const { count, ref } = useCountUp(stat.value)
  const formatted = formatCount(count, stat.value)

  return (
    <div
      ref={ref}
      className="flex flex-1 basis-full items-center justify-center py-4 sm:basis-0 sm:py-0"
    >
      {showDivider && (
        <span
          className="mr-6 h-12 w-px shrink-0 self-center sm:mr-8"
          style={{ background: "rgba(255,255,255,0.15)" }}
          aria-hidden
        />
      )}
      <div className="flex flex-col items-center text-center">
        <span className="text-2xl" aria-hidden>
          {stat.icon}
        </span>
        <span
          className="font-mono font-bold"
          style={{
            background: "linear-gradient(90deg, var(--purple), var(--cyan))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "clamp(32px, 5vw, 52px)",
            lineHeight: 1.2,
          }}
        >
          {formatted}
        </span>
        <span className="mt-1 text-sm text-text-muted">{stat.label}</span>
      </div>
    </div>
  )
}

export function StatsSection() {
  return (
    <section
      className={cn(
        "w-full border-t border-b border-border",
        "py-16 sm:py-20"
      )}
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(120,87,255,0.08) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(6,214,255,0.06) 0%, transparent 40%), var(--bg-deep)",
      }}
      aria-labelledby="stats-heading"
    >
      <h2 id="stats-heading" className="sr-only">
        Platform statistics
      </h2>
      <div className="mx-auto flex max-w-6xl flex-wrap items-stretch justify-center px-4 sm:flex-nowrap sm:px-6">
        {STATS.map((stat, i) => (
          <StatBlock key={stat.label} stat={stat} showDivider={i > 0} />
        ))}
      </div>
    </section>
  )
}
