'use client';

import { useRouter } from "next/navigation";
import Image from "next/image";
import { CardContainer, CardBody, CardItem } from "@/components/ui/aceternity/3d-card";
import { TextRevealCard, TextRevealCardTitle, TextRevealCardDescription } from "@/components/ui/aceternity/text-reveal-card";
import Aurora from "@/components/ui/Aurora";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Aurora 배경 효과 */}
      <Aurora
        colorStops={["#E9D1F2", "#C9E6F0", "#F5F3E4"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />

      {/* 메인 컨텐츠 */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <CardContainer className="inter-var">
          <CardBody className="relative group/card dark:hover:shadow-2xl dark:hover:shadow-aurora-violet/[0.1] dark:bg-white/[0.08] dark:border-black/[0.8] border-black/[0.8] w-[85vw] h-[110vw] sm:w-[55vw] sm:h-[65vw] md:w-[32rem] md:h-[38rem] rounded-3xl border backdrop-blur-sm flex flex-col items-center justify-center">
            {/* 헤딩 텍스트 */}
            <CardItem
              translateZ={80}
              className="absolute top-12 sm:top-10 md:top-12 w-full text-center text-5xl sm:text-5xl md:text-6xl font-bold text-white/90 tracking-wider group-hover/card:scale-105 group-hover/card:text-white group-hover/card:text-glow-white transition-all duration-500 ease-out"
            >
              BIOFOX
            </CardItem>

            {/* 로고 */}
            <CardItem 
              translateZ={100} 
              className="w-full h-full relative flex items-center justify-center"
            >
              <Image
                src="/images/biofox-logo.svg"
                fill
                className="object-contain p-8 md:p-10 pt-28 sm:pt-24 md:pt-28 rounded-3xl group-hover/card:scale-110 transition-all duration-500 ease-out"
                alt="BIOFOX"
                priority
              />
            </CardItem>

            {/* 로그인 버튼 */}
            <CardItem
              translateZ={120}
              as="button"
              className="absolute bottom-12 sm:bottom-10 md:bottom-12 right-8 sm:right-10 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-sm sm:text-base font-medium backdrop-blur-md border border-white/20 shadow-lg hover:shadow-aurora-violet/30 hover:scale-105 transition-all duration-300"
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