import { TrainingReq } from '../head-office/TrainingCard';

// Mock 데이터 (차후 Supabase 연결 시 교체)
const MOCK_DATA: TrainingReq[] = [
  {
    id: 'a1',
    created_at: '2024-03-01',
    shop_name: '바이오포톤 강남점',
    contact_name: '홍길동',
    contact_phone: '010-1234-5678',
    lecture_date: '2025-07-10', // 1회차 (최신)
    is_completed: false,
  },
  {
    id: 'b2',
    created_at: '2024-03-03',
    shop_name: '바이오포톤 부산점',
    contact_name: '김미래',
    contact_phone: '010-9876-5432',
    lecture_date: '2025-07-10', // 1회차 (최신)
    is_completed: true,
  },
  {
    id: 'c3',
    created_at: '2024-03-05',
    shop_name: '바이오포톤 대구점',
    contact_name: '이진수',
    contact_phone: '010-5555-1234',
    lecture_date: '2025-06-26', // 2회차
    is_completed: false,
  },
  {
    id: 'd4',
    created_at: '2024-03-07',
    shop_name: '바이오포톤 인천점',
    contact_name: '박서현',
    contact_phone: '010-7777-8888',
    lecture_date: '2025-06-26', // 2회차
    is_completed: true,
  },
  {
    id: 'e5',
    created_at: '2024-03-10',
    shop_name: '바이오포톤 광주점',
    contact_name: '최민호',
    contact_phone: '010-3333-4444',
    lecture_date: '2025-05-15', // 3회차
    is_completed: false,
  },
  {
    id: 'f6',
    created_at: '2024-03-12',
    shop_name: '바이오포톤 울산점',
    contact_name: '정윤지',
    contact_phone: '010-1111-2222',
    lecture_date: '2025-05-15', // 3회차
    is_completed: false,
  },
];

export async function getTrainingRequests(): Promise<TrainingReq[]> {
  // 시뮬레이션을 위한 지연
  await new Promise(resolve => setTimeout(resolve, 500));

  // TODO: 차후 Supabase로 교체
  // return supabase
  //   .from('hq_training_requests')
  //   .select('*')
  //   .order('lecture_date', { ascending: false });

  // lecture_date 기준 내림차순 정렬 (최신 날짜가 먼저)
  return MOCK_DATA.sort(
    (a, b) => new Date(b.lecture_date).getTime() - new Date(a.lecture_date).getTime()
  );
}
