"use client";

import { useEffect, useState } from "react";

interface StatItem {
  value: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: "10,000+", label: "Assets" },
  { value: "5,000+", label: "Developers" },
  { value: "500+", label: "Sellers" },
];

function AnimatedValue({ value }: { value: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <span
      className="tabular-nums transition-all duration-700 ease-out"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {value}
    </span>
  );
}

export function AnimatedStats() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
      {STATS.map(({ value, label }, i) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 text-center"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <AnimatedValue value={value} />
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
