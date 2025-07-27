import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  redirect: vi.fn(),
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

describe('ClinicalPhotosPage Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // 기본 mock 설정
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user123', email: 'test@example.com' },
    });

    mockUseCurrentProfile.mockReturnValue({
      profile: { _id: 'profile123', role: 'kol' },
      profileId: 'profile123',
    });

    mockUseQuery.mockReturnValue({
      _id: 'profile123',
      role: 'kol',
      email: 'test@example.com',
    });

    mockUseClinicalPhotosManager.mockReturnValue({
      data: {
        cases: [],
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
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  it('비인증 사용자를 로그인 페이지로 리다이렉트해야 함', async () => {
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

  it('KOL이 아닌 사용자를 홈으로 리다이렉트해야 함', async () => {
    mockUseQuery.mockReturnValue({
      _id: 'profile123',
      role: 'shop_owner',
      email: 'test@example.com',
    });

    mockUseCurrentProfile.mockReturnValue({
      profile: { _id: 'profile123', role: 'shop_owner' },
      profileId: 'profile123',
    });

    renderWithProviders(<ClinicalPhotosPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('케이스가 없을 때 빈 상태를 표시해야 함', async () => {
    renderWithProviders(<ClinicalPhotosPage />);

    await waitFor(() => {
      expect(screen.getByText('아직 내 케이스가 없습니다')).toBeInTheDocument();
      expect(screen.getByText('등록된 고객 케이스가 없습니다')).toBeInTheDocument();
    });
  });

  it('본인 케이스를 생성할 수 있어야 함', async () => {
    const mockCreateCase = vi.fn().mockResolvedValue('new-case-id');
    mockUseClinicalPhotosManager.mockReturnValue({
      data: {
        cases: [],
        isLoading: false,
        error: null,
      },
      actions: {
        createCase: mockCreateCase,
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

    const createButton = await screen.findByText('내 케이스 등록하기');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateCase).toHaveBeenCalledWith({
        name: '본인',
        subject_type: 'self',
        consent_status: 'pending',
      });
    });
  });

  it('고객 케이스를 표시해야 함', async () => {
    mockUseClinicalPhotosManager.mockReturnValue({
      data: {
        cases: [
          {
            _id: 'case1',
            id: 'case1',
            name: '홍길동',
            subject_type: 'customer',
            status: 'active', // in_progress -> active로 변경
            consentReceived: false,
            customerName: '홍길동',
            customerInfo: { name: '홍길동', products: [], skinTypes: [] },
            roundCustomerInfo: {},
            photos: [],
            createdAt: new Date().toISOString(),
          },
          {
            _id: 'case2',
            id: 'case2',
            name: '김철수',
            subject_type: 'customer',
            status: 'active', // in_progress -> active로 변경
            consentReceived: true,
            customerName: '김철수',
            customerInfo: { name: '김철수', products: [], skinTypes: [] },
            roundCustomerInfo: {},
            photos: [],
            createdAt: new Date().toISOString(),
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

    await waitFor(() => {
      expect(screen.getByText('전체 2건')).toBeInTheDocument();
      expect(screen.getByText('진행중 2건')).toBeInTheDocument();
    });
  });

  it('로딩 중일 때 로딩 화면을 표시해야 함', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
      user: null,
    });

    renderWithProviders(<ClinicalPhotosPage />);

    expect(screen.getByText('프로필을 불러오는 중입니다...')).toBeInTheDocument();
  });

  it('프로필이 없을 때 에러 메시지를 표시해야 함', async () => {
    mockUseQuery.mockReturnValue(null);

    renderWithProviders(<ClinicalPhotosPage />);

    await waitFor(() => {
      expect(screen.getByText('프로필을 찾을 수 없습니다.')).toBeInTheDocument();
      expect(screen.getByText('관리자에게 문의하여 프로필을 생성해주세요.')).toBeInTheDocument();
    });
  });
});
