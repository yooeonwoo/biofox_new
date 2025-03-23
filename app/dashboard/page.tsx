import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    redirect("/signin");
  }
  
  const role = sessionClaims?.role as string;
  
  if (role === "본사관리자") {
    redirect("/admin/dashboard");
  }
  
  if (role === "kol") {
    redirect("/kol/dashboard");
  }
  
  // 기본적으로 루트로 리다이렉트
  redirect("/");
} 