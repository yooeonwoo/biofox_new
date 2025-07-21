import { pgTable, serial, varchar, timestamp, integer, boolean, text, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum 정의
export const caseStatusEnum = pgEnum('case_status_enum', ['active', 'completed', 'cancelled']);
export const photoAngleEnum = pgEnum('photo_angle_enum', ['front', 'left', 'right']);

// 사용자 테이블
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("kol"), // admin, kol
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 사용자 관계 정의
export const usersRelations = relations(users, ({ one, many }) => ({
  kol: one(kols, {
    fields: [users.id],
    references: [kols.userId],
  }),
  notifications: many(notifications),
}));

// KOL 테이블
export const kols = pgTable("kols", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }),
  smartPlaceLink: varchar("smart_place_link", { length: 500 }),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// KOL 관계 정의
export const kolsRelations = relations(kols, ({ one, many }) => ({
  user: one(users, {
    fields: [kols.userId],
    references: [users.id],
  }),
  shops: many(shops),
  ownedShops: many(shops, {
    relationName: "ownedShops"
  }),
  dashboardMetrics: many(kolDashboardMetrics),
  totalMonthlySales: many(kolTotalMonthlySales),
}));

// 전문점 테이블
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  region: varchar("region", { length: 100 }),
  smartPlaceLink: varchar("smart_place_link", { length: 500 }),
  isOwnerKol: boolean("is_owner_kol").default(false).notNull(),
  contractDate: timestamp("contract_date"),
  email: varchar("email", { length: 255 }),
  ownerKolId: integer("owner_kol_id").references(() => kols.id),
  isSelfShop: boolean("is_self_shop").default(false).notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 전문점 관계 정의
export const shopsRelations = relations(shops, ({ one, many }) => ({
  kol: one(kols, {
    fields: [shops.kolId],
    references: [kols.id],
  }),
  ownerKol: one(kols, {
    fields: [shops.ownerKolId],
    references: [kols.id],
  }),
  salesMetrics: many(shopSalesMetrics),
}));

// 제품 테이블
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: integer("price").notNull(),
  isDevice: boolean("is_device").default(false).notNull(), // 기기(true) 또는 일반 제품(false)
  description: text("description"),
  image: varchar("image", { length: 500 }),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 제품 관계 정의
export const productsRelations = relations(products, ({ many }) => ({
}));

// 알림 테이블
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: varchar("content", { length: 1000 }).notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 알림 관계 정의
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));



// KOL 대시보드 메트릭 테이블
export const kolDashboardMetrics = pgTable("kol_dashboard_metrics", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  monthlySales: integer("monthly_sales").default(0).notNull(),
  monthlyCommission: integer("monthly_commission").default(0).notNull(),
  activeShopsCount: integer("active_shops_count").default(0).notNull(),
  totalShopsCount: integer("total_shops_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// KOL 대시보드 메트릭 관계 정의
export const kolDashboardMetricsRelations = relations(kolDashboardMetrics, ({ one }) => ({
  kol: one(kols, {
    fields: [kolDashboardMetrics.kolId],
    references: [kols.id],
  }),
}));

// 전문점 매출 메트릭 테이블
export const shopSalesMetrics = pgTable("shop_sales_metrics", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  totalSales: integer("total_sales").default(0).notNull(),
  productSales: integer("product_sales").default(0).notNull(),
  deviceSales: integer("device_sales").default(0).notNull(),
  commission: integer("commission").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 전문점 매출 메트릭 관계 정의
export const shopSalesMetricsRelations = relations(shopSalesMetrics, ({ one }) => ({
  shop: one(shops, {
    fields: [shopSalesMetrics.shopId],
    references: [shops.id],
  }),
}));


// KOL 총 월간 매출 테이블
export const kolTotalMonthlySales = pgTable("kol_total_monthly_sales", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  totalSales: integer("total_sales").default(0).notNull(),
  productSales: integer("product_sales").default(0).notNull(),
  deviceSales: integer("device_sales").default(0).notNull(),
  totalCommission: integer("total_commission").default(0).notNull(),
  totalActiveShops: integer("total_active_shops").default(0).notNull(),
  totalShops: integer("total_shops").default(0).notNull(),
  directSalesRatio: numeric("direct_sales_ratio").default("0").notNull(),
  indirectSalesRatio: numeric("indirect_sales_ratio").default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull()
});

// KOL 총 월간 매출 관계 정의
export const kolTotalMonthlySalesRelations = relations(kolTotalMonthlySales, ({ one }) => ({
  kol: one(kols, {
    fields: [kolTotalMonthlySales.kolId],
    references: [kols.id],
  }),
}));

// 임상 고객 테이블
export const clinicalCustomers = pgTable("clinical_customers", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  birthDate: date("birth_date"),
  memo: text("memo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 임상 케이스 테이블
export const clinicalCases = pgTable("clinical_cases", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  customerId: integer("customer_id").references(() => clinicalCustomers.id),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  caseName: varchar("case_name", { length: 200 }).notNull(),
  concernArea: varchar("concern_area", { length: 100 }),
  treatmentPlan: text("treatment_plan"),
  consentReceived: boolean("consent_received").default(false).notNull(),
  consentDate: date("consent_date"),
  status: caseStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 임상 사진 테이블
export const clinicalPhotos = pgTable("clinical_photos", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => clinicalCases.id).notNull(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  photoDate: date("photo_date").defaultNow().notNull(),
  roundNumber: integer("round_number").notNull(),
  angle: photoAngleEnum("angle").notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 50 }),
  memo: text("memo"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// 회차별 시술 정보 테이블
export const clinicalRoundInfo = pgTable("clinical_round_info", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => clinicalCases.id).notNull(),
  roundNumber: integer("round_number").notNull(),
  treatmentType: varchar("treatment_type", { length: 50 }),
  treatmentDate: date("treatment_date"),
  products: text("products"),
  skinTypes: text("skin_types"),
  age: integer("age"),
  gender: varchar("gender", { length: 10 }),
  memo: text("memo"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// 동의서 파일 정보 테이블
export const clinicalConsentFiles = pgTable("clinical_consent_files", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => clinicalCases.id).notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull()
});

// 관계 정의
export const clinicalCustomersRelations = relations(clinicalCustomers, ({ one, many }) => ({
  kol: one(kols, {
    fields: [clinicalCustomers.kolId],
    references: [kols.id],
  }),
  cases: many(clinicalCases),
}));

export const clinicalCasesRelations = relations(clinicalCases, ({ one, many }) => ({
  kol: one(kols, {
    fields: [clinicalCases.kolId],
    references: [kols.id],
  }),
  customer: one(clinicalCustomers, {
    fields: [clinicalCases.customerId],
    references: [clinicalCustomers.id],
  }),
  photos: many(clinicalPhotos),
  roundInfos: many(clinicalRoundInfo),
  consentFiles: many(clinicalConsentFiles),
}));

export const clinicalPhotosRelations = relations(clinicalPhotos, ({ one }) => ({
  case: one(clinicalCases, {
    fields: [clinicalPhotos.caseId],
    references: [clinicalCases.id],
  }),
  kol: one(kols, {
    fields: [clinicalPhotos.kolId],
    references: [kols.id],
  }),
}));

export const clinicalRoundInfoRelations = relations(clinicalRoundInfo, ({ one }) => ({
  case: one(clinicalCases, {
    fields: [clinicalRoundInfo.caseId],
    references: [clinicalCases.id],
  }),
}));

export const clinicalConsentFilesRelations = relations(clinicalConsentFiles, ({ one }) => ({
  case: one(clinicalCases, {
    fields: [clinicalConsentFiles.caseId],
    references: [clinicalCases.id],
  }),
}));