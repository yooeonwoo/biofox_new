'use client';

import { useRouter } from "next/navigation";
import Image from "next/image";
import { CardContainer, CardBody, CardItem } from "@/components/ui/aceternity/3d-card";
import { TextRevealCard, TextRevealCardTitle, TextRevealCardDescription } from "@/components/ui/aceternity/text-reveal-card";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* 배경 그라데이션 */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-aurora-pink/10 via-aurora-violet/10 to-aurora-blue/10 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* 헤딩 텍스트 */}
        <div className="w-full max-w-4xl mb-12">
          <TextRevealCard
            text="Reverse Aging"
            revealText="BIOFOX"
            className="bg-transparent backdrop-blur-sm"
          >
            <TextRevealCardDescription className="text-center font-extralight">
              The future of aging is here
            </TextRevealCardDescription>
          </TextRevealCard>
        </div>

        <CardContainer className="inter-var">
          <CardBody className="relative group/card dark:hover:shadow-2xl dark:hover:shadow-aurora-violet/[0.1] dark:bg-black/20 dark:border-white/[0.2] border-black/[0.1] w-[90vw] h-[90vw] sm:w-[60vw] sm:h-[60vw] md:w-[40rem] md:h-[40rem] rounded-3xl border backdrop-blur-sm">
            {/* 로고 */}
            <CardItem 
              translateZ="100" 
              className="w-full h-full relative"
            >
              <Image
                src="/images/biofox-logo.svg"
                fill
                className="object-contain p-8 rounded-3xl group-hover/card:scale-105 transition-transform duration-300"
                alt="BIOFOX"
                priority
              />
            </CardItem>

            {/* 로그인 버튼 */}
            <CardItem
              translateZ={120}
              as="button"
              className="absolute bottom-8 right-8 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-sm font-medium backdrop-blur-md border border-white/20 shadow-lg hover:shadow-aurora-violet/30 hover:scale-105 transition-all duration-300"
              onClick={() => router.push('/signin')}
            >
              Log in →
            </CardItem>
          </CardBody>
        </CardContainer>
      </main>
    </div>
  );
} 