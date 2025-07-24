'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { usePaginatedQuery } from 'convex/react';

/**
 * 고객 목록 조회 훅 (실시간 동기화)
 * @param kolId KOL 고유 ID
 * @param options 필터링 및 검색 옵션
 */
export function useCustomers(
  kolId: Id<'profiles'> | undefined,
  options?: {
    status?: string;
    region?: string;
    limit?: number;
  }
) {
  const { status, region, limit = 20 } = options || {};

  return usePaginatedQuery(
    api.customers.getCustomersByKol,
    kolId
      ? {
          kolId,
          status,
          region,
        }
      : 'skip',
    { initialNumItems: limit }
  );
}

/**
 * 단일 고객 상세 조회 훅
 * @param customerId 고객 ID
 */
export function useCustomer(customerId: Id<'customers'> | undefined) {
  return useQuery(api.customers.getCustomerById, customerId ? { customerId } : 'skip');
}

/**
 * 고객 통계 조회 훅
 * @param kolId KOL 고유 ID
 */
export function useCustomerStats(kolId: Id<'profiles'> | undefined) {
  return useQuery(api.customers.getCustomerStats, kolId ? { kolId } : 'skip');
}

/**
 * 고객 검색 훅
 * @param kolId KOL 고유 ID
 * @param searchTerm 검색어
 */
export function useCustomerSearch(
  kolId: Id<'profiles'> | undefined,
  searchTerm: string,
  options?: { limit?: number }
) {
  const { limit = 10 } = options || {};

  return usePaginatedQuery(
    api.customers.searchCustomers,
    kolId && searchTerm
      ? {
          kolId,
          searchTerm,
        }
      : 'skip',
    { initialNumItems: limit }
  );
}

/**
 * 고객 생성 훅
 */
export function useCreateCustomer() {
  const createCustomer = useMutation(api.customers.createCustomer);

  return {
    createCustomer: async (data: {
      kolId: Id<'profiles'>;
      name: string;
      shopName?: string;
      phone: string;
      region: string;
      placeAddress?: string;
      assignee: string;
      manager: string;
      status?: string;
      notes?: string;
    }) => {
      try {
        const customerId = await createCustomer(data);
        toast.success('고객이 성공적으로 생성되었습니다.');
        return customerId;
      } catch (error: any) {
        toast.error('고객 생성 실패: ' + error.message);
        throw error;
      }
    },
  };
}

/**
 * 고객 정보 업데이트 훅
 */
export function useUpdateCustomer() {
  const updateCustomer = useMutation(api.customers.updateCustomer);

  return {
    updateCustomer: async (data: {
      customerId: Id<'customers'>;
      updates: {
        name?: string;
        shopName?: string;
        phone?: string;
        region?: string;
        placeAddress?: string;
        assignee?: string;
        manager?: string;
        status?: string;
        notes?: string;
        completedStages?: number;
        totalStages?: number;
      };
    }) => {
      try {
        await updateCustomer(data);
        toast.success('고객 정보가 업데이트되었습니다.');
      } catch (error: any) {
        toast.error('업데이트 실패: ' + error.message);
        throw error;
      }
    },
  };
}

/**
 * 고객 진행상황 업데이트 훅 (실시간 동기화)
 */
export function useUpdateCustomerProgress() {
  const updateProgress = useMutation(api.customers.updateCustomerProgress);

  return {
    updateProgress: async (data: {
      customerId: Id<'customers'>;
      stageData: any;
      achievements: any;
    }) => {
      try {
        await updateProgress(data);
        // 성공 시 토스트는 표시하지 않음 (너무 빈번할 수 있음)
      } catch (error: any) {
        toast.error('진행상황 저장 실패: ' + error.message);
        throw error;
      }
    },
  };
}

/**
 * 고객 노트 추가 훅
 */
export function useAddCustomerNote() {
  const addNote = useMutation(api.customers.addCustomerNote);

  return {
    addNote: async (data: {
      customerId: Id<'customers'>;
      content: string;
      noteType?: string;
      createdBy: Id<'profiles'>;
    }) => {
      try {
        const noteId = await addNote(data);
        toast.success('노트가 추가되었습니다.');
        return noteId;
      } catch (error: any) {
        toast.error('노트 추가 실패: ' + error.message);
        throw error;
      }
    },
  };
}

/**
 * 고객 삭제 훅
 */
export function useDeleteCustomer() {
  const deleteCustomer = useMutation(api.customers.deleteCustomer);

  return {
    deleteCustomer: async (customerId: Id<'customers'>) => {
      try {
        await deleteCustomer({ customerId });
        toast.success('고객이 삭제되었습니다.');
      } catch (error: any) {
        toast.error('삭제 실패: ' + error.message);
        throw error;
      }
    },
  };
}

// 편의를 위한 타입 정의
export interface CustomerWithProgress {
  _id: Id<'customers'>;
  kol_id: Id<'profiles'>;
  name: string;
  shop_name?: string;
  phone: string;
  region: string;
  place_address?: string;
  assignee: string;
  manager: string;
  status: string;
  notes?: string;
  completed_stages?: number;
  total_stages?: number;
  created_at: number;
  updated_at: number;
  customer_progress?: {
    _id: Id<'customer_progress'>;
    customer_id: Id<'customers'>;
    stage_data: any;
    achievements: any;
    created_at: number;
    updated_at: number;
  } | null;
  customer_notes?: Array<{
    _id: Id<'customer_notes'>;
    customer_id: Id<'customers'>;
    content: string;
    note_type?: string;
    created_by: Id<'profiles'>;
    created_at: number;
    updated_at: number;
  }>;
}

/**
 * 디바운스된 진행상황 업데이트 훅
 * 빈번한 업데이트를 방지하기 위해 디바운스 적용
 */
import { useCallback, useRef } from 'react';

export function useDebouncedCustomerProgress() {
  const { updateProgress } = useUpdateCustomerProgress();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback(
    (data: { customerId: Id<'customers'>; stageData: any; achievements: any }) => {
      // 이전 타이머 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 새 타이머 설정 (500ms 디바운스)
      timeoutRef.current = setTimeout(() => {
        updateProgress(data);
      }, 500);
    },
    [updateProgress]
  );

  return { debouncedUpdate };
}
