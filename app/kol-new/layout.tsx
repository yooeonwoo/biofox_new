"use client";

import { ReactNode, useState } from "react";
import KolHeader from "../components/layout/KolHeader";
import KolSidebar from "@/app/components/layout/KolSidebar";
import KolFooter from "@/app/components/layout/KolFooter";
import { useUser, useClerk } from "@clerk/nextjs";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import KolMobileMenu from "../components/layout/KolMobileMenu";

interface Props {
  children: ReactNode;
}

export default function KolLayout({ children }: Props) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: dashboardCompleteData } = useDashboardData();
  const dashboardData = dashboardCompleteData?.dashboard;

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
        userName={dashboardData?.kol?.name}
        shopName={dashboardData?.kol?.shopName}
        userImage={user?.imageUrl}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />
      <div className="flex flex-1 overflow-hidden">
        <KolSidebar />
        <main className="flex-1 overflow-auto bg-muted/10">
          <div className="mx-auto max-w-7xl h-full">
            {children}
            <KolFooter />
          </div>
        </main>
      </div>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
          <KolMobileMenu 
            userName={dashboardData?.kol?.name} 
            shopName={dashboardData?.kol?.shopName} 
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}