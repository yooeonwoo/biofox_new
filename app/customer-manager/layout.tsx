import { ReactNode } from "react";
import AdminHeader from "@/components/layout/AdminHeader";

export default function CustomerManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
      <main className="flex-1 overflow-auto bg-gray-50 p-4">{children}</main>
    </div>
  );
} 