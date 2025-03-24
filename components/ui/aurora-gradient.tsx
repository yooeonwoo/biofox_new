import React from "react";
import { cn } from '@/lib/utils';

interface SimpleContainerProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export function SimpleContainer({
  children,
  className,
  containerClassName,
}: SimpleContainerProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <div
        className={cn(
          "relative z-10",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface SimpleTextProps {
  text: string;
  className?: string;
}

export function SimpleText({ text, className = '' }: SimpleTextProps) {
  return (
    <span
      className={cn(
        'text-gray-800',
        className
      )}
    >
      {text}
    </span>
  );
}

interface SimpleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
}

export function SimpleButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  variant = 'default',
  size = 'default',
}: SimpleButtonProps) {
  const variantStyles = {
    default: "bg-gray-800 text-white shadow-sm hover:bg-gray-700",
    outline: "border border-gray-300 text-gray-800 hover:bg-gray-100",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  };
  
  const sizeStyles = {
    sm: "text-xs px-4 py-1.5 rounded-lg",
    default: "text-sm px-6 py-2 rounded-md",
    lg: "text-base px-8 py-2.5 rounded-md",
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative transition-all duration-300',
        'font-medium',
        'focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

interface SimpleCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outlined";
}

export function SimpleCard({ 
  children, 
  className = '',
  variant = "default"
}: SimpleCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        variant === "default" ? [
          'bg-white shadow-md border border-gray-200 text-gray-800',
          'p-6'
        ] : [
          'bg-white border border-gray-300',
          'p-6 text-gray-800'
        ],
        className
      )}
    >
      {children}
    </div>
  );
}

// AuroraGradient, AuroraText, AuroraButton, AuroraCard를 각각
// SimpleContainer, SimpleText, SimpleButton, SimpleCard로 리네이밍
export { SimpleContainer as AuroraGradient, SimpleText as AuroraText, SimpleButton as AuroraButton, SimpleCard as AuroraCard }; 