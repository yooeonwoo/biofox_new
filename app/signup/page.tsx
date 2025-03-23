import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "회원가입 - BIOFOX KOL",
  description: "BIOFOX KOL 계정을 생성하세요.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">BIOFOX KOL</h1>
        <p className="text-center text-gray-600">
          KOL 및 전문점 관리 시스템
        </p>
      </div>
      <SignUp />
    </div>
  );
} 