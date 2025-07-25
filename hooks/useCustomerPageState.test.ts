import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { checkAuthSupabase } from '@/lib/auth';
import { useCustomerPageState } from './useCustomerPageState';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

// Mock dependencies
vi.mock('next/navigation');
vi.mock('@/lib/auth');
vi.mock('@/lib/clinical-photos');
vi.mock('@/lib/clinical-photos');

const mockUseRouter = vi.mocked(useRouter);
const mockCheckAuthSupabase = vi.mocked(checkAuthSupabase);

// Mock window.localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useCustomerPageState', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    // Mock DOM methods
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      writable: true,
    });

    Object.defineProperty(document, 'addEventListener', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(document, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    mockCheckAuthSupabase.mockResolvedValue({ user: null });

    const { result } = renderHook(() => useCustomerPageState());

    expect(result.current.user).toBe(null);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.cases).toEqual([]);
    expect(result.current.currentRounds).toEqual({});
    expect(result.current.hasUnsavedNewCustomer).toBe(false);
    expect(result.current.numberVisibleCards).toEqual(new Set());
    expect(result.current.isComposing).toBe(false);
    expect(result.current.isUserInteracting).toBe(false);
    expect(result.current.saveStatus).toEqual({});
  });

  it('isNewCustomer 함수가 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useCustomerPageState());

    expect(result.current.isNewCustomer('new-customer-123')).toBe(true);
    expect(result.current.isNewCustomer('regular-case-456')).toBe(false);
    expect(result.current.isNewCustomer('123')).toBe(false);
  });

  it('상태 setter 함수들이 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useCustomerPageState());

    act(() => {
      result.current.setIsComposing(true);
    });
    expect(result.current.isComposing).toBe(true);

    act(() => {
      result.current.setIsUserInteracting(true);
    });
    expect(result.current.isUserInteracting).toBe(true);

    act(() => {
      result.current.setHasUnsavedNewCustomer(true);
    });
    expect(result.current.hasUnsavedNewCustomer).toBe(true);
  });

  it('사용자 인증 실패 시 로그인 페이지로 리디렉션되어야 함', async () => {
    mockCheckAuthSupabase.mockResolvedValue({ user: null });

    renderHook(() => useCustomerPageState());

    // Wait for useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockPush).toHaveBeenCalledWith('/signin');
  });

  it('사용자 인증 성공 시 사용자 정보가 설정되어야 함', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', role: 'kol' };
    mockCheckAuthSupabase.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useCustomerPageState());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
  });

  it('numberVisibleCards 상태를 올바르게 업데이트할 수 있어야 함', () => {
    const { result } = renderHook(() => useCustomerPageState());

    const testIds = new Set(['case1', 'case2', 'case3']);

    act(() => {
      result.current.setNumberVisibleCards(testIds);
    });

    expect(result.current.numberVisibleCards).toEqual(testIds);
  });

  it('currentRounds 상태를 올바르게 업데이트할 수 있어야 함', () => {
    const { result } = renderHook(() => useCustomerPageState());

    const testRounds = { case1: 1, case2: 2, case3: 3 };

    act(() => {
      result.current.setCurrentRounds(testRounds);
    });

    expect(result.current.currentRounds).toEqual(testRounds);
  });

  it('refs가 올바르게 초기화되어야 함', () => {
    const { result } = renderHook(() => useCustomerPageState());

    expect(result.current.userActivityTimeoutRef).toBeDefined();
    expect(result.current.mainContentRef).toBeDefined();
    expect(result.current.casesRef).toBeDefined();
    expect(result.current.userActivityTimeoutRef.current).toBe(null);
    expect(result.current.mainContentRef.current).toBe(null);
    expect(result.current.casesRef.current).toEqual([]);
  });
});
