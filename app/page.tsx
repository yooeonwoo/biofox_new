'use client';

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Github } from "lucide-react";
import { ModernGradientBackground } from "@/components/ui/modern-gradient-background";
import { Button } from "@/components/ui/button";
import { AuroraCard, AuroraText } from "@/components/ui/aurora-gradient";

export default function Home() {
  const router = useRouter();
  
  const handleLogin = () => {
    router.push('/signin');
  };
  
  const handleSignup = () => {
    router.push('/signup');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 그라데이션 */}
      <ModernGradientBackground 
        gradientBackgroundStart="rgb(10, 10, 10)" 
        gradientBackgroundEnd="rgb(15, 15, 15)"
        firstColor="255, 138, 226"  // aurora-pink
        secondColor="139, 92, 246"  // aurora-violet
        thirdColor="103, 232, 249"  // aurora-blue
        fourthColor="109, 40, 217"  // biofox-purple
        blendingValue="soft-light"
        containerClassName="fixed inset-0 z-0"
      />
      
      {/* 네비게이션 헤더 */}
      <header className="w-full bg-background/10 backdrop-blur-md border-b border-white/5 z-40 sticky top-0">
        <div className="container relative mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Image src="/images/biofox-logo.svg" alt="BioFox Logo" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-xl text-gradient">BIOFOX</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleLogin}
              variant="ghost"
              className="text-sm font-medium"
            >
              로그인
            </Button>
            <Button 
              onClick={handleSignup}
              variant="gradient"
              className="text-sm font-medium"
            >
              회원가입
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 히어로 섹션 */}
      <main className="relative z-10 container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-16">
        <div className="relative w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* 왼쪽: 텍스트 콘텐츠 */}
          <div className="flex-1 space-y-8">
            {/* 뱃지 */}
            <div className="animate-appear inline-block rounded-full bg-dark-gray-1/80 backdrop-blur border border-white/10 px-4 py-1.5 text-white/90 text-sm">
              <span>바이오테크놀로지 솔루션</span>
            </div>
            
            {/* 타이틀 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight animate-appear delay-300">
              <span className="text-white">생체의학</span>
              <br />
              <span className="text-gradient">데이터 분석 플랫폼</span>
            </h1>
            
            {/* 설명 */}
            <p className="text-lg md:text-xl text-white/80 max-w-xl animate-appear delay-500">
              BIOFOX KOL 및 전문점 관리 시스템은 의료 연구와 헬스케어 솔루션을 혁신하는 통합 플랫폼입니다.
            </p>
            
            {/* 버튼 액션 */}
            <div className="flex flex-wrap gap-4 animate-appear delay-700">
              <Button
                onClick={handleSignup}
                variant="gradient"
                size="lg"
                className="rounded-full"
              >
                시작하기 <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
              <Button
                onClick={handleLogin}
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                로그인
              </Button>
            </div>
            
            {/* 기능 강조 포인트 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 animate-appear delay-1000">
              {[
                {
                  title: "KOL 관리",
                  description: "핵심 오피니언 리더 관리 및 협업",
                  color: "from-aurora-pink/20 to-aurora-pink/5"
                },
                {
                  title: "전문점 지원",
                  description: "바이오메디컬 전문점 맞춤형 솔루션",
                  color: "from-aurora-violet/20 to-aurora-violet/5"
                },
                {
                  title: "성과 분석",
                  description: "정밀한 데이터 분석 및 최적화 전략",
                  color: "from-aurora-blue/20 to-aurora-blue/5"
                }
              ].map((feature, index) => (
                <AuroraCard
                  key={index}
                  className="border border-white/10 bg-gradient-to-b p-4 h-full"
                >
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </AuroraCard>
              ))}
            </div>
          </div>
          
          {/* 오른쪽: 3D 또는 이미지 콘텐츠 */}
          <div className="flex-1 flex justify-center lg:justify-end animate-appear-zoom delay-500">
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-aurora-pink/30 via-aurora-violet/30 to-aurora-blue/30 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <div className="absolute inset-4 bg-dark-gray-1/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden p-4">
                <div className="absolute inset-0 bg-gradient-to-br from-aurora-pink/5 via-aurora-violet/5 to-aurora-blue/5"></div>
                <div className="h-8 bg-black/20 flex items-center px-4 rounded-t-lg border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-aurora-pink/70 rounded-full"></div>
                    <div className="w-3 h-3 bg-aurora-violet/70 rounded-full"></div>
                    <div className="w-3 h-3 bg-aurora-blue/70 rounded-full"></div>
                  </div>
                </div>
                <div className="relative p-4 h-full">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-white/5 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded"></div>
                        <div className="h-4 bg-white/5 rounded w-5/6"></div>
                      </div>
                      <div className="h-32 bg-gradient-to-r from-aurora-pink/10 to-aurora-violet/10 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded w-5/6"></div>
                        <div className="h-4 bg-white/5 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 미니멀 푸터 */}
        <footer className="w-full mt-auto pt-12 text-center text-white/50 text-sm">
          <p>© 2024 BIOFOX. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
