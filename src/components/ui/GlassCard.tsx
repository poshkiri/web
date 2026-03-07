import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[20px] border border-border backdrop-blur-[12px]",
        "bg-[rgba(255,255,255,0.03)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
