"use client";

import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, BookText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  backPath: string;
  journalPath: string;
  onAddCustomer: () => void;
  isAdding: boolean;
}

export default function PageHeader({
  backPath,
  journalPath,
  onAddCustomer,
  isAdding,
}: PageHeaderProps) {
  return (
    <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-b">
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <Button variant="outline" size="sm" asChild>
          <Link href={backPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Link>
        </Button>

        {/* 중앙 버튼 그룹 */}
        <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
                 <Button
                    onClick={onAddCustomer}
                    disabled={isAdding}
                    size="sm"
                 >
                    <Plus className="mr-2 h-4 w-4" />
                    고객 추가
                </Button>
                {isAdding && (
                    <p className="text-xs text-orange-600">
                        신규 고객을 저장하거나 삭제 후 추가할 수 있습니다.
                    </p>
                )}
            </div>
        </div>

        {/* 영업일지 버튼 */}
        <Button variant="outline" size="sm" asChild>
          <Link href={journalPath}>
            <BookText className="mr-2 h-4 w-4" />
            영업일지
          </Link>
        </Button>
      </div>
    </div>
  );
} 