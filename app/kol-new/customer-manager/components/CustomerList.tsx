'use client';

import { useCustomers } from '@/hooks/useCustomers';
import CustomerCard from './CustomerCard';
import { CustomerProgress, Customer } from '@/lib/types/customer';
import { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import { Id } from '@/convex/_generated/dataModel';

// isNew와 같은 로컬 상태를 포함하는 확장된 고객 타입
type LocalCustomer = Customer & {
  customer_progress?: CustomerProgress[];
  isNew?: boolean;
};

interface Props {
  initialData: LocalCustomer[];
  kolId: string; // Convex ID는 문자열
}

export default function CustomerList({ initialData, kolId }: Props) {
  const { results: customers, status, loadMore } = useCustomers(kolId as Id<'profiles'>);

  const [localCustomers, setLocalCustomers] = useState<LocalCustomer[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);

  const isLoading = status === 'LoadingFirstPage';
  const isError = false; // Convex는 다른 에러 처리 방식 사용

  useEffect(() => {
    // useCustomers 훅에서 데이터가 변경되면 로컬 상태도 업데이트
    // 단, 새 고객 추가 중일 때는 업데이트하지 않음
    if (customers && !isAdding) {
      // Convex 데이터를 기존 타입에 맞게 변환
      const transformedCustomers: LocalCustomer[] = customers.map(customer => ({
        id: customer._id,
        kol_id: parseInt(kolId), // string을 number로 변환
        name: customer.name,
        shopName: customer.shop_name,
        phone: customer.phone,
        region: customer.region,
        placeAddress: customer.place_address,
        assignee: customer.assignee,
        manager: customer.manager,
        status: customer.status,
        notes: customer.notes,
        completed_stages: customer.completed_stages,
        total_stages: customer.total_stages,
        created_at: new Date(customer.created_at).toISOString(),
        updated_at: customer.updated_at ? new Date(customer.updated_at).toISOString() : undefined,
        customer_progress: customer.customer_progress
          ? [
              {
                id: customer.customer_progress._id,
                customerId: customer.customer_progress.customer_id,
                stageData: customer.customer_progress.stage_data,
                achievements: customer.customer_progress.achievements,
                updatedAt: customer.customer_progress.updated_at
                  ? new Date(customer.customer_progress.updated_at).toISOString()
                  : null,
              },
            ]
          : [],
      }));
      setLocalCustomers(transformedCustomers);
    }
  }, [customers, isAdding]);

  const handleAddCustomer = () => {
    if (isAdding) return;

    const newCustomer: LocalCustomer = {
      id: `new-${Date.now()}`,
      kol_id: parseInt(kolId),
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
      // Customer 타입의 다른 필수 필드가 있다면 여기에 기본값 추가
      notes: '',
      completed_stages: 0,
      total_stages: 6,
    };
    setLocalCustomers(prev => [newCustomer, ...prev]);
    setIsAdding(true);
  };

  const handleDeleteNewCustomer = (customerId: string | number) => {
    setLocalCustomers(prev => prev.filter(c => c.id !== customerId));
    setIsAdding(false);
  };

  if (isLoading && localCustomers.length === 0) {
    return <p>로딩 중...</p>;
  }

  if (isError) {
    return <p>데이터를 불러오는 데 실패했습니다.</p>;
  }

  if (!localCustomers || localCustomers.length === 0) {
    return <p>등록된 고객이 없습니다.</p>;
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
            />
          ))}
        </div>
      </main>
    </div>
  );
}
