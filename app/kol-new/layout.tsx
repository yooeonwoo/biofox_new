import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getClientRole } from "@/lib/auth";

export default async function KolNewLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  
  // 인증 확인
  if (!userId) {
    console.log('[kol-new 레이아웃] 미인증 사용자 리다이렉트 /signin');
    redirect("/signin");
  }
  
  // Clerk에서 권한 확인 - 관리자면 관리자 페이지로 리다이렉트
  const role = await getClientRole(userId);
  console.log('[kol-new 레이아웃] 사용자 역할:', role);
  
  if (role === "본사관리자") {
    console.log('[kol-new 레이아웃] 관리자 사용자 리다이렉트 /admin');
    redirect("/admin");
  }
  
  // kol 역할이 아니면 홈으로 리다이렉트
  if (role !== "kol") {
    console.log('[kol-new 레이아웃] 일반 사용자 리다이렉트 /');
    redirect("/");
  }
  
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 