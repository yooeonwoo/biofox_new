'use client';

import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down';
    text?: string;
  };
  footer?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend,
  footer
}: MetricCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-full ${iconBgColor} p-2 ${iconColor}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formattedValue}
        </div>
        {trend && (
          <div className={`mt-1 flex items-center text-xs ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="mr-1 h-3 w-3" />
            <span>{trend.text || `전월 대비 ${trend.value}${trend.direction === 'up' ? '↑' : '↓'}`}</span>
          </div>
        )}
        {footer && (
          <div className="mt-1 text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 