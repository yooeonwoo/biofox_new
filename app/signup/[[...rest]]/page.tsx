import Link from "next/link";

export const metadata = {
  title: "회원가입 - BIOFOX KOL",
  description: "BIOFOX KOL 계정을 생성하세요.",
};

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            현재 로컬 개발 모드입니다.
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              인증이 비활성화되어 있습니다.
            </p>
            <p className="text-sm text-gray-500">
              모든 페이지에 자유롭게 접근할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 