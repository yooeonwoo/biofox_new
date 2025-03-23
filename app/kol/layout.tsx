import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function KolLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();
  
  // 인증 확인
  if (!userId) {
    redirect("/signin");
  }
  
  // 권한 확인 - 관리자면 관리자 페이지로 리다이렉트
  const role = user?.publicMetadata?.role as string;
  if (role === "본사관리자") {
    redirect("/admin");
  }
  
  return (
    <DashboardLayout title="KOL 페이지" role="kol">
      {children}
    </DashboardLayout>
  );
} 