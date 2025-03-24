CREATE TABLE "admin_dashboard_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"total_kols_count" integer DEFAULT 0 NOT NULL,
	"total_shops_count" integer DEFAULT 0 NOT NULL,
	"active_kols_count" integer DEFAULT 0 NOT NULL,
	"active_shops_count" integer DEFAULT 0 NOT NULL,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"product_sales" integer DEFAULT 0 NOT NULL,
	"device_sales" integer DEFAULT 0 NOT NULL,
	"total_commission" integer DEFAULT 0 NOT NULL,
	"previous_month_sales" integer DEFAULT 0 NOT NULL,
	"previous_month_commission" integer DEFAULT 0 NOT NULL,
	"sales_growth_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"commission_growth_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_kol_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"kol_id" integer NOT NULL,
	"access_level" varchar(50) DEFAULT 'view' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kol_hierarchy" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_kol_id" integer NOT NULL,
	"child_kol_id" integer NOT NULL,
	"child_start_month" varchar(7) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kol_monthly_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"kol_id" integer NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"monthly_sales" integer DEFAULT 0 NOT NULL,
	"monthly_commission" integer DEFAULT 0 NOT NULL,
	"avg_monthly_sales" numeric(12, 2) DEFAULT '0' NOT NULL,
	"cumulative_commission" integer DEFAULT 0 NOT NULL,
	"previous_month_sales" integer DEFAULT 0 NOT NULL,
	"previous_month_commission" integer DEFAULT 0 NOT NULL,
	"active_shops_count" integer DEFAULT 0 NOT NULL,
	"total_shops_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kol_total_monthly_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"kol_id" integer NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"product_sales" integer DEFAULT 0 NOT NULL,
	"device_sales" integer DEFAULT 0 NOT NULL,
	"total_commission" integer DEFAULT 0 NOT NULL,
	"total_active_shops" integer DEFAULT 0 NOT NULL,
	"total_shops" integer DEFAULT 0 NOT NULL,
	"direct_sales_ratio" numeric(5, 2) DEFAULT '0' NOT NULL,
	"indirect_sales_ratio" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"kol_id" integer NOT NULL,
	"shop_id" integer NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"product_sales" integer DEFAULT 0 NOT NULL,
	"device_sales" integer DEFAULT 0 NOT NULL,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"commission" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_sales_ratios" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"kol_id" integer NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"product_id" integer NOT NULL,
	"sales_amount" integer DEFAULT 0 NOT NULL,
	"sales_ratio" numeric(5, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_total_sales_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"product_id" integer NOT NULL,
	"total_sales_amount" integer DEFAULT 0 NOT NULL,
	"sales_ratio" numeric(5, 4) DEFAULT '0' NOT NULL,
	"sales_growth_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kols" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "kols" ADD COLUMN "smart_place_link" varchar(500);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "smart_place_link" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "admin_kol_access" ADD CONSTRAINT "admin_kol_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_kol_access" ADD CONSTRAINT "admin_kol_access_kol_id_kols_id_fk" FOREIGN KEY ("kol_id") REFERENCES "public"."kols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kol_hierarchy" ADD CONSTRAINT "kol_hierarchy_parent_kol_id_kols_id_fk" FOREIGN KEY ("parent_kol_id") REFERENCES "public"."kols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kol_hierarchy" ADD CONSTRAINT "kol_hierarchy_child_kol_id_kols_id_fk" FOREIGN KEY ("child_kol_id") REFERENCES "public"."kols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kol_monthly_summary" ADD CONSTRAINT "kol_monthly_summary_kol_id_kols_id_fk" FOREIGN KEY ("kol_id") REFERENCES "public"."kols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kol_total_monthly_sales" ADD CONSTRAINT "kol_total_monthly_sales_kol_id_kols_id_fk" FOREIGN KEY ("kol_id") REFERENCES "public"."kols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_sales" ADD CONSTRAINT "monthly_sales_kol_id_kols_id_fk" FOREIGN KEY ("kol_id") REFERENCES "public"."kols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_sales" ADD CONSTRAINT "monthly_sales_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sales_ratios" ADD CONSTRAINT "product_sales_ratios_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sales_ratios" ADD CONSTRAINT "product_sales_ratios_kol_id_kols_id_fk" FOREIGN KEY ("kol_id") REFERENCES "public"."kols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sales_ratios" ADD CONSTRAINT "product_sales_ratios_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_total_sales_stats" ADD CONSTRAINT "product_total_sales_stats_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kols" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "kols" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "kols" DROP COLUMN "profile_image";--> statement-breakpoint
ALTER TABLE "kols" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "kols" DROP COLUMN "bank_name";--> statement-breakpoint
ALTER TABLE "kols" DROP COLUMN "account_number";--> statement-breakpoint
ALTER TABLE "kols" DROP COLUMN "account_holder";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "business_number";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "operating_hours";