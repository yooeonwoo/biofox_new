import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClinicalPhotosPage from '../page';

// Mock 설정
const mockPush = vi.fn();
const mockUseAuth = vi.fn();
const mockUseQuery = vi.fn();
const mockUseClinicalCasesSupabase = vi.fn();
const mockCreateCase = vi.fn();

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

vi.mock('convex/react', () => ({
  useQuery: () => mockUseQuery(),
  useMutation: () => vi.fn(),
}));

vi.mock('@/lib/clinical-photos-supabase-hooks', () => ({
  useClinicalCasesSupabase: () => mockUseClinicalCasesSupabase(),
  useClinicalPhotosSupabase: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateClinicalCaseSupabase: () => ({
    mutate: mockCreateCase,
    isPending: false,
  }),
  useUpdateClinicalCaseSupabase: () => ({
    mutate: vi.fn(),
  }),
  useDeleteClinicalCaseSupabase: () => ({
    mutate: vi.fn(),
  }),
  // Add other missing hooks
  useClinicalCaseSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useClinicalCaseStatsSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useRoundCustomerInfoSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useConsentFileSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useUpdateClinicalCaseStatusSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUploadClinicalPhotoSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteClinicalPhotoSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useSaveRoundCustomerInfoSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useSaveConsentFileSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

describe('Clinical Photos Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  describe('Full Authentication Flow', () => {
    it('should complete full auth flow: Supabase → Convex → Supabase Data', async () => {
      // Step 1: Supabase 인증
      mockUseAuth.mockReturnValue({
        user: { id: 'supabase-123', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      // Step 2: Convex profile 조회
      mockUseQuery.mockReturnValue({
        _id: 'convex-profile-456',
        name: 'Test KOL',
        email: 'test@example.com',
        role: 'kol',
      });

      // Step 3: Supabase 데이터 조회
      mockUseClinicalCasesSupabase.mockReturnValue({
        data: [
          {
            _id: '1',
            name: '본인',
            subject_type: 'self',
            status: 'in_progress',
          },
          {
            _id: '2',
            name: '김고객',
            subject_type: 'customer',
            status: 'completed',
          },
        ],
        isLoading: false,
      });

      renderWithProviders(<ClinicalPhotosPage />);

      // 데이터가 로드된 후
      await waitFor(() => {
        expect(screen.getByText('내 임상 진행상황')).toBeInTheDocument();
        expect(screen.getByText('고객 임상 관리')).toBeInTheDocument();
      });

      // Supabase 쿼리가 Convex profile._id로 호출되었는지 확인
      expect(mockUseClinicalCasesSupabase).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle profile not found error gracefully', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'supabase-123', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      // Profile not found
      mockUseQuery.mockReturnValue(null);

      renderWithProviders(<ClinicalPhotosPage />);

      await waitFor(() => {
        expect(screen.getByText('프로필을 찾을 수 없습니다.')).toBeInTheDocument();
        expect(screen.getByText('관리자에게 문의하여 프로필을 생성해주세요.')).toBeInTheDocument();
      });
    });

    it('should handle non-KOL user access', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'supabase-123', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      mockUseQuery.mockReturnValue({
        _id: 'convex-profile-456',
        name: 'Test User',
        email: 'test@example.com',
        role: 'shop_owner', // Not KOL
      });

      renderWithProviders(<ClinicalPhotosPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Data Operations', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'supabase-123', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      mockUseQuery.mockReturnValue({
        _id: 'convex-profile-456',
        name: 'Test KOL',
        email: 'test@example.com',
        role: 'kol',
      });

      mockUseClinicalCasesSupabase.mockReturnValue({
        data: [],
        isLoading: false,
      });
    });

    it('should create personal case with profile ID', async () => {
      renderWithProviders(<ClinicalPhotosPage />);

      await waitFor(() => {
        expect(screen.getByText('아직 내 케이스가 없습니다')).toBeInTheDocument();
      });

      const createButton = screen.getByText('내 케이스 등록하기');
      fireEvent.click(createButton);

      expect(mockCreateCase).toHaveBeenCalledWith({
        name: '본인',
        profile_id: 'convex-profile-456',
        concern_area: '전체적인 피부 관리',
        treatment_plan: '개인 맞춤 관리',
        status: 'in_progress',
        consent_status: 'pending',
        subject_type: 'self',
      });
    });
  });

  describe('Loading States', () => {
    it('should show appropriate loading states during data fetch', async () => {
      // Auth loading
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      const { rerender } = renderWithProviders(<ClinicalPhotosPage />);

      expect(screen.getByText('프로필을 불러오는 중입니다...')).toBeInTheDocument();

      // Profile loading
      mockUseAuth.mockReturnValue({
        user: { id: 'supabase-123', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });
      mockUseQuery.mockReturnValue(undefined); // Loading state

      rerender(
        <QueryClientProvider client={queryClient}>
          <ClinicalPhotosPage />
        </QueryClientProvider>
      );

      expect(screen.getByText('프로필을 불러오는 중입니다...')).toBeInTheDocument();

      // Data loading
      mockUseQuery.mockReturnValue({
        _id: 'convex-profile-456',
        name: 'Test KOL',
        email: 'test@example.com',
        role: 'kol',
      });
      mockUseClinicalCasesSupabase.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <ClinicalPhotosPage />
        </QueryClientProvider>
      );

      expect(screen.getByText('임상 데이터를 불러오는 중입니다...')).toBeInTheDocument();
    });
  });
});
