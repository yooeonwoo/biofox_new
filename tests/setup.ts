import { vi } from "vitest";

// fetch 모킹 - 네트워크 호출로 인한 flaky 테스트 방지
vi.stubGlobal("fetch", (url: string) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: {} }),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  } as unknown as Response)
);

// URL.createObjectURL 모킹 - 테스트 환경에서 사용할 수 없는 API
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// localStorage 모킹
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// sessionStorage 모킹
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// 환경변수 모킹
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

// Mock clinical-photos-api to operate in-memory and avoid Supabase dependency
vi.mock('@/lib/clinical-photos-api', () => {
  const store: Record<number, any> = {};
  let idSeq = 1000;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createCase: async (data: any) => {
      const id = ++idSeq;
      const record = {
        id,
        customerName: data.customerName,
        caseName: data.caseName,
        concernArea: data.concernArea ?? '',
        status: 'active',
        ...data,
      };
      store[id] = record;
      return record;
    },

    fetchCase: async (id: number) => {
      return store[id] ?? null;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateCase: async (id: number, patch: any) => {
      if (!store[id]) return null;
      store[id] = { ...store[id], ...patch };
      return store[id];
    },

    deleteCase: async (id: number) => {
      if (store[id]) {
        delete store[id];
        return true;
      }
      return false;
    },
  };
}); 