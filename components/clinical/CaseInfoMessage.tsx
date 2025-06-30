'use client';

import React from 'react';
import { ICONS } from '@/constants/ui';

interface CaseInfoMessageProps {
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  className?: string;
  showIcon?: boolean;
}

export const CaseInfoMessage: React.FC<CaseInfoMessageProps> = ({
  message,
  type = 'info',
  className = '',
  showIcon = false
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getIcon = () => {
    const iconMap = {
      info: ICONS.info,
      warning: ICONS.warning,
      success: ICONS.success,
      error: ICONS.error,
    };
    const IconComponent = iconMap[type];
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className={`mt-6 text-center ${className}`}>
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getTypeStyles()}`}>
        {showIcon && getIcon()}
        <p className="text-sm">
          {message}
        </p>
      </div>
    </div>
  );
}; 