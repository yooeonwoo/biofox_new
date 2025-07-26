import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { Id } from './_generated/dataModel';

// 🔍 고객 목록 조회 (KOL별) - 실시간 동기화
export const getCustomersByKol = query({
  args: {
    kolId: v.id('profiles'),
    status: v.optional(v.string()),
    region: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { kolId, status, region, paginationOpts } = args;

    let query = ctx.db.query('customers').withIndex('by_kol', q => q.eq('kol_id', kolId));

    // 상태별 필터링
    if (status) {
      query = query.filter(q => q.eq(q.field('status'), status));
    }

    // 지역별 필터링
    if (region) {
      query = query.filter(q => q.eq(q.field('region'), region));
    }

    // 최신순 정렬 및 페이지네이션
    const customers = await query.order('desc').paginate(paginationOpts);

    // 각 고객의 진행상황과 노트 정보도 함께 조회
    const customersWithProgress = await Promise.all(
      customers.page.map(async customer => {
        const progress = await ctx.db
          .query('customer_progress')
          .withIndex('by_customer', q => q.eq('customer_id', customer._id))
          .first();

        const notes = await ctx.db
          .query('customer_notes')
          .withIndex('by_customer_created', q => q.eq('customer_id', customer._id))
          .order('desc')
          .take(5); // 최근 5개 노트만

        return {
          ...customer,
          customer_progress: progress || null,
          customer_notes: notes,
        };
      })
    );

    return {
      ...customers,
      page: customersWithProgress,
    };
  },
});

// 🔍 단일 고객 상세 조회
export const getCustomerById = query({
  args: { customerId: v.id('customers') },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) return null;

    const progress = await ctx.db
      .query('customer_progress')
      .withIndex('by_customer', q => q.eq('customer_id', args.customerId))
      .first();

    const notes = await ctx.db
      .query('customer_notes')
      .withIndex('by_customer_created', q => q.eq('customer_id', args.customerId))
      .order('desc')
      .collect();

    return {
      ...customer,
      customer_progress: progress || null,
      customer_notes: notes,
    };
  },
});

// 📊 고객 통계 조회 (KOL별)
export const getCustomerStats = query({
  args: { kolId: v.id('profiles') },
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query('customers')
      .withIndex('by_kol', q => q.eq('kol_id', args.kolId))
      .collect();

    const statusCounts = customers.reduce(
      (acc, customer) => {
        acc[customer.status] = (acc[customer.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const regionCounts = customers.reduce(
      (acc, customer) => {
        acc[customer.region] = (acc[customer.region] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalCustomers: customers.length,
      statusCounts,
      regionCounts,
      recentCustomers: customers.sort((a, b) => b.created_at - a.created_at).slice(0, 5),
    };
  },
});

// ➕ 고객 생성
export const createCustomer = mutation({
  args: {
    kolId: v.id('profiles'),
    name: v.string(),
    shopName: v.optional(v.string()),
    phone: v.string(),
    region: v.string(),
    placeAddress: v.optional(v.string()),
    assignee: v.string(),
    manager: v.string(),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const customerId = await ctx.db.insert('customers', {
      kol_id: args.kolId,
      name: args.name,
      shop_name: args.shopName,
      phone: args.phone,
      region: args.region,
      place_address: args.placeAddress,
      assignee: args.assignee,
      manager: args.manager,
      status: args.status || 'pending',
      notes: args.notes,
      completed_stages: 0,
      total_stages: 6, // 기본 단계 수
      created_at: now,
      updated_at: now,
    });

    // 초기 진행상황 생성
    await ctx.db.insert('customer_progress', {
      customer_id: customerId,
      stage_data: {},
      achievements: {},
      created_at: now,
      updated_at: now,
    });

    return customerId;
  },
});

// ✏️ 고객 정보 업데이트
export const updateCustomer = mutation({
  args: {
    customerId: v.id('customers'),
    updates: v.object({
      name: v.optional(v.string()),
      shopName: v.optional(v.string()),
      phone: v.optional(v.string()),
      region: v.optional(v.string()),
      placeAddress: v.optional(v.string()),
      assignee: v.optional(v.string()),
      manager: v.optional(v.string()),
      status: v.optional(v.string()),
      notes: v.optional(v.string()),
      completedStages: v.optional(v.number()),
      totalStages: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { customerId, updates } = args;

    const updateData: any = {
      updated_at: Date.now(),
    };

    // 카멜케이스를 스네이크케이스로 변환
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.shopName !== undefined) updateData.shop_name = updates.shopName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.region !== undefined) updateData.region = updates.region;
    if (updates.placeAddress !== undefined) updateData.place_address = updates.placeAddress;
    if (updates.assignee !== undefined) updateData.assignee = updates.assignee;
    if (updates.manager !== undefined) updateData.manager = updates.manager;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.completedStages !== undefined)
      updateData.completed_stages = updates.completedStages;
    if (updates.totalStages !== undefined) updateData.total_stages = updates.totalStages;

    await ctx.db.patch(customerId, updateData);
    return customerId;
  },
});

// 📈 고객 진행상황 업데이트 (자동 단계 수 계산 포함)
export const updateCustomerProgress = mutation({
  args: {
    customerId: v.id('customers'),
    stageData: v.any(),
    achievements: v.any(),
  },
  handler: async (ctx, args) => {
    const { customerId, stageData, achievements } = args;
    const now = Date.now();

    // 완료된 단계 수 계산
    const calculateCompletedStages = (stageData: any): number => {
      let completed = 0;
      const stages = ['inflow', 'contract', 'delivery', 'educationNotes', 'growth', 'expert'];

      for (const stage of stages) {
        if (stageData[stage] && Object.keys(stageData[stage]).length > 0) {
          // 각 단계별 완료 조건 체크
          switch (stage) {
            case 'inflow':
              if (stageData.inflow.source) completed++;
              break;
            case 'contract':
              if (
                stageData.contract.type &&
                (stageData.contract.purchaseDate ||
                  stageData.contract.depositDate ||
                  stageData.contract.rejectDate)
              ) {
                completed++;
              }
              break;
            case 'delivery':
              if (
                stageData.delivery.type &&
                (stageData.delivery.installDate || stageData.delivery.shipDate)
              ) {
                completed++;
              }
              break;
            case 'educationNotes':
              if (stageData.educationNotes.q1Level || stageData.educationNotes.memo) {
                completed++;
              }
              break;
            case 'growth':
              if (
                stageData.growth.clinicalProgress ||
                stageData.growth.learningProgress ||
                stageData.growth.salesData
              ) {
                completed++;
              }
              break;
            case 'expert':
              if (stageData.expert.topic || stageData.expert.memo) {
                completed++;
              }
              break;
          }
        }
      }
      return completed;
    };

    const completedStages = calculateCompletedStages(stageData);

    // 기존 진행상황 확인
    const existingProgress = await ctx.db
      .query('customer_progress')
      .withIndex('by_customer', q => q.eq('customer_id', customerId))
      .first();

    // 고객 테이블의 완료 단계 수도 업데이트
    await ctx.db.patch(customerId, {
      completed_stages: completedStages,
      updated_at: now,
    });

    if (existingProgress) {
      // 업데이트
      await ctx.db.patch(existingProgress._id, {
        stage_data: stageData,
        achievements,
        updated_at: now,
      });
      return existingProgress._id;
    } else {
      // 생성
      const progressId = await ctx.db.insert('customer_progress', {
        customer_id: customerId,
        stage_data: stageData,
        achievements,
        created_at: now,
        updated_at: now,
      });
      return progressId;
    }
  },
});

// 📝 고객 노트 추가
export const addCustomerNote = mutation({
  args: {
    customerId: v.id('customers'),
    content: v.string(),
    noteType: v.optional(v.string()),
    createdBy: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const noteId = await ctx.db.insert('customer_notes', {
      customer_id: args.customerId,
      content: args.content,
      note_type: args.noteType || 'general',
      created_by: args.createdBy,
      created_at: now,
      updated_at: now,
    });

    return noteId;
  },
});

// 🗑️ 고객 삭제
export const deleteCustomer = mutation({
  args: { customerId: v.id('customers') },
  handler: async (ctx, args) => {
    const { customerId } = args;

    // 관련 진행상황 삭제
    const progress = await ctx.db
      .query('customer_progress')
      .withIndex('by_customer', q => q.eq('customer_id', customerId))
      .collect();

    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    // 관련 노트 삭제
    const notes = await ctx.db
      .query('customer_notes')
      .withIndex('by_customer', q => q.eq('customer_id', customerId))
      .collect();

    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    // 고객 삭제
    await ctx.db.delete(customerId);
    return customerId;
  },
});

// 🔍 고객 검색 (이름, 전화번호, 매장명으로 부분 검색)
export const searchCustomers = query({
  args: {
    kolId: v.id('profiles'),
    searchTerm: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { kolId, searchTerm, paginationOpts } = args;

    // 빈 검색어인 경우 모든 고객 반환
    if (!searchTerm.trim()) {
      return await ctx.db
        .query('customers')
        .withIndex('by_kol', q => q.eq('kol_id', kolId))
        .order('desc')
        .paginate(paginationOpts);
    }

    const searchLower = searchTerm.toLowerCase().trim();

    // KOL의 모든 고객을 가져온 후 메모리에서 필터링 (부분 문자열 검색)
    const allCustomers = await ctx.db
      .query('customers')
      .withIndex('by_kol', q => q.eq('kol_id', kolId))
      .collect();

    const filteredCustomers = allCustomers.filter(customer => {
      const name = customer.name?.toLowerCase() || '';
      const phone = customer.phone?.toLowerCase() || '';
      const shopName = customer.shop_name?.toLowerCase() || '';

      return (
        name.includes(searchLower) || phone.includes(searchLower) || shopName.includes(searchLower)
      );
    });

    // 수동 페이지네이션 구현
    const { numItems, cursor } = paginationOpts;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + numItems;

    const paginatedResults = filteredCustomers
      .sort((a, b) => b.created_at - a.created_at) // 최신순 정렬
      .slice(startIndex, endIndex);

    const hasMore = endIndex < filteredCustomers.length;
    const nextCursor = hasMore ? endIndex.toString() : undefined;

    return {
      page: paginatedResults,
      isDone: !hasMore,
      continueCursor: nextCursor || '',
    };
  },
});
