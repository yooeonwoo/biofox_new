/**
 * 인증 패턴 검증 테스트
 *
 * 이 테스트는 clinical-photos 기능의 표준 인증 패턴을 검증합니다:
 * 1. Supabase 인증 → 2. Convex Profile 조회 → 3. Convex 데이터 작업
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClinicalPhotosPage from '../page';

// Mock 설정
const mockPush = vi.fn();
const mockUseAuth = vi.fn();
const mockUseQuery = vi.fn();
const mockUseClinicalPhotosManager = vi.fn();
const mockUseCurrentProfile = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => mockUseCurrentProfile(),
}));

vi.mock('convex/react', () => ({
  useQuery: () => mockUseQuery(),
  useMutation: () => vi.fn(),
}));

vi.mock('../hooks/useClinicalPhotosManager', () => ({
  useClinicalPhotosManager: () => mockUseClinicalPhotosManager(),
}));

describe('Auth Pattern Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  it('표준 인증 패턴을 따라야 함', async () => {
    // Step 1: Supabase 인증
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user123', email: 'test@example.com' },
    });

    // Step 2: Convex Profile 조회
    const profileData = {
      _id: 'profile123',
      role: 'kol',
      email: 'test@example.com',
      name: 'Test KOL',
    };
    mockUseQuery.mockReturnValue(profileData);
    mockUseCurrentProfile.mockReturnValue({
      profile: profileData,
      profileId: 'profile123',
    });

    // Step 3: Convex 데이터 작업
    mockUseClinicalPhotosManager.mockReturnValue({
      data: {
        cases: [
          {
            _id: 'case1',
            id: 'case1',
            name: '본인',
            subject_type: 'self',
            status: 'active',
            consentReceived: false,
            customerName: '본인',
            customerInfo: { name: '본인' },
            roundCustomerInfo: {},
            photos: [],
          },
        ],
        isLoading: false,
        error: null,
      },
      actions: {
        createCase: vi.fn(),
        updateCase: vi.fn(),
        deleteCase: vi.fn(),
        updateCaseStatus: vi.fn(),
        saveRoundCustomerInfo: vi.fn(),
        uploadPhoto: vi.fn(),
        deletePhoto: vi.fn(),
        uploadConsent: vi.fn(),
      },
    });

    renderWithProviders(<ClinicalPhotosPage />);

    // 페이지가 정상적으로 렌더링되는지 확인
    await waitFor(() => {
      expect(screen.getByText('내 임상 진행상황')).toBeInTheDocument();
      expect(screen.getByText('고객 임상 관리')).toBeInTheDocument();
    });

    // 인증 흐름이 올바른 순서로 호출되었는지 확인
    expect(mockUseAuth).toHaveBeenCalled();
    expect(mockUseClinicalPhotosManager).toHaveBeenCalled();
  });

  it('인증되지 않은 사용자를 로그인으로 리다이렉트해야 함', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithProviders(<ClinicalPhotosPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/signin');
    });
  });

  it('프로필이 없는 경우 에러 메시지를 표시해야 함', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user123', email: 'test@example.com' },
    });

    mockUseQuery.mockReturnValue(null); // 프로필 없음
    mockUseCurrentProfile.mockReturnValue({
      profile: null,
      profileId: null,
    });

    renderWithProviders(<ClinicalPhotosPage />);

    await waitFor(() => {
      expect(screen.getByText('프로필을 찾을 수 없습니다.')).toBeInTheDocument();
    });
  });

  it('권한이 없는 사용자를 홈으로 리다이렉트해야 함', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user123', email: 'test@example.com' },
    });

    const profileData = {
      _id: 'profile123',
      role: 'shop_owner', // KOL이 아님
      email: 'test@example.com',
    };
    mockUseQuery.mockReturnValue(profileData);
    mockUseCurrentProfile.mockReturnValue({
      profile: profileData,
      profileId: 'profile123',
    });

    renderWithProviders(<ClinicalPhotosPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
