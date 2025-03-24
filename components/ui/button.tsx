import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-biofox-purple-light/50 focus-visible:ring-offset-1 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-biofox-purple text-white hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:shadow-lg hover:shadow-biofox-purple-light/20",
        gradient:
          "bg-gradient-to-r from-aurora-pink via-aurora-violet to-aurora-blue text-white hover:shadow-lg hover:shadow-biofox-purple-light/30 hover:opacity-90",
        destructive:
          "bg-red-500/80 text-white hover:bg-red-500/60",
        outline:
          "border border-biofox-purple-light/50 bg-transparent text-biofox-purple hover:bg-gradient-to-r hover:from-aurora-pink hover:via-aurora-violet hover:to-aurora-blue hover:text-white hover:border-transparent",
        secondary:
          "bg-dark-gray-1 text-white hover:bg-dark-gray-1/80",
        ghost:
          "text-white hover:bg-dark-gray-1/60",
        link: 
          "text-aurora-violet underline-offset-4 hover:underline",
        modern: 
          "bg-[rgba(30,30,40,0.6)] backdrop-blur-md text-white border border-white/10 hover:border-biofox-purple-light/30 hover:shadow-biofox-purple-light/20 hover:-translate-y-0.5 transition-all",
        neon: 
          "relative overflow-hidden text-white bg-[rgba(30,30,40,0.7)] before:absolute before:inset-0 before:rounded-md before:p-[1px] before:bg-gradient-to-r before:from-aurora-pink before:via-aurora-violet before:to-aurora-blue before:-z-10 hover:shadow-biofox-purple-light/30",
        glass: 
          "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20",
        "modern-light": 
          "bg-white/70 backdrop-blur-md text-gray-800 border border-gray-200/50 hover:border-biofox-purple-light/30 hover:shadow-biofox-purple-light/20 hover:-translate-y-0.5 transition-all",
        "neon-light": 
          "relative overflow-hidden text-gray-800 bg-white/70 before:absolute before:inset-0 before:rounded-md before:p-[1px] before:bg-gradient-to-r before:from-aurora-pink before:via-aurora-violet before:to-aurora-blue before:-z-10 hover:shadow-biofox-purple-light/30",
        "glass-light": 
          "bg-white/70 backdrop-blur-md border border-gray-200/50 text-gray-800 hover:bg-white/90 hover:border-biofox-purple-light/30",
        "default-light":
          "bg-white text-gray-800 border border-gray-200 hover:border-biofox-purple-light/50 hover:shadow-lg hover:shadow-biofox-purple-light/20",
        "gradient-light":
          "bg-gradient-to-r from-aurora-pink/20 via-aurora-violet/20 to-aurora-blue/20 text-gray-800 hover:shadow-lg hover:shadow-biofox-purple-light/30 hover:opacity-90",
        "ghost-light":
          "text-gray-800 hover:bg-gray-100"
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
