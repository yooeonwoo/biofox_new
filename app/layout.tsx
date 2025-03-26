import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    >
      <html lang="ko">
        <body className={`${inter.variable} ${notoSansKr.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
