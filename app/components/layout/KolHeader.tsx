'use client';

import Link from 'next/link';
import { 
  ChevronDown, 
  Menu,
  LogOut
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../../../components/ui/sheet";
import { DialogTitle } from "../../../components/ui/dialog";
import { Separator } from "../../../components/ui/separator";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import KolMobileMenu from "./KolMobileMenu";

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

  return (
    <header className="border-b bg-white px-4 py-2 shadow-sm md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex w-64 items-center">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
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
          <Link href="/kol-new" className="flex w-full items-center justify-center font-bold text-sm md:text-lg">
            BIOFOX CRM
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-6 w-6 md:h-8 md:w-8">
                  <AvatarImage src={userImage} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-xs md:text-sm font-medium">{shopName || "로딩 중..."}</span>
                  <span className="text-xs text-gray-500">{userName || "로딩 중..."}</span>
                </div>
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuLabel>내 계정</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>로그아웃</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 