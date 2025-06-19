import { auth } from "@clerk/nextjs/server";
import { SalesJournalClient } from "./components";
import { JournalEntryData } from "./lib/types";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-client";

export const revalidate = 0;

// 목업 데이터
const mockShops: string[] = [
  '믈리에스킨', '피부미인', '아비에 대구', '엑스날 청담'
];

const mockShopSpecialNotes: Record<string, string> = {
  '믈리에스킨': '신규 제품 문의 관련으로 연락오심',
  '피부미인': '이벤트 추가 건의주심',
  '아비에 대구': '재고 부족 관련 문의주심',
  '엑스날 청담': '매장 확장 계획 상담 요청하심'
};

const mockEntries: JournalEntryData[] = [
    {
        id: '1',
        date: '2024-07-22',
        shopName: '믈리에스킨',
        content: '* [10:30] 신규 제품 소개 및 데모 진행\n* [11:15] 원장님 긍정적 반응, 샘플 요청',
        specialNotes: '신규 제품 문의 관련으로 연락오심',
        reminder: {
            content: '믈리에스킨 원장님께 샘플 발송',
            dateTime: '2024-07-23T14:00'
        },
        createdAt: new Date('2024-07-22T11:20:00').getTime(),
    },
    {
        id: '2',
        date: '2024-07-21',
        shopName: '피부미인',
        content: '기존 재고 확인 및 다음 달 프로모션 논의',
        specialNotes: '이벤트 추가 건의주심',
        ownerMessage: {
            content: '원장님, 다음달 프로모션 기획안 이메일로 보내드렸습니다. 확인 부탁드립니다.',
            dateTime: '2024-07-21T18:00',
            sendNow: true,
        },
        createdAt: new Date('2024-07-21T17:30:00').getTime(),
    }
];

export default async function SalesJournalPage() {
  const { userId } = await auth();
  if (!userId) {
    return <div className="p-6 text-center">로그인이 필요합니다.</div>;
  }

  // 백엔드 구현 전까지 KOL ID 65로 고정
  const kolId = 65; 

  const supabase = supabaseServer(cookies());

  // TODO: 추후 실제 API를 통해 KOL의 담당 샵 목록과 특이사항을 가져오도록 수정
  const { data: shops } = await supabase
    .from('shops')
    .select('name, special_notes')
    .eq('kol_id', kolId);

  const managedShops = shops?.map(s => s.name) || ['믈리에스킨', '피부미인', '아비에 대구', '엑스날 청담'];
  const shopSpecialNotes = shops?.reduce((acc, s) => {
    if(s.name && s.special_notes) {
      acc[s.name] = s.special_notes;
    }
    return acc;
  }, {} as Record<string, string>) || {
    '믈리에스킨': '신규 제품 문의 관련으로 연락오심',
    '피부미인': '이벤트 추가 건의주심',
    '아비에 대구': '재고 부족 관련 문의주심',
    '엑스날 청담': '매장 확장 계획 상담 요청하심'
  };

  // TODO: 추후 실제 API를 통해 영업일지 데이터를 가져오도록 수정
  const { data: initialData } = await supabase
    .from('sales_journals')
    .select('*')
    .eq('kol_id', kolId)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto">
        <SalesJournalClient
            kolId={kolId}
            initialEntries={initialData || mockEntries}
            initialManagedShops={managedShops}
            initialShopSpecialNotes={shopSpecialNotes}
        />
    </div>
  );
} 