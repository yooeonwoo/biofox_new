import React from 'react';
import { cn } from '@/lib/utils';

interface FoxLogoProps {
  className?: string;
}

export function FoxLogo({ className }: FoxLogoProps) {
  return (
    <svg
      className={cn("text-purple-600", className)}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        fill="url(#biofox-gradient-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Define the gradient */}
      <defs>
        <linearGradient id="biofox-gradient-primary" x1="2" y1="7" x2="22" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F29FBD" />
          <stop offset="0.333" stopColor="#E78FAF" />
          <stop offset="0.667" stopColor="#ABA3F7" />
          <stop offset="1" stopColor="#8E80F5" />
        </linearGradient>
      </defs>
    </svg>
  );
} 