import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "BIOFOX KOL",
  description: "KOL 및 전문점 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{
      variables: {
        colorPrimary: '#6D28D9',
        colorTextOnPrimaryBackground: 'white',
      },
      layout: {
        socialButtonsPlacement: 'bottom',
        socialButtonsVariant: 'blockButton', 
      },
    }}>
      <html lang="ko">
        <body className={`${inter.variable} ${notoSansKr.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
