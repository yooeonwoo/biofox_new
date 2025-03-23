import * as React from "react"
import { cn } from "@/lib/utils"

interface GradientTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of colors for the gradient
   * @default ["#0EA5E9", "#8B5CF6", "#EC4899"]
   */
  colors?: string[]
  /**
   * Animation duration in seconds
   * @default 8
   */
  animationSpeed?: number
  /**
   * Show animated border
   * @default false
   */
  showBorder?: boolean
  /**
   * Text size variant
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  /**
   * Font weight
   * @default "semibold"
   */
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold"
}

export function GradientText({
  children,
  className,
  colors = ["#0EA5E9", "#8B5CF6", "#EC4899"],
  animationSpeed = 8,
  showBorder = false,
  size = "md",
  weight = "semibold",
  ...props
}: GradientTextProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  }

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  }

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex max-w-fit flex-row items-center justify-center",
        "rounded-[1.25rem] backdrop-blur transition-shadow duration-500",
        "overflow-hidden",
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
      {...props}
    >
      {showBorder && (
        <div
          className="absolute inset-0 bg-cover z-0 pointer-events-none animate-gradient"
          style={{
            ...gradientStyle,
            backgroundSize: "300% 100%",
          }}
        >
          <div
            className="absolute inset-0 bg-background rounded-[1.25rem] z-[-1]"
            style={{
              width: "calc(100% - 2px)",
              height: "calc(100% - 2px)",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      )}
      <div
        className="inline-block relative z-2 text-transparent bg-cover animate-gradient px-4 py-2"
        style={{
          ...gradientStyle,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          backgroundSize: "300% 100%",
        }}
      >
        {children}
      </div>
    </div>
  )
} 