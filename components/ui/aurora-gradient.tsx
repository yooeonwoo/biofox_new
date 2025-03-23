import React from 'react';
import { cn } from '@/lib/utils';

interface AuroraGradientProps {
  className?: string;
  children?: React.ReactNode;
  containerClassName?: string;
}

export function AuroraGradient({
  className = '',
  children,
  containerClassName = '',
}: AuroraGradientProps) {
  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10',
          'animate-aurora-slow backdrop-blur-3xl',
          className
        )}
      />
      {children}
    </div>
  );
}

interface AuroraTextProps {
  text: string;
  className?: string;
}

export function AuroraText({ text, className = '' }: AuroraTextProps) {
  return (
    <span
      className={cn(
        'bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-400',
        'animate-aurora-text',
        className
      )}
    >
      {text}
    </span>
  );
}

interface AuroraButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AuroraButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}: AuroraButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative px-6 py-2 rounded-full overflow-hidden',
        'text-purple-800 font-medium transition-all',
        'shadow-[0_0_10px_rgba(139,92,246,0.5)]',
        'hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-aurora-slow" />
      <span className="absolute inset-0 opacity-0 hover:opacity-20 bg-white transition-opacity" />
      <span className="relative">{children}</span>
    </button>
  );
}

interface AuroraCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuroraCard({ children, className = '' }: AuroraCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        'bg-black/20 backdrop-blur-xl border border-white/10',
        'p-6 shadow-xl',
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 animate-aurora-slow" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-aurora-fast" />
      {children}
    </div>
  );
} 