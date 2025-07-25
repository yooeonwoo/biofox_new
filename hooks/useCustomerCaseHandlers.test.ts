import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { toast } from 'sonner';

import { useCustomerCaseHandlers } from './useCustomerCaseHandlers';
import type { ClinicalCase } from '@/types/clinical';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/clinical-photos', () => ({
  updateCase: vi.fn(),
  uploadPhoto: vi.fn(),
  fetchPhotos: vi.fn(),
  deletePhoto: vi.fn(),
  saveRoundCustomerInfo: vi.fn(),
  createCase: vi.fn(),
  deleteCase: vi.fn(),
}));

// 테스트용 QueryClient Provider 래퍼
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return Wrapper;
};

// 기본 테스트 props
const defaultProps = {
  user: { id: 'test-user', email: 'test@example.com' },
  cases: [] as ClinicalCase[],
  setCases: vi.fn(),
  currentRounds: { '1': 1 },
  setCurrentRounds: vi.fn(),
  isComposing: false,
  debouncedUpdate: vi.fn(),
  saveStatus: {},
  markSaving: vi.fn(),
  markSaved: vi.fn(),
  markError: vi.fn(),
  enqueue: vi.fn((caseId: string, task: () => Promise<void>) => task()),
  hasUnsavedNewCustomer: false,
  setHasUnsavedNewCustomer: vi.fn(),
};

describe('useCustomerCaseHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('훅이 모든 핸들러 함수들을 반환한다', () => {
    const { result } = renderHook(() => useCustomerCaseHandlers(defaultProps), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('handleSignOut');
    expect(result.current).toHaveProperty('handleCaseStatusChange');
    expect(result.current).toHaveProperty('handleConsentChange');
    expect(result.current).toHaveProperty('handlePhotoUpload');
    expect(result.current).toHaveProperty('handlePhotoDelete');
    expect(result.current).toHaveProperty('handleBasicCustomerInfoUpdate');
    expect(result.current).toHaveProperty('handleRoundCustomerInfoUpdate');
    expect(result.current).toHaveProperty('updateCaseCheckboxes');
    expect(result.current).toHaveProperty('handleCurrentRoundChange');
    expect(result.current).toHaveProperty('refreshCases');
    expect(result.current).toHaveProperty('handleAddCustomer');
    expect(result.current).toHaveProperty('handleSaveNewCustomer');
    expect(result.current).toHaveProperty('handleDeleteCase');
    expect(result.current).toHaveProperty('handleDeleteNewCustomer');
    expect(result.current).toHaveProperty('isNewCustomer');
    expect(result.current).toHaveProperty('handleSaveAll');
  });

  it('handleCaseStatusChange가 정상적으로 케이스 상태를 변경한다', async () => {
    const mockSetCases = vi.fn();
    const props = {
      ...defaultProps,
      setCases: mockSetCases,
    };

    const { updateCase } = await import('@/lib/clinical-photos');
    const mockUpdateCase = vi.mocked(updateCase);
    mockUpdateCase.mockResolvedValue(null);

    const { result } = renderHook(() => useCustomerCaseHandlers(props), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleCaseStatusChange('123', 'completed');
    });

    expect(mockUpdateCase).toHaveBeenCalledWith(123, { status: 'completed' });
    expect(mockSetCases).toHaveBeenCalled();
  });

  it('handlePhotoUpload이 enqueue 함수를 통해 호출된다', async () => {
    const mockEnqueue = vi.fn((caseId: string, task: () => Promise<void>) => task());
    const props = {
      ...defaultProps,
      enqueue: mockEnqueue,
    };

    const { uploadPhoto } = await import('@/lib/clinical-photos');
    const mockUploadPhoto = vi.mocked(uploadPhoto);
    mockUploadPhoto.mockResolvedValue('test-url');

    const { result } = renderHook(() => useCustomerCaseHandlers(props), {
      wrapper: createWrapper(),
    });

    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handlePhotoUpload('123', 1, 'front', testFile);
    });

    // 새 고객이 아닌 경우 uploadPhoto가 호출되어야 함
    expect(mockUploadPhoto).toHaveBeenCalledWith(123, 1, 'front', testFile);
    expect(toast.success).toHaveBeenCalledWith('사진이 성공적으로 업로드되었습니다.');
  });

  it('새 고객 케이스에 대해서는 API 호출을 하지 않는다', async () => {
    const mockSetCases = vi.fn();
    const props = {
      ...defaultProps,
      setCases: mockSetCases,
    };

    const { updateCase } = await import('@/lib/clinical-photos');
    const mockUpdateCase = vi.mocked(updateCase);

    const { result } = renderHook(() => useCustomerCaseHandlers(props), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleCaseStatusChange('new-customer-123', 'completed');
    });

    // 새 고객의 경우 API 호출하지 않음
    expect(mockUpdateCase).not.toHaveBeenCalled();
    // 로컬 상태만 업데이트
    expect(mockSetCases).toHaveBeenCalled();
  });

  it('handleAddCustomer가 새 고객을 추가한다', () => {
    const mockSetCases = vi.fn();
    const mockSetCurrentRounds = vi.fn();
    const mockSetHasUnsavedNewCustomer = vi.fn();

    const props = {
      ...defaultProps,
      cases: [],
      setCases: mockSetCases,
      setCurrentRounds: mockSetCurrentRounds,
      setHasUnsavedNewCustomer: mockSetHasUnsavedNewCustomer,
    };

    const { result } = renderHook(() => useCustomerCaseHandlers(props), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleAddCustomer();
    });

    expect(mockSetCases).toHaveBeenCalled();
    expect(mockSetCurrentRounds).toHaveBeenCalled();
    expect(mockSetHasUnsavedNewCustomer).toHaveBeenCalledWith(true);
  });

  it('이미 새 고객이 있을 때 추가 시도하면 토스트 에러를 표시한다', () => {
    const mockCases = [{ id: 'new-customer-123', customerName: '새 고객' } as ClinicalCase];

    const props = {
      ...defaultProps,
      cases: mockCases,
    };

    const { result } = renderHook(() => useCustomerCaseHandlers(props), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleAddCustomer();
    });

    expect(toast.error).toHaveBeenCalledWith(
      '이미 등록 중인 새 고객이 있습니다. 먼저 저장하거나 취소해주세요.'
    );
  });

  it('isNewCustomer 유틸리티 함수가 정확히 작동한다', () => {
    const { result } = renderHook(() => useCustomerCaseHandlers(defaultProps), {
      wrapper: createWrapper(),
    });

    expect(result.current.isNewCustomer('new-customer-123')).toBe(true);
    expect(result.current.isNewCustomer('123')).toBe(false);
    expect(result.current.isNewCustomer('regular-case')).toBe(false);
  });
});
