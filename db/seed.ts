import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { profiles, shopRelationships } from "./schema";
import { sql } from "drizzle-orm";

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or SUPABASE_DB_URL environment variable is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

/**
 * BIOFOX KOL 테스트 데이터 시드 스크립트
 * 개발 및 테스트 환경을 위한 샘플 데이터 생성
 */
async function seedData() {
  try {
    console.log("🌱 Starting database seeding...");

    // Step 1: Clear existing test data (optional - uncomment if needed)
    console.log("🧹 Clearing existing test data...");
    // await db.delete(shopRelationships);
    // await db.delete(profiles);

    // Step 2: Insert Admin user
    console.log("👤 Inserting admin user...");
    await db.insert(profiles).values({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@biofox.co.kr',
      name: '시스템 관리자',
      role: 'admin',
      status: 'approved',
      shopName: '바이오폭스 본사',
      region: '서울시 강남구',
      commissionRate: null,
      createdAt: new Date(),
    });

    // Step 3: Insert KOL users (top level)
    console.log("👑 Inserting KOL users...");
    await db.insert(profiles).values([
      {
        id: '10000000-0000-0000-0000-000000000001',
        email: 'kol1@example.com',
        name: '김미용',
        role: 'kol',
        status: 'approved',
        shopName: '김미용 피부과',
        region: '서울시 강남구',
        commissionRate: '15.00',
        totalSubordinates: 8,
        activeSubordinates: 7,
        approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        approvedBy: '00000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        email: 'kol2@example.com',
        name: '이정훈',
        role: 'kol',
        status: 'approved',
        shopName: '이정훈 성형외과',
        region: '서울시 서초구',
        commissionRate: '18.00',
        totalSubordinates: 12,
        activeSubordinates: 10,
        approvedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        approvedBy: '00000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), // 80 days ago
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        email: 'kol3@example.com',
        name: '박수진',
        role: 'kol',
        status: 'approved',
        shopName: '박수진 의원',
        region: '부산시 해운대구',
        commissionRate: '12.00',
        totalSubordinates: 5,
        activeSubordinates: 4,
        approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        approvedBy: '00000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago
      },
    ]);

    // Step 4: Insert OL users (middle level)
    console.log("🔸 Inserting OL users...");
    await db.insert(profiles).values([
      {
        id: '20000000-0000-0000-0000-000000000001',
        email: 'ol1@example.com',
        name: '최영미',
        role: 'ol',
        status: 'approved',
        shopName: '영미 에스테틱',
        region: '서울시 강남구',
        commissionRate: '10.00',
        totalSubordinates: 3,
        activeSubordinates: 3,
        approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        approvedBy: '10000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        email: 'ol2@example.com',
        name: '정민수',
        role: 'ol',
        status: 'approved',
        shopName: '민수 뷰티샵',
        region: '서울시 강남구',
        commissionRate: '8.00',
        totalSubordinates: 4,
        activeSubordinates: 2,
        approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        approvedBy: '10000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        email: 'ol3@example.com',
        name: '홍지연',
        role: 'ol',
        status: 'approved',
        shopName: '지연 스킨케어',
        region: '서울시 서초구',
        commissionRate: '9.00',
        totalSubordinates: 2,
        activeSubordinates: 2,
        approvedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        approvedBy: '10000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        email: 'ol4@example.com',
        name: '강태현',
        role: 'ol',
        status: 'approved',
        shopName: '태현 미용실',
        region: '부산시 해운대구',
        commissionRate: '7.00',
        totalSubordinates: 3,
        activeSubordinates: 1,
        approvedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        approvedBy: '10000000-0000-0000-0000-000000000003',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Step 5: Insert Shop Owner users (bottom level)
    console.log("🏪 Inserting shop owner users...");
    await db.insert(profiles).values([
      // Kim Mi-yong's (KOL1) subordinate shops
      {
        id: '30000000-0000-0000-0000-000000000001',
        email: 'shop1@example.com',
        name: '안효진',
        role: 'shop_owner',
        status: 'approved',
        shopName: '효진 뷰티룸',
        region: '서울시 강남구',
        commissionRate: '5.00',
        approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        email: 'shop2@example.com',
        name: '신혜원',
        role: 'shop_owner',
        status: 'approved',
        shopName: '혜원 피부관리실',
        region: '서울시 강남구',
        commissionRate: '6.00',
        approvedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        email: 'shop3@example.com',
        name: '유지현',
        role: 'shop_owner',
        status: 'approved',
        shopName: '지현 스파',
        region: '서울시 강남구',
        commissionRate: '4.50',
        approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000004',
        email: 'shop4@example.com',
        name: '문서영',
        role: 'shop_owner',
        status: 'approved',
        shopName: '서영 에스테틱',
        region: '서울시 강남구',
        commissionRate: '5.50',
        approvedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        email: 'shop5@example.com',
        name: '조민정',
        role: 'shop_owner',
        status: 'approved',
        shopName: '민정 케어센터',
        region: '서울시 강남구',
        commissionRate: '5.00',
        approvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      },
      // More shop owners...
      {
        id: '30000000-0000-0000-0000-000000000006',
        email: 'shop6@example.com',
        name: '김수연',
        role: 'shop_owner',
        status: 'approved',
        shopName: '수연 클리닉',
        region: '서울시 서초구',
        commissionRate: '7.00',
        approvedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000003',
        createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000007',
        email: 'shop7@example.com',
        name: '이민아',
        role: 'shop_owner',
        status: 'approved',
        shopName: '민아 뷰티',
        region: '서울시 서초구',
        commissionRate: '6.50',
        approvedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000003',
        createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000008',
        email: 'shop8@example.com',
        name: '전소라',
        role: 'shop_owner',
        status: 'approved',
        shopName: '소라 피부샵',
        region: '부산시 해운대구',
        commissionRate: '4.00',
        approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        approvedBy: '20000000-0000-0000-0000-000000000004',
        createdAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      },
      // Pending and rejected shops
      {
        id: '30000000-0000-0000-0000-000000000009',
        email: 'pending1@example.com',
        name: '장미래',
        role: 'shop_owner',
        status: 'pending',
        shopName: '미래 스킨케어',
        region: '대구시 중구',
        commissionRate: null,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000010',
        email: 'pending2@example.com',
        name: '오현지',
        role: 'shop_owner',
        status: 'pending',
        shopName: '현지 뷰티룸',
        region: '인천시 남동구',
        commissionRate: null,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: '30000000-0000-0000-0000-000000000011',
        email: 'rejected1@example.com',
        name: '한소희',
        role: 'shop_owner',
        status: 'rejected',
        shopName: '소희 에스테틱',
        region: '광주시 서구',
        commissionRate: null,
        approvedAt: null,
        approvedBy: '00000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Step 6: Insert shop relationships
    console.log("🔗 Inserting shop relationships...");

    // KOL -> OL relationships
    await db.insert(shopRelationships).values([
      {
        id: '40000000-0000-0000-0000-000000000001',
        shopOwnerId: '20000000-0000-0000-0000-000000000001', // 최영미
        parentId: '10000000-0000-0000-0000-000000000001', // 김미용
        startedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '김미용 피부과 직영 에스테틱 체인 관리자',
        createdBy: '10000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000002',
        shopOwnerId: '20000000-0000-0000-0000-000000000002', // 정민수
        parentId: '10000000-0000-0000-0000-000000000001', // 김미용
        startedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '김미용 피부과 강남점 관리자',
        createdBy: '10000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000003',
        shopOwnerId: '20000000-0000-0000-0000-000000000003', // 홍지연
        parentId: '10000000-0000-0000-0000-000000000002', // 이정훈
        startedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '이정훈 성형외과 서초점 관리자',
        createdBy: '10000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000004',
        shopOwnerId: '20000000-0000-0000-0000-000000000004', // 강태현
        parentId: '10000000-0000-0000-0000-000000000003', // 박수진
        startedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '박수진 의원 해운대점 관리자',
        createdBy: '10000000-0000-0000-0000-000000000003',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    ]);

    // OL -> Shop Owner relationships
    await db.insert(shopRelationships).values([
      // 최영미(OL1) subordinate shops
      {
        id: '40000000-0000-0000-0000-000000000005',
        shopOwnerId: '30000000-0000-0000-0000-000000000001', // 안효진
        parentId: '20000000-0000-0000-0000-000000000001', // 최영미
        startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '영미 에스테틱 체인 1호점',
        createdBy: '20000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000006',
        shopOwnerId: '30000000-0000-0000-0000-000000000002', // 신혜원
        parentId: '20000000-0000-0000-0000-000000000001', // 최영미
        startedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '영미 에스테틱 체인 2호점',
        createdBy: '20000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000007',
        shopOwnerId: '30000000-0000-0000-0000-000000000003', // 유지현
        parentId: '20000000-0000-0000-0000-000000000001', // 최영미
        startedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '영미 에스테틱 체인 3호점',
        createdBy: '20000000-0000-0000-0000-000000000001',
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
      // More relationships...
      {
        id: '40000000-0000-0000-0000-000000000008',
        shopOwnerId: '30000000-0000-0000-0000-000000000004', // 문서영
        parentId: '20000000-0000-0000-0000-000000000002', // 정민수
        startedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '민수 뷰티샵 프랜차이즈 1호',
        createdBy: '20000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000009',
        shopOwnerId: '30000000-0000-0000-0000-000000000005', // 조민정
        parentId: '20000000-0000-0000-0000-000000000002', // 정민수
        startedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '민수 뷰티샵 프랜차이즈 2호',
        createdBy: '20000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000010',
        shopOwnerId: '30000000-0000-0000-0000-000000000006', // 김수연
        parentId: '20000000-0000-0000-0000-000000000003', // 홍지연
        startedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '지연 스킨케어 서초점',
        createdBy: '20000000-0000-0000-0000-000000000003',
        createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000011',
        shopOwnerId: '30000000-0000-0000-0000-000000000007', // 이민아
        parentId: '20000000-0000-0000-0000-000000000003', // 홍지연
        startedAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '지연 스킨케어 신논현점',
        createdBy: '20000000-0000-0000-0000-000000000003',
        createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
      },
      {
        id: '40000000-0000-0000-0000-000000000012',
        shopOwnerId: '30000000-0000-0000-0000-000000000008', // 전소라
        parentId: '20000000-0000-0000-0000-000000000004', // 강태현
        startedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
        isActive: true,
        relationshipType: 'direct',
        notes: '태현 미용실 해운대점',
        createdBy: '20000000-0000-0000-0000-000000000004',
        createdAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Step 7: Insert special relationships (terminated, transferred, temporary)
    console.log("🔄 Inserting special relationships...");
    await db.insert(shopRelationships).values([
      // Terminated relationship (shop transfer)
      {
        id: '40000000-0000-0000-0000-000000000013',
        shopOwnerId: '30000000-0000-0000-0000-000000000001', // 안효진
        parentId: '20000000-0000-0000-0000-000000000002', // 정민수 (previous parent)
        startedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        isActive: false,
        relationshipType: 'transferred',
        notes: '민수 뷰티샵에서 영미 에스테틱으로 이전',
        createdBy: '20000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      },
      // Temporary relationship
      {
        id: '40000000-0000-0000-0000-000000000014',
        shopOwnerId: '30000000-0000-0000-0000-000000000005', // 조민정
        parentId: '20000000-0000-0000-0000-000000000003', // 홍지연 (temporary manager)
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Future end date
        isActive: true,
        relationshipType: 'temporary',
        notes: '홍지연의 임시 관리 (정민수 휴가 기간)',
        createdBy: '10000000-0000-0000-0000-000000000002',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Step 8: Update subordinate counts
    console.log("📊 Updating subordinate counts...");
    await db.execute(sql`
      UPDATE profiles SET 
        total_subordinates = (
          SELECT COUNT(*) FROM shop_relationships sr 
          WHERE sr.parent_id = profiles.id OR sr.parent_id IN (
            SELECT shop_owner_id FROM shop_relationships WHERE parent_id = profiles.id
          )
        ),
        active_subordinates = (
          SELECT COUNT(*) FROM shop_relationships sr 
          WHERE sr.is_active = true AND (
            sr.parent_id = profiles.id OR sr.parent_id IN (
              SELECT shop_owner_id FROM shop_relationships WHERE parent_id = profiles.id AND is_active = true
            )
          )
        )
      WHERE role IN ('kol', 'ol')
    `);

    console.log("✅ Database seeding completed successfully!");

    // Display verification results
    console.log("\n📋 Verification Results:");
    const profilesResult = await db.execute(sql`
      SELECT 
        p.name as "사용자명",
        p.role as "역할",
        p.shop_name as "샵명",
        p.status as "상태",
        p.total_subordinates as "총하위수",
        p.active_subordinates as "활성하위수"
      FROM profiles p 
      ORDER BY 
        CASE p.role 
          WHEN 'admin' THEN 1 
          WHEN 'kol' THEN 2 
          WHEN 'ol' THEN 3 
          WHEN 'shop_owner' THEN 4 
        END, p.name
      LIMIT 10
    `);

    console.table(profilesResult);

    const relationshipsCount = await db.execute(sql`
      SELECT COUNT(*) as total_relationships FROM shop_relationships
    `);
    
    console.log(`\n📈 Total relationships created: ${(relationshipsCount[0] as any)?.total_relationships}`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log("🎉 Seeding process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedData }; 