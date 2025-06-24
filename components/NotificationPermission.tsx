"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

type PermissionState = 'default' | 'granted' | 'denied';

export default function NotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 브라우저가 알림을 지원하는지 확인
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission as PermissionState);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "알림 지원 안함",
        description: "현재 브라우저는 알림을 지원하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result === 'granted') {
        toast({
          title: "알림 권한 허용됨",
          description: "이제 영업일지 리마인드 알림을 받을 수 있습니다!",
        });

        // 테스트 알림 표시
        new Notification("BiofoxKOL 알림 설정 완료", {
          body: "영업일지 리마인드 알림이 활성화되었습니다.",
          icon: "/favicon.ico",
        });
      } else if (result === 'denied') {
        toast({
          title: "알림 권한 거부됨",
          description: "브라우저 설정에서 알림 권한을 수동으로 허용해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('알림 권한 요청 오류:', error);
      toast({
        title: "권한 요청 실패",
        description: "알림 권한 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 브라우저가 알림을 지원하지 않으면 컴포넌트를 표시하지 않음
  if (typeof window !== 'undefined' && !('Notification' in window)) {
    return null;
  }

  // 이미 권한이 허용된 경우 간단한 상태 표시
  if (permission === 'granted') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>브라우저 알림이 활성화되어 있습니다. 리마인드 알림을 받을 수 있어요!</span>
            <Bell className="h-4 w-4 text-green-600" />
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // 권한이 거부된 경우
  if (permission === 'denied') {
    return (
      <Alert className="bg-red-50 border-red-200">
        <X className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">브라우저 알림이 차단되어 있습니다</div>
              <div className="text-sm text-red-700 mt-1">
                브라우저 설정에서 알림을 허용해주세요. (주소창 옆 🔒 클릭 → 알림 허용)
              </div>
            </div>
            <BellOff className="h-4 w-4 text-red-600" />
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // 기본 상태 (권한 요청 필요)
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-blue-900 mb-1">
              리마인드 알림을 받으시겠어요?
            </div>
            <div className="text-sm text-blue-800">
              영업일지 리마인드 시간이 되면 브라우저 알림으로 알려드립니다.
              탭이 닫혀있어도 알림을 받을 수 있어요!
            </div>
          </div>
          <Button
            onClick={requestPermission}
            disabled={isLoading}
            size="sm"
            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>요청 중...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>알림 허용</span>
              </div>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}