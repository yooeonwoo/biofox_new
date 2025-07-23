/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

/**
 * 상품 관리 플로우 통합 테스트
 *
 * 이 테스트는 상품 등록, 카테고리 관리, 활성화/비활성화,
 * 수수료 설정 등의 전체 상품 관리 워크플로우를 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 상품 생성 및 기본 설정
 * 2. 카테고리별 상품 관리
 * 3. 상품 활성화/비활성화
 * 4. 수수료율 관리 (기본/최소/최대)
 * 5. 상품 검색 및 필터링
 * 6. 상품 이미지 및 메타데이터 관리
 */

describe('Product Management Flow Integration Tests', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  // 테스트용 관리자 생성 헬퍼 함수
  async function createAdmin(
    name: string,
    email: string
  ): Promise<{ userId: any; profileId: any }> {
    const adminAuth = t.withIdentity({
      name,
      email,
      subject: `${email}-id`,
    });

    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email,
        name,
      });
    });

    const profileId = await adminAuth.mutation(api.auth.ensureUserProfile, {
      userId,
      email,
      name,
      role: 'admin',
      shop_name: 'BioFox Admin',
      region: '서울',
    });

    // 관리자를 승인된 상태로 만들기
    await t.run(async (ctx: any) => {
      await ctx.db.patch(profileId, {
        status: 'approved',
        approved_at: Date.now(),
      });
    });

    return { userId, profileId };
  }

  test('Complete product creation and management workflow', async () => {
    // 1. 관리자 생성
    const { profileId: adminProfileId } = await createAdmin('Product Admin', 'admin@biofox.com');

    // 2. 기본 상품 생성
    const now = Date.now();
    const productData = {
      name: 'Premium Anti-Aging Serum',
      code: 'BF-SERUM-001',
      category: 'skincare' as const,
      price: 89000,
      is_active: true,
      is_featured: false,
      sort_order: 1,
      description: '프리미엄 안티에이징 세럼으로 콜라겐 생성을 촉진하고 주름을 개선합니다.',
      specifications: {
        volume: '30ml',
        ingredients: ['펩타이드', '히알루론산', '나이아신아마이드'],
        usage: '아침, 저녁 세안 후 적당량을 발라주세요',
        cautions: ['임신 중 사용 금지', '아이 주변 사용 주의'],
      },
      images: [
        'https://example.com/serum-front.jpg',
        'https://example.com/serum-back.jpg',
        'https://example.com/serum-ingredients.jpg',
      ],
      default_commission_rate: 0.15, // 15% 기본 수수료
      min_commission_rate: 0.1, // 10% 최소 수수료
      max_commission_rate: 0.2, // 20% 최대 수수료
      created_at: now,
      updated_at: now,
      created_by: adminProfileId,
    };

    const productId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('products', productData);
    });

    // 3. 생성된 상품 확인
    const createdProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(createdProduct).toMatchObject({
      name: 'Premium Anti-Aging Serum',
      code: 'BF-SERUM-001',
      category: 'skincare',
      price: 89000,
      is_active: true,
      default_commission_rate: 0.15,
    });

    expect(createdProduct.specifications.volume).toBe('30ml');
    expect(createdProduct.images).toHaveLength(3);

    // 4. 상품 업데이트 (가격 조정 및 추천 상품 설정)
    await t.run(async (ctx: any) => {
      await ctx.db.patch(productId, {
        price: 79000, // 할인 적용
        is_featured: true, // 추천 상품으로 설정
        updated_at: Date.now(),
      });
    });

    // 5. 업데이트된 상품 확인
    const updatedProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(updatedProduct.price).toBe(79000);
    expect(updatedProduct.is_featured).toBe(true);

    // 6. 활성 상품 조회
    const activeProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_active', (q: any) => q.eq('is_active', true))
        .collect();
    });

    expect(activeProducts).toHaveLength(1);
    expect(activeProducts[0]._id).toBe(productId);

    // 7. 추천 상품 조회
    const featuredProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_featured_active', (q: any) =>
          q.eq('is_featured', true).eq('is_active', true)
        )
        .collect();
    });

    expect(featuredProducts).toHaveLength(1);
    expect(featuredProducts[0]._id).toBe(productId);
  });

  test('Product category management and filtering', async () => {
    // 1. 관리자 생성
    const { profileId: adminProfileId } = await createAdmin(
      'Category Admin',
      'category@biofox.com'
    );

    // 2. 다양한 카테고리의 상품들 생성
    const products = [
      {
        name: 'Vitamin C Serum',
        category: 'skincare' as const,
        price: 65000,
        commission_rate: 0.12,
      },
      {
        name: 'LED Face Mask',
        category: 'device' as const,
        price: 250000,
        commission_rate: 0.08,
      },
      {
        name: 'Collagen Supplement',
        category: 'supplement' as const,
        price: 45000,
        commission_rate: 0.2,
      },
      {
        name: 'BB Cream',
        category: 'cosmetic' as const,
        price: 35000,
        commission_rate: 0.15,
      },
      {
        name: 'Facial Cleansing Brush',
        category: 'accessory' as const,
        price: 89000,
        commission_rate: 0.1,
      },
    ];

    const productIds = [];

    // 3. 각 상품 생성
    for (const productData of products) {
      const productId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('products', {
          name: productData.name,
          code: `PROD-${Date.now()}-${Math.random()}`,
          category: productData.category,
          price: productData.price,
          is_active: true,
          is_featured: false,
          default_commission_rate: productData.commission_rate,
          min_commission_rate: productData.commission_rate * 0.7,
          max_commission_rate: productData.commission_rate * 1.3,
          description: `Test product: ${productData.name}`,
          created_at: Date.now(),
          updated_at: Date.now(),
          created_by: adminProfileId,
        });
      });

      productIds.push(productId);
    }

    // 4. 전체 상품 수 확인
    const allProducts = await t.run(async (ctx: any) => {
      return await ctx.db.query('products').collect();
    });

    expect(allProducts).toHaveLength(5);

    // 5. 카테고리별 상품 조회 테스트
    const categories = ['skincare', 'device', 'supplement', 'cosmetic', 'accessory'];

    for (const category of categories) {
      const categoryProducts = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('products')
          .withIndex('by_category_active', (q: any) =>
            q.eq('category', category).eq('is_active', true)
          )
          .collect();
      });

      expect(categoryProducts).toHaveLength(1);
      expect(categoryProducts[0].category).toBe(category);
    }

    // 6. 가격대별 상품 조회
    const expensiveProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_price', (q: any) => q.gte('price', 100000))
        .collect();
    });

    expect(expensiveProducts).toHaveLength(1); // LED Face Mask만 해당
    expect(expensiveProducts[0].name).toBe('LED Face Mask');

    // 7. 수수료율별 상품 분류
    const highCommissionProducts = allProducts.filter(
      (product: any) => product.default_commission_rate >= 0.15
    );
    const lowCommissionProducts = allProducts.filter(
      (product: any) => product.default_commission_rate < 0.1
    );

    expect(highCommissionProducts).toHaveLength(2); // Collagen Supplement, BB Cream
    expect(lowCommissionProducts).toHaveLength(1); // LED Face Mask
  });

  test('Product activation and deactivation workflow', async () => {
    // 1. 관리자 생성
    const { profileId: adminProfileId } = await createAdmin(
      'Activation Admin',
      'activation@biofox.com'
    );

    // 2. 테스트 상품 생성
    const productId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('products', {
        name: 'Test Product for Activation',
        code: 'TEST-ACTIVATION-001',
        category: 'skincare',
        price: 50000,
        is_active: true,
        is_featured: false,
        default_commission_rate: 0.12,
        min_commission_rate: 0.08,
        max_commission_rate: 0.16,
        description: 'Product for testing activation/deactivation',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: adminProfileId,
      });
    });

    // 3. 초기 활성 상태 확인
    const initialProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(initialProduct.is_active).toBe(true);

    // 4. 상품 비활성화
    await t.run(async (ctx: any) => {
      await ctx.db.patch(productId, {
        is_active: false,
        updated_at: Date.now(),
      });
    });

    // 5. 비활성화된 상품 확인
    const deactivatedProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(deactivatedProduct.is_active).toBe(false);

    // 6. 활성 상품 목록에서 제외되는지 확인
    const activeProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_active', (q: any) => q.eq('is_active', true))
        .collect();
    });

    expect(activeProducts.some((product: any) => product._id === productId)).toBe(false);

    // 7. 상품 재활성화
    await t.run(async (ctx: any) => {
      await ctx.db.patch(productId, {
        is_active: true,
        updated_at: Date.now(),
      });
    });

    // 8. 재활성화된 상품 확인
    const reactivatedProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(reactivatedProduct.is_active).toBe(true);

    // 9. 활성 상품 목록에 다시 포함되는지 확인
    const reactivatedActiveProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_active', (q: any) => q.eq('is_active', true))
        .collect();
    });

    expect(reactivatedActiveProducts.some((product: any) => product._id === productId)).toBe(true);
  });

  test('Commission rate management and validation', async () => {
    // 1. 관리자 생성
    const { profileId: adminProfileId } = await createAdmin(
      'Commission Admin',
      'commission@biofox.com'
    );

    // 2. 다양한 수수료율을 가진 상품 생성
    const commissionTestProduct = await t.run(async (ctx: any) => {
      return await ctx.db.insert('products', {
        name: 'Commission Test Product',
        code: 'COMM-TEST-001',
        category: 'skincare',
        price: 100000,
        is_active: true,
        default_commission_rate: 0.15,
        min_commission_rate: 0.1,
        max_commission_rate: 0.25,
        description: 'Product for testing commission rates',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: adminProfileId,
      });
    });

    // 3. 초기 수수료율 확인
    const initialProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(commissionTestProduct);
    });

    expect(initialProduct.default_commission_rate).toBe(0.15);
    expect(initialProduct.min_commission_rate).toBe(0.1);
    expect(initialProduct.max_commission_rate).toBe(0.25);

    // 4. 수수료율 조정 (프로모션으로 인한 수수료 상향)
    await t.run(async (ctx: any) => {
      await ctx.db.patch(commissionTestProduct, {
        default_commission_rate: 0.2, // 20%로 상향
        updated_at: Date.now(),
      });
    });

    // 5. 조정된 수수료율 확인
    const adjustedProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(commissionTestProduct);
    });

    expect(adjustedProduct.default_commission_rate).toBe(0.2);

    // 6. 수수료율 범위 유효성 테스트 (최대값을 초과하는 경우)
    // 실제 비즈니스 로직에서는 검증이 필요하지만,
    // 여기서는 데이터 구조상 가능함을 확인
    await t.run(async (ctx: any) => {
      await ctx.db.patch(commissionTestProduct, {
        default_commission_rate: 0.3, // 최대값(0.25) 초과
        updated_at: Date.now(),
      });
    });

    const overMaxProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(commissionTestProduct);
    });

    // 데이터는 저장되지만, 실제 애플리케이션에서는 검증 로직이 필요
    expect(overMaxProduct.default_commission_rate).toBe(0.3);
    expect(overMaxProduct.default_commission_rate).toBeGreaterThan(
      overMaxProduct.max_commission_rate
    );

    // 7. 수수료율 정규화 (최대값으로 조정)
    await t.run(async (ctx: any) => {
      await ctx.db.patch(commissionTestProduct, {
        default_commission_rate: Math.min(0.3, overMaxProduct.max_commission_rate),
        updated_at: Date.now(),
      });
    });

    const normalizedProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(commissionTestProduct);
    });

    expect(normalizedProduct.default_commission_rate).toBe(0.25);
  });

  test('Product search and sorting functionality', async () => {
    // 1. 관리자 생성
    const { profileId: adminProfileId } = await createAdmin('Search Admin', 'search@biofox.com');

    // 2. 검색 테스트용 상품들 생성
    const searchProducts = [
      {
        name: 'Premium Vitamin C Serum',
        price: 120000,
        sort_order: 1,
        is_featured: true,
      },
      {
        name: 'Basic Vitamin C Cream',
        price: 60000,
        sort_order: 3,
        is_featured: false,
      },
      {
        name: 'Advanced Anti-Aging Serum',
        price: 150000,
        sort_order: 2,
        is_featured: true,
      },
      {
        name: 'Daily Moisturizer',
        price: 45000,
        sort_order: 4,
        is_featured: false,
      },
    ];

    const productIds = [];

    for (const [index, productData] of searchProducts.entries()) {
      const productId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('products', {
          name: productData.name,
          code: `SEARCH-${index + 1}`,
          category: 'skincare',
          price: productData.price,
          is_active: true,
          is_featured: productData.is_featured,
          sort_order: productData.sort_order,
          default_commission_rate: 0.15,
          min_commission_rate: 0.1,
          max_commission_rate: 0.2,
          description: `Search test product: ${productData.name}`,
          created_at: Date.now(),
          updated_at: Date.now(),
          created_by: adminProfileId,
        });
      });

      productIds.push(productId);
    }

    // 3. 전체 상품 조회
    const allProducts = await t.run(async (ctx: any) => {
      return await ctx.db.query('products').collect();
    });

    expect(allProducts).toHaveLength(4);

    // 4. 가격순 정렬 테스트
    const priceDescProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_price', (q: any) => q.gte('price', 0))
        .order('desc')
        .collect();
    });

    expect(priceDescProducts[0].name).toBe('Advanced Anti-Aging Serum'); // 가장 비싼 상품
    expect(priceDescProducts[3].name).toBe('Daily Moisturizer'); // 가장 저렴한 상품

    // 5. 정렬 순서별 조회
    const sortOrderProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_sort_order', (q: any) => q.gte('sort_order', 1))
        .collect();
    });

    const sortedBySortOrder = sortOrderProducts.sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    );
    expect(sortedBySortOrder[0].name).toBe('Premium Vitamin C Serum'); // sort_order: 1
    expect(sortedBySortOrder[1].name).toBe('Advanced Anti-Aging Serum'); // sort_order: 2

    // 6. 추천 상품만 조회
    const featuredProducts = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('products')
        .withIndex('by_featured_active', (q: any) =>
          q.eq('is_featured', true).eq('is_active', true)
        )
        .collect();
    });

    expect(featuredProducts).toHaveLength(2);
    expect(featuredProducts.every((product: any) => product.is_featured === true)).toBe(true);

    // 7. 가격 범위별 필터링
    const midRangeProducts = allProducts.filter(
      (product: any) => product.price >= 50000 && product.price <= 100000
    );

    expect(midRangeProducts).toHaveLength(1);
    expect(midRangeProducts[0].name).toBe('Basic Vitamin C Cream');

    // 8. 이름 기반 검색 시뮬레이션 (Vitamin C 포함 상품)
    const vitaminCProducts = allProducts.filter((product: any) =>
      product.name.toLowerCase().includes('vitamin c')
    );

    expect(vitaminCProducts).toHaveLength(2);
    expect(
      vitaminCProducts.every((product: any) => product.name.toLowerCase().includes('vitamin c'))
    ).toBe(true);
  });

  test('Product metadata and specifications management', async () => {
    // 1. 관리자 생성
    const { profileId: adminProfileId } = await createAdmin(
      'Metadata Admin',
      'metadata@biofox.com'
    );

    // 2. 복잡한 메타데이터를 가진 상품 생성
    const complexSpecifications = {
      basic_info: {
        volume: '50ml',
        weight: '120g',
        dimensions: '5cm x 5cm x 12cm',
        shelf_life: '36개월',
        manufacturing_date: '2024-01-15',
      },
      ingredients: {
        active_ingredients: [
          { name: '레티놀', concentration: '0.5%', function: '주름개선' },
          { name: '히알루론산', concentration: '2%', function: '보습' },
          { name: '나이아신아마이드', concentration: '5%', function: '미백' },
        ],
        base_ingredients: ['정제수', '글리세린', '세틸알코올', '스테아르산'],
        preservatives: ['페녹시에탄올', '에틸헥실글리세린'],
      },
      usage_instructions: {
        frequency: '하루 1-2회',
        timing: '저녁 사용 권장',
        application_method: '세안 후 적당량을 얼굴 전체에 발라주세요',
        precautions: [
          '임신, 수유 중 사용 금지',
          '햇빛에 민감해질 수 있으니 자외선 차단제 사용',
          '눈 주위 사용 주의',
        ],
      },
      certifications: {
        kfda_approval: true,
        cruelty_free: true,
        vegan: false,
        organic: false,
        certificates: ['GMP', 'ISO 22716'],
      },
      storage: {
        temperature: '실온 보관',
        humidity: '60% 이하',
        sunlight: '직사광선 피해 보관',
        expiration_after_opening: '12개월',
      },
    };

    const productId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('products', {
        name: 'Professional Retinol Serum',
        code: 'PRO-RETINOL-001',
        category: 'skincare',
        price: 180000,
        is_active: true,
        is_featured: true,
        sort_order: 1,
        description: '전문가용 레티놀 세럼으로 강력한 안티에이징 효과를 제공합니다.',
        specifications: complexSpecifications,
        images: [
          'https://example.com/retinol-main.jpg',
          'https://example.com/retinol-ingredients.jpg',
          'https://example.com/retinol-usage.jpg',
          'https://example.com/retinol-certification.jpg',
        ],
        default_commission_rate: 0.18,
        min_commission_rate: 0.15,
        max_commission_rate: 0.25,
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: adminProfileId,
      });
    });

    // 3. 생성된 상품의 메타데이터 확인
    const productWithSpecs = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(productWithSpecs.specifications).toMatchObject(complexSpecifications);
    expect(productWithSpecs.specifications.basic_info.volume).toBe('50ml');
    expect(productWithSpecs.specifications.ingredients.active_ingredients).toHaveLength(3);
    expect(productWithSpecs.specifications.certifications.kfda_approval).toBe(true);

    // 4. 이미지 정보 확인
    expect(productWithSpecs.images).toHaveLength(4);
    expect(productWithSpecs.images[0]).toBe('https://example.com/retinol-main.jpg');

    // 5. 사양 업데이트 (새로운 인증 추가)
    const updatedSpecifications = {
      ...complexSpecifications,
      certifications: {
        ...complexSpecifications.certifications,
        new_certification: 'FDA 승인',
        certificates: [...complexSpecifications.certifications.certificates, 'COSMOS'],
      },
      version_info: {
        version: '2.0',
        update_date: '2024-02-01',
        changes: ['농도 개선', '새로운 보습 성분 추가'],
      },
    };

    await t.run(async (ctx: any) => {
      await ctx.db.patch(productId, {
        specifications: updatedSpecifications,
        updated_at: Date.now(),
      });
    });

    // 6. 업데이트된 사양 확인
    const updatedProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(updatedProduct.specifications.certifications.new_certification).toBe('FDA 승인');
    expect(updatedProduct.specifications.certifications.certificates).toContain('COSMOS');
    expect(updatedProduct.specifications.version_info.version).toBe('2.0');

    // 7. 이미지 업데이트 (새로운 이미지 추가)
    const newImages = [
      ...productWithSpecs.images,
      'https://example.com/retinol-before-after.jpg',
      'https://example.com/retinol-clinical-test.jpg',
    ];

    await t.run(async (ctx: any) => {
      await ctx.db.patch(productId, {
        images: newImages,
        updated_at: Date.now(),
      });
    });

    // 8. 업데이트된 이미지 확인
    const finalProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(productId);
    });

    expect(finalProduct.images).toHaveLength(6);
    expect(finalProduct.images).toContain('https://example.com/retinol-before-after.jpg');
  });

  test('Product inventory and availability management', async () => {
    // 1. 관리자 생성
    const { profileId: adminProfileId } = await createAdmin(
      'Inventory Admin',
      'inventory@biofox.com'
    );

    // 2. 재고 관리 정보를 포함한 상품 생성
    const inventoryProduct = await t.run(async (ctx: any) => {
      return await ctx.db.insert('products', {
        name: 'Limited Edition Face Cream',
        code: 'LIMITED-CREAM-001',
        category: 'skincare',
        price: 95000,
        is_active: true,
        is_featured: true,
        sort_order: 1,
        description: '한정판 페이스 크림',
        specifications: {
          inventory: {
            stock_quantity: 100,
            reserved_quantity: 10,
            available_quantity: 90,
            reorder_level: 20,
            max_stock_level: 500,
            is_limited_edition: true,
            expected_restock_date: '2024-03-01',
          },
          availability: {
            is_available: true,
            pre_order_available: false,
            backorder_allowed: false,
            estimated_delivery: '2-3 영업일',
          },
        },
        default_commission_rate: 0.16,
        min_commission_rate: 0.12,
        max_commission_rate: 0.2,
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: adminProfileId,
      });
    });

    // 3. 초기 재고 상태 확인
    const initialInventory = await t.run(async (ctx: any) => {
      return await ctx.db.get(inventoryProduct);
    });

    expect(initialInventory.specifications.inventory.stock_quantity).toBe(100);
    expect(initialInventory.specifications.inventory.available_quantity).toBe(90);
    expect(initialInventory.specifications.availability.is_available).toBe(true);

    // 4. 주문으로 인한 재고 감소 시뮬레이션
    const soldQuantity = 25;
    const newAvailableQuantity =
      initialInventory.specifications.inventory.available_quantity - soldQuantity;

    await t.run(async (ctx: any) => {
      await ctx.db.patch(inventoryProduct, {
        specifications: {
          ...initialInventory.specifications,
          inventory: {
            ...initialInventory.specifications.inventory,
            available_quantity: newAvailableQuantity,
            reserved_quantity:
              initialInventory.specifications.inventory.reserved_quantity + soldQuantity,
          },
        },
        updated_at: Date.now(),
      });
    });

    // 5. 재고 감소 후 상태 확인
    const afterSaleInventory = await t.run(async (ctx: any) => {
      return await ctx.db.get(inventoryProduct);
    });

    expect(afterSaleInventory.specifications.inventory.available_quantity).toBe(65);
    expect(afterSaleInventory.specifications.inventory.reserved_quantity).toBe(35);

    // 6. 재고 부족 상황 시뮬레이션
    await t.run(async (ctx: any) => {
      await ctx.db.patch(inventoryProduct, {
        specifications: {
          ...afterSaleInventory.specifications,
          inventory: {
            ...afterSaleInventory.specifications.inventory,
            available_quantity: 15, // 재주문 수준(20) 미만
          },
          availability: {
            ...afterSaleInventory.specifications.availability,
            is_available: false,
            pre_order_available: true,
            backorder_allowed: true,
          },
        },
        is_active: false, // 일시적으로 비활성화
        updated_at: Date.now(),
      });
    });

    // 7. 재고 부족 상태 확인
    const lowStockProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(inventoryProduct);
    });

    expect(lowStockProduct.specifications.inventory.available_quantity).toBe(15);
    expect(lowStockProduct.specifications.availability.is_available).toBe(false);
    expect(lowStockProduct.specifications.availability.pre_order_available).toBe(true);
    expect(lowStockProduct.is_active).toBe(false);

    // 8. 재입고 시뮬레이션
    const restockQuantity = 200;

    await t.run(async (ctx: any) => {
      await ctx.db.patch(inventoryProduct, {
        specifications: {
          ...lowStockProduct.specifications,
          inventory: {
            ...lowStockProduct.specifications.inventory,
            stock_quantity:
              lowStockProduct.specifications.inventory.stock_quantity + restockQuantity,
            available_quantity:
              lowStockProduct.specifications.inventory.available_quantity + restockQuantity,
            expected_restock_date: null, // 재입고 완료
          },
          availability: {
            ...lowStockProduct.specifications.availability,
            is_available: true,
            pre_order_available: false,
            backorder_allowed: false,
          },
        },
        is_active: true, // 다시 활성화
        updated_at: Date.now(),
      });
    });

    // 9. 재입고 후 상태 확인
    const restockedProduct = await t.run(async (ctx: any) => {
      return await ctx.db.get(inventoryProduct);
    });

    expect(restockedProduct.specifications.inventory.stock_quantity).toBe(300);
    expect(restockedProduct.specifications.inventory.available_quantity).toBe(215);
    expect(restockedProduct.specifications.availability.is_available).toBe(true);
    expect(restockedProduct.is_active).toBe(true);
  });
});
