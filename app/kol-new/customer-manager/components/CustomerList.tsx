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

  // 실제 프로필 조회 (이메일 기반)
  const profile = useQuery(api.profiles.getProfileByEmail, {
    email: kolId, // kolId는 현재 사용자의 이메일
  });

  // 프로필이 있을 때만 고객 데이터 조회
  const customers = useQuery(
    api.customers.getCustomersByKol,
    profile?._id
      ? {
          kolId: profile._id,
          paginationOpts: { numItems: 100, cursor: null },
        }
      : 'skip'
  );

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

  const handleAddCustomer = async () => {
    if (isAdding) return;

    setIsAdding(true);

    try {
      // 프로필이 없으면 에러 처리
      if (!profile?._id) {
        toast.error('프로필을 찾을 수 없습니다. 로그인을 다시 시도해주세요.');
        setIsAdding(false);
        return;
      }

      const customerId = await createCustomer({
        kolId: profile._id, // 실제 kolId 사용
        name: '새 고객',
        shopName: '',
        phone: '',
        region: '',
        placeAddress: '',
        assignee: '',
        manager: '',
        notes: '',
      });

      if (customerId) {
        toast.success('새 고객이 추가되었습니다. 필수 정보를 입력해주세요.');
        // 고객 목록은 Convex query에 의해 자동으로 업데이트됨
      }
    } catch (error) {
      console.error('고객 추가 중 오류:', error);
      toast.error('고객 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (customerId: string | number) => {
    // 프로필이 없으면 에러 처리
    if (!profile?._id) {
      toast.error('프로필을 찾을 수 없습니다.');
      return;
    }

    // 삭제 로직 (현재는 로컬에서만 제거)
    setLocalCustomers(prev => prev.filter(c => c.id !== customerId));
    toast.success('고객이 삭제되었습니다.');
  };

  // 로딩 상태 처리
  if (profile === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-gray-500">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 프로필을 찾을 수 없는 경우
  if (profile === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">프로필을 찾을 수 없습니다.</p>
          <p className="text-gray-500">관리자에게 문의하여 프로필을 생성해주세요.</p>
        </div>
      </div>
    );
  }

  // 고객 데이터 로딩 중
  if (customers === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-gray-500">고객 데이터를 불러오는 중...</p>
        </div>
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
              cardNumber={idx + 1}
              isNew={c.isNew}
              onDelete={() => handleDelete(c.id)}
              isDummyMode={false} // 실제 Convex 연동 모드로 변경
            />
          ))}
        </div>
      </main>
    </div>
  );
}
