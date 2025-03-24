import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "gradient" | "glass" | "dark" | "outline" | "modern" | "neon" | "glass-light" | "modern-light" | "neon-light"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "border bg-white text-gray-800 shadow-sm",
    gradient: "border-transparent bg-gradient-to-r from-aurora-pink/10 via-aurora-violet/10 to-aurora-blue/10 text-gray-800 shadow-lg hover:shadow-biofox-purple-light/20",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-lg hover:border-white/20 hover:bg-white/8",
    dark: "bg-dark-gray-1 border-dark-gray-2 text-white shadow-md hover:shadow-biofox-purple-light/20",
    outline: "border-2 border-biofox-purple-light/30 bg-transparent text-white hover:border-biofox-purple-light/50 hover:shadow-sm hover:shadow-biofox-purple-light/10",
    modern: "bg-[rgba(30,30,40,0.5)] backdrop-blur-md border border-white/8 text-white shadow-lg relative overflow-hidden hover:border-biofox-purple-light/30 hover:shadow-biofox-purple-light/20 hover:-translate-y-1 transition-all duration-300",
    neon: "bg-dark-gray-1/90 border border-transparent relative overflow-hidden text-white shadow-lg before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-aurora-pink before:via-aurora-violet before:to-aurora-blue before:-z-10 hover:shadow-biofox-purple-light/30",
    "glass-light": "bg-white/80 backdrop-blur-md border border-gray-200/50 text-gray-800 shadow-lg hover:border-biofox-purple-light/30 hover:bg-white/90",
    "modern-light": "bg-white/90 backdrop-blur-md border border-gray-200/50 text-gray-800 shadow-lg relative overflow-hidden hover:border-biofox-purple-light/30 hover:shadow-biofox-purple-light/20 hover:-translate-y-1 transition-all duration-300",
    "neon-light": "bg-white/90 border border-transparent relative overflow-hidden text-gray-800 shadow-lg before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-r before:from-aurora-pink before:via-aurora-violet before:to-aurora-blue before:-z-10 hover:shadow-biofox-purple-light/30"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg transition-all duration-300", 
        variantStyles[variant],
        variant === "modern" && "after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 