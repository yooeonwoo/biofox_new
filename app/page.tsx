'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardContainer, CardBody, CardItem } from '@/components/ui/aceternity/3d-card';
import Aurora from '@/components/ui/Aurora';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useSimpleAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트에서만 렌더링하도록 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // 서버 사이드 렌더링과 하이드레이션 미스매치 방지
  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Aurora 배경 효과 */}
      <Aurora
        colorStops={['#E9D1F2', '#C9E6F0', '#F5F3E4']}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />

      {/* 메인 컨텐츠 */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <CardContainer className="inter-var">
          <CardBody className="group/card dark:hover:shadow-aurora-violet/[0.1] relative flex h-[30rem] w-[85vw] flex-col items-center justify-center rounded-3xl border border-black/[0.8] backdrop-blur-sm dark:border-black/[0.8] dark:bg-white/[0.08] dark:hover:shadow-2xl sm:w-[55vw] md:w-[32rem]">
            {/* 헤딩 텍스트 */}
            <CardItem
              translateZ={80}
              className="group-hover/card:text-glow-white text-center text-6xl font-bold tracking-wider text-white/90 transition-all duration-500 ease-out group-hover/card:scale-105 group-hover/card:text-white md:text-7xl"
            >
              BIOFOX
            </CardItem>

            {/* 로그인 버튼 */}
            <CardItem translateZ={120} className="mt-8">
              <Link
                href="/signin"
                className="rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                로그인
              </Link>
            </CardItem>
          </CardBody>
        </CardContainer>
      </main>
    </div>
  );
}
