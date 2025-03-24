import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getClientRole } from "@/lib/auth";

export default async function UserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 현재 로그인한 사용자 정보 가져오기
  const { userId } = await auth();
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!userId) {
    redirect("/signin");
  }

  // DB에서 관리자 권한 확인
  const userRole = await getClientRole(userId);
  
  if (userRole !== "본사관리자") {
    // 권한이 없는 경우 대시보드로 리다이렉트
    redirect("/dashboard");
  }

  return <>{children}</>;
} 