import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  // Convex Auth 시스템 테이블
  ...authTables,

  // 💼 사용자 프로필 - 실제 Supabase 구조 정확 매핑
  profiles: defineTable({
    userId: v.id('users'), // Convex Auth users 테이블 참조
    // 기본 정보
    email: v.string(),
    name: v.string(),
    // 역할 및 상태 (실제 enum 값들)
    role: v.union(v.literal('admin'), v.literal('kol'), v.literal('ol'), v.literal('shop_owner')),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    // 매장 정보
    shop_name: v.string(),
    region: v.optional(v.string()),
    naver_place_link: v.optional(v.string()),
    // 승인 관리
    approved_at: v.optional(v.number()),
    approved_by: v.optional(v.id('profiles')),
    // 수수료 및 하위 매장 관리
    commission_rate: v.optional(v.number()),
    total_subordinates: v.optional(v.number()),
    active_subordinates: v.optional(v.number()),
    // 메타데이터
    metadata: v.optional(v.any()),
    // 시스템 필드
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_email', ['email'])
    .index('by_role', ['role'])
    .index('by_status', ['status'])
    .index('by_approved_by', ['approved_by'])
    // 🚀 성능 최적화 인덱스
    .index('by_role_status', ['role', 'status']) // 역할별 승인 상태 조회
    .index('by_region', ['region']) // 지역별 조회
    .index('by_created_at', ['created_at']) // 생성일순 정렬
    .index('by_updated_at', ['updated_at']) // 최근 활동순 정렬
    .index('by_active_subordinates', ['active_subordinates']), // 하위 매장 수 기준 정렬

  // 🏪 매장 관계 - 계층적 KOL-매장 관계
  shop_relationships: defineTable({
    shop_owner_id: v.id('profiles'),
    parent_id: v.optional(v.id('profiles')),
    started_at: v.number(),
    ended_at: v.optional(v.number()),
    is_active: v.boolean(),
    relationship_type: v.optional(
      v.union(v.literal('direct'), v.literal('transferred'), v.literal('temporary'))
    ),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.optional(v.id('profiles')),
  })
    .index('by_shop_owner', ['shop_owner_id'])
    .index('by_parent', ['parent_id'])
    .index('by_active', ['is_active'])
    .index('by_relationship_type', ['relationship_type'])
    // 🚀 성능 최적화 인덱스
    .index('by_parent_active', ['parent_id', 'is_active']) // 활성 하위 관계 조회
    .index('by_shop_active', ['shop_owner_id', 'is_active']) // 매장의 활성 관계
    .index('by_started_at', ['started_at']) // 시작일순 정렬
    .index('by_type_active', ['relationship_type', 'is_active']), // 타입별 활성 관계

  // 🛍️ 상품 관리
  products: defineTable({
    name: v.string(),
    code: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal('skincare'),
        v.literal('device'),
        v.literal('supplement'),
        v.literal('cosmetic'),
        v.literal('accessory')
      )
    ),
    price: v.number(),
    is_active: v.boolean(),
    is_featured: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
    description: v.optional(v.string()),
    specifications: v.optional(v.any()),
    images: v.optional(v.array(v.string())),
    default_commission_rate: v.optional(v.number()),
    min_commission_rate: v.optional(v.number()),
    max_commission_rate: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.optional(v.id('profiles')),
  })
    .index('by_category', ['category'])
    .index('by_active', ['is_active'])
    .index('by_featured', ['is_featured'])
    .index('by_code', ['code'])
    // 🚀 성능 최적화 인덱스
    .index('by_category_active', ['category', 'is_active']) // 카테고리별 활성 상품
    .index('by_price', ['price']) // 가격순 정렬
    .index('by_sort_order', ['sort_order']) // 정렬 순서
    .index('by_featured_active', ['is_featured', 'is_active']), // 추천 활성 상품

  // 📦 주문 관리
  orders: defineTable({
    shop_id: v.id('profiles'),
    order_date: v.number(), // Unix timestamp converted from date
    order_number: v.optional(v.string()),
    total_amount: v.number(),
    commission_rate: v.optional(v.number()),
    commission_amount: v.optional(v.number()),
    commission_status: v.optional(
      v.union(
        v.literal('calculated'),
        v.literal('adjusted'),
        v.literal('paid'),
        v.literal('cancelled')
      )
    ),
    order_status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('completed'),
        v.literal('cancelled'),
        v.literal('refunded')
      )
    ),
    is_self_shop_order: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.id('profiles'),
  })
    .index('by_shop', ['shop_id'])
    .index('by_date', ['order_date'])
    .index('by_status', ['order_status'])
    .index('by_commission_status', ['commission_status'])
    // 🚀 성능 최적화 인덱스
    .index('by_shop_date', ['shop_id', 'order_date']) // 매장별 날짜순 주문
    .index('by_shop_status', ['shop_id', 'order_status']) // 매장별 상태별 주문
    .index('by_date_status', ['order_date', 'order_status']) // 일별 상태별 주문
    .index('by_created_by', ['created_by']) // 생성자별 주문
    .index('by_total_amount', ['total_amount']) // 금액순 정렬
    .index('by_commission_amount', ['commission_amount']), // 수수료순 정렬

  // 📋 주문 항목
  order_items: defineTable({
    order_id: v.id('orders'),
    product_id: v.optional(v.id('products')),
    product_name: v.string(),
    product_code: v.optional(v.string()),
    quantity: v.number(),
    unit_price: v.number(),
    subtotal: v.number(),
    item_commission_rate: v.optional(v.number()),
    item_commission_amount: v.optional(v.number()),
    created_at: v.number(),
  })
    .index('by_order', ['order_id'])
    // 🚀 성능 최적화 인덱스
    .index('by_product', ['product_id']) // 상품별 주문 항목
    .index('by_order_product', ['order_id', 'product_id']), // 주문-상품 복합

  // 📱 디바이스 판매 관리
  device_sales: defineTable({
    shop_id: v.id('profiles'),
    sale_date: v.number(),
    device_name: v.optional(v.string()),
    quantity: v.number(),
    tier_at_sale: v.union(v.literal('tier_1_4'), v.literal('tier_5_plus')),
    standard_commission: v.number(),
    actual_commission: v.number(),
    commission_status: v.optional(
      v.union(
        v.literal('calculated'),
        v.literal('adjusted'),
        v.literal('paid'),
        v.literal('cancelled')
      )
    ),
    notes: v.optional(v.string()),
    serial_numbers: v.optional(v.array(v.string())),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.id('profiles'),
  })
    .index('by_shop', ['shop_id'])
    .index('by_date', ['sale_date'])
    .index('by_tier', ['tier_at_sale'])
    // 🚀 성능 최적화 인덱스
    .index('by_shop_date', ['shop_id', 'sale_date']) // 매장별 날짜순 판매
    .index('by_shop_tier', ['shop_id', 'tier_at_sale']) // 매장별 티어별 판매
    .index('by_commission_status', ['commission_status']), // 수수료 상태별

  // 📊 KOL 디바이스 누적기
  kol_device_accumulator: defineTable({
    kol_id: v.id('profiles'),
    total_devices_sold: v.number(),
    total_devices_returned: v.number(),
    net_devices_sold: v.number(),
    current_tier: v.union(v.literal('tier_1_4'), v.literal('tier_5_plus')),
    tier_1_4_count: v.optional(v.number()),
    tier_5_plus_count: v.optional(v.number()),
    tier_changed_at: v.optional(v.number()),
    last_updated: v.number(),
    created_at: v.number(),
  })
    .index('by_kol', ['kol_id'])
    .index('by_tier', ['current_tier'])
    // 🚀 성능 최적화 인덱스
    .index('by_net_devices', ['net_devices_sold']) // 순 판매량순 정렬
    .index('by_last_updated', ['last_updated']), // 최근 업데이트순

  // 💼 디바이스 수수료 티어
  device_commission_tiers: defineTable({
    device_type: v.string(),
    tier: v.number(),
    commission: v.number(),
  })
    .index('by_device_type', ['device_type'])
    // 🚀 성능 최적화 인덱스
    .index('by_tier', ['tier']) // 티어별 조회
    .index('by_device_tier', ['device_type', 'tier']), // 디바이스-티어 복합

  // 📈 CRM 카드 - 10단계 CRM 관리 시스템 (41개 컬럼)
  crm_cards: defineTable({
    kol_id: v.id('profiles'),
    shop_id: v.id('profiles'),
    // 10단계 상태 관리
    stage_1_status: v.optional(v.boolean()),
    stage_1_completed_at: v.optional(v.number()),
    stage_2_status: v.optional(v.boolean()),
    stage_2_completed_at: v.optional(v.number()),
    stage_3_status: v.optional(v.boolean()),
    stage_3_completed_at: v.optional(v.number()),
    stage_4_status: v.optional(v.boolean()),
    stage_4_completed_at: v.optional(v.number()),
    stage_5_status: v.optional(v.boolean()),
    stage_5_completed_at: v.optional(v.number()),
    stage_6_status: v.optional(v.boolean()),
    stage_6_completed_at: v.optional(v.number()),
    stage_7_status: v.optional(v.boolean()),
    stage_7_completed_at: v.optional(v.number()),
    stage_8_status: v.optional(v.boolean()),
    stage_8_completed_at: v.optional(v.number()),
    stage_9_status: v.optional(v.boolean()),
    stage_9_completed_at: v.optional(v.number()),
    stage_10_status: v.optional(v.boolean()),
    stage_10_completed_at: v.optional(v.number()),
    // 설치 정보
    installation_date: v.optional(v.number()),
    installation_manager: v.optional(v.string()),
    installation_contact: v.optional(v.string()),
    // Q1-Q6 질문 답변 (실제 enum 값들)
    q1_cleobios: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q2_instasure: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q3_proper_procedure: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q4_progress_check: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q5_feedback_need: v.optional(v.union(v.literal('상'), v.literal('중'), v.literal('하'))),
    q6_management: v.optional(v.union(v.literal('상'), v.literal('중'), v.literal('하'))),
    // 메타데이터
    priority_level: v.optional(v.union(v.literal('high'), v.literal('normal'), v.literal('low'))),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    total_clinical_cases: v.optional(v.number()),
    active_clinical_cases: v.optional(v.number()),
    last_activity_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.optional(v.id('profiles')),
  })
    .index('by_kol', ['kol_id'])
    .index('by_shop', ['shop_id'])
    .index('by_priority', ['priority_level'])
    // 🚀 성능 최적화 인덱스
    .index('by_kol_priority', ['kol_id', 'priority_level']) // KOL별 우선순위
    .index('by_installation_date', ['installation_date']) // 설치일순
    .index('by_last_activity', ['last_activity_at']) // 최근 활동순
    .index('by_clinical_cases', ['active_clinical_cases']), // 활성 임상 케이스 수순

  // 🌱 자체 성장 카드 - 자체 성장 관리 (24개 컬럼)
  self_growth_cards: defineTable({
    shop_id: v.id('profiles'),
    crm_card_id: v.optional(v.id('crm_cards')),
    // 설치 정보
    installation_date: v.optional(v.number()),
    installation_manager: v.optional(v.string()),
    installation_contact: v.optional(v.string()),
    // Q1-Q4 질문과 완료 시간
    q1_cleobios: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q1_completed_at: v.optional(v.number()),
    q2_instasure: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q2_completed_at: v.optional(v.number()),
    q3_proper_procedure: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q3_completed_at: v.optional(v.number()),
    q4_progress_check: v.optional(v.union(v.literal('Y'), v.literal('N'))),
    q4_completed_at: v.optional(v.number()),
    // 교육 상태
    company_training_status: v.optional(
      v.union(
        v.literal('not_started'),
        v.literal('applied'),
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('cancelled')
      )
    ),
    company_training_applied_at: v.optional(v.number()),
    company_training_completed_at: v.optional(v.number()),
    // 목표 및 평가 (JSONB)
    monthly_goals: v.optional(v.any()),
    self_evaluation: v.optional(v.any()),
    improvement_plans: v.optional(v.array(v.string())),
    self_notes: v.optional(v.string()),
    private_data: v.optional(v.any()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index('by_shop', ['shop_id'])
    // 🚀 성능 최적화 인덱스
    .index('by_training_status', ['company_training_status']) // 교육 상태별
    .index('by_training_applied', ['company_training_applied_at']) // 교육 신청일순
    .index('by_training_completed', ['company_training_completed_at']), // 교육 완료일순

  // 🏥 임상 케이스 - 임상 사례 관리 (22개 컬럼)
  clinical_cases: defineTable({
    shop_id: v.id('profiles'),
    subject_type: v.union(v.literal('self'), v.literal('customer')),
    name: v.string(),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    age: v.optional(v.number()),
    status: v.union(
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('paused'),
      v.literal('cancelled')
    ),
    treatment_item: v.optional(v.string()),
    start_date: v.optional(v.number()),
    end_date: v.optional(v.number()),
    total_sessions: v.optional(v.number()),
    consent_status: v.union(v.literal('no_consent'), v.literal('consented'), v.literal('pending')),
    consent_date: v.optional(v.number()),
    marketing_consent: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    custom_fields: v.optional(v.any()),
    photo_count: v.optional(v.number()),
    latest_session: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.optional(v.id('profiles')),
  })
    .index('by_shop', ['shop_id'])
    .index('by_status', ['status'])
    .index('by_subject_type', ['subject_type'])
    .index('by_consent_status', ['consent_status'])
    // 🚀 성능 최적화 인덱스
    .index('by_shop_status', ['shop_id', 'status']) // 매장별 상태별 케이스
    .index('by_start_date', ['start_date']) // 시작일순
    .index('by_end_date', ['end_date']) // 종료일순
    .index('by_treatment_item', ['treatment_item']) // 치료 항목별
    .index('by_age', ['age']) // 나이순
    .index('by_gender', ['gender']), // 성별

  // 📷 임상 사진 - 세션별 임상 사진 관리 (10개 컬럼)
  clinical_photos: defineTable({
    clinical_case_id: v.id('clinical_cases'),
    session_number: v.number(),
    photo_type: v.union(v.literal('front'), v.literal('left_side'), v.literal('right_side')),
    file_path: v.string(),
    file_size: v.optional(v.number()),
    metadata: v.optional(v.any()),
    upload_date: v.number(),
    created_at: v.number(),
    uploaded_by: v.optional(v.id('profiles')),
  })
    .index('by_case', ['clinical_case_id'])
    .index('by_session', ['clinical_case_id', 'session_number'])
    .index('by_photo_type', ['photo_type'])
    // 🚀 성능 최적화 인덱스
    .index('by_upload_date', ['upload_date']) // 업로드일순
    .index('by_session_type', ['clinical_case_id', 'session_number', 'photo_type']), // 세션-타입 복합

  // 📄 동의서 파일 - 동의서 문서 관리 (10개 컬럼)
  consent_files: defineTable({
    clinical_case_id: v.id('clinical_cases'),
    file_path: v.string(),
    file_name: v.string(),
    file_size: v.optional(v.number()),
    file_type: v.optional(v.string()),
    metadata: v.optional(v.any()),
    upload_date: v.number(),
    created_at: v.number(),
    uploaded_by: v.optional(v.id('profiles')),
  })
    .index('by_case', ['clinical_case_id'])
    // 🚀 성능 최적화 인덱스
    .index('by_upload_date', ['upload_date']) // 업로드일순
    .index('by_file_type', ['file_type']), // 파일 타입별

  // 💰 수수료 계산 - 월별 수수료 계산서 (25개 컬럼)
  commission_calculations: defineTable({
    kol_id: v.id('profiles'),
    calculation_month: v.number(), // 월초 날짜
    subordinate_shop_count: v.optional(v.number()),
    active_shop_count: v.optional(v.number()),
    subordinate_sales: v.optional(v.number()),
    subordinate_commission: v.optional(v.number()),
    self_shop_sales: v.optional(v.number()),
    self_shop_commission: v.optional(v.number()),
    device_count: v.optional(v.number()),
    device_commission: v.optional(v.number()),
    manual_adjustment: v.optional(v.number()),
    adjustment_reason: v.optional(v.string()),
    total_commission: v.number(),
    status: v.optional(
      v.union(
        v.literal('calculated'),
        v.literal('reviewed'),
        v.literal('approved'),
        v.literal('paid'),
        v.literal('cancelled')
      )
    ),
    payment_date: v.optional(v.number()),
    payment_reference: v.optional(v.string()),
    calculation_details: v.optional(v.any()),
    notes: v.optional(v.string()),
    calculated_at: v.number(),
    paid_at: v.optional(v.number()),
    created_by: v.optional(v.id('profiles')),
    updated_by: v.optional(v.id('profiles')),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index('by_kol', ['kol_id'])
    .index('by_month', ['calculation_month'])
    .index('by_status', ['status'])
    // 🚀 성능 최적화 인덱스
    .index('by_kol_month', ['kol_id', 'calculation_month']) // KOL별 월별 수수료
    .index('by_kol_status', ['kol_id', 'status']) // KOL별 상태별 수수료
    .index('by_total_commission', ['total_commission']) // 총 수수료순
    .index('by_payment_date', ['payment_date']) // 지급일순
    .index('by_calculated_at', ['calculated_at']), // 계산일순

  // 🔔 알림 - 시스템 알림 (16개 컬럼)
  notifications: defineTable({
    user_id: v.id('profiles'),
    type: v.union(
      v.literal('system'),
      v.literal('crm_update'),
      v.literal('order_created'),
      v.literal('commission_paid'),
      v.literal('clinical_progress'),
      v.literal('approval_required'),
      v.literal('status_changed'),
      v.literal('reminder')
    ),
    title: v.string(),
    message: v.string(),
    related_type: v.optional(v.string()),
    related_id: v.optional(v.string()),
    action_url: v.optional(v.string()),
    is_read: v.optional(v.boolean()),
    read_at: v.optional(v.number()),
    is_archived: v.optional(v.boolean()),
    archived_at: v.optional(v.number()),
    priority: v.optional(
      v.union(v.literal('low'), v.literal('normal'), v.literal('high'), v.literal('urgent'))
    ),
    metadata: v.optional(v.any()),
    created_at: v.number(),
    expires_at: v.optional(v.number()),
  })
    .index('by_user', ['user_id'])
    .index('by_type', ['type'])
    .index('by_read', ['is_read'])
    .index('by_priority', ['priority'])
    .index('by_created_at', ['created_at'])
    // 🚀 성능 최적화 인덱스
    .index('by_user_read', ['user_id', 'is_read']) // 사용자별 읽기 상태
    .index('by_user_type', ['user_id', 'type']) // 사용자별 알림 타입
    .index('by_user_priority', ['user_id', 'priority']) // 사용자별 우선순위
    .index('by_expires_at', ['expires_at']) // 만료일순
    .index('by_related', ['related_type', 'related_id']), // 관련 항목별

  // 📝 감사 로그 - 변경 사항 추적 (12개 컬럼)
  audit_logs: defineTable({
    table_name: v.string(),
    record_id: v.string(),
    action: v.union(v.literal('INSERT'), v.literal('UPDATE'), v.literal('DELETE')),
    user_id: v.optional(v.id('profiles')),
    user_role: v.optional(v.string()),
    user_ip: v.optional(v.string()),
    old_values: v.optional(v.any()),
    new_values: v.optional(v.any()),
    changed_fields: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    created_at: v.number(),
  })
    .index('by_table', ['table_name'])
    .index('by_user', ['user_id'])
    .index('by_action', ['action'])
    .index('by_record', ['table_name', 'record_id'])
    // 🚀 성능 최적화 인덱스
    .index('by_user_action', ['user_id', 'action']) // 사용자별 액션
    .index('by_table_action', ['table_name', 'action']) // 테이블별 액션
    .index('by_created_at', ['created_at']) // 시간순 정렬
    .index('by_user_created', ['user_id', 'created_at']), // 사용자별 시간순

  // 📁 파일 메타데이터 - 파일 정보 관리 (9개 컬럼)
  file_metadata: defineTable({
    bucket_name: v.string(),
    file_path: v.string(),
    file_name: v.string(),
    file_size: v.optional(v.number()),
    mime_type: v.optional(v.string()),
    uploaded_by: v.optional(v.id('profiles')),
    metadata: v.optional(v.any()),
    created_at: v.number(),
  })
    .index('by_bucket', ['bucket_name'])
    .index('by_uploader', ['uploaded_by'])
    .index('by_file_path', ['file_path'])
    // 🚀 성능 최적화 인덱스
    .index('by_bucket_uploader', ['bucket_name', 'uploaded_by']) // 버킷별 업로더
    .index('by_mime_type', ['mime_type']) // 파일 타입별
    .index('by_file_size', ['file_size']) // 파일 크기순
    .index('by_created_at', ['created_at']), // 업로드일순
});
