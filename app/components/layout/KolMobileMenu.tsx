'use client';

import Link from 'next/link';
import { Home, Store, Users, BarChart3, LogOut, Bell, FileText, ShoppingBag, Camera } from "lucide-react";
import { Separator } from "../../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { FoxLogo } from "../../../components/ui/fox-logo";
import { useUser } from "@clerk/nextjs";

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
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string || "kol";
  const isTestRole = userRole === "test";
  const userInitials = userName?.substring(0, 2) || "KL";

  // 프로필 표시 개선 함수
  const getDisplayName = () => {
    if (!userName) return "사용자";
    return userName;
  };

  const getDisplayShopName = () => {
    if (!shopName) return "Shop";
    return shopName;
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-3 px-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userImage} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{getDisplayShopName()}</p>
          <p className="text-xs text-gray-500">{getDisplayName()}</p>
        </div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1">
        {!isTestRole && (
          <>
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
              href="/kol-new/customer-manager" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
            >
              <Users className="h-4 w-4" />
              <span>고객 관리</span>
            </Link>
          </>
        )}
        <Link 
          href="/kol-new/clinical-photos" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <Camera className="h-4 w-4" />
          <span>임상사진</span>
        </Link>
        <a 
          href="https://biofoxpro.co.kr/" 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>전문가몰</span>
        </a>
        <a 
          href="https://ad.biofoxi.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
        >
          <FoxLogo className="h-4 w-4" />
          <span>폭시</span>
        </a>
        {!isTestRole && (
          <>
            <Separator className="my-2" />
            <Link 
              href="/kol-new/notifications" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
            >
              <Bell className="h-4 w-4" />
              <span>알림</span>
            </Link>
          </>
        )}
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