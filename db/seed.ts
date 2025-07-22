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
    // 기존 데이터 삭제를 주석 처리
    // await supabase.from('shop_relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Step 2: Insert admin user first
    console.log('👤 Inserting admin user...');
    const { error: adminError } = await supabase.from('profiles').upsert(
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@biofox.co.kr',
        name: '시스템 관리자',
        role: 'admin',
        status: 'approved',
        shop_name: '바이오폭스 본사',
        region: '서울시 강남구',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (adminError) {
      console.log('Admin user might already exist, continuing...', adminError.message);
    }

    // Step 3: Insert test profiles
    console.log('👥 Creating test profiles...');

    // KOL - 김미용
    const kolUser = {
      id: 'b3d8760c-ee3a-4a51-b8b4-27bd5fb2512e',
      email: 'kol1@biofox.co.kr',
      name: '김미용',
      role: 'kol' as const,
      status: 'approved' as const,
      shop_name: '김미용 에스테틱',
      region: '서울시 강남구',
      commission_rate: 15.0,
      created_at: new Date().toISOString(),
    };

    // OL - 이정민 (OL이면서 에스테틱 센터 운영)
    const olUser = {
      id: '20000000-0000-0000-0000-000000000111',
      email: 'ol.jung@example.com',
      name: '이정민',
      role: 'ol' as const,
      status: 'approved' as const,
      shop_name: '이정민 에스테틱 센터',
      region: '서울시 서초구',
      commission_rate: 12.0,
      created_at: new Date().toISOString(),
    };

    // SHOP - 박영희
    const shopUser1 = {
      id: '30000000-0000-0000-0000-000000000111',
      email: 'shop.park@example.com',
      name: '박영희',
      role: 'shop_owner' as const,
      status: 'approved' as const,
      shop_name: '박영희 에스테틱',
      region: '서울시 강남구',
      commission_rate: 8.0,
      created_at: new Date().toISOString(),
    };

    // 추가 SHOP - 최지혜 (전문점 추가 테스트용)
    const shopUser2 = {
      id: '31000000-0000-0000-0000-000000000111',
      email: 'shop.choi@example.com',
      name: '최지혜',
      role: 'shop_owner' as const,
      status: 'approved' as const,
      shop_name: '최지혜 뷰티샵',
      region: '서울시 서초구',
      commission_rate: 8.0,
      created_at: new Date().toISOString(),
    };

    // 추가 SHOP - 정민수 (전문점 추가 테스트용)
    const shopUser3 = {
      id: '32000000-0000-0000-0000-000000000111',
      email: 'shop.jung@example.com',
      name: '정민수',
      role: 'shop_owner' as const,
      status: 'approved' as const,
      shop_name: '정민수 스킨케어',
      region: '경기도 성남시',
      commission_rate: 8.0,
      created_at: new Date().toISOString(),
    };

    const testProfiles = [kolUser, olUser, shopUser1, shopUser2, shopUser3];

    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert(testProfiles, { onConflict: 'id' });

    if (profilesError) {
      console.log('Some profiles insertion failed:', profilesError.message);
    } else {
      console.log(`✅ Created ${testProfiles.length} test profiles`);
    }

    // Step 4: 2단계 관계 생성 (KOL ↔ Shop)
    console.log('🔗 Creating 2-level relationships...');

    // 2단계 관계: KOL ↔ Shop 직접 관계
    // 1. 김미용(KOL) -> 박영희(Shop) 관계
    const { error: rel1Error } = await supabase.from('shop_relationships').upsert(
      {
        id: '11000000-0000-0000-0000-000000000001',
        shop_owner_id: '30000000-0000-0000-0000-000000000111', // 박영희 (Shop)
        parent_id: 'b3d8760c-ee3a-4a51-b8b4-27bd5fb2512e', // 김미용 (KOL)
        started_at: new Date().toISOString(),
        is_active: true,
        relationship_type: 'direct',
        notes: 'KOL 김미용 직속 에스테틱 샵',
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (rel1Error) {
      console.log('Relationship 1 error:', rel1Error.message);
    }

    // 2. 김미용(KOL) -> 이정민(OL이면서 Shop) 관계
    const { error: rel2Error } = await supabase.from('shop_relationships').upsert(
      {
        id: '11000000-0000-0000-0000-000000000002',
        shop_owner_id: '20000000-0000-0000-0000-000000000111', // 이정민 (OL)
        parent_id: 'b3d8760c-ee3a-4a51-b8b4-27bd5fb2512e', // 김미용 (KOL)
        started_at: new Date().toISOString(),
        is_active: true,
        relationship_type: 'direct',
        notes: 'KOL 김미용 직속 에스테틱 센터 (OL이면서 샵 운영)',
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (rel2Error) {
      console.log('Relationship 2 error:', rel2Error.message);
    } else {
      console.log('✅ Created 2 test relationships (2-level structure)');
    }

    console.log('🎯 Seed data generation completed!');
    console.log('📊 Current structure:');
    console.log('   김미용 (KOL) - 김미용 에스테틱');
    console.log('   ├── 박영희 (SHOP) - 박영희 에스테틱');
    console.log('   └── 이정민 (OL) - 이정민 에스테틱 센터');
    console.log('💡 Available for adding: 최지혜 뷰티샵, 정민수 스킨케어');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
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
