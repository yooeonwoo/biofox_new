/**
 * API 계층 ID 타입 통합 어댑터
 * 백엔드 API와 Convex 간 ID 타입 불일치를 해결하는 어댑터 레이어
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  convertToStringId,
  convertToNumberId,
  convertIdsToString,
  convertIdsToNumber,
  convertArrayToStringIds,
  convertArrayToNumberIds,
  safeConvertToString,
  safeConvertToNumber,
  isNumberId,
  isStringId,
  type NumberId,
  type StringId,
  type ConvexId,
} from '@/lib/utils/id-conversion';

// 어댑터 설정 타입
export interface AdapterConfig {
  convexUrl: string;
  defaultIdFields: string[];
  enableLogging: boolean;
  enableCaching: boolean;
  cacheTimeout: number; // ms
  fallbackEnabled: boolean;
}

// API 변환 메타데이터
export interface TransformMetadata {
  direction: 'request' | 'response';
  tableName?: string;
  idFields: string[];
  nestedFields?: { [key: string]: string[] };
}

// 어댑터 인스턴스 관리
class ApiIdAdapterManager {
  private static instance: ApiIdAdapterManager;
  private convexClient: ConvexHttpClient | null = null;
  private config: AdapterConfig;
  private cache = new Map<string, { data: any; timestamp: number }>();

  private constructor(config: AdapterConfig) {
    this.config = config;
    if (config.convexUrl) {
      this.convexClient = new ConvexHttpClient(config.convexUrl);
    }
  }

  static getInstance(config?: AdapterConfig): ApiIdAdapterManager {
    if (!ApiIdAdapterManager.instance) {
      if (!config) {
        throw new Error('ApiIdAdapterManager 초기화에 config가 필요합니다.');
      }
      ApiIdAdapterManager.instance = new ApiIdAdapterManager(config);
    }
    return ApiIdAdapterManager.instance;
  }

  getConvexClient(): ConvexHttpClient {
    if (!this.convexClient) {
      throw new Error('Convex 클라이언트가 초기화되지 않았습니다.');
    }
    return this.convexClient;
  }

  getConfig(): AdapterConfig {
    return this.config;
  }

  // 캐시 관리
  setCache(key: string, data: any): void {
    if (!this.config.enableCaching) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // 캐시 크기 제한
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  getCache(key: string): any | null {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    // 캐시 만료 확인
    if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// API 요청 인터셉터
export class ApiRequestInterceptor {
  private static instance: ApiRequestInterceptor;
  private manager: ApiIdAdapterManager;

  private constructor(manager: ApiIdAdapterManager) {
    this.manager = manager;
  }

  static getInstance(manager: ApiIdAdapterManager): ApiRequestInterceptor {
    if (!ApiRequestInterceptor.instance) {
      ApiRequestInterceptor.instance = new ApiRequestInterceptor(manager);
    }
    return ApiRequestInterceptor.instance;
  }

  /**
   * API 요청 데이터의 ID를 Convex 호환 형식으로 변환
   */
  transformRequest<T extends Record<string, any>>(data: T, metadata: TransformMetadata): T {
    try {
      if (this.manager.getConfig().enableLogging) {
        console.log('[API Adapter] Request 변환 시작:', { data, metadata });
      }

      let transformed = data;

      // 기본 ID 필드 변환 (number → string)
      if (metadata.idFields.length > 0) {
        transformed = convertIdsToString(transformed, metadata.idFields);
      }

      // 중첩 객체 변환
      if (metadata.nestedFields) {
        Object.entries(metadata.nestedFields).forEach(([parentField, childIdFields]) => {
          if (parentField in transformed && transformed[parentField]) {
            if (Array.isArray(transformed[parentField])) {
              transformed[parentField] = convertArrayToStringIds(
                transformed[parentField],
                childIdFields
              );
            } else if (typeof transformed[parentField] === 'object') {
              transformed[parentField] = convertIdsToString(
                transformed[parentField],
                childIdFields
              );
            }
          }
        });
      }

      if (this.manager.getConfig().enableLogging) {
        console.log('[API Adapter] Request 변환 완료:', transformed);
      }

      return transformed;
    } catch (error) {
      console.error('[API Adapter] Request 변환 실패:', error);

      if (this.manager.getConfig().fallbackEnabled) {
        console.warn('[API Adapter] Fallback: 원본 데이터 반환');
        return data;
      }

      throw error;
    }
  }

  /**
   * 배치 요청 변환
   */
  transformBatchRequest<T extends Record<string, any>>(
    dataArray: T[],
    metadata: TransformMetadata
  ): T[] {
    return dataArray.map(item => this.transformRequest(item, metadata));
  }
}

// API 응답 인터셉터
export class ApiResponseInterceptor {
  private static instance: ApiResponseInterceptor;
  private manager: ApiIdAdapterManager;

  private constructor(manager: ApiIdAdapterManager) {
    this.manager = manager;
  }

  static getInstance(manager: ApiIdAdapterManager): ApiResponseInterceptor {
    if (!ApiResponseInterceptor.instance) {
      ApiResponseInterceptor.instance = new ApiResponseInterceptor(manager);
    }
    return ApiResponseInterceptor.instance;
  }

  /**
   * API 응답 데이터의 ID를 UI 호환 형식으로 변환
   */
  transformResponse<T extends Record<string, any>>(data: T, metadata: TransformMetadata): T {
    try {
      if (this.manager.getConfig().enableLogging) {
        console.log('[API Adapter] Response 변환 시작:', { data, metadata });
      }

      let transformed = data;

      // Convex _id를 id로 매핑
      if ('_id' in transformed && !('id' in transformed)) {
        transformed = { ...transformed, id: transformed._id };
      }

      // ID 필드 변환 (필요에 따라 string → number 또는 유지)
      if (metadata.idFields.length > 0) {
        // UI 컴포넌트가 string ID를 기대하는 경우 string으로 변환
        transformed = convertIdsToString(transformed, metadata.idFields);
      }

      // 중첩 객체 변환
      if (metadata.nestedFields) {
        Object.entries(metadata.nestedFields).forEach(([parentField, childIdFields]) => {
          if (parentField in transformed && transformed[parentField]) {
            if (Array.isArray(transformed[parentField])) {
              transformed[parentField] = convertArrayToStringIds(
                transformed[parentField],
                childIdFields
              );
            } else if (typeof transformed[parentField] === 'object') {
              transformed[parentField] = convertIdsToString(
                transformed[parentField],
                childIdFields
              );
            }
          }
        });
      }

      if (this.manager.getConfig().enableLogging) {
        console.log('[API Adapter] Response 변환 완료:', transformed);
      }

      return transformed;
    } catch (error) {
      console.error('[API Adapter] Response 변환 실패:', error);

      if (this.manager.getConfig().fallbackEnabled) {
        console.warn('[API Adapter] Fallback: 원본 데이터 반환');
        return data;
      }

      throw error;
    }
  }

  /**
   * 배치 응답 변환
   */
  transformBatchResponse<T extends Record<string, any>>(
    dataArray: T[],
    metadata: TransformMetadata
  ): T[] {
    return dataArray.map(item => this.transformResponse(item, metadata));
  }
}

// Convex 쿼리/뮤테이션 래퍼
export class ConvexApiWrapper {
  private manager: ApiIdAdapterManager;
  private requestInterceptor: ApiRequestInterceptor;
  private responseInterceptor: ApiResponseInterceptor;

  constructor(manager: ApiIdAdapterManager) {
    this.manager = manager;
    this.requestInterceptor = ApiRequestInterceptor.getInstance(manager);
    this.responseInterceptor = ApiResponseInterceptor.getInstance(manager);
  }

  /**
   * Convex 쿼리 실행 (ID 변환 포함)
   */
  async query<TInput extends Record<string, any>, TOutput>(
    queryName: string,
    input: TInput,
    metadata: TransformMetadata
  ): Promise<TOutput> {
    try {
      // 캐시 확인
      const cacheKey = `query_${queryName}_${JSON.stringify(input)}`;
      const cached = this.manager.getCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 요청 데이터 변환
      const transformedInput = this.requestInterceptor.transformRequest(input, metadata);

      // Convex 쿼리 실행
      const convexClient = this.manager.getConvexClient();
      const result = await convexClient.query(api[queryName] as any, transformedInput);

      // 응답 데이터 변환
      const transformedResult = this.responseInterceptor.transformResponse(result, {
        ...metadata,
        direction: 'response',
      });

      // 캐시 저장
      this.manager.setCache(cacheKey, transformedResult);

      return transformedResult;
    } catch (error) {
      console.error(`[ConvexApiWrapper] Query ${queryName} 실패:`, error);
      throw error;
    }
  }

  /**
   * Convex 뮤테이션 실행 (ID 변환 포함)
   */
  async mutation<TInput extends Record<string, any>, TOutput>(
    mutationName: string,
    input: TInput,
    metadata: TransformMetadata
  ): Promise<TOutput> {
    try {
      // 요청 데이터 변환
      const transformedInput = this.requestInterceptor.transformRequest(input, metadata);

      // Convex 뮤테이션 실행
      const convexClient = this.manager.getConvexClient();
      const result = await convexClient.mutation(api[mutationName] as any, transformedInput);

      // 응답 데이터 변환
      const transformedResult = this.responseInterceptor.transformResponse(result, {
        ...metadata,
        direction: 'response',
      });

      // 관련 캐시 무효화
      this.invalidateRelatedCache(metadata.tableName);

      return transformedResult;
    } catch (error) {
      console.error(`[ConvexApiWrapper] Mutation ${mutationName} 실패:`, error);
      throw error;
    }
  }

  /**
   * 관련 캐시 무효화
   */
  private invalidateRelatedCache(tableName?: string): void {
    if (!tableName) return;

    // 테이블 관련 캐시 키들을 찾아서 무효화
    const keysToDelete: string[] = [];
    for (const [key] of this.manager['cache']) {
      if (key.includes(tableName)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.manager['cache'].delete(key);
    });
  }
}

// 통합 API 어댑터 인터페이스
export class ApiIdAdapter {
  private static instance: ApiIdAdapter | null = null;
  private manager: ApiIdAdapterManager;
  private convexWrapper: ConvexApiWrapper;

  private constructor(config: AdapterConfig) {
    this.manager = ApiIdAdapterManager.getInstance(config);
    this.convexWrapper = new ConvexApiWrapper(this.manager);
  }

  /**
   * 어댑터 초기화
   */
  static initialize(config: AdapterConfig): ApiIdAdapter {
    if (ApiIdAdapter.instance) {
      console.warn('[ApiIdAdapter] 이미 초기화된 인스턴스가 있습니다.');
      return ApiIdAdapter.instance;
    }

    ApiIdAdapter.instance = new ApiIdAdapter(config);
    return ApiIdAdapter.instance;
  }

  /**
   * 어댑터 인스턴스 반환
   */
  static getInstance(): ApiIdAdapter {
    if (!ApiIdAdapter.instance) {
      throw new Error('ApiIdAdapter가 초기화되지 않았습니다. initialize()를 먼저 호출하세요.');
    }
    return ApiIdAdapter.instance;
  }

  /**
   * Convex 쿼리 실행
   */
  async query<TInput extends Record<string, any>, TOutput>(
    queryName: string,
    input: TInput,
    options: {
      tableName?: string;
      idFields?: string[];
      nestedFields?: { [key: string]: string[] };
    } = {}
  ): Promise<TOutput> {
    const metadata: TransformMetadata = {
      direction: 'request',
      tableName: options.tableName,
      idFields: options.idFields || this.manager.getConfig().defaultIdFields,
      nestedFields: options.nestedFields,
    };

    return this.convexWrapper.query(queryName, input, metadata);
  }

  /**
   * Convex 뮤테이션 실행
   */
  async mutation<TInput extends Record<string, any>, TOutput>(
    mutationName: string,
    input: TInput,
    options: {
      tableName?: string;
      idFields?: string[];
      nestedFields?: { [key: string]: string[] };
    } = {}
  ): Promise<TOutput> {
    const metadata: TransformMetadata = {
      direction: 'request',
      tableName: options.tableName,
      idFields: options.idFields || this.manager.getConfig().defaultIdFields,
      nestedFields: options.nestedFields,
    };

    return this.convexWrapper.mutation(mutationName, input, metadata);
  }

  /**
   * 캐시 관리
   */
  clearCache(): void {
    this.manager.clearCache();
  }

  /**
   * 설정 업데이트
   */
  updateConfig(partialConfig: Partial<AdapterConfig>): void {
    const currentConfig = this.manager.getConfig();
    Object.assign(currentConfig, partialConfig);
  }
}

// 기본 설정
export const DEFAULT_ADAPTER_CONFIG: AdapterConfig = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || '',
  defaultIdFields: ['id', 'userId', 'kolId', 'shopId', 'parentId'],
  enableLogging: process.env.NODE_ENV === 'development',
  enableCaching: true,
  cacheTimeout: 5 * 60 * 1000, // 5분
  fallbackEnabled: true,
};

// 편의 함수들
export function initializeApiAdapter(config?: Partial<AdapterConfig>): ApiIdAdapter {
  const finalConfig = { ...DEFAULT_ADAPTER_CONFIG, ...config };
  return ApiIdAdapter.initialize(finalConfig);
}

export function getApiAdapter(): ApiIdAdapter {
  return ApiIdAdapter.getInstance();
}

// 타입 헬퍼 함수들
export const typeHelpers = {
  isConvexId: (id: unknown): id is ConvexId => {
    return typeof id === 'string' && id.length >= 16;
  },

  isLegacyId: (id: unknown): id is NumberId => {
    return isNumberId(id);
  },

  convertIdForApi: (id: unknown): string => {
    return safeConvertToString(id);
  },

  convertIdForLegacy: (id: unknown): number => {
    return safeConvertToNumber(id);
  },
};
