import { pgTable, serial, varchar, timestamp, integer, boolean, foreignKey, text, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 사용자 테이블
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("kol"), // 본사관리자, kol
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
  commissions: many(commissions),
  monthlySummaries: many(kolMonthlySummary),
  monthlySales: many(monthlySales),
  childKols: many(kolHierarchy, { relationName: "parentKols" }),
  parentKols: many(kolHierarchy, { relationName: "childKols" }),
}));

// 전문점 테이블
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }),
  smartPlaceLink: varchar("smart_place_link", { length: 500 }),
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
  orders: many(orders),
  monthlySales: many(monthlySales),
  productRatios: many(productSalesRatios),
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
  orderItems: many(orderItems),
  salesRatios: many(productSalesRatios),
}));

// 주문 테이블
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 255 }).notNull().unique(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  paymentMethod: varchar("payment_method", { length: 100 }),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 주문 관계 정의
export const ordersRelations = relations(orders, ({ one, many }) => ({
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  orderItems: many(orderItems),
  commission: one(commissions, {
    fields: [orders.id],
    references: [commissions.orderId],
  }),
}));

// 주문 상세 테이블
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 주문 상세 관계 정의
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// 수당 테이블
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  amount: integer("amount").notNull(),
  settled: boolean("settled").default(false).notNull(),
  settledDate: timestamp("settled_date"),
  settledNote: varchar("settled_note", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 수당 관계 정의
export const commissionsRelations = relations(commissions, ({ one }) => ({
  kol: one(kols, {
    fields: [commissions.kolId],
    references: [kols.id],
  }),
  order: one(orders, {
    fields: [commissions.orderId],
    references: [orders.id],
  }),
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

// 월별 매출 및 수당 관리 테이블
export const monthlySales = pgTable("monthly_sales", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  productSales: integer("product_sales").notNull().default(0), // 제품 매출 합계 (기기 제외)
  deviceSales: integer("device_sales").notNull().default(0), // 기기 매출 합계
  totalSales: integer("total_sales").notNull().default(0), // 총 매출 (제품+기기)
  commission: integer("commission").notNull().default(0), // 수당 합계
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 월별 매출 관계 정의
export const monthlySalesRelations = relations(monthlySales, ({ one }) => ({
  kol: one(kols, {
    fields: [monthlySales.kolId],
    references: [kols.id],
  }),
  shop: one(shops, {
    fields: [monthlySales.shopId],
    references: [shops.id],
  }),
}));

// 제품별 매출 비율 테이블
export const productSalesRatios = pgTable("product_sales_ratios", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  productId: integer("product_id").references(() => products.id).notNull(),
  salesAmount: integer("sales_amount").notNull().default(0), // 제품별 매출 합계
  salesRatio: decimal("sales_ratio", { precision: 5, scale: 4 }).notNull().default("0"), // 해당 월 제품별 매출 비율 (0~1)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 제품별 매출 비율 관계 정의
export const productSalesRatiosRelations = relations(productSalesRatios, ({ one }) => ({
  shop: one(shops, {
    fields: [productSalesRatios.shopId],
    references: [shops.id],
  }),
  kol: one(kols, {
    fields: [productSalesRatios.kolId],
    references: [kols.id],
  }),
  product: one(products, {
    fields: [productSalesRatios.productId],
    references: [products.id],
  }),
}));

// KOL 계층 구조 테이블
export const kolHierarchy = pgTable("kol_hierarchy", {
  id: serial("id").primaryKey(),
  parentKolId: integer("parent_kol_id").references(() => kols.id).notNull(),
  childKolId: integer("child_kol_id").references(() => kols.id).notNull(),
  childStartMonth: varchar("child_start_month", { length: 7 }).notNull(), // YYYY-MM 형식
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// KOL 계층 구조 관계 정의
export const kolHierarchyRelations = relations(kolHierarchy, ({ one }) => ({
  parentKol: one(kols, {
    fields: [kolHierarchy.parentKolId],
    references: [kols.id],
    relationName: "parentKols",
  }),
  childKol: one(kols, {
    fields: [kolHierarchy.childKolId],
    references: [kols.id],
    relationName: "childKols",
  }),
}));

// KOL 월별 요약 테이블
export const kolMonthlySummary = pgTable("kol_monthly_summary", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  monthlySales: integer("monthly_sales").notNull().default(0), // 당월 매출
  monthlyCommission: integer("monthly_commission").notNull().default(0), // 당월 수당
  avgMonthlySales: decimal("avg_monthly_sales", { precision: 12, scale: 2 }).notNull().default("0"), // 월평균 매출 (최근 3개월 기준)
  cumulativeCommission: integer("cumulative_commission").notNull().default(0), // 누적 수당
  previousMonthSales: integer("previous_month_sales").notNull().default(0), // 전월 매출
  previousMonthCommission: integer("previous_month_commission").notNull().default(0), // 전월 수당
  activeShopsCount: integer("active_shops_count").notNull().default(0), // 당월 주문이 있는 전문점 수
  totalShopsCount: integer("total_shops_count").notNull().default(0), // 소속된 전체 전문점 수
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// KOL 월별 요약 관계 정의
export const kolMonthlySummaryRelations = relations(kolMonthlySummary, ({ one }) => ({
  kol: one(kols, {
    fields: [kolMonthlySummary.kolId],
    references: [kols.id],
  }),
}));

// 관리자 대시보드용 전체 KOL 통계 테이블
export const adminDashboardStats = pgTable("admin_dashboard_stats", {
  id: serial("id").primaryKey(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  totalKolsCount: integer("total_kols_count").notNull().default(0), // 전체 KOL 수
  totalShopsCount: integer("total_shops_count").notNull().default(0), // 전체 전문점 수
  activeKolsCount: integer("active_kols_count").notNull().default(0), // 활동 중인 KOL 수 
  activeShopsCount: integer("active_shops_count").notNull().default(0), // 활동 중인 전문점 수
  totalSales: integer("total_sales").notNull().default(0), // 전체 매출 합계
  productSales: integer("product_sales").notNull().default(0), // 제품 매출 합계
  deviceSales: integer("device_sales").notNull().default(0), // 기기 매출 합계
  totalCommission: integer("total_commission").notNull().default(0), // 전체 수당 합계
  previousMonthSales: integer("previous_month_sales").notNull().default(0), // 전월 전체 매출
  previousMonthCommission: integer("previous_month_commission").notNull().default(0), // 전월 전체 수당
  salesGrowthRate: decimal("sales_growth_rate", { precision: 5, scale: 2 }).notNull().default("0"), // 매출 성장률 (%)
  commissionGrowthRate: decimal("commission_growth_rate", { precision: 5, scale: 2 }).notNull().default("0"), // 수당 성장률 (%)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 관리자 통계를 위한 KOL별 월간 매출 합계 테이블
export const kolTotalMonthlySales = pgTable("kol_total_monthly_sales", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  totalSales: integer("total_sales").notNull().default(0), // 해당 KOL의 모든 전문점 매출 합계
  productSales: integer("product_sales").notNull().default(0), // 제품 매출 합계
  deviceSales: integer("device_sales").notNull().default(0), // 기기 매출 합계
  totalCommission: integer("total_commission").notNull().default(0), // 수당 합계
  totalActiveShops: integer("total_active_shops").notNull().default(0), // 활동 중인 전문점 수
  totalShops: integer("total_shops").notNull().default(0), // 전체 전문점 수
  directSalesRatio: decimal("direct_sales_ratio", { precision: 5, scale: 2 }).notNull().default("0"), // 직접 판매 비율 (%)
  indirectSalesRatio: decimal("indirect_sales_ratio", { precision: 5, scale: 2 }).notNull().default("0"), // 간접 판매 비율 (%)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// KOL별 월간 매출 합계 관계 정의
export const kolTotalMonthlySalesRelations = relations(kolTotalMonthlySales, ({ one }) => ({
  kol: one(kols, {
    fields: [kolTotalMonthlySales.kolId],
    references: [kols.id],
  }),
}));

// 전체 제품별 매출 비율 통계 테이블
export const productTotalSalesStats = pgTable("product_total_sales_stats", {
  id: serial("id").primaryKey(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM
  productId: integer("product_id").references(() => products.id).notNull(),
  totalSalesAmount: integer("total_sales_amount").notNull().default(0), // 제품별 전체 매출액
  salesRatio: decimal("sales_ratio", { precision: 5, scale: 4 }).notNull().default("0"), // 제품별 매출 비율
  salesGrowthRate: decimal("sales_growth_rate", { precision: 5, scale: 2 }).notNull().default("0"), // 전월 대비 성장률
  orderCount: integer("order_count").notNull().default(0), // 주문 수량
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 제품별 매출 비율 관계 정의
export const productTotalSalesStatsRelations = relations(productTotalSalesStats, ({ one }) => ({
  product: one(products, {
    fields: [productTotalSalesStats.productId],
    references: [products.id],
  }),
}));

// 관리자 권한 관리 테이블 (관리자가 특정 KOL 그룹만 관리하도록 설정)
export const adminKolAccess = pgTable("admin_kol_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // 관리자 사용자 ID
  kolId: integer("kol_id").references(() => kols.id).notNull(), // 접근 가능한 KOL ID
  accessLevel: varchar("access_level", { length: 50 }).notNull().default("view"), // view, edit, full_access 등
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 관리자 KOL 접근 권한 관계 정의
export const adminKolAccessRelations = relations(adminKolAccess, ({ one }) => ({
  user: one(users, {
    fields: [adminKolAccess.userId],
    references: [users.id],
  }),
  kol: one(kols, {
    fields: [adminKolAccess.kolId],
    references: [kols.id],
  }),
})); 