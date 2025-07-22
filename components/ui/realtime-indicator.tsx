'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Radio, Bell, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';

// 실시간 업데이트 펄스 애니메이션 컴포넌트
interface RealtimePulseProps {
  isUpdating?: boolean;
  children: React.ReactNode;
  pulseColor?: 'blue' | 'green' | 'orange' | 'red';
  className?: string;
}

export const RealtimePulse: React.FC<RealtimePulseProps> = ({
  isUpdating = false,
  children,
  pulseColor = 'blue',
  className,
}) => {
  const pulseColors = {
    blue: 'ring-blue-400/50 bg-blue-50',
    green: 'ring-green-400/50 bg-green-50',
    orange: 'ring-orange-400/50 bg-orange-50',
    red: 'ring-red-400/50 bg-red-50',
  };

  return (
    <motion.div
      className={cn('relative', className)}
      animate={
        isUpdating
          ? {
              boxShadow: [
                '0 0 0 0 rgba(59, 130, 246, 0.7)',
                '0 0 0 10px rgba(59, 130, 246, 0)',
                '0 0 0 0 rgba(59, 130, 246, 0)',
              ],
            }
          : {}
      }
      transition={{
        duration: 1.5,
        repeat: isUpdating ? Infinity : 0,
        repeatType: 'reverse',
      }}
    >
      {children}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            className={cn(
              'pointer-events-none absolute -inset-1 rounded-lg ring-2',
              pulseColors[pulseColor]
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0.95, 1.02, 0.95],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 새로운 데이터 하이라이트 컴포넌트
interface NewDataHighlightProps {
  isNew?: boolean;
  children: React.ReactNode;
  highlightDuration?: number;
  className?: string;
}

export const NewDataHighlight: React.FC<NewDataHighlightProps> = ({
  isNew = false,
  children,
  highlightDuration = 3000,
  className,
}) => {
  const [shouldHighlight, setShouldHighlight] = useState(false);

  useEffect(() => {
    if (isNew) {
      setShouldHighlight(true);
      const timer = setTimeout(() => {
        setShouldHighlight(false);
      }, highlightDuration);

      return () => clearTimeout(timer);
    }
  }, [isNew, highlightDuration]);

  return (
    <motion.div
      className={cn('relative', className)}
      animate={
        shouldHighlight
          ? {
              backgroundColor: ['rgb(254, 249, 195)', 'rgb(255, 255, 255)'],
            }
          : {}
      }
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {children}
      <AnimatePresence>
        {shouldHighlight && (
          <motion.div
            className="absolute -left-1 bottom-0 top-0 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-600"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 연결 상태 표시기 컴포넌트
interface ConnectionStatusProps {
  isConnected: boolean;
  showText?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  showText = true,
  className,
}) => {
  return (
    <motion.div
      className={cn('flex items-center gap-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{
          scale: isConnected ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isConnected ? Infinity : 0,
          repeatType: 'reverse',
        }}
      >
        {isConnected ? (
          <Radio className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
      </motion.div>
      {showText && (
        <span
          className={cn('text-xs font-medium', isConnected ? 'text-green-600' : 'text-red-600')}
        >
          {isConnected ? '실시간 연결됨' : '연결 끊김'}
        </span>
      )}
    </motion.div>
  );
};

// 알림 배지 컴포넌트
interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  animate?: boolean;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  showZero = false,
  animate = true,
  className,
}) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const shouldShow = count > 0 || showZero;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={cn('relative', className)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
        >
          <Badge
            variant="destructive"
            className={cn(
              'flex h-5 min-w-[1.25rem] items-center justify-center px-1 text-xs',
              animate && count > 0 && 'animate-pulse'
            )}
          >
            {displayCount}
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 상태 변경 트랜지션 컴포넌트
interface StatusTransitionProps {
  status: string;
  previousStatus?: string;
  children: React.ReactNode;
  statusColors?: Record<string, string>;
  className?: string;
}

export const StatusTransition: React.FC<StatusTransitionProps> = ({
  status,
  previousStatus,
  children,
  statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    done: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
  },
  className,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, previousStatus]);

  return (
    <motion.div
      className={cn('relative', className)}
      animate={
        isTransitioning
          ? {
              scale: [1, 1.05, 1],
              opacity: [1, 0.8, 1],
            }
          : {}
      }
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={cn(
          'rounded-full px-2 py-1 text-xs font-medium transition-colors duration-300',
          statusColors[status] || 'bg-gray-100 text-gray-800'
        )}
        layout
      >
        {children}
      </motion.div>
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-400/20 ring-2 ring-blue-400/50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 활동 타입별 아이콘 컴포넌트
interface ActivityIconProps {
  type: 'order_created' | 'commission_updated' | 'user_registered' | string;
  isNew?: boolean;
  className?: string;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({ type, isNew = false, className }) => {
  const getIcon = () => {
    switch (type) {
      case 'order_created':
        return <Bell className="h-4 w-4" />;
      case 'commission_updated':
        return <AlertCircle className="h-4 w-4" />;
      case 'user_registered':
        return <Wifi className="h-4 w-4" />;
      default:
        return <Radio className="h-4 w-4" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'order_created':
        return 'text-blue-500 bg-blue-100';
      case 'commission_updated':
        return 'text-green-500 bg-green-100';
      case 'user_registered':
        return 'text-purple-500 bg-purple-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <motion.div
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-full',
        getColor(),
        className
      )}
      animate={
        isNew
          ? {
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }
          : {}
      }
      transition={{ duration: 0.6 }}
    >
      {getIcon()}
      <AnimatePresence>
        {isNew && (
          <motion.div
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 실시간 업데이트 토스트 알림
interface RealtimeToastProps {
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

export const RealtimeToast: React.FC<RealtimeToastProps> = ({
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          setTimeout(onClose, 300); // 애니메이션 완료 후 제거
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('max-w-sm rounded-lg border p-4 shadow-lg', typeStyles[type])}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.4 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{title}</h4>
              {description && <p className="mt-1 text-sm opacity-80">{description}</p>}
            </div>
            {onClose && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  if (onClose) {
                    setTimeout(onClose, 300);
                  }
                }}
                className="ml-2 opacity-60 transition-opacity hover:opacity-100"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
