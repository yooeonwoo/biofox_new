'use client';

import CustomerCard from './CustomerCard';
import { CustomerProgress, Customer } from '@/lib/types/customer';
import { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import { toast } from 'sonner';

// Convex 관련 imports
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// isNew와 같은 로컬 상태를 포함하는 확장된 고객 타입
type LocalCustomer = Customer & {
  customer_progress?: CustomerProgress[];
  isNew?: boolean;
};

interface Props {
  initialData: LocalCustomer[];
  kolId: string; // 간단한 문자열 ID
}

export default function CustomerList({ kolId }: Props) {
  const [localCustomers, setLocalCustomers] = useState<LocalCustomer[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // 현재는 임시로 하드코딩된 프로필 ID 사용 (실제로는 profiles에서 조회해야 함)
  const actualKolId = 'mock-profile-id' as Id<'profiles'>;

  // Convex queries and mutations
  const customers = useQuery(api.customers.getCustomersByKol, {
    kolId: actualKolId,
    paginationOpts: { numItems: 100, cursor: null },
  });

  const createCustomer = useMutation(api.customers.createCustomer);

  // 실제 고객 데이터 로드
  useEffect(() => {
    if (customers?.page) {
      const formattedCustomers: LocalCustomer[] = customers.page.map(c => ({
        id: c._id as string,
        kol_id: 1, // 임시로 숫자로 설정 (실제로는 kolId를 숫자로 변환해야 함)
        name: c.name,
        shopName: c.shop_name,
        phone: c.phone,
        region: c.region,
        placeAddress: c.place_address,
        assignee: c.assignee,
        manager: c.manager,
        status: c.status,
        notes: c.notes,
        completed_stages: c.completed_stages || 0,
        total_stages: c.total_stages || 6,
        created_at: new Date(c.created_at).toISOString(),
        customer_progress: [], // 일단 빈 배열로 설정
      }));
      setLocalCustomers(formattedCustomers);
    }
  }, [customers]);

  const handleAddCustomer = () => {
    if (isAdding) return;

    const newCustomer: LocalCustomer = {
      id: `new-${Date.now()}`,
      kol_id: 1, // 임시로 숫자로 설정
      name: '신규 고객',
      shopName: '',
      phone: '',
      region: '',
      placeAddress: '',
      assignee: '',
      manager: '',
      status: 'new',
      created_at: new Date().toISOString(),
      customer_progress: [],
      isNew: true,
      notes: '',
      completed_stages: 0,
      total_stages: 6,
    };
    setLocalCustomers(prev => [newCustomer, ...prev]);
    setIsAdding(true);
  };

  const handleSaveNewCustomer = async (customerData: {
    name: string;
    shopName?: string;
    phone: string;
    region: string;
    placeAddress?: string;
    assignee: string;
    manager: string;
    notes?: string;
  }) => {
    try {
      const customerId = await createCustomer({
        kolId: actualKolId,
        name: customerData.name,
        shopName: customerData.shopName,
        phone: customerData.phone,
        region: customerData.region,
        placeAddress: customerData.placeAddress,
        assignee: customerData.assignee,
        manager: customerData.manager,
        notes: customerData.notes,
      });

      // 임시 고객 제거 (실제 데이터는 useQuery를 통해 자동으로 업데이트됨)
      setLocalCustomers(prev => prev.filter(c => !c.isNew));
      setIsAdding(false);

      toast.success('고객이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('고객 생성 실패:', error);
      toast.error('고객 등록에 실패했습니다.');
    }
  };

  const handleDeleteNewCustomer = (customerId: string | number) => {
    setLocalCustomers(prev => prev.filter(c => c.id !== customerId));
    setIsAdding(false);
  };

  // 로딩 상태
  if (customers === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 빈 상태 처리
  if (!localCustomers || localCustomers.length === 0) {
    return (
      <div className="py-8 text-center">
        <h3 className="mb-2 text-lg font-medium text-gray-900">등록된 고객이 없습니다</h3>
        <p className="mb-4 text-gray-600">첫 번째 고객을 등록해보세요.</p>
        <button
          onClick={handleAddCustomer}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          disabled={isAdding}
        >
          고객 추가
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        backPath="/kol-new"
        onAddCustomer={handleAddCustomer}
        isAdding={isAdding}
        title="영업 관리 일지"
      />

      {/* 메인 컨테이너 - clinical-photos와 동일한 반응형 레이아웃 */}
      <main className="mx-auto w-full max-w-none xs:max-w-full sm:max-w-2xl">
        <div className="space-y-4 p-2 xs:space-y-5 xs:p-3 md:px-0 md:py-6">
          {localCustomers.map((c, idx) => (
            <CustomerCard
              key={c.id}
              customer={c}
              progress={c.customer_progress?.[0]}
              cardNumber={idx + 1}
              isNew={c.isNew}
              onDelete={() => handleDeleteNewCustomer(c.id)}
              onSave={c.isNew ? handleSaveNewCustomer : undefined}
              isDummyMode={false} // 실제 Convex 연동 모드로 변경
            />
          ))}
        </div>
      </main>
    </div>
  );
}
