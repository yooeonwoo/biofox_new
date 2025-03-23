import { pgTable, serial, varchar, timestamp, integer, boolean, foreignKey, text } from "drizzle-orm/pg-core";
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