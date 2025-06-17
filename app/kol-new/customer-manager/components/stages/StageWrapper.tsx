import React from "react";
import { cn } from "@/lib/utils"; // simple class merge util, fallback if exists
import { Pencil } from "lucide-react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  title: string;
  number: number;
  accentColor: string;
  children: React.ReactNode;
}

export default function StageWrapper({ title, number, accentColor, children }: Props) {
  return (
    <Drawer>
      <div className={cn("stage-block border border-gray-200 rounded-xl p-4 relative", accentColor)}>
        {/* 헤더 (번호 + 제목) */}
        <div className="flex items-center gap-2 mb-3">
          <div className="size-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
            {number}
          </div>
          <h4 className="text-sm font-semibold flex-1">{title}</h4>

          {/* 편집 버튼 */}
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label="상세 편집"
              className="size-6 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Pencil size={14} />
            </button>
          </DrawerTrigger>
        </div>

        {children}
      </div>

      {/* Drawer Content */}
      <DrawerContent side="right" className="w-full sm:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>{title} 상세 메모</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="px-4 pb-6 h-[80vh]">
          <p className="text-sm text-muted-foreground mb-4">
            이 영역에서 첨부파일 업로드 및 장문의 메모 작성 UI를 추가할 예정입니다.
          </p>
          {/* TODO: 상세 메모/첨부 컴포넌트 구현 */}
        </ScrollArea>
        <DrawerClose aria-label="닫기" className="absolute top-4 right-4 text-gray-500 hover:text-foreground" />
      </DrawerContent>
    </Drawer>
  );
} 