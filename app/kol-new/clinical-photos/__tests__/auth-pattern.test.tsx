import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import ClinicalPhotosPage from '../page';
import CustomerClinicalUploadPage from '../upload/customer/page';
import PersonalPage from '../upload/personal/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useClinicalCasesSupabase } from '@/lib/clinical-photos-supabase-hooks';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('convex/react');
vi.mock('next/navigation');
vi.mock('@/hooks/useCurrentProfile');
vi.mock('@/lib/clinical-photos-supabase-hooks', () => ({
  useClinicalCasesSupabase: vi.fn(() => ({ data: [], isLoading: false })),
  useClinicalCaseSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useClinicalPhotosSupabase: vi.fn(() => ({ data: [], isLoading: false })),
  useClinicalCaseStatsSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useRoundCustomerInfoSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useConsentFileSupabase: vi.fn(() => ({ data: null, isLoading: false })),
  useCreateClinicalCaseSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateClinicalCaseSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateClinicalCaseStatusSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteClinicalCaseSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUploadClinicalPhotoSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteClinicalPhotoSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useSaveRoundCustomerInfoSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useSaveConsentFileSupabase: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

describe('Clinical Photos Authentication Pattern', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockProfile = {
    _id: 'profile-123',
    name: 'Test KOL',
    email: 'test@example.com',
    role: 'kol',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe('Phase 1: Authentication - Supabase Session', () => {
    it('should redirect to signin when user is not authenticated', async () => {
      (useAuth as any).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      (useQuery as any).mockReturnValue(null);

      renderWithProviders(<ClinicalPhotosPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/signin');
      });
    });

    it('should proceed when user is authenticated', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
      (useQuery as any).mockReturnValue(mockProfile);

      renderWithProviders(<ClinicalPhotosPage />);

      expect(mockRouter.push).not.toHaveBeenCalledWith('/signin');
    });
  });

  describe('Phase 2: Authorization - Profile Check', () => {
    it('should show error when profile is not found', async () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
      (useQuery as any).mockReturnValue(null); // Profile not found

      renderWithProviders(<ClinicalPhotosPage />);

      await waitFor(() => {
        expect(screen.getByText('프로필을 찾을 수 없습니다.')).toBeInTheDocument();
      });
    });

    it('should redirect non-KOL users to home', async () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
      (useQuery as any).mockReturnValue({
        ...mockProfile,
        role: 'shop_owner', // Not a KOL
      });

      renderWithProviders(<ClinicalPhotosPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    it('should allow KOL users to access the page', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
      (useQuery as any).mockReturnValue(mockProfile);

      renderWithProviders(<ClinicalPhotosPage />);

      expect(mockRouter.push).not.toHaveBeenCalledWith('/');
      expect(screen.queryByText('프로필을 찾을 수 없습니다.')).not.toBeInTheDocument();
    });
  });

  describe('Phase 3: Data Fetching - Hybrid Approach', () => {
    it('should use profile._id for Supabase queries', async () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
      (useQuery as any).mockReturnValue(mockProfile);
      // Specific mock for this test
      const mockData = [{ _id: '1', name: 'Test Case' }];
      (useClinicalCasesSupabase as any).mockReturnValue({ data: mockData, isLoading: false });

      renderWithProviders(<ClinicalPhotosPage />);

      await waitFor(() => {
        expect(useClinicalCasesSupabase).toHaveBeenCalledWith(mockProfile._id, undefined);
      });
    });
  });

  describe('Subpage Pattern Consistency', () => {
    it('customer page should use useCurrentProfile hook', () => {
      (useCurrentProfile as any).mockReturnValue({
        profile: mockProfile,
        profileId: mockUser.id,
        isLoading: false,
        isAuthenticated: true,
      });

      renderWithProviders(<CustomerClinicalUploadPage />);

      expect(useCurrentProfile).toHaveBeenCalled();
    });

    it('personal page should use useCurrentProfile hook', () => {
      (useCurrentProfile as any).mockReturnValue({
        profile: mockProfile,
        profileId: mockUser.id,
        isLoading: false,
        isAuthenticated: true,
      });

      renderWithProviders(<PersonalPage />);

      expect(useCurrentProfile).toHaveBeenCalled();
    });
  });
});
