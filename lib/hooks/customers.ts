// 이 파일은 Convex로 전환되었습니다.
// 새로운 훅은 /hooks/useCustomers.ts 에서 사용하세요.
//
// 마이그레이션 가이드:
// - useCustomers() → hooks/useCustomers.ts의 useCustomers()
// - useUpdateCustomer() → hooks/useCustomers.ts의 useUpdateCustomerProgress()
//
// 백업 파일: lib/hooks/customers.ts.backup

export {
  useCustomers,
  useCustomer,
  useCustomerStats,
  useCustomerSearch,
  useCreateCustomer,
  useUpdateCustomer,
  useUpdateCustomerProgress,
  useAddCustomerNote,
  useDeleteCustomer,
  useDebouncedCustomerProgress,
} from '@/hooks/useCustomers';

export type { CustomerWithProgress } from '@/hooks/useCustomers';
