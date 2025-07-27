'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  queryResponseTime: number;
  renderCount: number;
  dataSize: number;
  updateFrequency: number;
  lastUpdateTime: number;
  memoryUsage?: number;
}

interface PerformanceMonitorOptions {
  enabled?: boolean;
  logInterval?: number;
  trackMemory?: boolean;
}

export const usePerformanceMonitor = (
  queryName: string,
  data: any,
  options: PerformanceMonitorOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    logInterval = 5000,
    trackMemory = false,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    queryResponseTime: 0,
    renderCount: 0,
    dataSize: 0,
    updateFrequency: 0,
    lastUpdateTime: Date.now(),
  });

  const startTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const updateTimesRef = useRef<number[]>([]);
  const prevDataRef = useRef<any>(null);

  // 렌더링 횟수 추적
  useEffect(() => {
    if (!enabled) return;
    renderCountRef.current += 1;
  });

  // 데이터 변경 추적 및 성능 측정
  useEffect(() => {
    if (!enabled || !data) return;

    const now = Date.now();
    const responseTime = now - startTimeRef.current;

    // 데이터가 변경되었는지 확인 - 참조 비교로 최적화
    // JSON.stringify는 큰 객체에서 성능 저하를 유발할 수 있음
    const hasDataChanged = data !== prevDataRef.current;

    if (hasDataChanged) {
      // 업데이트 시간 기록
      updateTimesRef.current.push(now);

      // 최근 1분간의 업데이트만 유지
      const oneMinuteAgo = now - 60000;
      updateTimesRef.current = updateTimesRef.current.filter(time => time > oneMinuteAgo);

      // 데이터 크기 계산 - 성능을 위해 샘플링 방식 사용
      let dataSize = 0;
      try {
        // 큰 데이터의 경우 전체 stringify 대신 대략적인 크기 추정
        if (Array.isArray(data)) {
          dataSize = data.length * 100; // 배열 항목당 평균 100바이트로 추정
        } else if (typeof data === 'object' && data !== null) {
          dataSize = Object.keys(data).length * 50; // 객체 키당 평균 50바이트로 추정
        } else {
          dataSize = JSON.stringify(data).length;
        }
      } catch (e) {
        dataSize = 0;
      }

      // 업데이트 빈도 계산 (분당 업데이트 수)
      const updateFrequency = updateTimesRef.current.length;

      setMetrics(prev => ({
        ...prev,
        queryResponseTime: responseTime,
        renderCount: renderCountRef.current,
        dataSize,
        updateFrequency,
        lastUpdateTime: now,
      }));

      prevDataRef.current = data;
    }

    startTimeRef.current = now;
  }, [data, enabled]);

  // 메모리 사용량 추적 (선택적)
  useEffect(() => {
    if (!enabled || !trackMemory || !('memory' in performance)) return;

    const measureMemory = () => {
      // @ts-ignore - performance.memory는 Chrome에서만 사용 가능
      const memoryInfo = performance.memory;
      if (memoryInfo) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024, // MB 단위
        }));
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, logInterval);
    return () => clearInterval(interval);
  }, [enabled, trackMemory, logInterval]);

  // 성능 로그 출력 - metrics 대신 ref 사용하여 불필요한 재실행 방지
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    if (!enabled) return;

    const logMetrics = () => {
      const currentMetrics = metricsRef.current;
      console.group(`🚀 Performance Monitor: ${queryName}`);
      console.table({
        'Query Response Time (ms)': currentMetrics.queryResponseTime,
        'Render Count': currentMetrics.renderCount,
        'Data Size (bytes)': currentMetrics.dataSize,
        'Update Frequency (per min)': currentMetrics.updateFrequency,
        'Memory Usage (MB)': currentMetrics.memoryUsage || 'N/A',
        'Last Update': new Date(currentMetrics.lastUpdateTime).toLocaleTimeString(),
      });
      console.groupEnd();
    };

    const interval = setInterval(logMetrics, logInterval);
    return () => clearInterval(interval);
  }, [enabled, queryName, logInterval]); // metrics 의존성 제거

  return metrics;
};

// 성능 임계값 체크 훅
export const usePerformanceThresholds = (metrics: PerformanceMetrics) => {
  const [warnings, setWarnings] = useState<string[]>([]);

  // 개별 metrics 속성을 의존성으로 사용하여 정밀한 업데이트 제어
  useEffect(() => {
    const newWarnings: string[] = [];

    // 응답 시간이 2초를 초과하는 경우
    if (metrics.queryResponseTime > 2000) {
      newWarnings.push(`Slow query response: ${metrics.queryResponseTime}ms`);
    }

    // 렌더링이 초당 10회를 초과하는 경우
    if (metrics.renderCount > 10) {
      newWarnings.push(`High render count: ${metrics.renderCount}`);
    }

    // 데이터 크기가 1MB를 초과하는 경우
    if (metrics.dataSize > 1024 * 1024) {
      newWarnings.push(`Large data size: ${(metrics.dataSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // 업데이트 빈도가 분당 30회를 초과하는 경우
    if (metrics.updateFrequency > 30) {
      newWarnings.push(`High update frequency: ${metrics.updateFrequency}/min`);
    }

    // 메모리 사용량이 50MB를 초과하는 경우
    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      newWarnings.push(`High memory usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    }

    setWarnings(newWarnings);
  }, [
    metrics.queryResponseTime,
    metrics.renderCount,
    metrics.dataSize,
    metrics.updateFrequency,
    metrics.memoryUsage,
  ]); // 개별 속성들을 의존성으로 분리

  return warnings;
};

// 성능 개선 제안 생성 훅
export const usePerformanceRecommendations = (warnings: string[]) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const newRecommendations: string[] = [];

    warnings.forEach(warning => {
      if (warning.includes('Slow query')) {
        newRecommendations.push('Consider adding database indexes or implementing pagination');
      }
      if (warning.includes('High render count')) {
        newRecommendations.push('Use React.memo() or useMemo() to prevent unnecessary re-renders');
      }
      if (warning.includes('Large data size')) {
        newRecommendations.push('Implement data pagination or selective field loading');
      }
      if (warning.includes('High update frequency')) {
        newRecommendations.push('Consider implementing data debouncing or batching updates');
      }
      if (warning.includes('High memory usage')) {
        newRecommendations.push('Check for memory leaks and implement data cleanup strategies');
      }
    });

    // 중복 제거
    setRecommendations([...new Set(newRecommendations)]);
  }, [warnings]);

  return recommendations;
};
