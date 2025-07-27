/**
 * useClinicalPhotosManager 훅 단위 테스트
 *
 * 이 테스트는 중앙 데이터 관리 훅의 핵심 기능들을 검증합니다:
 * 1. 데이터 변환 로직
 * 2. Convex 통합
 * 3. 에러 처리
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClinicalPhotosManager } from '../hooks/useClinicalPhotosManager';

// Mock dependencies
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/convex/_generated/api', () => ({
  api: {
    clinical: {
      listClinicalCases: 'listClinicalCases',
      createClinicalCase: 'createClinicalCase',
      updateClinicalCase: 'updateClinicalCase',
      deleteClinicalCase: 'deleteClinicalCase',
      updateClinicalCaseStatus: 'updateClinicalCaseStatus',
      saveRoundCustomerInfo: 'saveRoundCustomerInfo',
    },
    fileStorage: {
      saveClinicalPhoto: 'saveClinicalPhoto',
      deleteClinicalPhoto: 'deleteClinicalPhoto',
      generateUploadUrl: 'generateUploadUrl',
      saveConsentFile: 'saveConsentFile',
      deleteConsentFile: 'deleteConsentFile',
    },
  },
}));

// Import mocked modules to access functions
import { useQuery, useMutation } from 'convex/react';
import { toast } from 'sonner';

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);
const mockToast = vi.mocked(toast);

describe('useClinicalPhotosManager', () => {
  const mockProfileId = 'profile123' as any;
  const mockCreateCase = vi.fn();
  const mockUpdateCase = vi.fn();
  const mockDeleteCase = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 query mock 설정
    mockUseQuery.mockReturnValue({
      page: [
        {
          _id: 'case1',
          name: '본인',
          subject_type: 'self',
          status: 'in_progress',
          consent_status: 'pending',
          created_at: Date.now(),
        },
        {
          _id: 'case2',
          name: '고객1',
          subject_type: 'customer',
          status: 'in_progress',
          consent_status: 'consented',
          created_at: Date.now(),
        },
      ],
    });

    // 기본 mutation mock 설정
    mockUseMutation.mockReturnValue(mockCreateCase as any);
  });

  it('데이터를 올바르게 변환해야 함', () => {
    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    expect(result.current.data.cases).toHaveLength(2);

    const personalCase = result.current.data.cases.find(c => c.name === '본인');
    expect(personalCase).toBeDefined();
    expect(personalCase?.status).toBe('active'); // in_progress -> active 변환
    expect(personalCase?.consentReceived).toBe(false); // pending -> false
    expect(personalCase?.id).toBe('case1');
    expect(personalCase?.createdAt).toBeDefined();

    const customerCase = result.current.data.cases.find(c => c.name === '고객1');
    expect(customerCase).toBeDefined();
    expect(customerCase?.status).toBe('active');
    expect(customerCase?.consentReceived).toBe(true); // consented -> true
  });

  it('로딩 상태를 올바르게 처리해야 함', () => {
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    expect(result.current.data.isLoading).toBe(true);
    expect(result.current.data.cases).toEqual([]);
  });

  it('에러 상태를 올바르게 처리해야 함', () => {
    mockUseQuery.mockReturnValue(null);

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    expect(result.current.data.error).toBeDefined();
    expect(result.current.data.error?.message).toBe('Failed to load cases');
  });

  it('케이스 생성 액션이 올바르게 작동해야 함', async () => {
    mockCreateCase.mockResolvedValue('new-case-id');

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    await result.current.actions.createCase({
      name: '새 고객',
      subject_type: 'customer',
      consent_status: 'pending',
    });

    expect(mockCreateCase).toHaveBeenCalledWith({
      profileId: mockProfileId,
      name: '새 고객',
      subject_type: 'customer',
      consent_status: 'pending',
    });

    expect(mockToast.success).toHaveBeenCalledWith('케이스가 생성되었습니다');
  });

  it('케이스 생성 실패 시 에러 처리해야 함', async () => {
    mockCreateCase.mockRejectedValue(new Error('Creation failed'));

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    await expect(
      result.current.actions.createCase({
        name: '새 고객',
        subject_type: 'customer',
        consent_status: 'pending',
      })
    ).rejects.toThrow('Creation failed');

    expect(mockToast.error).toHaveBeenCalledWith('케이스 생성 실패');
  });

  it('케이스 업데이트 액션이 올바르게 작동해야 함', async () => {
    mockUpdateCase.mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(mockUpdateCase as any);

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    await result.current.actions.updateCase({
      caseId: 'case1' as any,
      updates: { name: '수정된 이름' },
    });

    expect(mockUpdateCase).toHaveBeenCalledWith({
      caseId: 'case1',
      profileId: mockProfileId,
      updates: { name: '수정된 이름' },
    });

    expect(mockToast.success).toHaveBeenCalledWith('케이스가 업데이트되었습니다');
  });

  it('케이스 상태 변경이 올바르게 작동해야 함', async () => {
    const mockUpdateStatus = vi.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(mockUpdateStatus as any);

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    await result.current.actions.updateCaseStatus({
      caseId: 'case1' as any,
      status: 'completed',
    });

    expect(mockUpdateStatus).toHaveBeenCalledWith({
      caseId: 'case1',
      profileId: mockProfileId,
      status: 'completed',
    });

    expect(mockToast.success).toHaveBeenCalledWith('상태가 변경되었습니다');
  });

  it('케이스 삭제가 올바르게 작동해야 함', async () => {
    mockDeleteCase.mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(mockDeleteCase as any);

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    await result.current.actions.deleteCase({
      caseId: 'case1' as any,
    });

    expect(mockDeleteCase).toHaveBeenCalledWith({
      caseId: 'case1',
      profileId: mockProfileId,
    });

    expect(mockToast.success).toHaveBeenCalledWith('케이스가 삭제되었습니다');
  });

  it('회차별 고객 정보 저장이 올바르게 작동해야 함', async () => {
    const mockSaveRoundInfo = vi.fn().mockResolvedValue(undefined);
    mockUseMutation.mockReturnValue(mockSaveRoundInfo as any);

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    const roundInfo = {
      treatmentDate: '2024-01-01',
      treatmentType: '치료타입',
      products: ['product1'],
      skinTypes: ['skin1'],
      memo: '메모',
    };

    await result.current.actions.saveRoundCustomerInfo({
      caseId: 'case1' as any,
      roundNumber: 1,
      info: roundInfo,
    });

    expect(mockSaveRoundInfo).toHaveBeenCalledWith({
      caseId: 'case1',
      profileId: mockProfileId,
      roundNumber: 1,
      info: roundInfo,
    });
  });

  it('profileId가 없을 때 query를 skip해야 함', () => {
    // profileId가 없을 때는 'skip'이 전달되므로 데이터가 없어야 함
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: undefined }));

    expect(result.current.data.cases).toEqual([]);
    expect(result.current.data.isLoading).toBe(true);
  });

  it('빈 케이스 배열을 올바르게 처리해야 함', () => {
    mockUseQuery.mockReturnValue({ page: [] });

    const { result } = renderHook(() => useClinicalPhotosManager({ profileId: mockProfileId }));

    expect(result.current.data.cases).toEqual([]);
    expect(result.current.data.isLoading).toBe(false);
    expect(result.current.data.error).toBeNull();
  });
});
