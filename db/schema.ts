import { pgTable, uuid, varchar, timestamp, text, numeric, integer, boolean, date, pgEnum, jsonb, check } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums 정의
export const userRoleEnum = pgEnum('user_role_enum', ['admin', 'kol', 'ol', 'shop_owner']);
export const approvalStatusEnum = pgEnum('approval_status_enum', ['pending', 'approved', 'rejected']);
export const relationshipTypeEnum = pgEnum('relationship_type_enum', ['direct', 'transferred', 'temporary']);
export const productCategoryEnum = pgEnum('product_category_enum', ['skincare', 'device', 'supplement', 'cosmetic', 'accessory']);
export const orderStatusEnum = pgEnum('order_status_enum', ['pending', 'completed', 'cancelled', 'refunded']);
export const commissionStatusEnum = pgEnum('commission_status_enum', ['calculated', 'adjusted', 'paid', 'cancelled']);
export const clinicalStatusEnum = pgEnum('clinical_status_enum', ['in_progress', 'completed', 'paused', 'cancelled']);
export const consentStatusEnum = pgEnum('consent_status_enum', ['no_consent', 'consented', 'pending']);
export const genderEnum = pgEnum('gender_enum', ['male', 'female', 'other']);
export const subjectTypeEnum = pgEnum('subject_type_enum', ['self', 'customer']);
export const photoTypeEnum = pgEnum('photo_type_enum', ['front', 'left_side', 'right_side']);
export const notificationTypeEnum = pgEnum('notification_type_enum', [
  'system', 'crm_update', 'order_created', 'commission_paid', 
  'clinical_progress', 'approval_required', 'status_changed', 'reminder'
]);
export const priorityEnum = pgEnum('priority_enum', ['low', 'normal', 'high', 'urgent']);
export const auditActionEnum = pgEnum('audit_action_enum', ['INSERT', 'UPDATE', 'DELETE']);
export const ynEnum = pgEnum('yn_enum', ['Y', 'N']);
export const ratingEnum = pgEnum('rating_enum', ['상', '중', '하']);
export const educationStatusEnum = pgEnum('education_status_enum', ['not_started', 'applied', 'in_progress', 'completed', 'cancelled']);
export const tierEnum = pgEnum('tier_enum', ['tier_1_4', 'tier_5_plus']);

/**
 * 사용자 프로필 테이블
 * Auth.users와 1:1 관계를 가지는 프로필 정보
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // auth.users.id와 동일
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default('shop_owner'),
  status: approvalStatusEnum("status").notNull().default('pending'),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }),
  naverPlaceLink: text("naver_place_link"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  totalSubordinates: integer("total_subordinates").default(0),
  activeSubordinates: integer("active_subordinates").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameCheck: check("name_length_check", sql`length(trim(both from ${table.name})) >= 2`),
  shopNameCheck: check("shop_name_length_check", sql`length(trim(both from ${table.shopName})) >= 2`),
  emailCheck: check("email_format_check", sql`${table.email} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  commissionRateCheck: check("commission_rate_range", sql`${table.commissionRate} >= 0 AND ${table.commissionRate} <= 100`),
  // Foreign key constraints
  approvedByFkey: check("approved_by_fkey", sql`${table.approvedBy} IS NULL OR EXISTS (SELECT 1 FROM ${table} WHERE id = ${table.approvedBy})`),
}));

/**
 * 샵 관계 테이블
 * KOL과 샵 간의 부모-자식 관계를 추적하는 핵심 테이블
 */
export const shopRelationships = pgTable("shop_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopOwnerId: uuid("shop_owner_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  parentId: uuid("parent_id").references(() => profiles.id, { onDelete: 'set null' }),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  relationshipType: relationshipTypeEnum("relationship_type").default('direct'),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => profiles.id),
}, (table) => ({
  noSelfRelationship: check("no_self_relationship", sql`${table.shopOwnerId} <> ${table.parentId}`),
  endedRelationshipNotActive: check("ended_relationship_not_active", 
    sql`NOT ((${table.endedAt} IS NOT NULL) AND (${table.isActive} = true))`),
  validRelationshipPeriod: check("valid_relationship_period", 
    sql`(${table.endedAt} IS NULL) OR (${table.endedAt} > ${table.startedAt})`),
}));

/**
 * 제품 테이블
 * 판매 가능한 모든 제품 정보
 */
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).unique(),
  category: productCategoryEnum("category"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  description: text("description"),
  specifications: jsonb("specifications").default({}),
  images: text("images").array(),
  defaultCommissionRate: numeric("default_commission_rate", { precision: 5, scale: 2 }),
  minCommissionRate: numeric("min_commission_rate", { precision: 5, scale: 2 }),
  maxCommissionRate: numeric("max_commission_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => profiles.id),
}, (table) => ({
  nameCheck: check("name_length_check", sql`length(trim(both from ${table.name})) >= 2`),
  priceCheck: check("price_positive", sql`${table.price} >= 0`),
}));

/**
 * 주문 테이블
 * 샵에서 발생한 주문 정보
 */
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").notNull().references(() => profiles.id),
  orderDate: date("order_date").notNull(),
  orderNumber: varchar("order_number", { length: 100 }),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),
  commissionStatus: commissionStatusEnum("commission_status").default('calculated'),
  orderStatus: orderStatusEnum("order_status").default('completed'),
  isSelfShopOrder: boolean("is_self_shop_order").default(false),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
}, (table) => ({
  orderDateCheck: check("order_date_not_future", sql`${table.orderDate} <= CURRENT_DATE`),
  totalAmountCheck: check("total_amount_range", 
    sql`${table.totalAmount} >= -999999999 AND ${table.totalAmount} <= 999999999`),
  commissionRateCheck: check("commission_rate_range", 
    sql`${table.commissionRate} IS NULL OR (${table.commissionRate} >= 0 AND ${table.commissionRate} <= 100)`),
}));

/**
 * 주문 아이템 테이블
 * 주문에 포함된 개별 제품 정보
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid("product_id").references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productCode: varchar("product_code", { length: 100 }),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  itemCommissionRate: numeric("item_commission_rate", { precision: 5, scale: 2 }),
  itemCommissionAmount: numeric("item_commission_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  quantityCheck: check("quantity_not_zero", sql`${table.quantity} <> 0`),
  unitPriceCheck: check("unit_price_positive", sql`${table.unitPrice} >= 0`),
}));

/**
 * 임상 케이스 테이블
 * 고객의 임상 케이스 관리
 */
export const clinicalCases = pgTable("clinical_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").notNull().references(() => profiles.id),
  subjectType: subjectTypeEnum("subject_type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  gender: genderEnum("gender"),
  age: integer("age"),
  status: clinicalStatusEnum("status").notNull().default('in_progress'),
  treatmentItem: varchar("treatment_item", { length: 255 }),
  startDate: date("start_date").default(sql`CURRENT_DATE`),
  endDate: date("end_date"),
  totalSessions: integer("total_sessions").default(0),
  consentStatus: consentStatusEnum("consent_status").notNull().default('pending'),
  consentDate: date("consent_date"),
  marketingConsent: boolean("marketing_consent").default(false),
  notes: text("notes"),
  tags: text("tags").array(),
  customFields: jsonb("custom_fields").default({}),
  photoCount: integer("photo_count").default(0),
  latestSession: integer("latest_session").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => profiles.id),
}, (table) => ({
  ageCheck: check("age_range", sql`${table.age} IS NULL OR (${table.age} > 0 AND ${table.age} < 150)`),
  totalSessionsCheck: check("total_sessions_positive", sql`${table.totalSessions} >= 0`),
}));

/**
 * 임상 사진 테이블
 * 임상 케이스의 진행 사진들
 */
export const clinicalPhotos = pgTable("clinical_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicalCaseId: uuid("clinical_case_id").notNull().references(() => clinicalCases.id, { onDelete: 'cascade' }),
  sessionNumber: integer("session_number").notNull(),
  photoType: photoTypeEnum("photo_type").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  metadata: jsonb("metadata").default({}),
  uploadDate: timestamp("upload_date", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id),
}, (table) => ({
  sessionNumberCheck: check("session_number_range", 
    sql`${table.sessionNumber} >= 0 AND ${table.sessionNumber} <= 999`),
  fileSizeCheck: check("file_size_positive", 
    sql`${table.fileSize} IS NULL OR ${table.fileSize} > 0`),
}));

/**
 * 동의서 파일 테이블
 * 임상 케이스별 동의서 파일 정보
 */
export const consentFiles = pgTable("consent_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  clinicalCaseId: uuid("clinical_case_id").notNull().unique().references(() => clinicalCases.id, { onDelete: 'cascade' }),
  filePath: text("file_path").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 100 }),
  metadata: jsonb("metadata").default({}),
  uploadDate: timestamp("upload_date", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id),
}, (table) => ({
  fileSizeCheck: check("file_size_positive", 
    sql`${table.fileSize} IS NULL OR ${table.fileSize} > 0`),
}));

/**
 * 알림 테이블
 * 시스템 알림 관리
 */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedType: varchar("related_type", { length: 100 }),
  relatedId: uuid("related_id"),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  priority: priorityEnum("priority").default('normal'),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

/**
 * 감사 로그 테이블
 * 데이터 변경 이력 추적
 */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: uuid("record_id").notNull(),
  action: auditActionEnum("action").notNull(),
  userId: uuid("user_id").references(() => profiles.id),
  userRole: varchar("user_role", { length: 50 }),
  userIp: varchar("user_ip", { length: 45 }), // IPv6 지원
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changedFields: text("changed_fields").array(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 파일 메타데이터 테이블
 * 업로드된 파일들의 메타데이터 관리
 */
export const fileMetadata = pgTable("file_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucketName: varchar("bucket_name", { length: 100 }).notNull(),
  filePath: text("file_path").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations 정의
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  approver: one(profiles, {
    fields: [profiles.approvedBy],
    references: [profiles.id],
    relationName: "approver"
  }),
  parentRelationships: many(shopRelationships, {
    relationName: "parentRelationships"
  }),
  childRelationships: many(shopRelationships, {
    relationName: "childRelationships"  
  }),
  orders: many(orders, {
    relationName: "shopOrders"
  }),
  createdOrders: many(orders, {
    relationName: "createdOrders"
  }),
  clinicalCases: many(clinicalCases),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  uploadedFiles: many(fileMetadata),
  createdProducts: many(products),
}));

export const shopRelationshipsRelations = relations(shopRelationships, ({ one }) => ({
  shopOwner: one(profiles, {
    fields: [shopRelationships.shopOwnerId],
    references: [profiles.id],
    relationName: "childRelationships"
  }),
  parent: one(profiles, {
    fields: [shopRelationships.parentId], 
    references: [profiles.id],
    relationName: "parentRelationships"
  }),
  creator: one(profiles, {
    fields: [shopRelationships.createdBy],
    references: [profiles.id],
    relationName: "createdRelationships"
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [products.createdBy],
    references: [profiles.id]
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  shop: one(profiles, {
    fields: [orders.shopId],
    references: [profiles.id],
    relationName: "shopOrders"
  }),
  creator: one(profiles, {
    fields: [orders.createdBy],
    references: [profiles.id],
    relationName: "createdOrders"
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
}));

export const clinicalCasesRelations = relations(clinicalCases, ({ one, many }) => ({
  shop: one(profiles, {
    fields: [clinicalCases.shopId],
    references: [profiles.id]
  }),
  creator: one(profiles, {
    fields: [clinicalCases.createdBy],
    references: [profiles.id]
  }),
  photos: many(clinicalPhotos),
  consentFiles: many(consentFiles),
}));

export const clinicalPhotosRelations = relations(clinicalPhotos, ({ one }) => ({
  clinicalCase: one(clinicalCases, {
    fields: [clinicalPhotos.clinicalCaseId],
    references: [clinicalCases.id]
  }),
  uploader: one(profiles, {
    fields: [clinicalPhotos.uploadedBy],
    references: [profiles.id]
  }),
}));

export const consentFilesRelations = relations(consentFiles, ({ one }) => ({
  clinicalCase: one(clinicalCases, {
    fields: [consentFiles.clinicalCaseId],
    references: [clinicalCases.id]
  }),
  uploader: one(profiles, {
    fields: [consentFiles.uploadedBy],
    references: [profiles.id]
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id]
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [auditLogs.userId],
    references: [profiles.id]
  }),
}));

export const fileMetadataRelations = relations(fileMetadata, ({ one }) => ({
  uploader: one(profiles, {
    fields: [fileMetadata.uploadedBy],
    references: [profiles.id]
  }),
}));