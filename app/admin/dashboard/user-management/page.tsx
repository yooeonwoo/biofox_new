/**
 * 관리자 사용자 관리 페이지
 * 
 * 이 페이지에서는 다음 기능을 제공합니다:
 * 1. 사용자 등록 (이메일, 성함, 역할)
 * 2. 사용자 목록 조회
 * 3. 사용자 역할 관리
 */
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UserForm from "./components/UserForm";
import UserTable from "./components/UserTable";

export default async function UserManagementPage() {
  // 현재 로그인한 사용자 정보 가져오기
  const user = await currentUser();
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    redirect("/signin");
  }

  // 관리자 권한 확인 (실제 환경에서는 DB에서 역할 확인 필요)
  const userRole = user?.publicMetadata?.role || "kol";
  
  if (userRole !== "본사관리자") {
    // 권한이 없는 경우 대시보드로 리다이렉트
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">사용자 관리</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 사용자 등록 폼 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">새 사용자 등록</h2>
          <UserForm />
        </div>
        
        {/* 사용자 목록 */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">사용자 목록</h2>
          <UserTable />
        </div>
      </div>
    </div>
  );
} 