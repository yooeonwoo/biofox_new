'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  idle: {
    icon: null,
    text: '',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
  },
  saving: {
    icon: Loader2,
    text: '저장 중...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  saved: {
    icon: Check,
    text: '저장됨',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  error: {
    icon: AlertCircle,
    text: '저장 실패',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  offline: {
    icon: CloudOff,
    text: '오프라인',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
};

const sizeConfig = {
  sm: {
    iconSize: 'w-3 h-3',
    textSize: 'text-xs',
    padding: 'px-2 py-1',
    gap: 'gap-1',
  },
  md: {
    iconSize: 'w-4 h-4',
    textSize: 'text-sm',
    padding: 'px-3 py-1.5',
    gap: 'gap-1.5',
  },
  lg: {
    iconSize: 'w-5 h-5',
    textSize: 'text-base',
    padding: 'px-4 py-2',
    gap: 'gap-2',
  },
};

export function SaveStatusIndicator({
  status,
  className,
  showText = true,
  size = 'md',
}: SaveStatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];
  const Icon = config.icon;

  if (status === 'idle' && !showText) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'inline-flex items-center rounded-full',
          sizeConf.padding,
          sizeConf.gap,
          config.bgColor,
          config.color,
          className
        )}
      >
        {Icon && <Icon className={cn(sizeConf.iconSize, status === 'saving' && 'animate-spin')} />}
        {showText && <span className={cn('font-medium', sizeConf.textSize)}>{config.text}</span>}
      </motion.div>
    </AnimatePresence>
  );
}

interface AutoHideSaveStatusProps extends SaveStatusIndicatorProps {
  hideDelay?: number;
  onHide?: () => void;
}

export function AutoHideSaveStatus({
  status,
  hideDelay = 2000,
  onHide,
  ...props
}: AutoHideSaveStatusProps) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, hideDelay);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [status, hideDelay, onHide]);

  if (!visible && status === 'saved') return null;

  return <SaveStatusIndicator status={status} {...props} />;
}

// 네트워크 상태 모니터링 Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 전역 저장 상태 표시기
interface GlobalSaveStatusProps {
  saveStatuses: Record<string, SaveStatus>;
  className?: string;
}

export function GlobalSaveStatus({ saveStatuses, className }: GlobalSaveStatusProps) {
  const isOnline = useNetworkStatus();

  // 전체 상태 계산
  const hasError = Object.values(saveStatuses).some(s => s === 'error');
  const isSaving = Object.values(saveStatuses).some(s => s === 'saving');
  const savingCount = Object.values(saveStatuses).filter(s => s === 'saving').length;

  let globalStatus: SaveStatus = 'idle';
  if (!isOnline) globalStatus = 'offline';
  else if (hasError) globalStatus = 'error';
  else if (isSaving) globalStatus = 'saving';
  else if (Object.values(saveStatuses).some(s => s === 'saved')) globalStatus = 'saved';

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <AnimatePresence>
        {globalStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-lg border bg-white p-3 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <SaveStatusIndicator status={globalStatus} showText={false} size="lg" />
              <div>
                <p className="text-sm font-medium">
                  {!isOnline && '오프라인 모드'}
                  {hasError && '일부 변경사항 저장 실패'}
                  {isSaving && `${savingCount}개 항목 저장 중...`}
                  {globalStatus === 'saved' && '모든 변경사항 저장됨'}
                </p>
                {!isOnline && (
                  <p className="text-xs text-gray-500">온라인 상태가 되면 자동으로 동기화됩니다</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
