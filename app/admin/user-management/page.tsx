"use client";

/**
 * 관리자 사용자 관리 페이지
 * 
 * 이 페이지에서는 다음 기능을 제공합니다:
 * 1. 사용자 등록 (이메일, 성함, 역할)
 * 2. 사용자 목록 조회
 * 3. 사용자 역할 관리
 */
import { useState } from "react";
import UserTable from "./components/UserTable";
import UserForm from "./components/UserForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UserManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleFormClose = () => {
    setIsDialogOpen(false);
    setIsSheetOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        
        {/* 데스크톱 사용자 등록 버튼 */}
        <div className="hidden md:block">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="font-medium bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                사용자 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0">
              <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-white">
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  사용자 등록
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 py-4 bg-white">
                <UserForm onClose={handleFormClose} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 모바일 사용자 등록 시트 */}
        <div className="block md:hidden w-full">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline"
                className="w-full font-medium bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                사용자 등록
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] p-0 bg-white">
              <SheetHeader className="px-6 py-4 border-b border-gray-200">
                <SheetTitle className="text-xl font-semibold text-gray-900">
                  사용자 등록
                </SheetTitle>
              </SheetHeader>
              <div className="px-6 py-4 overflow-y-auto">
                <UserForm onClose={handleFormClose} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 사용자 테이블/카드 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <UserTable />
      </div>
    </div>
  );
} 