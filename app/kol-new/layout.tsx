"use client";

import { ReactNode, useState } from "react";
import KolHeader from "../components/layout/KolHeader";
import KolSidebar from "@/app/components/layout/KolSidebar";
import { useUser, useClerk } from "@clerk/nextjs";

interface Props {
  children: ReactNode;
}

export default function KolLayout({ children }: Props) {
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
    <div className="flex h-screen bg-gray-100">
      <KolSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <KolHeader
          userName={user?.fullName || user?.username || undefined}
          userImage={user?.imageUrl}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}