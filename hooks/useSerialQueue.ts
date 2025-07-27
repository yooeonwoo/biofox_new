import { useRef, useCallback } from 'react';

// 직렬화 큐 아이템 타입
interface QueueItem {
  id: string;
  task: () => Promise<void>;
  abortController?: AbortController;
}

// 큐 상태 타입
interface QueueState {
  items: QueueItem[];
  isProcessing: boolean;
}

/**
 * 비동기 작업을 직렬화하여 실행하는 큐 훅
 * 동시에 여러 업데이트가 발생하지 않도록 보장합니다.
 */
export function useSerialQueue() {
  const queueRef = useRef<QueueState>({
    items: [],
    isProcessing: false,
  });

  // 큐 처리 함수
  const processQueue = useCallback(async () => {
    const queue = queueRef.current;

    if (queue.isProcessing || queue.items.length === 0) {
      return;
    }

    queue.isProcessing = true;

    while (queue.items.length > 0) {
      const item = queue.items.shift();
      if (!item) continue;

      try {
        // AbortController 확인
        if (item.abortController?.signal.aborted) {
          continue;
        }

        await item.task();
      } catch (error) {
        // 개별 작업 실패는 로그만 남기고 큐 처리 계속
        console.error(`Queue task ${item.id} failed:`, error);
      }
    }

    queue.isProcessing = false;
  }, []);

  // 작업을 큐에 추가
  const enqueue = useCallback(
    (
      id: string,
      task: () => Promise<void>,
      options?: {
        abortController?: AbortController;
        priority?: 'high' | 'normal'; // 높은 우선순위 작업은 큐 앞쪽에 추가
      }
    ) => {
      const queue = queueRef.current;

      // 동일한 ID의 기존 작업이 있으면 취소
      const existingIndex = queue.items.findIndex(item => item.id === id);
      if (existingIndex > -1) {
        const existingItem = queue.items[existingIndex];
        if (existingItem) {
          existingItem.abortController?.abort();
        }
        queue.items.splice(existingIndex, 1);
      }

      const queueItem: QueueItem = {
        id,
        task,
        abortController: options?.abortController,
      };

      // 우선순위에 따라 큐 위치 결정
      if (options?.priority === 'high') {
        queue.items.unshift(queueItem);
      } else {
        queue.items.push(queueItem);
      }

      // 큐 처리 시작
      processQueue();
    },
    [processQueue]
  );

  // 특정 작업 취소
  const cancel = useCallback((id: string) => {
    const queue = queueRef.current;
    const index = queue.items.findIndex(item => item.id === id);

    if (index > -1) {
      const item = queue.items[index];
      if (item) {
        item.abortController?.abort();
      }
      queue.items.splice(index, 1);
    }
  }, []);

  // 모든 작업 취소
  const cancelAll = useCallback(() => {
    const queue = queueRef.current;
    queue.items.forEach(item => {
      item.abortController?.abort();
    });
    queue.items.length = 0;
  }, []);

  // 큐 상태 조회
  const getQueueInfo = useCallback(() => {
    const queue = queueRef.current;
    return {
      isProcessing: queue.isProcessing,
      queueLength: queue.items.length,
      hasItems: queue.items.length > 0,
    };
  }, []);

  return {
    enqueue,
    cancel,
    cancelAll,
    getQueueInfo,
  };
}

/**
 * 케이스별 직렬화 큐를 관리하는 훅
 * 여러 케이스의 업데이트를 독립적으로 처리합니다.
 */
export function useCaseSerialQueues() {
  // 큐 상태를 직접 관리하여 React Hook 규칙 위반 방지
  const queuesRef = useRef<Map<string, QueueState>>(new Map());
  const processQueueRef = useRef<Map<string, () => Promise<void>>>(new Map());

  // 큐 처리 함수 생성
  const createProcessQueueForCase = useCallback((caseId: string) => {
    const processQueue = async () => {
      const queue = queuesRef.current.get(caseId);
      if (!queue || queue.isProcessing || queue.items.length === 0) {
        return;
      }

      queue.isProcessing = true;

      while (queue.items.length > 0) {
        const item = queue.items.shift();
        if (!item) continue;

        try {
          if (item.abortController?.signal.aborted) {
            continue;
          }
          await item.task();
        } catch (error) {
          console.error(`Queue task ${item.id} failed:`, error);
        }
      }

      queue.isProcessing = false;
    };

    return processQueue;
  }, []);

  // 특정 케이스의 큐 가져오기 또는 생성
  const getQueueForCase = useCallback(
    (caseId: string) => {
      if (!queuesRef.current.has(caseId)) {
        queuesRef.current.set(caseId, {
          items: [],
          isProcessing: false,
        });
        processQueueRef.current.set(caseId, createProcessQueueForCase(caseId));
      }
      return {
        queue: queuesRef.current.get(caseId)!,
        processQueue: processQueueRef.current.get(caseId)!,
      };
    },
    [createProcessQueueForCase]
  );

  // 특정 케이스에 작업 추가
  const enqueueForCase = useCallback(
    (
      caseId: string,
      taskId: string,
      task: () => Promise<void>,
      options?: {
        abortController?: AbortController;
        priority?: 'high' | 'normal';
      }
    ) => {
      const { queue, processQueue } = getQueueForCase(caseId);

      // 동일한 ID의 기존 작업이 있으면 취소
      const existingIndex = queue.items.findIndex(item => item.id === taskId);
      if (existingIndex > -1) {
        const existingItem = queue.items[existingIndex];
        if (existingItem) {
          existingItem.abortController?.abort();
        }
        queue.items.splice(existingIndex, 1);
      }

      const queueItem: QueueItem = {
        id: taskId,
        task,
        abortController: options?.abortController,
      };

      // 우선순위에 따라 큐 위치 결정
      if (options?.priority === 'high') {
        queue.items.unshift(queueItem);
      } else {
        queue.items.push(queueItem);
      }

      // 큐 처리 시작
      processQueue();
    },
    [getQueueForCase]
  );

  // 특정 케이스의 작업 취소
  const cancelForCase = useCallback((caseId: string, taskId: string) => {
    const queue = queuesRef.current.get(caseId);
    if (!queue) return;

    const index = queue.items.findIndex(item => item.id === taskId);
    if (index > -1) {
      const item = queue.items[index];
      if (item) {
        item.abortController?.abort();
      }
      queue.items.splice(index, 1);
    }
  }, []);

  // 특정 케이스의 모든 작업 취소
  const cancelAllForCase = useCallback((caseId: string) => {
    const queue = queuesRef.current.get(caseId);
    if (!queue) return;

    queue.items.forEach(item => {
      item.abortController?.abort();
    });
    queue.items.length = 0;
  }, []);

  // 모든 케이스의 모든 작업 취소
  const cancelAllCases = useCallback(() => {
    queuesRef.current.forEach(queue => {
      queue.items.forEach(item => {
        item.abortController?.abort();
      });
      queue.items.length = 0;
    });
    queuesRef.current.clear();
    processQueueRef.current.clear();
  }, []);

  // 케이스별 큐 상태 조회
  const getQueueInfoForCase = useCallback((caseId: string) => {
    const queue = queuesRef.current.get(caseId);
    return queue
      ? {
          isProcessing: queue.isProcessing,
          queueLength: queue.items.length,
          hasItems: queue.items.length > 0,
        }
      : {
          isProcessing: false,
          queueLength: 0,
          hasItems: false,
        };
  }, []);

  return {
    enqueueForCase,
    cancelForCase,
    cancelAllForCase,
    cancelAllCases,
    getQueueInfoForCase,
  };
}

// 편의를 위한 디바운스 기능이 포함된 훅
export function useSerialQueueWithDebounce(defaultDelay = 500) {
  const queue = useSerialQueue();
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const enqueueWithDebounce = useCallback(
    (
      id: string,
      task: () => Promise<void>,
      delay = defaultDelay,
      options?: {
        abortController?: AbortController;
        priority?: 'high' | 'normal';
      }
    ) => {
      // 기존 디바운스 타이머 취소
      const existingTimeout = timeoutsRef.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // 새 디바운스 타이머 설정
      const timeout = setTimeout(() => {
        queue.enqueue(id, task, options);
        timeoutsRef.current.delete(id);
      }, delay);

      timeoutsRef.current.set(id, timeout);
    },
    [queue, defaultDelay]
  );

  const cancelDebounce = useCallback(
    (id: string) => {
      const timeout = timeoutsRef.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        timeoutsRef.current.delete(id);
      }
      queue.cancel(id);
    },
    [queue]
  );

  const cancelAllDebounce = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    queue.cancelAll();
  }, [queue]);

  return {
    enqueue: queue.enqueue,
    enqueueWithDebounce,
    cancel: cancelDebounce,
    cancelAll: cancelAllDebounce,
    getQueueInfo: queue.getQueueInfo,
  };
}
