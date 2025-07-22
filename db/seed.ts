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
    await supabase
      .from('shop_relationships')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

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

    // Step 3: 2단계 구조로 KOL과 Shop 생성 (OL은 KOL의 일종으로 취급)
    console.log('👑 Inserting KOL users...');

    // KOL 1: 김미용 - 에스테틱 전문가
    const { error: kol1Error } = await supabase.from('profiles').upsert(
      {
        id: 'b3d8760c-ee3a-4a51-b8b4-27bd5fb2512e',
        email: 'kol1@biofox.co.kr',
        name: '김미용',
        role: 'kol',
        status: 'approved',
        shop_name: '김미용 에스테틱',
        region: '서울시 강남구',
        commission_rate: 15.0,
        total_subordinates: 3,
        active_subordinates: 3,
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'id' }
    );

    if (kol1Error) {
      console.log('KOL users might already exist, continuing...', kol1Error.message);
    }

    // OL 1: 이정민 - KOL이면서 동시에 에스테틱 샵 운영
    const { error: ol1Error } = await supabase.from('profiles').upsert(
      {
        id: '20000000-0000-0000-0000-000000000111',
        email: 'ol.jung@example.com',
        name: '이정민',
        role: 'ol',
        status: 'approved',
        shop_name: '이정민 에스테틱 센터',
        region: '서울시 강남구',
        commission_rate: 10.0,
        total_subordinates: 0,
        active_subordinates: 0,
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (ol1Error) {
      console.log('OL users might already exist, continuing...', ol1Error.message);
    }

    console.log('🏪 Inserting shop owner users...');

    // Shop 1: 박영희 - 일반 에스테틱 샵
    const { error: shop1Error } = await supabase.from('profiles').upsert(
      {
        id: '30000000-0000-0000-0000-000000000111',
        email: 'shop.park@example.com',
        name: '박영희',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '박영희 에스테틱',
        region: '서울시 강남구',
        commission_rate: 5.0,
        total_subordinates: 0,
        active_subordinates: 0,
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // Shop 2: 최수진 - 일반 에스테틱 샵
    const { error: shop2Error } = await supabase.from('profiles').upsert(
      {
        id: '30000000-0000-0000-0000-000000000222',
        email: 'shop.choi@example.com',
        name: '최수진',
        role: 'shop_owner',
        status: 'approved',
        shop_name: '수진 스킨케어',
        region: '서울시 서초구',
        commission_rate: 5.5,
        total_subordinates: 0,
        active_subordinates: 0,
        approved_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (shop1Error || shop2Error) {
      console.log('Shop owners might already exist, continuing...');
    }

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
        shop_owner_id: '20000000-0000-0000-0000-000000000111', // 이정민 (OL이면서 Shop)
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
    }

    // 3. 김미용(KOL) -> 최수진(Shop) 관계
    const { error: rel3Error } = await supabase.from('shop_relationships').upsert(
      {
        id: '11000000-0000-0000-0000-000000000003',
        shop_owner_id: '30000000-0000-0000-0000-000000000222', // 최수진 (Shop)
        parent_id: 'b3d8760c-ee3a-4a51-b8b4-27bd5fb2512e', // 김미용 (KOL)
        started_at: new Date().toISOString(),
        is_active: true,
        relationship_type: 'direct',
        notes: 'KOL 김미용 직속 스킨케어 샵',
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (rel3Error) {
      console.log('Relationship 3 error:', rel3Error.message);
    }

    if (rel1Error || rel2Error || rel3Error) {
      console.log('Some relationships had errors, continuing...');
    } else {
      console.log('All relationships created successfully!');
    }

    console.log('✅ Database seeding completed successfully!');

    // Step 4: Verification
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('name, role, shop_name, status, total_subordinates, active_subordinates')
      .order('role, name');

    const { data: relationshipsData } = await supabase
      .from('shop_relationships')
      .select('*')
      .eq('is_active', true);

    console.log('\n📋 Verification Results:');
    console.table(profilesData);
    console.log(`\n📈 Total relationships created: ${relationshipsData?.length || 0}`);
    console.log('🎉 Seeding process completed!');
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
