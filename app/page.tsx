'use client';

import { CardContainer, CardBody, CardItem } from "@/components/ui/aceternity/3d-card";
import Aurora from "@/components/ui/Aurora";

export default function Home() {
  // 임시 점검 중 - 모든 리다이렉션 비활성화

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
          <CardBody className="relative group/card dark:hover:shadow-2xl dark:hover:shadow-aurora-violet/[0.1] dark:bg-white/[0.08] dark:border-black/[0.8] border-black/[0.8] w-[85vw] sm:w-[55vw] md:w-[32rem] h-[30rem] rounded-3xl border backdrop-blur-sm flex flex-col items-center justify-center">
            {/* 헤딩 텍스트 */}
            <CardItem
              translateZ={80}
              className="text-center text-6xl md:text-7xl font-bold text-white/90 tracking-wider group-hover/card:scale-105 group-hover/card:text-white group-hover/card:text-glow-white transition-all duration-500 ease-out"
            >
              BIOFOX
            </CardItem>
            
            {/* 점검 메시지 */}
            <CardItem
              translateZ={60}
              className="mt-6 text-center text-xl font-semibold text-yellow-400"
            >
              🔧 임시 점검 중 🔧
            </CardItem>

            <CardItem
              translateZ={60}
              className="mt-4 text-center text-lg text-white/80 max-w-sm leading-relaxed"
            >
              앱 업그레이드로 인해<br/>
              현재 서비스를 일시 중단합니다.
            </CardItem>

            <CardItem
              translateZ={60}
              className="mt-4 text-center text-base text-white/60 max-w-sm"
            >
              빠른 시일 내에 정상화하겠습니다.<br/>
              이용에 불편을 드려 죄송합니다.
            </CardItem>

            {/* 비활성화된 버튼 */}
            <CardItem
              translateZ={120}
              className="mt-8 px-8 py-4 rounded-2xl bg-gray-600/30 text-gray-400 text-base font-medium backdrop-blur-md border border-gray-500/30 cursor-not-allowed"
            >
              서비스 점검 중
            </CardItem>
          </CardBody>
        </CardContainer>
      </main>
    </div>
  );
} 