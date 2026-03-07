"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"
import { cn } from "@/lib/utils"

const DURATION_MS = 2000

const STATS: Array<{
  value: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
}> = [
  { value: 10247, label: "Assets" },
  { value: 5891, label: "Developers" },
  { value: 487, label: "Sellers" },
  { value: 2.4, label: "Paid Out", prefix: "$", suffix: "M", decimals: 1 },
]

function useCounter(target: number, isInView: boolean, decimals = 0) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!isInView) return
    startRef.current = performance.now()
    setDisplay(0)

    const tick = (now: number) => {
      const start = startRef.current ?? now
      const elapsed = now - start
      const t = Math.min(elapsed / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = target * eased
      setDisplay(decimals > 0 ? Number(current.toFixed(decimals)) : Math.round(current))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isInView, target, decimals])

  return display
}

function StatBlock({
  target,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  isInView,
  showDivider,
}: {
  target: number
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  isInView: boolean
  showDivider: boolean
}) {
  const display = useCounter(target, isInView, decimals)
  const formatted =
    decimals > 0
      ? `${prefix}${display.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${suffix}`
      : `${prefix}${display.toLocaleString()}${suffix}`

  return (
    <div className="flex flex-1 basis-full items-center justify-center py-4 sm:basis-0 sm:py-0">
      {showDivider && (
        <span
          className="mr-6 h-12 w-px shrink-0 self-center sm:mr-8"
          style={{ background: "rgba(255,255,255,0.15)" }}
          aria-hidden
        />
      )}
      <div className="flex flex-col items-center text-center">
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
        <span className="mt-1 text-sm text-text-muted">{label}</span>
      </div>
    </div>
  )
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section
      ref={ref}
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
          <StatBlock
            key={stat.label}
            target={stat.value}
            label={stat.label}
            prefix={stat.prefix}
            suffix={stat.suffix}
            decimals={stat.decimals}
            isInView={isInView}
            showDivider={i > 0}
          />
        ))}
      </div>
    </section>
  )
}
