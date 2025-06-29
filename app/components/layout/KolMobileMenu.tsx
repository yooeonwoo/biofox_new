'use client';

import Link from 'next/link';
import { Home, Store, Users, BarChart3, LogOut, Bell, FileText, ShoppingBag, Camera } from "lucide-react";
import { Separator } from "../../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { FoxLogo } from "../../../components/ui/fox-logo";
import { Sheet, SheetContent } from "../../../components/ui/sheet";

interface KolMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  shopName?: string;
  userImage?: string;
  onSignOut?: () => void;
}

export default function KolMobileMenu({
  isOpen,
  onClose,
  userName,
  shopName,
  userImage,
  onSignOut
}: KolMobileMenuProps) {
  // 임시 사용자 정보 (로컬 개발용)
  const tempUser = {
    name: userName || "테스트 사용자",
    shopName: shopName || "테스트 샵",
    role: "kol",
    avatar: userImage
  };

  const userInitials = tempUser.name.substring(0, 2) || "KL";
  const isTestRole = tempUser.role === "test";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left">
        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center gap-3 px-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={tempUser.avatar || ''} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{tempUser.shopName}</p>
              <p className="text-xs text-gray-500">{tempUser.name}</p>
            </div>
          </div>
          <Separator />
          <nav className="flex flex-1 flex-col gap-1">
            {!isTestRole && (
              <>
                <Link 
                  href="/kol-new" 
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
                >
                  <Home className="h-4 w-4" />
                  <span>대시보드</span>
                </Link>
                <Link 
                  href="/kol-new/stores" 
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
                >
                  <Store className="h-4 w-4" />
                  <span>전문점 관리</span>
                </Link>
                <Link 
                  href="/kol-new/customer-manager" 
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
                >
                  <Users className="h-4 w-4" />
                  <span>고객 관리</span>
                </Link>
              </>
            )}
            <Link 
              href="/kol-new/clinical-photos" 
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
            >
              <Camera className="h-4 w-4" />
              <span>임상사진</span>
            </Link>
            <a 
              href="https://biofoxpro.co.kr/" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-muted"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>전문가몰</span>
            </a>
            <a 
              href="https://ad.biofoxi.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={onClose}
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
                  onClick={onClose}
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
                onClose();
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
      </SheetContent>
    </Sheet>
  );
} 