import Image from "next/image";
import Link from "next/link";
import LoginButtons from "./components/LoginButtons";

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] items-center sm:items-center">
        <div className="w-full flex flex-col items-center gap-4 mb-8">
          <h1 className="text-5xl font-bold" style={{ 
            backgroundImage: 'linear-gradient(to right, #6D28D9, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            BIOFOX KOL
          </h1>
          <p className="text-center text-gray-600 text-xl">KOL 및 전문점 관리 시스템</p>
        </div>
        
        <LoginButtons />
        
        <div className="card-gradient w-full max-w-2xl p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">BIOFOX KOL 시스템 소개</h2>
          <p className="mb-6 text-lg">
            BIOFOX KOL은 Key Opinion Leader 및 전문점 관리를 위한 통합 솔루션입니다.
            효율적인 마케팅 캠페인 관리와 성과 추적을 위한 최적의 플랫폼을 경험해보세요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-aurora-pink/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-aurora-pink">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-semibold">KOL 관리</h3>
              <p className="text-sm text-gray-600">인플루언서 및 전문가 관리</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-aurora-violet/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-aurora-violet">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3 className="font-semibold">전문점 지원</h3>
              <p className="text-sm text-gray-600">전문점 데이터 통합 관리</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-aurora-blue/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-aurora-blue">
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="m4.93 4.93 2.83 2.83" />
                  <path d="m16.24 16.24 2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="m4.93 19.07 2.83-2.83" />
                  <path d="m16.24 7.76 2.83-2.83" />
                </svg>
              </div>
              <h3 className="font-semibold">성과 분석</h3>
              <p className="text-sm text-gray-600">실시간 데이터 분석 및 리포트</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
