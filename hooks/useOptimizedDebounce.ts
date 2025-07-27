import { useCallback, useRef, useEffect } from 'react';

interface DebounceOptions {
  delay?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
}

/**
 * 최적화된 디바운싱 Hook
 * - maxWait 옵션으로 최대 대기 시간 설정 가능
 * - leading/trailing 옵션으로 실행 시점 제어
 * - cancel/flush 메서드 제공
 */
export function useOptimizedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { delay = 300, maxWait, leading = false, trailing = true } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastThisRef = useRef<any>(null);
  const resultRef = useRef<any>(null);
  const pendingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const invoke = useCallback(() => {
    if (!lastArgsRef.current) return;

    const args = lastArgsRef.current;
    const thisArg = lastThisRef.current;

    lastArgsRef.current = null;
    lastThisRef.current = null;
    pendingRef.current = false;

    resultRef.current = callback.apply(thisArg, args);
  }, [callback]);

  const startTimer = useCallback(
    (wait: number) => {
      clearTimers();
      timeoutRef.current = setTimeout(() => {
        if (trailing) {
          invoke();
        }
        clearTimers();
      }, wait);
    },
    [clearTimers, invoke, trailing]
  );

  const debouncedFunction = useCallback(
    function (this: any, ...args: Parameters<T>) {
      const now = Date.now();
      const isFirstCall = !lastCallTimeRef.current;

      lastArgsRef.current = args;
      lastThisRef.current = this;
      lastCallTimeRef.current = now;
      pendingRef.current = true;

      // maxWait 처리
      if (maxWait && isFirstCall) {
        maxTimeoutRef.current = setTimeout(() => {
          if (pendingRef.current) {
            invoke();
            clearTimers();
          }
        }, maxWait);
      }

      // leading 처리
      if (leading && isFirstCall) {
        invoke();
      }

      // 기본 디바운싱
      startTimer(delay);
    },
    [delay, maxWait, leading, invoke, startTimer, clearTimers]
  ) as T;

  const cancel = useCallback(() => {
    clearTimers();
    lastCallTimeRef.current = null;
    lastArgsRef.current = null;
    lastThisRef.current = null;
    pendingRef.current = false;
  }, [clearTimers]);

  const flush = useCallback(() => {
    if (pendingRef.current) {
      invoke();
    }
    cancel();
  }, [invoke, cancel]);

  const isPending = useCallback(() => {
    return pendingRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return Object.assign(debouncedFunction, {
    cancel,
    flush,
    isPending,
  });
}

/**
 * 여러 필드에 대한 디바운싱을 관리하는 Hook
 */
export function useFieldDebounce() {
  const debouncersRef = useRef<Map<string, DebouncedFunction<any>>>(new Map());

  const debounce = useCallback(
    <T extends (...args: any[]) => any>(
      key: string,
      callback: T,
      options?: DebounceOptions
    ): DebouncedFunction<T> => {
      const existing = debouncersRef.current.get(key);
      if (existing) {
        return existing as DebouncedFunction<T>;
      }

      const debounced = useOptimizedDebounce(callback, options);
      debouncersRef.current.set(key, debounced);
      return debounced;
    },
    []
  );

  const cancel = useCallback((key: string) => {
    const debouncer = debouncersRef.current.get(key);
    if (debouncer) {
      debouncer.cancel();
    }
  }, []);

  const cancelAll = useCallback(() => {
    debouncersRef.current.forEach(debouncer => {
      debouncer.cancel();
    });
    debouncersRef.current.clear();
  }, []);

  const flush = useCallback((key: string) => {
    const debouncer = debouncersRef.current.get(key);
    if (debouncer) {
      debouncer.flush();
    }
  }, []);

  const flushAll = useCallback(() => {
    debouncersRef.current.forEach(debouncer => {
      debouncer.flush();
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAll();
    };
  }, [cancelAll]);

  return {
    debounce,
    cancel,
    cancelAll,
    flush,
    flushAll,
  };
}
