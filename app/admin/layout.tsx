import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import DashboardLayout from "@/components/layout/dashboard-layout";
import MobileTabBar from "@/components/layout/mobile-tab-bar";
import { Metadata } from "next";
import { getClientRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "관리자 대시보드 - BIOFOX KOL",
  description: "BIOFOX KOL 관리자 대시보드",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  
  // 인증 확인
  if (!userId) {
    redirect("/signin");
  }
  
  // Clerk에서 관리자 권한 확인
  const role = await getClientRole(userId);
  if (role !== "본사관리자") {
    redirect("/dashboard");
  }
  
  return (
    <DashboardLayout title="관리자 대시보드" role="본사관리자">
      <div className="bg-white min-h-screen pb-16 md:pb-0">
        <div className="p-3 md:p-6">
          {children}
        </div>
        <MobileTabBar />
      </div>
    </DashboardLayout>
  );
}
