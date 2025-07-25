import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

/**
 * 간단한 진행률 바 컴포넌트 (Radix 의존성 없이 구현)
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.round((value / max) * 100));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}
        {...props}
      >
        {/* eslint-disable-next-line no-inline-styles */}
        <div
          className="absolute left-0 top-0 h-full bg-black transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';
