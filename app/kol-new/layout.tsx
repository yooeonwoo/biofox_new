import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getClientRole } from "@/lib/auth";
import { ReactNode } from "react";
import KolSidebar from "@/components/layout/KolSidebar";

export default async function KolNewLayout({ children }: { children: ReactNode }) {
  const { userId } = auth();
  if (!userId) {
    redirect("/signin");
  }

  const role = await getClientRole(userId);
  if (role === "admin") {
    redirect("/admin-dashboard/main");
  }
  if (role !== "kol" && role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <KolSidebar />
      <main className="flex-1 min-w-0">
        <div className="mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}