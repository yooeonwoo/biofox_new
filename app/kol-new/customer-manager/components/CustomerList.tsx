'use client';

import CustomerCard from './CustomerCard';
import { CustomerProgress, Customer } from '@/lib/types/customer';
import { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import { toast } from 'sonner';

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

  // 더미 데이터 초기화
  useEffect(() => {
    // 더미 고객 데이터 생성
    const dummyCustomers: LocalCustomer[] = [
      {
        id: '1',
        kol_id: kolId,
        name: '김철수',
        shopName: '뷰티샵 강남점',
        phone: '010-1234-5678',
        region: '서울',
        placeAddress: '서울시 강남구 테헤란로 123',
        assignee: '이영희',
        manager: '박민수',
        status: 'active',
        notes: '우수 고객',
        completed_stages: 3,
        total_stages: 6,
        created_at: new Date().toISOString(),
        customer_progress: [
          {
            id: 'p1',
            customerId: '1',
            stageData: {
              inflow: { source: '온라인' },
              contract: { type: '구매', purchaseDate: '2024-01-15' },
              delivery: { type: '설치', installDate: '2024-01-20' },
            },
            achievements: {},
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: '2',
        kol_id: kolId,
        name: '이미영',
        shopName: '더뷰티 청담점',
        phone: '010-2345-6789',
        region: '서울',
        placeAddress: '서울시 강남구 청담동 456',
        assignee: '최지훈',
        manager: '김수진',
        status: 'active',
        notes: '신규 고객',
        completed_stages: 1,
        total_stages: 6,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        customer_progress: [
          {
            id: 'p2',
            customerId: '2',
            stageData: {
              inflow: { source: '오프라인' },
            },
            achievements: {},
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ];
    setLocalCustomers(dummyCustomers);
  }, [kolId]);

  const handleAddCustomer = () => {
    if (isAdding) return;

    const newCustomer: LocalCustomer = {
      id: `new-${Date.now()}`,
      kol_id: kolId, // Convex ID 그대로 사용
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
    // 더미 데이터로 저장 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    const newCustomerId = `customer-${Date.now()}`;
    const savedCustomer: LocalCustomer = {
      id: newCustomerId,
      kol_id: kolId,
      ...customerData,
      status: 'active',
      completed_stages: 0,
      total_stages: 6,
      created_at: new Date().toISOString(),
      customer_progress: [],
    };

    // 임시 고객 제거하고 저장된 고객 추가
    setLocalCustomers(prev => [savedCustomer, ...prev.filter(c => !c.isNew)]);
    setIsAdding(false);

    toast.success('고객이 성공적으로 등록되었습니다.');
  };

  const handleDeleteNewCustomer = (customerId: string | number) => {
    setLocalCustomers(prev => prev.filter(c => c.id !== customerId));
    setIsAdding(false);
  };

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
              isDummyMode={true} // 하드코딩 인증으로 더미 모드 사용
            />
          ))}
        </div>
      </main>
    </div>
  );
}
