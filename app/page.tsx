'use client';

import Link from 'next/link';
import { CardContainer, CardBody, CardItem } from '@/components/ui/aceternity/3d-card';
import { AuthButton } from '@/components/auth/AuthButton';
import Aurora from '@/components/ui/Aurora';

export default function Home() {
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

            {/* 인증 버튼 */}
            <CardItem translateZ={120} className="mt-8">
              <div className="flex items-center">
                <AuthButton />
              </div>
            </CardItem>
          </CardBody>
        </CardContainer>
      </main>
    </div>
  );
}
