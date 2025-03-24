"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

const simpleButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center",
    "rounded-md px-6 py-3",
    "text-sm font-medium",
    "transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "group",
  ],
  {
    variants: {
      variant: {
        primary: "bg-gray-800 text-white shadow-sm hover:bg-gray-700 hover:-translate-y-0.5",
        secondary: "bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300 hover:-translate-y-0.5",
        outline: "bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-100",
        ghost: "bg-transparent text-gray-800 hover:bg-gray-100",
      },
      size: {
        sm: "h-9 px-4 py-2 text-xs rounded-md",
        default: "h-10 px-6 py-3 text-sm",
        lg: "h-12 px-8 py-4 text-base rounded-md",
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

export interface SimpleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof simpleButtonVariants> {
  asChild?: boolean
  showIcon?: boolean
}

const SimpleButton = React.forwardRef<HTMLButtonElement, SimpleButtonProps>(
  ({ className, variant, size, asChild = false, showIcon = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(simpleButtonVariants({ variant, size, hasIcon: showIcon, className }))}
        ref={ref}
        {...props}
      >
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          <span>{children}</span>
          {showIcon && <ArrowUpRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
        </div>
      </Comp>
    )
  }
)
SimpleButton.displayName = "SimpleButton"

// Simple Card Component
interface SimpleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  footer?: React.ReactNode
  variant?: "default" | "bordered" | "elevated"
}

const SimpleCard = React.forwardRef<HTMLDivElement, SimpleCardProps>(
  ({ className, title, description, footer, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl overflow-hidden",
          "transition-all duration-300",
          variant === "default" && "bg-white text-gray-800 border border-gray-200",
          variant === "bordered" && "bg-white text-gray-800 border border-gray-300",
          variant === "elevated" && "bg-white text-gray-800 border border-gray-200 shadow-md",
          "hover:-translate-y-1",
          "group",
          className
        )}
        {...props}
      >
        {/* Card content */}
        <div className="p-6 space-y-4">
          {title && <h3 className="text-xl font-semibold">{title}</h3>}
          {description && <p className="text-muted-foreground">{description}</p>}
          {children}
        </div>
        
        {footer && (
          <div className={cn(
            "px-6 py-4 border-t border-gray-200 bg-gray-50"
          )}>
            {footer}
          </div>
        )}
      </div>
    )
  }
)
SimpleCard.displayName = "SimpleCard"

// 원래 export를 유지하되 새 컴포넌트도 export
export { SimpleButton as ModernGradientButton, SimpleCard as ModernGradientCard, simpleButtonVariants as modernGradientButtonVariants } 