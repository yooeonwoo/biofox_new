'use client';

import Link from 'next/link';
import { Home, Store, BarChart3, Settings } from "lucide-react";
import { Separator } from "../../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";

interface KolMobileMenuProps {
  userName?: string;
  shopName?: string;
  userImage?: string;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function KolMobileMenu({
  userName,
  shopName,
  userImage,
  setMobileMenuOpen
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
          href="#" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <Home className="h-4 w-4" />
          <span>홈</span>
        </Link>
        <Link 
          href="#" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <Store className="h-4 w-4" />
          <span>전문점 관리</span>
        </Link>
        <Link 
          href="#" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <BarChart3 className="h-4 w-4" />
          <span>매출 분석</span>
        </Link>
        <Link 
          href="#" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <Settings className="h-4 w-4" />
          <span>설정</span>
        </Link>
      </nav>
    </div>
  );
} 