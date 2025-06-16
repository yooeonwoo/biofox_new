"use client";

import { ReactNode, useState } from "react";
import KolHeader from "../../components/layout/KolHeader";
import KolSidebar from "../../components/layout/KolSidebar";
import { useUser, useClerk } from "@clerk/nextjs";

export default function CustomerManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("로그아웃 오류", err);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <KolHeader
        userName={user?.fullName || user?.username || undefined}
        userImage={user?.imageUrl}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />
      <div className="flex flex-1 overflow-hidden">
        <KolSidebar />
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
} 