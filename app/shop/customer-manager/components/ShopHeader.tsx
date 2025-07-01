"use client";

import Link from 'next/link';
import { ChevronDown, Menu, LogOut, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ShopMobileMenu from "./ShopMobileMenu";
import { useState } from "react";
import ChangePasswordDialog from "@/components/account/ChangePasswordDialog";

interface ShopHeaderProps {
  userName?: string;
  shopName?: string;
  userImage?: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onSignOut?: () => void;
}

export default function ShopHeader({ 
  userName, 
  shopName, 
  userImage,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSignOut
}: ShopHeaderProps) {
  const userInitials = userName?.substring(0, 2) || "SH";
  const getDisplayName = () => userName || "사용자";
  const getDisplayShopName = () => shopName || "내 상점";
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  return (
    <header className="border-b bg-white px-4 py-2 shadow-sm md:px-6 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0">
              <ShopMobileMenu setMobileMenuOpen={setMobileMenuOpen} />
            </SheetContent>
          </Sheet>
          <Link href="/shop" className="font-bold text-sm md:text-lg text-black hover:text-gray-700 transition-colors">
            BIOFOX SHOP
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userImage} />
                  <AvatarFallback className="bg-green-100 text-green-600 text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-medium text-gray-900">{getDisplayShopName()}</span>
                  <span className="text-xs text-gray-500">{getDisplayName()}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
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
          <ChangePasswordDialog open={pwdDialogOpen} setOpen={setPwdDialogOpen} />
        </div>
      </div>
    </header>
  );
} 