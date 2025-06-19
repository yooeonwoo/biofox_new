"use client";

import Link from 'next/link';
import { 
  ChevronDown, 
  Menu,
  LogOut,
  Key
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../../../components/ui/sheet";
import { DialogTitle } from "../../../components/ui/dialog";
import { Separator } from "../../../components/ui/separator";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import KolMobileMenu from "./KolMobileMenu";
import { useState } from "react";
import ChangePasswordDialog from "@/components/account/ChangePasswordDialog";
import { useAuth, UserButton } from "@clerk/nextjs";

interface KolHeaderProps {
  userName?: string;
  shopName?: string;
  userImage?: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onSignOut?: () => void;
}

export default function KolHeader({ 
  userName, 
  shopName, 
  userImage,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSignOut
}: KolHeaderProps) {
  const userInitials = userName?.substring(0, 2) || "KL";
  const { userId } = useAuth();

  // 프로필 표시 개선 함수
  const getDisplayName = () => {
    if (!userName) return "사용자";
    return userName;
  };

  const getDisplayShopName = () => {
    if (!shopName) return "내 상점";
    return shopName;
  };

  // 비밀번호 변경 다이얼로그 상태
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  return (
    <header className="border-b bg-white px-4 py-2 shadow-sm md:px-6">
      <div className="flex items-center justify-between">
        {/* 왼쪽 영역 - BIOFOX 텍스트를 완전히 왼쪽 정렬 */}
        <div className="flex items-center">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
              <KolMobileMenu 
                userName={userName} 
                shopName={shopName} 
                userImage={userImage} 
                setMobileMenuOpen={setMobileMenuOpen} 
                onSignOut={onSignOut}
              />
            </SheetContent>
          </Sheet>
          <Link href="/kol-new" className="font-bold text-sm md:text-lg text-black hover:text-gray-700 transition-colors">
            BIOFOX
          </Link>
        </div>

        {/* 오른쪽 프로필 영역 */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-50">
                <Avatar className="h-6 w-6 md:h-8 md:w-8">
                  <AvatarImage src={userImage} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-xs md:text-sm font-medium text-gray-900">
                    {getDisplayShopName()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getDisplayName()}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white w-48">
              <DropdownMenuLabel className="text-sm">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium text-gray-900">{getDisplayShopName()}</span>
                  <span className="text-xs text-gray-500">{getDisplayName()}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* 비밀번호 변경 */}
              <DropdownMenuItem onClick={() => setPwdDialogOpen(true)}>
                <Key className="mr-2 h-4 w-4" />
                <span>비밀번호 변경</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>로그아웃</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 비밀번호 변경 다이얼로그 */}
          <ChangePasswordDialog open={pwdDialogOpen} setOpen={setPwdDialogOpen} />
        </div>
      </div>
    </header>
  );
} 