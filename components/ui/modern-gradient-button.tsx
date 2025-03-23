"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

const modernGradientButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-xl px-6 py-3",
    "text-sm font-medium",
    "transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "overflow-hidden",
    "group",
  ],
  {
    variants: {
      variant: {
        primary: "text-purple-800 border border-transparent",
        secondary: "bg-background text-foreground border border-border",
        outline: "bg-transparent border border-border",
      },
      size: {
        sm: "h-9 px-4 py-2 text-xs rounded-lg",
        default: "h-10 px-6 py-3 text-sm",
        lg: "h-12 px-8 py-4 text-base rounded-xl",
      },
      hasIcon: {
        true: "pr-4",
        false: "",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      hasIcon: false,
    },
  }
)

export interface ModernGradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernGradientButtonVariants> {
  asChild?: boolean
  showIcon?: boolean
}

const ModernGradientButton = React.forwardRef<HTMLButtonElement, ModernGradientButtonProps>(
  ({ className, variant, size, asChild = false, showIcon = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(modernGradientButtonVariants({ variant, size, hasIcon: showIcon, className }))}
        ref={ref}
        {...props}
      >
        {/* Gradient background effect */}
        <div
          className={cn(
            "absolute inset-0 z-0",
            variant === "primary" 
              ? "bg-gradient-to-r from-purple-200 via-violet-400 to-indigo-600" 
              : "bg-gradient-to-r from-slate-300 to-slate-500 opacity-0 group-hover:opacity-10",
            "transition-opacity duration-300",
          )}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <span>{children}</span>
          {showIcon && <ArrowUpRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
        </div>
      </Comp>
    )
  }
)
ModernGradientButton.displayName = "ModernGradientButton"

// Modern Gradient Card Component
interface ModernGradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  footer?: React.ReactNode
  variant?: "default" | "bordered" | "elevated"
}

const ModernGradientCard = React.forwardRef<HTMLDivElement, ModernGradientCardProps>(
  ({ className, title, description, footer, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl overflow-hidden",
          "bg-background text-foreground",
          "transition-all duration-300",
          variant === "bordered" && "border border-border",
          variant === "elevated" && "shadow-lg",
          "group",
          className
        )}
        {...props}
      >
        {/* Gradient border effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl p-[1px] -z-10",
            "bg-gradient-to-r from-purple-200 via-violet-400 to-indigo-600",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-500",
            variant === "bordered" ? "opacity-30" : ""
          )}
        />
        
        {/* Card content */}
        <div className="p-6 space-y-4">
          {title && <h3 className="text-xl font-semibold">{title}</h3>}
          {description && <p className="text-muted-foreground">{description}</p>}
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 bg-muted/50 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    )
  }
)
ModernGradientCard.displayName = "ModernGradientCard"

export { ModernGradientButton, ModernGradientCard, modernGradientButtonVariants } 