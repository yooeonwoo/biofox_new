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
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
} 