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
          <CardBody className="relative group/card dark:hover:shadow-2xl dark:hover:shadow-aurora-violet/[0.1] dark:bg-white/[0.08] dark:border-black/[0.8] border-black/[0.8] w-[85vw] sm:w-[55vw] md:w-[32rem] h-[25rem] rounded-3xl border backdrop-blur-sm flex flex-col items-center justify-center">
            {/* 헤딩 텍스트 */}
            <CardItem
              translateZ={80}
              className="text-center text-6xl md:text-7xl font-bold text-white/90 tracking-wider group-hover/card:scale-105 group-hover/card:text-white group-hover/card:text-glow-white transition-all duration-500 ease-out"
            >
              BIOFOX
            </CardItem>
            
            {/* 서브 텍스트 */}
            <CardItem
              translateZ={60}
              className="mt-4 text-center text-lg text-white/70 max-w-xs"
            >
              KOL CRM System 
            </CardItem>

            {/* 로그인 버튼 */}
            <CardItem
              translateZ={120}
              as="button"
              className="mt-10 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-base font-medium backdrop-blur-md border border-white/20 shadow-lg hover:shadow-aurora-violet/30 hover:scale-105 transition-all duration-300"
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