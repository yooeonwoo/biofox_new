import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCaseManagement } from '../useCaseManagement';
import * as service from '@/lib/clinical-photos-service';

describe('useCaseManagement', () => {
  const mockPersonalCase = { id: 1, customerName: '본인', status: 'active' } as any;
  const mockCustomerCases = [
    { id: 2, customerName: 'Alice', status: 'active' },
    { id: 3, customerName: 'Bob', status: 'active' },
  ] as any[];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('personal 타입일 때 본인 케이스를 자동 로드/생성한다', async () => {
    vi.spyOn(service, 'ensurePersonalCaseExists').mockResolvedValue(mockPersonalCase);

    const { result } = renderHook(() => useCaseManagement('personal'));

    // 처음에는 loading true
    expect(result.current.loading).toBe(true);

    // wait for hook to update
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.cases).toEqual([mockPersonalCase]);
  });

  it('customer 타입일 때 본인 케이스를 제외한 고객 케이스를 로드한다', async () => {
    vi.spyOn(service, 'fetchCustomerCases').mockResolvedValue(mockCustomerCases);

    const { result } = renderHook(() => useCaseManagement('customer'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.cases).toEqual(mockCustomerCases);
  });
}); 