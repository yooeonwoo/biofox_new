"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 텍스트 크기 변형
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  /**
   * 글꼴 두께
   * @default "semibold"
   */
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold"
}

/**
 * 단순한 텍스트 컴포넌트
 * 
 * @example
 * ```tsx
 * <SimpleText>일반 텍스트</SimpleText>
 * <SimpleText size="2xl" weight="bold">굵은 큰 텍스트</SimpleText>
 * ```
 */
export function SimpleText({
  children,
  className,
  size = "md",
  weight = "semibold",
  ...props
}: SimpleTextProps) {
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
        "text-gray-800",
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// 기존 export 유지
export { SimpleText as GradientText } 