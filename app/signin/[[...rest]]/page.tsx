import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = {
  title: "로그인 - BIOFOX KOL",
  description: "BIOFOX KOL 계정으로 로그인하세요.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ 
      background: 'linear-gradient(to bottom right, white, rgba(192, 166, 227, 0.1))' 
    }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6">
            <h1 className="text-4xl font-bold" style={{ 
              backgroundImage: 'linear-gradient(to right, #6D28D9, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              BIOFOX KOL
            </h1>
          </Link>
          
          {/* 시스템 업그레이드 안내 */}
          <div className="w-full mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">시스템 업그레이드 완료</h3>
                <p className="text-xs text-blue-700 mb-2">
                  보안 강화를 위해 시스템이 업그레이드되었습니다.
                </p>
                <div className="text-xs text-blue-600">
                  <p className="mb-1">
                    <strong>기존 사용자:</strong> "비밀번호를 잊으셨나요?"를 클릭하여 새 비밀번호를 설정해 주세요.
                  </p>
                  <p>
                    ※ 기존 데이터(매장 정보, 수당 내역 등)는 모두 유지됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-gradient">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: "btn-primary",
                card: "shadow-none bg-transparent",
                headerTitle: "text-xl font-semibold",
                headerSubtitle: "",
                socialButtonsBlockButton: "border border-solid hover:border-[#C0A6E3]",
                socialButtonsBlockButtonText: "text-gray-600",
                formFieldLabel: "text-gray-700",
                formFieldInput: "border-solid focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9]",
                footerActionLink: "text-[#6D28D9] hover:text-[#8B5CF6]",
                identityPreviewText: "text-gray-700",
                identityPreviewEditButton: "text-[#6D28D9] hover:text-[#8B5CF6]",
                rootBox: "w-full",
                footer: "pb-0",
                main: "p-0 sm:p-0"
              },
            }}
            path="/signin"
            routing="path"
            signUpUrl="/signup"
            fallbackRedirectUrl="/dashboard" // 로그인 성공 후 dashboard로 리다이렉션 (미들웨어에서 역할별로 처리)
            developmentMode={false}
          />
        </div>
      </div>
    </div>
  );
} 