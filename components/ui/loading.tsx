import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn('animate-spin rounded-full border-b-2 border-primary', sizeClasses[size])}
      ></div>
    </div>
  );
}

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  title = '데이터를 불러오는 중...',
  description,
  className,
  size = 'md',
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4 p-8', className)}>
      <LoadingSpinner size={size} />
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'card' | 'inline';
}

export function ErrorState({
  title = '오류가 발생했습니다',
  description = '데이터를 불러오는 중 문제가 발생했습니다.',
  onRetry,
  className,
  variant = 'default',
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-destructive">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </Button>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="p-8">{content}</CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 p-2 text-sm text-destructive', className)}>
        <AlertTriangle className="h-4 w-4" />
        <span>{title}</span>
        {onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry}>
            재시도
          </Button>
        )}
      </div>
    );
  }

  return <div className={cn('p-8', className)}>{content}</div>;
}

interface NetworkErrorStateProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkErrorState({ onRetry, className }: NetworkErrorStateProps) {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <ErrorState
      title={isOnline ? '서버 연결 실패' : '인터넷 연결 없음'}
      description={
        isOnline
          ? '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
          : '인터넷 연결을 확인하고 다시 시도해주세요.'
      }
      onRetry={onRetry}
      className={className}
    />
  );
}

interface ConvexQueryStateProps {
  data: any;
  error?: any;
  title?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: (data: any) => React.ReactNode;
  className?: string;
  onRetry?: () => void;
}

/**
 * Convex useQuery 결과를 표준화된 방식으로 처리하는 컴포넌트
 * 로딩, 에러, 빈 데이터 상태를 일관성 있게 처리
 */
export function ConvexQueryState({
  data,
  error,
  title,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  className,
  onRetry,
}: ConvexQueryStateProps) {
  // 로딩 상태 (data가 undefined인 경우)
  if (data === undefined) {
    return <div className={className}>{loadingComponent || <LoadingState title={title} />}</div>;
  }

  // 에러 상태
  if (error) {
    return (
      <div className={className}>
        {errorComponent || (
          <ErrorState
            title="데이터 로드 실패"
            description={error.message || '데이터를 불러오는 중 오류가 발생했습니다.'}
            onRetry={onRetry}
          />
        )}
      </div>
    );
  }

  // 빈 데이터 상태 (배열의 경우)
  if (Array.isArray(data) && data.length === 0) {
    return (
      <div className={className}>
        {emptyComponent || (
          <div className="p-8 text-center text-muted-foreground">
            <p>표시할 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    );
  }

  // 데이터가 있는 경우
  return <div className={className}>{children(data)}</div>;
}

interface TableLoadingProps {
  rows?: number;
  columns?: number;
}

export function TableLoading({ rows = 5, columns = 4 }: TableLoadingProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// 페이지 레벨 로딩 상태
export function PageLoading({ title = '페이지를 로드하는 중...' }: { title?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingState title={title} size="lg" />
    </div>
  );
}
