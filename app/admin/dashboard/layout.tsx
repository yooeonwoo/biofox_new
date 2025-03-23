import { ReactNode } from "react";

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
} 