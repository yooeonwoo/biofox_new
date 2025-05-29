import { pgTable, serial, varchar, timestamp, integer, boolean, text, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum 정의
export const activityTypeEnum = pgEnum('activity_type_enum', ['general', 'visit']);

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
  salesActivities: many(salesActivities),
  productSalesMetrics: many(productSalesMetrics),
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
  salesActivities: many(salesActivities),
  productSalesMetrics: many(productSalesMetrics),
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
  productSalesMetrics: many(productSalesMetrics),
  totalSalesStats: many(productTotalSalesStats),
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

// 영업 활동 테이블
export const salesActivities = pgTable("sales_activities", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  shopId: integer("shop_id").references(() => shops.id),
  activityDate: date("activity_date").defaultNow().notNull(),
  content: text("content").notNull(),
  activityType: activityTypeEnum("activity_type").default("general"),
  shopName: text("shop_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 영업 활동 관계 정의
export const salesActivitiesRelations = relations(salesActivities, ({ one }) => ({
  kol: one(kols, {
    fields: [salesActivities.kolId],
    references: [kols.id],
  }),
  shop: one(shops, {
    fields: [salesActivities.shopId],
    references: [shops.id],
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

// 제품 매출 메트릭 테이블
export const productSalesMetrics = pgTable("product_sales_metrics", {
  id: serial("id").primaryKey(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  shopId: integer("shop_id").references(() => shops.id),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  quantity: integer("quantity").default(0).notNull(),
  salesAmount: integer("sales_amount").default(0).notNull(),
  salesRatio: numeric("sales_ratio").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 제품 매출 메트릭 관계 정의
export const productSalesMetricsRelations = relations(productSalesMetrics, ({ one }) => ({
  kol: one(kols, {
    fields: [productSalesMetrics.kolId],
    references: [kols.id],
  }),
  product: one(products, {
    fields: [productSalesMetrics.productId],
    references: [products.id],
  }),
  shop: one(shops, {
    fields: [productSalesMetrics.shopId],
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

// 제품 총 매출 통계 테이블
export const productTotalSalesStats = pgTable("product_total_sales_stats", {
  id: serial("id").primaryKey(),
  yearMonth: varchar("year_month", { length: 7 }).notNull(), // YYYY-MM 형식
  productId: integer("product_id").references(() => products.id).notNull(),
  totalSalesAmount: integer("total_sales_amount").default(0).notNull(),
  salesRatio: numeric("sales_ratio").default("0").notNull(),
  salesGrowthRate: numeric("sales_growth_rate").default("0").notNull(),
  orderCount: integer("order_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull()
});

// 제품 총 매출 통계 관계 정의
export const productTotalSalesStatsRelations = relations(productTotalSalesStats, ({ one }) => ({
  product: one(products, {
    fields: [productTotalSalesStats.productId],
    references: [products.id],
  }),
}));

 