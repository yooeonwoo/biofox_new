import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CaseCard } from '@/components/clinical/CaseCard';
import type { ClinicalCase } from '@/types/clinical';

// Mock dependencies
vi.mock('@/hooks/useClinicalCases', () => ({
  useUploadPhoto: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useSerialQueue', () => ({
  useCaseSerialQueues: () => ({ enqueueForCase: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Legacy Parity: CaseCard Component', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const mockCase: ClinicalCase = {
    id: 'test-case-1',
    customerName: '김테스트',
    status: 'active',
    consentReceived: true,
    consentImageUrl: undefined,
    photos: [],
    customerInfo: {
      name: '김테스트',
      age: 30,
      gender: 'female',
      products: ['cure_booster', 'cure_mask'],
      skinTypes: ['red_sensitive', 'pore'],
    },
    roundCustomerInfo: {
      1: {
        treatmentType: '10GF',
        products: ['cure_booster', 'cure_mask'],
        skinTypes: ['red_sensitive', 'pore'],
        memo: '테스트 메모',
        date: '2024-01-15',
      },
    },
    createdAt: '2024-01-15T09:00:00Z',
  };

  const mockHandlers = {
    handleConsentChange: vi.fn(),
    handleCaseStatusChange: vi.fn(),
    handleDeleteCase: vi.fn(),
    refreshCases: vi.fn(),
    handleSaveAll: vi.fn(),
    handleBasicCustomerInfoUpdate: vi.fn(),
    handleRoundCustomerInfoUpdate: vi.fn(),
    updateCaseCheckboxes: vi.fn(),
  };

  const defaultProps = {
    case_: mockCase,
    index: 0,
    currentRounds: { 'test-case-1': 1 },
    saveStatus: { 'test-case-1': 'idle' as const },
    numberVisibleCards: new Set<string>(),
    isNewCustomer: () => false,
    setIsComposing: vi.fn(),
    setCases: vi.fn(),
    handlers: mockHandlers,
    totalCases: 5,
  };

  it('renders with correct legacy DOM structure for active case', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CaseCard {...defaultProps} />
      </QueryClientProvider>
    );

    // Check Card container has legacy-card class
    const cardElement = container.querySelector('[data-case-id="test-case-1"]');
    expect(cardElement?.classList.contains('legacy-card')).toBe(true);
    
    // Check PhotoUploader section has legacy classes
    const photoContainer = container.querySelector('.legacy-photo-container');
    expect(photoContainer).toBeTruthy();
    
    const photoGrid = container.querySelector('.legacy-photo-grid');
    expect(photoGrid).toBeTruthy();
    
    // Check section styling
    const customerInfoSection = container.querySelector('.legacy-section');
    expect(customerInfoSection).toBeTruthy();
    
    const sectionHeader = container.querySelector('.legacy-section-header');
    expect(sectionHeader).toBeTruthy();
    
    const roundBadge = container.querySelector('.legacy-round-badge');
    expect(roundBadge).toBeTruthy();
    
    // Verify round name format (Before for round 1)
    expect(container.textContent).toContain('Before');
  });

  it('renders completed case with glass-light variant', () => {
    const completedCase = { ...mockCase, status: 'completed' as const };
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CaseCard {...defaultProps} case_={completedCase} />
      </QueryClientProvider>
    );

    const cardElement = container.querySelector('[data-case-id="test-case-1"]');
    expect(cardElement?.classList.contains('legacy-card')).toBe(true);
  });

  it('renders round 2+ with correct naming format', () => {
    const round2Props = {
      ...defaultProps,
      currentRounds: { 'test-case-1': 2 },
    };
    
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CaseCard {...round2Props} />
      </QueryClientProvider>
    );

    // Round 2 should show as "1회차" (round-1)
    expect(container.textContent).toContain('1회차');
  });

  it('matches legacy DOM snapshot', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CaseCard {...defaultProps} />
      </QueryClientProvider>
    );
    
    // Remove data attributes and dynamic content for stable snapshots
    const cleanContainer = container.cloneNode(true) as Element;
    cleanContainer.querySelectorAll('[data-testid]').forEach(el => {
      el.removeAttribute('data-testid');
    });
    
    expect(cleanContainer.innerHTML).toMatchSnapshot('customer-clinical-card-active.snap');
  });

  it('matches legacy DOM snapshot for completed case', () => {
    const completedCase = { ...mockCase, status: 'completed' as const };
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CaseCard {...defaultProps} case_={completedCase} />
      </QueryClientProvider>
    );
    
    const cleanContainer = container.cloneNode(true) as Element;
    cleanContainer.querySelectorAll('[data-testid]').forEach(el => {
      el.removeAttribute('data-testid');
    });
    
    expect(cleanContainer.innerHTML).toMatchSnapshot('customer-clinical-card-completed.snap');
  });
}); 