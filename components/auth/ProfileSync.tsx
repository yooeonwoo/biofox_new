'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileSyncProps {
  children: React.ReactNode;
  showSyncStatus?: boolean;
}

export function ProfileSync({ children, showSyncStatus = false }: ProfileSyncProps) {
  const { syncError, isLoading, isAuthenticated, profile } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isAuthenticated) {
        toast({
          title: '연결 복구됨',
          description: '인터넷 연결이 복구되어 프로필 데이터 동기화가 재개됩니다.',
          duration: 3000,
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: '연결 끊김',
        description: '인터넷 연결이 끊어졌습니다. 연결이 복구되면 자동으로 동기화됩니다.',
        duration: 5000,
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 온라인 상태 확인
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, toast]);

  // 프로필 변경 감지 및 마지막 동기화 시간 업데이트
  useEffect(() => {
    if (profile && isOnline) {
      setLastSyncTime(new Date());
    }
  }, [profile, isOnline]);

  // 동기화 오류 알림
  useEffect(() => {
    if (syncError && isOnline) {
      toast({
        title: '동기화 오류',
        description: syncError,
        duration: 5000,
        variant: 'destructive',
      });
    }
  }, [syncError, isOnline, toast]);

  // 프로필 상태별 동기화 상태 표시
  const getSyncStatus = () => {
    if (!isAuthenticated) return { status: 'none', message: '인증되지 않음' };
    if (isLoading) return { status: 'loading', message: '동기화 중...' };
    if (!isOnline) return { status: 'offline', message: '오프라인' };
    if (syncError) return { status: 'error', message: `오류: ${syncError}` };
    if (profile) {
      const timeAgo = lastSyncTime
        ? `${Math.round((Date.now() - lastSyncTime.getTime()) / 1000)}초 전`
        : '방금';
      return { status: 'synced', message: `동기화됨 (${timeAgo})` };
    }
    return { status: 'no-profile', message: '프로필 없음' };
  };

  const syncStatus = getSyncStatus();

  return (
    <div className="relative">
      {/* 동기화 상태 표시 (옵션) */}
      {showSyncStatus && isAuthenticated && (
        <div className="fixed right-4 top-4 z-50">
          <Alert className={`w-64 ${getSyncStatusColor(syncStatus.status)}`}>
            <div className="flex items-center gap-2">
              {getSyncIcon(syncStatus.status)}
              <AlertDescription className="text-sm">{syncStatus.message}</AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* 오프라인 경고 */}
      {!isOnline && isAuthenticated && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 transform">
          <Alert variant="destructive" className="w-auto">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {children}
    </div>
  );
}

function getSyncIcon(status: string) {
  switch (status) {
    case 'loading':
      return (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      );
    case 'synced':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'offline':
      return <WifiOff className="h-4 w-4 text-yellow-600" />;
    default:
      return <Wifi className="h-4 w-4 text-gray-400" />;
  }
}

function getSyncStatusColor(status: string) {
  switch (status) {
    case 'synced':
      return 'border-green-200 bg-green-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    case 'offline':
      return 'border-yellow-200 bg-yellow-50';
    case 'loading':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
}
