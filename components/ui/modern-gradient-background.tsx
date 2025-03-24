"use client";

import { cn } from "@/lib/utils";
import React from "react";

export interface ModernGradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  blendingValue?: string;
}

export const ModernGradientBackground = ({
  children,
  className,
  containerClassName,
  gradientBackgroundStart = "rgb(10, 10, 10)",
  gradientBackgroundEnd = "rgb(15, 15, 15)",
  firstColor = "255, 138, 226",
  secondColor = "139, 92, 246",
  thirdColor = "103, 232, 249",
  fourthColor = "109, 40, 217",
  blendingValue = "soft-light"
}: ModernGradientBackgroundProps) => {
  return (
    <div
      className={cn(
        "min-h-screen w-full relative",
        containerClassName
      )}
      style={{
        background: `linear-gradient(to bottom, ${gradientBackgroundStart}, ${gradientBackgroundEnd})`,
      }}
    >
      {/* 오로라 효과 레이어 */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{ 
          backgroundImage: `
            radial-gradient(circle at 15% 50%, rgba(${firstColor}, 0.8) 0%, rgba(${firstColor}, 0) 25%),
            radial-gradient(circle at 85% 30%, rgba(${secondColor}, 0.8) 0%, rgba(${secondColor}, 0) 25%),
            radial-gradient(circle at 75% 85%, rgba(${thirdColor}, 0.8) 0%, rgba(${thirdColor}, 0) 25%),
            radial-gradient(circle at 35% 75%, rgba(${fourthColor}, 0.8) 0%, rgba(${fourthColor}, 0) 25%)
          `,
          mixBlendMode: blendingValue as any
        }}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}; 