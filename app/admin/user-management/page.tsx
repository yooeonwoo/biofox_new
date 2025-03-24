/**
 * 관리자 사용자 관리 페이지
 * 
 * 이 페이지에서는 다음 기능을 제공합니다:
 * 1. 사용자 등록 (이메일, 성함, 역할)
 * 2. 사용자 목록 조회
 * 3. 사용자 역할 관리
 */
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import UserForm from "./components/UserForm";
import UserTable from "./components/UserTable";
import { getClientRole } from "@/lib/auth";

export default async function UserManagementPage() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">사용자 관리</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 사용자 등록 폼 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">새 사용자 등록</h2>
          <UserForm />
        </div>
        
        {/* 사용자 목록 */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">사용자 목록</h2>
          <UserTable />
        </div>
      </div>
    </div>
  );
} 