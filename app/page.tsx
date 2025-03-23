'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  const handleLogin = () => {
    router.push('/signin');
  };
  
  const handleSignup = () => {
    router.push('/signup');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 네비게이션 헤더 */}
      <header className="w-full bg-background/80 backdrop-blur-sm border-b z-40 sticky top-0">
        <div className="container relative mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Image src="/img/logo.png" alt="BioFox Logo" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">BIOFOX</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogin}
              className="text-sm font-medium hover:text-purple-600 transition-colors"
            >
              로그인
            </button>
            <button 
              onClick={handleSignup}
              className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-4 py-2 rounded-full text-white text-sm font-medium hover:shadow-lg transition-all"
            >
              회원가입
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="relative bg-background text-foreground py-16 md:py-24 lg:py-32 px-4 overflow-hidden">
          <div className="mx-auto max-w-7xl flex flex-col gap-12 pt-8 md:pt-16">
            <div className="flex flex-col items-center gap-8 text-center">
              {/* Badge */}
              <div className="animate-appear px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-sm flex items-center gap-1">
                <span>바이오테크놀로지 솔루션</span>
                <Link href="/about" className="flex items-center gap-1 text-xs font-medium underline">
                  자세히 보기
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Title */}
              <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-[#FF8AE2] bg-clip-text text-4xl font-bold leading-tight text-transparent drop-shadow-sm sm:text-5xl md:text-6xl lg:text-7xl">
                생체의학 데이터 분석 플랫폼
              </h1>

              {/* Description */}
              <p className="text-md relative z-10 max-w-[600px] animate-appear font-medium text-gray-600 sm:text-xl">
                BIOFOX KOL 및 전문점 관리 시스템은 의료 연구와 헬스케어 솔루션을 혁신하는 통합 플랫폼입니다.
              </p>

              {/* Actions */}
              <div className="relative z-10 flex flex-wrap animate-appear justify-center gap-4">
                <button
                  onClick={handleSignup}
                  className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-6 py-3 rounded-full text-white text-sm md:text-base font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                  시작하기 <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLogin}
                  className="border border-[#8B5CF6] px-6 py-3 rounded-full text-[#6D28D9] text-sm md:text-base font-medium hover:bg-purple-50 transition-all"
                >
                  로그인
                </button>
              </div>

              {/* Image with Mockup */}
              <div className="relative w-full mt-12 rounded-lg overflow-hidden border border-purple-200 shadow-xl">
                <div className="h-8 bg-gray-100 flex items-center px-4 border-b">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="bg-white p-4 relative">
                  <Image 
                    src="/img/logo.png" 
                    alt="BioFox Dashboard Preview" 
                    width={1200} 
                    height={800}
                    className="w-full h-auto rounded shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wave Effect */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-r from-[#67E8F9] via-[#FF8AE2] to-[#8B5CF6] opacity-10">
            <svg
              className="absolute bottom-0 w-full h-24"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
            >
              <path
                fill="currentColor"
                fillOpacity="0.3"
                d="M0,192L48,176C96,160,192,128,288,122.7C384,117,480,139,576,165.3C672,192,768,224,864,213.3C960,203,1056,149,1152,133.3C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
        </section>

        {/* 서비스 카드 섹션 */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent">
                BIOFOX KOL 시스템 특징
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                최첨단 바이오테크놀로지와 생체의학 분야를 위한 혁신적인 관리 시스템을 경험해보세요.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {[
                {
                  title: "KOL 관리",
                  description: "핵심 오피니언 리더를 효과적으로 관리하고 협업하여 바이오테크 분야의 영향력을 극대화합니다.",
                  color: "#6D28D9",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  )
                },
                {
                  title: "전문점 지원",
                  description: "바이오메디컬 전문점을 위한 맞춤형 솔루션과 지원 시스템으로 비즈니스 성장을 가속화합니다.",
                  color: "#FF8AE2",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  )
                },
                {
                  title: "성과 분석",
                  description: "정밀한 데이터 분석을 통해 생체의학 분야의 성과를 측정하고 최적화된 전략을 수립합니다.",
                  color: "#67E8F9",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="m4.93 4.93 2.83 2.83" />
                      <path d="m16.24 16.24 2.83 2.83" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="m4.93 19.07 2.83-2.83" />
                      <path d="m16.24 7.76 2.83-2.83" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="relative group h-full"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-200 via-violet-400 to-indigo-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                  
                  <div className="relative h-full flex flex-col rounded-xl border border-purple-200 bg-white p-6 transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-lg">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl bg-gradient-to-r from-purple-200 via-violet-400 to-indigo-600" />
                    
                    <div 
                      className="mb-6 p-3 rounded-full w-14 h-14 flex items-center justify-center"
                      style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                    
                    <div className="mb-2 text-lg font-bold relative z-10">
                      <div 
                        className="absolute left-0 inset-y-0 h-6 group-hover:h-8 w-1 rounded-tr-full rounded-br-full transition-all duration-200 origin-center"
                        style={{ backgroundColor: feature.color }}
                      />
                      <span className="group-hover:translate-x-2 transition duration-200 inline-block">
                        {feature.title}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 relative z-10">
                      {feature.description}
                    </p>
                    
                    <div className="mt-auto pt-4">
                      <div
                        className="h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-800 group-hover:border-transparent transition-colors duration-300"
                        style={{ 
                          boxShadow: `0 0 0 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)` 
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 opacity-10" />
          <div className="absolute bottom-0 left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] bg-[radial-gradient(ellipse_at_center,_rgba(109,40,217,0.5)_10%,_rgba(109,40,217,0)_60%)]" />
          
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              지금 시작하세요
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              BIOFOX KOL과 함께 생체의학 분야의 데이터를 효율적으로 관리하고 분석하세요.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleSignup}
                className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-6 py-3 rounded-full text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
              >
                무료로 시작하기 <ArrowRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleLogin}
                className="border border-[#6D28D9] px-6 py-3 rounded-full text-[#6D28D9] font-medium hover:bg-purple-50 transition-all"
              >
                로그인
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <div className="col-span-2 mb-8 lg:mb-0">
              <div className="flex items-center gap-2">
                <Image src="/img/logo.png" alt="BioFox Logo" width={40} height={40} className="h-10 w-auto" />
                <p className="text-xl font-semibold bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] bg-clip-text text-transparent">BIOFOX</p>
              </div>
              <p className="mt-4 text-gray-600">생체의학 데이터 분석 플랫폼</p>
            </div>
            
            <div>
              <h3 className="mb-4 font-bold">서비스</h3>
              <ul className="space-y-4 text-gray-500">
                <li className="font-medium hover:text-[#6D28D9]">
                  <Link href="#">KOL 관리</Link>
                </li>
                <li className="font-medium hover:text-[#6D28D9]">
                  <Link href="#">전문점 지원</Link>
                </li>
                <li className="font-medium hover:text-[#6D28D9]">
                  <Link href="#">성과 분석</Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 font-bold">정보</h3>
              <ul className="space-y-4 text-gray-500">
                <li className="font-medium hover:text-[#6D28D9]">
                  <Link href="#">회사 소개</Link>
                </li>
                <li className="font-medium hover:text-[#6D28D9]">
                  <Link href="#">연락처</Link>
                </li>
                <li className="font-medium hover:text-[#6D28D9]">
                  <Link href="#">개인정보처리방침</Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium text-gray-500 md:flex-row md:items-center">
            <p>© 2024 BIOFOX. All rights reserved.</p>
            <ul className="flex gap-4">
              <li className="underline hover:text-[#6D28D9]">
                <Link href="#">이용약관</Link>
              </li>
              <li className="underline hover:text-[#6D28D9]">
                <Link href="#">개인정보처리방침</Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
