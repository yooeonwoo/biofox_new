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

// 📈 고객 진행상황 업데이트
export const updateCustomerProgress = mutation({
  args: {
    customerId: v.id('customers'),
    stageData: v.any(),
    achievements: v.any(),
  },
  handler: async (ctx, args) => {
    const { customerId, stageData, achievements } = args;
    const now = Date.now();

    // 기존 진행상황 확인
    const existingProgress = await ctx.db
      .query('customer_progress')
      .withIndex('by_customer', q => q.eq('customer_id', customerId))
      .first();

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

// 🔍 고객 검색 (이름, 전화번호, 매장명으로)
export const searchCustomers = query({
  args: {
    kolId: v.id('profiles'),
    searchTerm: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { kolId, searchTerm, paginationOpts } = args;

    const customers = await ctx.db
      .query('customers')
      .withIndex('by_kol', q => q.eq('kol_id', kolId))
      .filter(q =>
        q.or(
          q.eq(q.field('name'), searchTerm),
          q.eq(q.field('phone'), searchTerm),
          q.eq(q.field('shop_name'), searchTerm)
        )
      )
      .order('desc')
      .paginate(paginationOpts);

    return customers;
  },
});
