'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

// Chart container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: Record<string, any>;
  }
>(({ className, children, config, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('h-full w-full', className)} {...props}>
      {children}
    </div>
  );
});
ChartContainer.displayName = 'ChartContainer';

// Chart tooltip
const ChartTooltip = RechartsPrimitive.Tooltip;

// Chart tooltip content
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      ...props
    }: any,
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || 'value'}`;
      const itemConfig = item.payload;
      const value = !labelKey && typeof label === 'string' ? itemConfig?.[label] : label;

      if (labelFormatter && typeof value !== 'undefined') {
        return labelFormatter(value, payload);
      }

      return value;
    }, [label, labelFormatter, payload, hideLabel, labelKey]);

    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {tooltipLabel ? <p className={cn('font-medium', labelClassName)}>{tooltipLabel}</p> : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`;
            const itemConfig = item.payload;
            const indicatorColor = color || item.payload?.fill || item.color;

            return (
              <div
                key={item.dataKey}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center'
                )}
              >
                {formatter && item?.value !== undefined && item?.name ? (
                  formatter(item.value, item.name, item, index, payload)
                ) : (
                  <>
                    {!hideIndicator && (
                      <div
                        className={cn(
                          'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
                          {
                            'h-2.5 w-2.5': indicator === 'dot',
                            'w-1': indicator === 'line',
                            'w-0 border-[1.5px] border-dashed bg-transparent':
                              indicator === 'dashed',
                            'my-0.5': indicator === 'dashed' || indicator === 'line',
                          }
                        )}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between leading-none',
                        hideIndicator ? 'items-end' : 'items-center'
                      )}
                    >
                      <div className="grid gap-1.5">
                        <span className="text-muted-foreground">{key}</span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

// Chart legend
const ChartLegend = RechartsPrimitive.Legend;

// Chart legend content
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> &
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }, ref) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div ref={ref} className={cn('flex items-center justify-center gap-4', className)}>
      {payload.map(item => {
        const key = `${nameKey || item.value || item.dataKey || 'value'}`;

        return (
          <div
            key={item.value}
            className={cn(
              'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
            )}
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span className="text-muted-foreground">{key}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = 'ChartLegendContent';

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
