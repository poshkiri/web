"use client"

import { useState } from "react"

const MARQUEE_TEXT =
  "3D MODELS · UI KITS · SOUND PACKS · VFX · TEXTURES · ANIMATIONS · SHADERS · SPRITES · MODS · "

export function MarqueeSection() {
  const [paused, setPaused] = useState(false)

  return (
    <section
      className="overflow-hidden border-t border-b border-border py-[18px]"
      style={{ background: "rgba(120,87,255,0.06)" }}
      aria-hidden
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="inline-flex whitespace-nowrap"
        style={{
          animation: "marquee 30s linear infinite",
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <span className="pr-8 text-sm font-medium tracking-wide text-text-primary">
          {MARQUEE_TEXT}
        </span>
        <span className="pr-8 text-sm font-medium tracking-wide text-text-primary">
          {MARQUEE_TEXT}
        </span>
      </div>
    </section>
  )
}
