/Users/yoo/biofox-kol/biofox-kol/docs/plan/고객 관리 시스템 의 폴더에 있는 UI/UX 레이아웃을 확인하여 참고할것. 이 레이아웃 대로 하고싶음.

1) 한 카드(CustomerCard)에 6개의 논리 단계(유입·계약·설치/교육·특이사항·성장·전문가)가 포함되고, 카드 여러 개가 세로로 반복되는 리스트 형태
2) 각 카드 내부는
버튼 토글(Shadcn Button) + 입력(Input, Checkbox 등)
SVG 선으로 단계 간 연결
진행률(Progress), 그래프, 별(⭐)에 의한 단계 달성 표시


# 고객 관리 시스템 통합 개발 PRD

## 1. 프로젝트 개요

### 1.1 목적
기존 biofox-kol 시스템에 고객 관리 기능을 통합하여, 고객의 전체 라이프사이클(유입→계약→설치→교육→성장→전문가과정)을 체계적으로 관리할 수 있는 페이지 구현

### 1.2 핵심 원칙
- **UI 일관성**: 제공된 디자인을 정확히 구현
- **코드 품질**: 기존 아키텍처 패턴 준수
- **확장성**: 향후 기능 추가를 고려한 구조
- **유지보수성**: 하드코딩 지양, 재사용 가능한 컴포넌트

## 2. 기술 스택 및 아키텍처

### 2.1 기술 스택
- **Frontend**: Next.js 14 (App Router), TypeScript, React Query
- **UI**: shadcn/ui, Tailwind CSS, Radix UI
- **인증**: Clerk
- **Database**: Supabase (PostgreSQL)
- **상태관리**: React Query + React Context

### 2.2 디렉토리 구조
```
app/
├── customer-manager/
│   ├── layout.tsx              # 페이지 레이아웃
│   ├── page.tsx               # 메인 페이지 (Server Component)
│   ├── loading.tsx            # 로딩 상태
│   ├── error.tsx              # 에러 핸들링
│   └── components/
│       ├── CustomerCard.tsx   # 고객 카드 메인 컴포넌트
│       ├── CustomerSection.tsx # 카드 내부 섹션
│       ├── ConnectionLines.tsx # SVG 연결선
│       └── types.ts           # 타입 정의
lib/
├── hooks/
│   └── customers.ts           # 고객 관련 React Query 훅
└── types/
    └── customer.ts            # 고객 도메인 타입
```

## 3. 데이터 모델 // 백엔드는 추후 추가할것.

### 3.1 Supabase 스키마

```sql
-- 고객 기본 정보
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  shop_name TEXT,
  phone TEXT,
  region TEXT,
  place_address TEXT,
  assignee TEXT,
  manager TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 고객 진행 상태 (JSON 구조로 유연하게 관리)
CREATE TABLE customer_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  stage_data JSONB NOT NULL DEFAULT '{}',
  achievements JSONB DEFAULT '{"basic_training": false, "standard_protocol": false, "expert_course": false}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 섹션별 메모
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- 담당자/배정자만 조회 가능
CREATE POLICY "Users can view their assigned customers" ON customers
  FOR SELECT USING (
    assignee = auth.jwt() ->> 'sub' OR 
    manager = auth.jwt() ->> 'sub'
  );
```

### 3.2 타입 정의

```typescript
// lib/types/customer.ts
export interface Customer {
  id: string;
  name: string;
  shopName?: string;
  phone: string;
  region: string;
  placeAddress?: string;
  assignee: string;
  manager: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProgress {
  id: string;
  customerId: string;
  stageData: StageData;
  achievements: Achievements;
}

export interface StageData {
  inflow?: InflowStage;
  contract?: ContractStage;
  delivery?: DeliveryStage;
  educationNotes?: EducationNotesStage;
  growth?: GrowthStage;
  expert?: ExpertStage;
}

export interface Achievements {
  basicTraining: boolean;
  standardProtocol: boolean;
  expertCourse: boolean;
}
```

## 4. 구현 상세

### 4.1 페이지 구조

```typescript
// app/customer-manager/page.tsx
import { auth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase';
import CustomerList from './components/CustomerList';

export default async function CustomerManagerPage() {
  const { userId } = auth();
  const supabase = createClient();
  
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      customer_progress (*),
      customer_notes (*)
    `)
    .or(`assignee.eq.${userId},manager.eq.${userId}`)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto p-4">
      <CustomerList initialData={customers} />
    </div>
  );
}
```

### 4.2 고객 카드 컴포넌트 구조

```typescript
// app/customer-manager/components/CustomerCard.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUpdateCustomer } from '@/lib/hooks/customers';
import CustomerSection from './CustomerSection';
import ConnectionLines from './ConnectionLines';
import { Customer, CustomerProgress } from '@/lib/types/customer';

interface CustomerCardProps {
  customer: Customer;
  progress: CustomerProgress;
  cardNumber: number;
}

export default function CustomerCard({ 
  customer, 
  progress, 
  cardNumber 
}: CustomerCardProps) {
  const updateMutation = useUpdateCustomer();
  const [localProgress, setLocalProgress] = useState(progress);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 디바운스된 자동 저장
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (JSON.stringify(localProgress) !== JSON.stringify(progress)) {
        updateMutation.mutate({
          customerId: customer.id,
          progress: localProgress
        });
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [localProgress]);

  return (
    <div ref={cardRef} className="bg-white border-2 border-black rounded-xl p-4 mb-5 relative">
      <ConnectionLines 
        progress={localProgress} 
        cardRef={cardRef}
      />
      
      {/* 헤더 섹션 */}
      <CustomerHeader 
        customer={customer}
        achievements={localProgress.achievements}
        cardNumber={cardNumber}
      />
      
      {/* 6개 단계 섹션 */}
      <StageBlocks 
        progress={localProgress}
        onProgressChange={setLocalProgress}
      />
    </div>
  );
}
```

### 4.3 React Query 훅

```typescript
// lib/hooks/customers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase-client';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('customers')
        .select('*, customer_progress(*), customer_notes(*)');
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ customerId, progress }) => {
      const { error } = await supabaseClient
        .from('customer_progress')
        .update({ stage_data: progress.stageData })
        .eq('customer_id', customerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast.error('저장 실패: ' + error.message);
    }
  });
}
```

### 4.4 레이아웃 통합

```typescript
// app/customer-manager/layout.tsx
import { Metadata } from 'next';
import AdminHeader from '@/components/layout/AdminHeader';
import AdminSidebar from '@/components/layout/AdminSidebar';

export const metadata: Metadata = {
  title: '고객 관리 | Biofox',
  description: '고객 라이프사이클 관리'
};

export default function CustomerManagerLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## 5. 주요 기능 구현

### 5.1 상태 관리 전략
- **서버 상태**: React Query로 관리
- **로컬 상태**: useState + 디바운스 자동 저장
- **UI 상태**: 컴포넌트 내부 상태 (메모 열림/닫힘 등)

### 5.2 성능 최적화
- 가상 스크롤링 (카드 100개 이상 시)
- 이미지 지연 로딩
- React.memo로 불필요한 리렌더링 방지
- 연결선 SVG 최적화 (ResizeObserver 사용)

### 5.3 반응형 디자인
```css
/* 모바일 대응 */
@media (max-width: 768px) {
  .customer-card {
    @apply max-w-full;
  }
  
  .section-grid {
    @apply grid-cols-1;
  }
  
  .connection-lines {
    @apply hidden;
  }
}
```

## 6. 보안 고려사항

### 6.1 권한 검증
- Clerk 미들웨어로 인증 확인
- Supabase RLS로 데이터 접근 제어
- 담당자/관리자만 해당 고객 조회/수정 가능

### 6.2 데이터 검증
```typescript
// Zod 스키마로 입력 검증
const customerUpdateSchema = z.object({
  shopName: z.string().max(100).optional(),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/),
  region: z.string().max(50)
});
```

## 7. 테스트 계획

### 7.1 유닛 테스트
```typescript
// __tests__/CustomerCard.test.tsx
describe('CustomerCard', () => {
  it('should render all 6 stages', () => {
    const { getAllByTestId } = render(<CustomerCard {...mockProps} />);
    expect(getAllByTestId('customer-section')).toHaveLength(6);
  });
  
  it('should auto-save on progress change', async () => {
    // 디바운스 테스트
  });
});
```

### 7.2 통합 테스트
- Playwright로 전체 플로우 테스트
- 모바일/데스크톱 반응형 테스트

## 8. 배포 및 모니터링

### 8.1 환경 변수
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

### 8.2 모니터링
- React Query Devtools로 캐시 상태 확인
- Supabase Dashboard로 쿼리 성능 모니터링

## 9. 주의사항

### ❌ 하지 말아야 할 것
- 상태나 설정값 하드코딩
- 인라인 스타일 사용
- any 타입 사용
- 동기적 저장 (반드시 디바운스)

### ✅ 반드시 해야 할 것
- 기존 컴포넌트 재사용 (shadcn/ui)
- 타입 안전성 확보
- 에러 바운더리 적용
- 접근성 고려 (ARIA 레이블)

## 10. 타임라인

### Phase 1 (1주차)
- [ ] DB 스키마 마이그레이션
- [ ] 기본 CRUD API 구현
- [ ] CustomerCard 컴포넌트 이식

### Phase 2 (2주차)
- [ ] React Query 훅 구현
- [ ] 자동 저장 로직
- [ ] 연결선 SVG 구현

### Phase 3 (3주차)
- [ ] 권한 관리 구현
- [ ] 테스트 작성
- [ ] 성능 최적화

이 PRD를 기반으로 기존 시스템과 일관성 있게 고객 관리 기능을 통합할 수 있습니다.