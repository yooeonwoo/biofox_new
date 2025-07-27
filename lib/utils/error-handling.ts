import { toast } from 'sonner';

// 에러 타입 분류
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  CONFLICT = 'CONFLICT',
  UNKNOWN = 'UNKNOWN',
}

// 에러 분류 함수
export function classifyError(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  // Convex 에러 처리
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.PERMISSION;
    }
    if (message.includes('conflict') || message.includes('concurrent')) {
      return ErrorType.CONFLICT;
    }
    if (message.includes('invalid') || message.includes('validation')) {
      return ErrorType.VALIDATION;
    }
  }

  return ErrorType.UNKNOWN;
}

// 재시도 설정
interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

// 재시도 함수
export async function retry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true, onRetry } = config;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const errorType = classifyError(error);

      // 재시도 불가능한 에러는 즉시 throw
      if (errorType === ErrorType.PERMISSION || errorType === ErrorType.VALIDATION) {
        throw error;
      }

      // 마지막 시도였으면 throw
      if (attempt === maxAttempts) {
        throw error;
      }

      // 재시도 콜백
      onRetry?.(attempt, error);

      // 대기
      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

// 낙관적 업데이트 헬퍼
export class OptimisticUpdate<T> {
  private rollbackData: T | null = null;

  async execute<R>(
    optimisticFn: () => void,
    asyncFn: () => Promise<R>,
    rollbackFn: (data: T) => void,
    getCurrentData: () => T
  ): Promise<R> {
    // 현재 데이터 저장
    this.rollbackData = getCurrentData();

    // 낙관적 업데이트 실행
    optimisticFn();

    try {
      // 실제 작업 실행
      const result = await asyncFn();
      this.rollbackData = null;
      return result;
    } catch (error) {
      // 롤백
      if (this.rollbackData !== null) {
        rollbackFn(this.rollbackData);
      }
      throw error;
    }
  }
}

// 사용자 친화적인 에러 메시지
export function getErrorMessage(error: unknown): string {
  const errorType = classifyError(error);

  switch (errorType) {
    case ErrorType.NETWORK:
      return '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    case ErrorType.PERMISSION:
      return '이 작업을 수행할 권한이 없습니다.';
    case ErrorType.CONFLICT:
      return '다른 사용자가 동시에 수정하고 있습니다. 페이지를 새로고침해주세요.';
    case ErrorType.VALIDATION:
      return error instanceof Error ? error.message : '입력값이 올바르지 않습니다.';
    default:
      return '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
}

// 에러 토스트 표시 헬퍼
export function showErrorToast(error: unknown, customMessage?: string) {
  const message = customMessage || getErrorMessage(error);
  toast.error(message);

  // 개발 환경에서는 콘솔에도 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', error);
  }
}
