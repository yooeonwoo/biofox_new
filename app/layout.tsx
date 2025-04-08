import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

// 환경 변수 체크
const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

if (!hasClerkKeys && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ Clerk 키가 설정되지 않았습니다. .env 파일에 환경 변수를 설정해주세요.');
  console.warn('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY와 CLERK_SECRET_KEY는 Clerk 인증에 필요한 환경 변수입니다.');
}

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BIOFOX KOL",
  description: "KOL 및 전문점 관리 시스템",
  metadataBase: new URL('https://biofox-kol.vercel.app'),
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Clerk 설정이 없는 경우 Clerk Provider를 사용하지 않고 기본 레이아웃만 렌더링
  if (!hasClerkKeys) {
    return (
      <html lang="ko">
        <body className={`${inter.variable} ${notoSansKr.variable}`}>
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mb-4">
            <p>⚠️ 환경 변수가 설정되지 않았습니다. 인증 기능이 비활성화되었습니다.</p>
            <p>Clerk과 Supabase 설정을 위해 .env 파일을 확인해주세요.</p>
          </div>
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider 
      localization={koKR}
      appearance={{
        variables: {
          colorPrimary: '#6D28D9',
          colorTextOnPrimaryBackground: 'white',
        },
        layout: {
          socialButtonsPlacement: 'bottom',
          socialButtonsVariant: 'blockButton', 
        },
        elements: {
          formButtonPrimary: "btn-primary",
          card: "shadow-none bg-transparent",
          headerTitle: "text-xl font-semibold",
          headerSubtitle: "",
          socialButtonsBlockButton: "border border-solid hover:border-[#C0A6E3]",
          socialButtonsBlockButtonText: "text-gray-600",
          formFieldLabel: "text-gray-700",
          formFieldInput: "border-solid focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9]",
          footerActionLink: "text-[#6D28D9] hover:text-[#8B5CF6]",
          identityPreviewText: "text-gray-700",
          identityPreviewEditButton: "text-[#6D28D9] hover:text-[#8B5CF6]",
        },
      }}
      developmentMode={false}
    >
      <html lang="ko">
        <body className={`${inter.variable} ${notoSansKr.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
