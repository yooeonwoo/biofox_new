import { pgTable, serial, varchar, timestamp, integer, boolean, text, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { kols } from "../schema";

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

// 임상 케이스 상태 enum
export const caseStatusEnum = pgEnum('case_status_enum', ['active', 'completed', 'cancelled']);

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

// 사진 각도 enum
export const photoAngleEnum = pgEnum('photo_angle_enum', ['front', 'left', 'right']);

// 임상 사진 테이블
export const clinicalPhotos = pgTable("clinical_photos", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => clinicalCases.id).notNull(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  photoDate: date("photo_date").defaultNow().notNull(),
  roundNumber: integer("round_number").notNull(), // 회차 번호
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
  products: text("products"), // JSON 형식으로 저장
  skinTypes: text("skin_types"), // JSON 형식으로 저장
  memo: text("memo"),
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