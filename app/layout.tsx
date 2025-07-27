import type { Metadata } from 'next';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { ConvexClientProvider } from '@/components/providers/ConvexProvider'; // ✅ 임시로 다시 추가 (일부 컴포넌트가 여전히 사용)
import { SupabaseAuthProvider } from '@/providers/supabase-auth-provider';
import { Toaster as SonnerToaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BIOFOX',
  description: 'KOL 및 전문점 관리 시스템',
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
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${notoSansKr.variable}`}>
        {/* ✅ ConvexProvider를 다시 추가 - 일부 컴포넌트(CustomerAddModal 등)가 여전히 사용 */}
        <ConvexClientProvider>
          <ReactQueryProvider>
            <SupabaseAuthProvider>
              {children}
              <Toaster />
              <SonnerToaster position="top-center" duration={3000} closeButton />
            </SupabaseAuthProvider>
          </ReactQueryProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
