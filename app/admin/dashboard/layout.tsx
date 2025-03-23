import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default async function AdminDashboardLayout({
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
  
  // 관리자 권한 확인
  const role = user?.publicMetadata?.role as string;
  if (role !== "본사관리자") {
    redirect("/dashboard");
  }
  
  return (
    <DashboardLayout title="관리자 대시보드" role="본사관리자">
      {children}
    </DashboardLayout>
  );
} 