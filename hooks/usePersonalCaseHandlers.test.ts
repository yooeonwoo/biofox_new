import { renderHook, act } from '@testing-library/react';
import { usePersonalCaseHandlers } from './usePersonalCaseHandlers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import type { ClinicalCase } from '@/types/clinical';

// 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({})),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/clinical-photos', () => ({
  updateCase: vi.fn(() => Promise.resolve({})),
  saveRoundCustomerInfo: vi.fn(() => Promise.resolve({})),
  uploadPhoto: vi.fn(() => Promise.resolve('http://example.com/photo.jpg')),
  fetchPhotos: vi.fn(() => Promise.resolve([])),
  deletePhoto: vi.fn(() => Promise.resolve()),
}));

// URL.createObjectURL 모킹
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-image');

describe('usePersonalCaseHandlers', () => {
  const mockUser = { id: '56', name: '정광원', role: 'kol' };
  const mockCase: ClinicalCase = {
    id: 'new-personal-123',
    customerName: '본인',
    status: 'active',
    createdAt: '2024-01-01',
    consentReceived: false,
    photos: [],
    customerInfo: {
      name: '본인',
      products: [],
      skinTypes: [],
      memo: '',
    },
    roundCustomerInfo: {
      1: {
        treatmentType: '',
        products: [],
        skinTypes: [],
        memo: '',
        date: '2024-01-01',
      },
    },
    cureBooster: false,
    cureMask: false,
    premiumMask: false,
    allInOneSerum: false,
    skinRedSensitive: false,
    skinPigment: false,
    skinPore: false,
    skinTrouble: false,
    skinWrinkle: false,
    skinEtc: false,
  };

  const defaultProps = {
    user: mockUser,
    cases: [mockCase],
    setCases: vi.fn(),
    currentRound: 1,
    setCurrentRound: vi.fn(),
    isComposing: false,
    debouncedUpdate: vi.fn(),
    saveStatus: {},
    markSaving: vi.fn(),
    markSaved: vi.fn(),
    markError: vi.fn(),
    enqueue: vi.fn(() => Promise.resolve()),
    hasUnsavedPersonalCase: true,
    setHasUnsavedPersonalCase: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // localStorage 모킹
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('isNewPersonalCase 헬퍼 함수가 올바르게 동작해야 한다', () => {
    const { result } = renderHook(() => usePersonalCaseHandlers(defaultProps));

    expect(result.current.isNewPersonalCase('new-personal-123')).toBe(true);
    expect(result.current.isNewPersonalCase('new-customer-123')).toBe(false);
    expect(result.current.isNewPersonalCase('123')).toBe(false);
  });

  it('로그아웃 핸들러가 올바르게 동작해야 한다', async () => {
    const { result } = renderHook(() => usePersonalCaseHandlers(defaultProps));

    await act(async () => {
      await result.current.handleSignOut();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('dev-user');
    expect(mockPush).toHaveBeenCalledWith('/signin');
  });

  it('케이스 상태 변경이 올바르게 동작해야 한다', async () => {
    const mockSetCases = vi.fn();
    const props = { ...defaultProps, setCases: mockSetCases };

    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    await act(async () => {
      await result.current.handleCaseStatusChange('new-personal-123', 'completed');
    });

    expect(mockSetCases).toHaveBeenCalled();
  });

  it('동의서 상태 변경이 올바르게 동작해야 한다', async () => {
    const mockSetCases = vi.fn();
    const props = { ...defaultProps, setCases: mockSetCases };

    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    await act(async () => {
      await result.current.handleConsentChange('new-personal-123', true);
    });

    expect(mockSetCases).toHaveBeenCalled();
  });

  it('개인 케이스 추가가 1개 제한을 준수해야 한다', () => {
    // 이미 케이스가 1개 있는 상황
    const props = { ...defaultProps, cases: [mockCase] };
    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    act(() => {
      result.current.handleAddPersonalCase();
    });

    expect(toast.warning).toHaveBeenCalledWith('본인 케이스는 1개만 생성할 수 있습니다.');
  });

  it('케이스가 없을 때 개인 케이스 추가가 성공해야 한다', () => {
    const mockSetCases = vi.fn();
    const mockSetCurrentRound = vi.fn();
    const mockSetHasUnsavedPersonalCase = vi.fn();

    const props = {
      ...defaultProps,
      cases: [], // 케이스 없음
      setCases: mockSetCases,
      setCurrentRound: mockSetCurrentRound,
      setHasUnsavedPersonalCase: mockSetHasUnsavedPersonalCase,
    };

    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    act(() => {
      result.current.handleAddPersonalCase();
    });

    expect(mockSetCases).toHaveBeenCalled();
    expect(mockSetCurrentRound).toHaveBeenCalledWith(1);
    expect(mockSetHasUnsavedPersonalCase).toHaveBeenCalledWith(true);
    expect(toast.success).toHaveBeenCalledWith('새 개인 케이스가 추가되었습니다.');
  });

  it('사진 업로드가 새 개인 케이스에서 올바르게 동작해야 한다', async () => {
    const mockSetCases = vi.fn();
    const props = { ...defaultProps, setCases: mockSetCases };

    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handlePhotoUpload('new-personal-123', 1, 'front', mockFile);
    });

    expect(mockSetCases).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('사진이 성공적으로 업로드되었습니다.');
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
  });

  it('사진 삭제가 새 개인 케이스에서 올바르게 동작해야 한다', async () => {
    const mockSetCases = vi.fn();
    const props = { ...defaultProps, setCases: mockSetCases };

    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    await act(async () => {
      await result.current.handlePhotoDelete('new-personal-123', 1, 'front');
    });

    expect(mockSetCases).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('사진이 성공적으로 삭제되었습니다.');
  });

  it('기본 개인정보 업데이트가 올바르게 동작해야 한다', async () => {
    const mockSetCases = vi.fn();
    const mockMarkSaving = vi.fn();
    const mockMarkSaved = vi.fn();

    const props = {
      ...defaultProps,
      setCases: mockSetCases,
      markSaving: mockMarkSaving,
      markSaved: mockMarkSaved,
    };

    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    await act(async () => {
      await result.current.handleBasicPersonalInfoUpdate('new-personal-123', { age: 25 });
    });

    expect(mockMarkSaving).toHaveBeenCalledWith('new-personal-123');
    expect(mockSetCases).toHaveBeenCalled();
    expect(mockMarkSaved).toHaveBeenCalledWith('new-personal-123');
  });

  it('회차별 개인정보 업데이트가 올바르게 동작해야 한다', async () => {
    const mockSetCases = vi.fn();
    const mockMarkSaving = vi.fn();
    const mockMarkSaved = vi.fn();

    const props = {
      ...defaultProps,
      setCases: mockSetCases,
      markSaving: mockMarkSaving,
      markSaved: mockMarkSaved,
    };

    const { result } = renderHook(() => usePersonalCaseHandlers(props));

    await act(async () => {
      await result.current.handleRoundPersonalInfoUpdate('new-personal-123', 1, {
        treatmentType: '10GF',
        memo: '테스트 메모',
      });
    });

    expect(mockMarkSaving).toHaveBeenCalledWith('new-personal-123');
    expect(mockSetCases).toHaveBeenCalled();
    expect(mockMarkSaved).toHaveBeenCalledWith('new-personal-123');
  });
});
