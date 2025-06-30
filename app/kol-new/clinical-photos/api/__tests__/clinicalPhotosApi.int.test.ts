import '@/tests/setup';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  createCase,
  fetchCase,
  updateCase,
  deleteCase,
} from '@/lib/clinical-photos-api';

// Mock fetch to avoid network calls
global.fetch = vi.fn();

const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('clinical-photos-api mocked', () => {
  let createdCaseId: number;
  const uniqueName = `모킹테스트_${Date.now()}`;

  beforeAll(() => {
    process.env.TEST_KOL_ID = '00000000-0000-4000-8000-000000000001';
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('createCase → fetchCase', async () => {
    // Mock successful case creation
    const mockCase = {
      id: 12345,
      customerName: uniqueName,
      caseName: `케이스_${uniqueName}`,
      status: 'active',
      concernArea: '',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockCase], error: null }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockCase, error: null }),
      } as Response);

    const newCase = await createCase({
      customerName: uniqueName,
      caseName: `케이스_${uniqueName}`,
    });
    expect(newCase).toBeTruthy();
    expect(newCase?.customerName).toBe(uniqueName);
    createdCaseId = newCase!.id;

    const fetched = await fetchCase(createdCaseId);
    expect(fetched?.customerName).toBe(uniqueName);
  }, 20_000);

  it('updateCase 변경사항 반영', async () => {
    const mockUpdatedCase = {
      id: createdCaseId || 12345,
      customerName: uniqueName,
      concernArea: '리액트테스트',
      status: 'active',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockUpdatedCase, error: null }),
    } as Response);

    const updated = await updateCase(createdCaseId || 12345, { concernArea: '리액트테스트' });
    expect(updated?.concernArea).toBe('리액트테스트');
  }, 20_000);
}); 