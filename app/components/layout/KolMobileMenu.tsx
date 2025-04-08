'use client';

import Link from 'next/link';
import { Home, Store, BarChart3, LogOut, Bell, FileText } from "lucide-react";
import { Separator } from "../../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";

interface KolMobileMenuProps {
  userName?: string;
  shopName?: string;
  userImage?: string;
  setMobileMenuOpen: (open: boolean) => void;
  onSignOut?: () => void;
}

export default function KolMobileMenu({
  userName,
  shopName,
  userImage,
  setMobileMenuOpen,
  onSignOut
}: KolMobileMenuProps) {
  const userInitials = userName?.substring(0, 2) || "KL";

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-2 px-4">
        <Avatar>
          <AvatarImage src={userImage} />
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{userName || "로딩 중..."}</p>
          <p className="text-xs text-muted-foreground">{shopName || "로딩 중..."}</p>
        </div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1">
        <Link 
          href="/kol-new" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <Home className="h-4 w-4" />
          <span>대시보드</span>
        </Link>
        <Link 
          href="/kol-new/stores" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <Store className="h-4 w-4" />
          <span>전문점 관리</span>
        </Link>
        <Link 
          href="/kol-new/activities" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <FileText className="h-4 w-4" />
          <span>영업 일지</span>
        </Link>
        <Separator className="my-2" />
        <Link 
          href="/kol-new/notifications" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
          <span>알림</span>
        </Link>
        <Separator className="my-2" />
        <Button 
          variant="ghost" 
          onClick={() => {
            setMobileMenuOpen(false);
            if (onSignOut) {
              onSignOut();
            }
          }}
          className="flex items-center justify-start gap-2 rounded-md px-4 py-2 text-sm font-normal hover:bg-muted"
        >
          <LogOut className="h-4 w-4 text-red-500" />
          <span className="text-red-500">로그아웃</span>
        </Button>
      </nav>
    </div>
  );
} 