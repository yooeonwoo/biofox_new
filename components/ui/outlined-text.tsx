import React from 'react';
import { cn } from '@/lib/utils';

interface OutlinedTextProps {
  text: string;
  className?: string;
  outlineColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
}

export function OutlinedText({
  text,
  className,
  outlineColor = 'rgba(0, 0, 0, 0.8)',
  textColor = 'white',
  fontSize = '1rem',
  fontWeight = 'normal',
}: OutlinedTextProps) {
  return (
    <span
      className={cn('relative inline-block', className)}
      style={{
        color: textColor,
        fontSize,
        fontWeight,
        textShadow: `
          -1px -1px 0 ${outlineColor},
          1px -1px 0 ${outlineColor},
          -1px 1px 0 ${outlineColor},
          1px 1px 0 ${outlineColor},
          0px -1px 0 ${outlineColor},
          0px 1px 0 ${outlineColor},
          -1px 0px 0 ${outlineColor},
          1px 0px 0 ${outlineColor}
        `,
      }}
    >
      {text}
    </span>
  );
} 