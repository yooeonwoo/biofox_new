import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { getClientRole } from "@/lib/auth";

export default async function KolLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  
  // 인증 확인
  if (!userId) {
    redirect("/signin");
  }
  
  // Clerk에서 권한 확인 - 관리자면 관리자 페이지로 리다이렉트
  // 캐싱된 함수 사용으로 성능 개선됨
  const role = await getClientRole(userId);
  if (role === "본사관리자") {
    redirect("/admin");
  }
  
  return (
    <DashboardLayout title="KOL 페이지" role="kol">
      {children}
    </DashboardLayout>
  );
} 