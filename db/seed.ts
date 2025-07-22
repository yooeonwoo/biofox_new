import { createClient } from '@supabase/supabase-js';
import { profiles, shopRelationships } from './schema';

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * BIOFOX KOL 테스트 데이터 시드 스크립트
 * 개발 및 테스트 환경을 위한 샘플 데이터 생성
 */
async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Step 1: Clear existing test data (optional - uncomment if needed)
    console.log('🧹 Clearing existing test data...');
    // await supabase.from('shop_relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-000000000000');

    // Step 2: Insert Admin user
    console.log('👤 Inserting admin user...');
    const { error: adminError } = await supabase.from('profiles').insert({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@biofox.co.kr',
      name: '시스템 관리자',
      role: 'admin',
      status: 'approved',
      shop_name: '바이오폭스 본사',
      region: '서울시 강남구',
      commission_rate: null,
      created_at: new Date(),
    });

    if (adminError) {
      console.log('Admin user might already exist, continuing...');
    }

    // Step 3: Insert KOL users (top level)
    console.log('👑 Inserting KOL users...');
    const { error: kolError } = await supabase.from('profiles').insert([
      {
        id: '10000000-0000-0000-0000-000000000001',
        email: 'kol1@example.com',
        name: '김미용',
        role: 'kol',
        status: 'approved',
        shop_name: '김미용 피부과',
        region: '서울시 강남구',
        commission_rate: 15.0,
        total_subordinates: 8,
        active_subordinates: 7,
        approved_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        email: 'kol2@example.com',
        name: '이정훈',
        role: 'kol',
        status: 'approved',
        shop_name: '이정훈 성형외과',
        region: '서울시 서초구',
        commission_rate: 18.0,
        total_subordinates: 12,
        active_subordinates: 10,
        approved_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), // 80 days ago
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        email: 'kol3@example.com',
        name: '박수진',
        role: 'kol',
        status: 'approved',
        shop_name: '박수진 의원',
        region: '부산시 해운대구',
        commission_rate: 12.0,
        total_subordinates: 5,
        active_subordinates: 4,
        approved_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago
      },
    ]);

    if (kolError) {
      console.log('KOL users might already exist, continuing...', kolError.message);
    }

    // Step 4: Insert OL users (middle level)
    console.log('🔸 Inserting OL users...');
    const { error: olError } = await supabase.from('profiles').insert([
      {
        id: '20000000-0000-0000-0000-000000000001',
        email: 'ol1@example.com',
        name: '최영미',
        role: 'ol',
        status: 'approved',
        shop_name: '영미 에스테틱',
        region: '서울시 강남구',
        commission_rate: 10.0,
        total_subordinates: 3,
        active_subordinates: 3,
        approved_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        approved_by: '10000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        email: 'ol2@example.com',
        name: '정민수',
        role: 'ol',
        status: 'approved',
        shop_name: '민수 뷰티샵',
        region: '서울시 강남구',
        commission_rate: 8.0,
        total_subordinates: 4,
        active_subordinates: 2,
        approved_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        approved_by: '10000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        email: 'ol3@example.com',
        name: '홍지연',
        role: 'ol',
        status: 'approved',
        shop_name: '지연 스킨케어',
        region: '서울시 서초구',
        commission_rate: 9.0,
        total_subordinates: 2,
        active_subordinates: 2,
        approved_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        approved_by: '10000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        email: 'ol4@example.com',
        name: '강태현',
        role: 'ol',
        status: 'approved',
        shop_name: '태현 미용실',
        region: '부산시 해운대구',
        commission_rate: 7.0,
        total_subordinates: 3,
        active_subordinates: 1,
        approved_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        approved_by: '10000000-0000-0000-0000-000000000003',
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    ]);

    if (olError) {
      console.log('OL users might already exist, continuing...', olError.message);
    }

    // Step 5: Insert Shop Owner users (bottom level)
    console.log('🏪 Inserting shop owner users...');
    const shopOwnersData = [
      // Kim Mi-yong's (KOL1) subordinate shops
      {
        id: '30000000-0000-0000-0000-000000000001',
        email: 'shop1@example.com',
        name: '안효진',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '효진 뷰티룸',
        region: '서울시 강남구',
        commission_rate: 5.0,
        approved_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        email: 'shop2@example.com',
        name: '신혜원',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '혜원 피부관리실',
        region: '서울시 강남구',
        commission_rate: 6.0,
        approved_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        email: 'shop3@example.com',
        name: '유지현',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '지현 스파',
        region: '서울시 강남구',
        commission_rate: 4.5,
        approved_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000004',
        email: 'shop4@example.com',
        name: '문서영',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '서영 에스테틱',
        region: '서울시 강남구',
        commission_rate: 5.5,
        approved_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        email: 'shop5@example.com',
        name: '조민정',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '민정 케어센터',
        region: '서울시 강남구',
        commission_rate: 5.0,
        approved_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      },
      // More shop owners...
      {
        id: '30000000-0000-0000-0000-000000000006',
        email: 'shop6@example.com',
        name: '김수연',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '수연 클리닉',
        region: '서울시 서초구',
        commission_rate: 7.0,
        approved_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000003',
        created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000007',
        email: 'shop7@example.com',
        name: '이민아',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '민아 뷰티',
        region: '서울시 서초구',
        commission_rate: 6.5,
        approved_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000003',
        created_at: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000008',
        email: 'shop8@example.com',
        name: '전소라',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '소라 피부샵',
        region: '부산시 해운대구',
        commission_rate: 4.0,
        approved_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        approved_by: '20000000-0000-0000-0000-000000000004',
        created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      },
      // Pending and rejected shops
      {
        id: '30000000-0000-0000-0000-000000000009',
        email: 'pending1@example.com',
        name: '장미래',
        role: 'shop_owner',
        status: 'pending',
        shop_name: '미래 스킨케어',
        region: '대구시 중구',
        commission_rate: null,
        approved_at: null,
        approved_by: null,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000010',
        email: 'pending2@example.com',
        name: '오현지',
        role: 'shop_owner',
        status: 'pending',
        shop_name: '현지 뷰티룸',
        region: '인천시 남동구',
        commission_rate: null,
        approved_at: null,
        approved_by: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000011',
        email: 'rejected1@example.com',
        name: '한소희',
        role: 'shop_owner',
        status: 'rejected',
        shop_name: '소희 에스테틱',
        region: '광주시 서구',
        commission_rate: null,
        approved_at: null,
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ];

    const { error: shopError } = await supabase.from('profiles').insert(shopOwnersData);

    if (shopError) {
      console.log('Shop owners might already exist, continuing...', shopError.message);
    }

    // Step 6: Insert shop relationships
    console.log('🔗 Inserting shop relationships...');

    // KOL -> OL relationships
    const kolToOlRelations = [
      {
        id: '40000000-0000-0000-0000-000000000001',
        shop_owner_id: '20000000-0000-0000-0000-000000000001', // 최영미
        parent_id: '10000000-0000-0000-0000-000000000001', // 김미용
        started_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '김미용 피부과 직영 에스테틱 체인 관리자',
        created_by: '10000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000002',
        shop_owner_id: '20000000-0000-0000-0000-000000000002', // 정민수
        parent_id: '10000000-0000-0000-0000-000000000001', // 김미용
        started_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '김미용 피부과 강남점 관리자',
        created_by: '10000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000003',
        shop_owner_id: '20000000-0000-0000-0000-000000000003', // 홍지연
        parent_id: '10000000-0000-0000-0000-000000000002', // 이정훈
        started_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '이정훈 성형외과 서초점 관리자',
        created_by: '10000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000004',
        shop_owner_id: '20000000-0000-0000-0000-000000000004', // 강태현
        parent_id: '10000000-0000-0000-0000-000000000003', // 박수진
        started_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '박수진 의원 해운대점 관리자',
        created_by: '10000000-0000-0000-0000-000000000003',
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    ];

    const { error: kolOlError } = await supabase
      .from('shop_relationships')
      .insert(kolToOlRelations);

    if (kolOlError) {
      console.log('KOL->OL relationships might already exist, continuing...', kolOlError.message);
    }

    // OL -> Shop Owner relationships
    const olToShopRelations = [
      // 최영미(OL1) subordinate shops
      {
        id: '40000000-0000-0000-0000-000000000005',
        shop_owner_id: '30000000-0000-0000-0000-000000000001', // 안효진
        parent_id: '20000000-0000-0000-0000-000000000001', // 최영미
        started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '영미 에스테틱 체인 1호점',
        created_by: '20000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000006',
        shop_owner_id: '30000000-0000-0000-0000-000000000002', // 신혜원
        parent_id: '20000000-0000-0000-0000-000000000001', // 최영미
        started_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '영미 에스테틱 체인 2호점',
        created_by: '20000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000007',
        shop_owner_id: '30000000-0000-0000-0000-000000000003', // 유지현
        parent_id: '20000000-0000-0000-0000-000000000001', // 최영미
        started_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '영미 에스테틱 체인 3호점',
        created_by: '20000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
      // More relationships...
      {
        id: '40000000-0000-0000-0000-000000000008',
        shop_owner_id: '30000000-0000-0000-0000-000000000004', // 문서영
        parent_id: '20000000-0000-0000-0000-000000000002', // 정민수
        started_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '민수 뷰티샵 프랜차이즈 1호',
        created_by: '20000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000009',
        shop_owner_id: '30000000-0000-0000-0000-000000000005', // 조민정
        parent_id: '20000000-0000-0000-0000-000000000002', // 정민수
        started_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '민수 뷰티샵 프랜차이즈 2호',
        created_by: '20000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000010',
        shop_owner_id: '30000000-0000-0000-0000-000000000006', // 김수연
        parent_id: '20000000-0000-0000-0000-000000000003', // 홍지연
        started_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '지연 스킨케어 서초점',
        created_by: '20000000-0000-0000-0000-000000000003',
        created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000011',
        shop_owner_id: '30000000-0000-0000-0000-000000000007', // 이민아
        parent_id: '20000000-0000-0000-0000-000000000003', // 홍지연
        started_at: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '지연 스킨케어 신논현점',
        created_by: '20000000-0000-0000-0000-000000000003',
        created_at: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000012',
        shop_owner_id: '30000000-0000-0000-0000-000000000008', // 전소라
        parent_id: '20000000-0000-0000-0000-000000000004', // 강태현
        started_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
        is_active: true,
        relationship_type: 'direct',
        notes: '태현 미용실 해운대점',
        created_by: '20000000-0000-0000-0000-000000000004',
        created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      },
    ];

    const { error: olShopError } = await supabase
      .from('shop_relationships')
      .insert(olToShopRelations);

    if (olShopError) {
      console.log('OL->Shop relationships might already exist, continuing...', olShopError.message);
    }

    // Step 7: Insert special relationships (terminated, transferred, temporary)
    console.log('🔄 Inserting special relationships...');
    const specialRelations = [
      // Terminated relationship (shop transfer)
      {
        id: '40000000-0000-0000-0000-000000000013',
        shop_owner_id: '30000000-0000-0000-0000-000000000001', // 안효진
        parent_id: '20000000-0000-0000-0000-000000000002', // 정민수 (previous parent)
        started_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        ended_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        is_active: false,
        relationship_type: 'transferred',
        notes: '민수 뷰티샵에서 영미 에스테틱으로 이전',
        created_by: '20000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      },
      // Temporary relationship
      {
        id: '40000000-0000-0000-0000-000000000014',
        shop_owner_id: '30000000-0000-0000-0000-000000000005', // 조민정
        parent_id: '20000000-0000-0000-0000-000000000003', // 홍지연 (temporary manager)
        started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        ended_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Future end date
        is_active: true,
        relationship_type: 'temporary',
        notes: '홍지연의 임시 관리 (정민수 휴가 기간)',
        created_by: '10000000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ];

    const { error: specialError } = await supabase
      .from('shop_relationships')
      .insert(specialRelations);

    if (specialError) {
      console.log('Special relationships might already exist, continuing...', specialError.message);
    }

    console.log('✅ Database seeding completed successfully!');

    // Display verification results
    console.log('\n📋 Verification Results:');
    const { data: profilesResult, error: profilesError } = await supabase
      .from('profiles')
      .select('name, role, shop_name, status, total_subordinates, active_subordinates')
      .order('role')
      .limit(10);

    if (profilesResult) {
      console.table(profilesResult);
    }

    const { data: relationshipsCount, error: relCountError } = await supabase
      .from('shop_relationships')
      .select('id', { count: 'exact' });

    console.log(`\n📈 Total relationships created: ${relationshipsCount?.length || 0}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedData };
