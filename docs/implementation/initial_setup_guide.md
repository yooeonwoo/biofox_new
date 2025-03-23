# BIOFOX KOL 프로젝트 초기 설정 가이드

본 가이드는 BIOFOX KOL 프로젝트의 초기 설정 과정을 상세히 설명합니다. 프로젝트 설정, 필요한 패키지 설치, 폴더 구조 생성 및 주요 설정 파일 작성 등에 대한 지침을 제공합니다.

## 1. 프로젝트 생성 및 기본 설정

### 1.1 Next.js 프로젝트 생성

```bash
# 프로젝트 디렉토리 생성 및 이동
mkdir BIOFOX-KOL
cd BIOFOX-KOL

# Next.js 프로젝트 초기화
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir
```

프로젝트 생성 질문에 답하기:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No (kolrules에 따라)
- App Router: Yes
- Import alias: 기본값 (사용자 선택)

### 1.2 기본 패키지 설치

```bash
# 필수 패키지 설치
npm install @clerk/nextjs @supabase/supabase-js drizzle-orm zod lucide-react @hookform/resolvers react-hook-form sonner
npm install -D drizzle-kit @types/node
```

### 1.3 ShadCN UI 설치

```bash
# ShadCN 설치
npx shadcn-ui@latest init
```

ShadCN 설정 질문에 답하기:
- 스타일 선택: Default (또는 요구사항에 맞게)
- 기본 CSS 변수 스타일: Yes
- 글로벌 CSS는 app/globals.css: Yes
- 컴포넌트 디렉토리: components/ui
- 유틸리티 함수 디렉토리: lib/utils
- React Server Components: Yes
- 컴포넌트 사용에 대한 주석 포함: Yes
- 테일윈드 CSS 클래스 정렬: Yes

## 2. 폴더 구조 설정

kolrules.mdc에 명시된 폴더 구조를 생성합니다.

```bash
# 기본 폴더 구조 생성
mkdir -p app/api
mkdir -p app/dashboard
mkdir -p app/profile
mkdir -p components/layout
mkdir -p db
mkdir -p drizzle
mkdir -p public
mkdir -p types
mkdir -p utils
```

## 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```bash
touch .env
```

`.env` 파일 내용:

```
# Clerk (인증)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase (데이터베이스)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cafe24 API
CAFE24_MALL_ID=
CAFE24_CLIENT_ID=
CAFE24_CLIENT_SECRET=
CAFE24_REDIRECT_URI=

# n8n
N8N_WEBHOOK_URL=
```

## 4. Clerk 인증 설정

### 4.1 Clerk 미들웨어 설정

루트 디렉토리에 `middleware.ts` 파일을 생성합니다.

```typescript
import { authMiddleware, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook(.*)"],
  async afterAuth(auth, req) {
    // 인증 후 처리 로직 (화이트리스트 이메일 확인 등)
    if (auth.isPublicRoute) {
      return NextResponse.next();
    }

    // 사용자가 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!auth.userId) {
      const signInUrl = new URL('/signin', req.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### 4.2 Clerk 프로바이더 설정

`app/layout.tsx` 파일을 수정합니다.

```typescript
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BIOFOX KOL",
  description: "KOL 매출 및 수당 관리 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="ko">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## 5. 데이터베이스 설정 (Drizzle + Supabase)

### 5.1 Drizzle 설정 파일

루트 디렉토리에 `drizzle.config.ts` 파일을 생성합니다.

```typescript
import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "",
  }
} satisfies Config;
```

### 5.2 데이터베이스 스키마 정의

`db/schema.ts` 파일을 생성합니다.

```typescript
import { pgTable, serial, varchar, timestamp, integer, boolean, foreignKey } from "drizzle-orm/pg-core";

// 사용자 테이블
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull().default("kol"), // 본사관리자, kol
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// KOL 테이블
export const kols = pgTable("kols", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 전문점 테이블
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  kolId: integer("kol_id").references(() => kols.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 제품 테이블
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: integer("price").notNull(),
  isDevice: boolean("is_device").default(false).notNull(), // 기기(true) 또는 일반 제품(false)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// 주문 테이블
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 255 }).notNull().unique(),
  shopId: integer("shop_id").references(() => shops.id).notNull(),
  totalAmount: integer("total_amount").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

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

// 화이트리스트 이메일 테이블
export const whitelistedEmails = pgTable("whitelisted_emails", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull().default("kol"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

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
```

### 5.3 데이터베이스 연결

`db/index.ts` 파일을 생성합니다.

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// PostgreSQL 클라이언트 설정
const client = postgres(process.env.DATABASE_URL || "");

// Drizzle ORM 인스턴스 생성
export const db = drizzle(client, { schema });
```

## 6. 유틸리티 함수 설정

### 6.1 기본 유틸리티 함수

`utils/index.ts` 파일을 생성합니다.

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// tailwind 클래스 병합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 화폐 포맷 유틸리티
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

// 날짜 포맷 유틸리티
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

### 6.2 Supabase 클라이언트 설정

`utils/supabase.ts` 파일을 생성합니다.

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 측 서비스 롤 클라이언트 (더 높은 권한)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

## 7. 타입 정의

`types/index.ts` 파일을 생성합니다.

```typescript
// 사용자 인터페이스
export interface IUser {
  id: string;
  email: string;
  role: "admin" | "kol";
}

// KOL 인터페이스
export interface IKOL {
  id: string;
  userId: string;
  name: string;
  shopName: string;
  phone?: string;
  shops?: IShop[];
}

// 전문점 인터페이스
export interface IShop {
  id: string;
  name: string;
  ownerName: string;
  kolId: string;
}

// 제품 인터페이스
export interface IProduct {
  id: string;
  name: string;
  price: number;
  isDevice: boolean;
}

// 주문 인터페이스
export interface IOrder {
  id: string;
  orderNumber: string;
  shopId: string;
  totalAmount: number;
  orderDate: Date;
  items?: IOrderItem[];
}

// 주문 상세 인터페이스
export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: IProduct;
}

// 수당 인터페이스
export interface ICommission {
  id: string;
  kolId: string;
  orderId: string;
  amount: number;
  settled: boolean;
  settledDate?: Date;
  settledNote?: string;
}

// 화이트리스트 이메일 인터페이스
export interface IWhitelistedEmail {
  id: string;
  email: string;
  role: "admin" | "kol";
}

// 알림 인터페이스
export interface INotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: Date;
}
```

## 8. 컴포넌트 설정

### 8.1 레이아웃 컴포넌트

`components/layout/header.tsx` 파일을 생성합니다.

```tsx
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold text-purple-700">
          BIOFOX KOL
        </Link>
        <nav className="space-x-6">
          <Link href="/dashboard" className="text-gray-700 hover:text-purple-700">
            대시보드
          </Link>
          <Link href="/profile" className="text-gray-700 hover:text-purple-700">
            프로필
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
```

`components/layout/footer.tsx` 파일을 생성합니다.

```tsx
export default function Footer() {
  return (
    <footer className="border-t bg-white py-6">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} BIOFOX KOL. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

### 8.2 기본 ShadCN UI 컴포넌트 설치

필요한 기본 UI 컴포넌트를 설치합니다.

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add dialog
```

## 9. 기본 페이지 설정

### 9.1 루트 페이지

`app/page.tsx` 파일을 수정합니다.

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-purple-100 to-purple-50">
      <div className="container flex max-w-4xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-purple-900 sm:text-6xl">
          BIOFOX KOL
        </h1>
        <p className="text-xl text-gray-600">
          KOL 및 전문점 매출·수당을 실시간으로 관리하고 조회하는 시스템
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="bg-purple-700 hover:bg-purple-800">
            <Link href="/signin">로그인</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-purple-700 text-purple-700 hover:bg-purple-50">
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
```

### 9.2 대시보드 페이지

`app/dashboard/page.tsx` 파일을 생성합니다.

```tsx
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = auth();
  
  if (!userId) {
    redirect("/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">대시보드</h1>
      <p>대시보드 콘텐츠가 여기에 표시됩니다.</p>
    </div>
  );
}
```

`app/dashboard/layout.tsx` 파일을 생성합니다.

```tsx
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">{children}</main>
      <Footer />
    </div>
  );
}
```

## 10. 테마 및 스타일 설정

`app/globals.css` 파일을 수정하여 디자인.md에 정의된 컬러 팔레트를 반영합니다.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    
    /* 브랜드 컬러: 보라색 계열 */
    --primary: 270 80% 50%; /* Deep Purple */
    --primary-foreground: 0 0% 100%;
    
    --secondary: 267 59% 77%; /* Light Purple */
    --secondary-foreground: 0 0% 9%;
    
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;
    
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220 8.9% 46.1%;
    
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 270 80% 50%; /* 기본 보라색 */
    
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    
    --primary: 270 80% 40%; /* 더 어두운 보라색 */
    --primary-foreground: 0 0% 100%;
    
    --secondary: 267 59% 67%;
    --secondary-foreground: 0 0% 9%;
    
    --card: 224 71.4% 4.1%;
    --card-foreground: 210 20% 98%;
    
    --popover: 224 71.4% 4.1%;
    --popover-foreground: 210 20% 98%;
    
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 270 80% 40%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* 오로라 그라데이션 효과 */
.aurora-gradient {
  background: linear-gradient(135deg, #FF8AE2, #8B5CF6, #67E8F9);
  background-size: 200% 200%;
  animation: aurora 15s ease infinite;
}

@keyframes aurora {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

## 11. 테일윈드 설정

`tailwind.config.ts` 파일을 수정하여 디자인 가이드에 맞는 설정을 추가합니다.

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 브랜드 컬러 추가
        'deep-purple': '#6D28D9',
        'light-purple': '#C0A6E3',
        'aura-silver': '#D7D7D7',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

## 12. 배포 설정

### 12.1 Vercel 배포 설정

루트 디렉토리에 `vercel.json` 파일을 생성합니다.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "devCommand": "npm run dev",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "crons": []
}
```

### 12.2 GitHub Actions 워크플로우

`.github/workflows/ci.yml` 파일을 생성합니다.

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
```

## 13. Git 설정

### 13.1 .gitignore 설정

`.gitignore` 파일을 수정합니다.

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env files
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# drizzle
.drizzle
```

### 13.2 Git 초기화

```bash
# Git 저장소 초기화
git init

# 초기 커밋
git add .
git commit -m "Initial project setup"

# GitHub 원격 저장소 연결 (이미 생성된 경우)
git remote add origin https://github.com/username/BIOFOX-KOL.git
git push -u origin main
```

## 14. 결론

이 초기 설정 가이드에 따라 BIOFOX KOL 프로젝트의 기본 구조를 설정했습니다. 이제 구현 계획에 따라 각 기능을 개발해 나갈 수 있습니다. 

다음 단계는 다음과 같습니다:

1. 인증 시스템 구현 (화이트리스트 이메일 정책)
2. KOL 및 전문점 관리 기능 구현
3. Cafe24 API 연동 및 n8n 워크플로우 설정
4. 대시보드 및 수당 계산 로직 개발
5. 정산 기능 및 알림 시스템 구축

이 초기 설정은 KOL 프로젝트의 기반이 되므로, 필요에 따라 추가적인 설정이나 조정을 할 수 있습니다. 