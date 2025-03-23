/**
 * 전문점 활성 현황 위젯
 * 
 * 활성 전문점 수 / 전체 전문점 수 표시
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ShopStatusWidgetProps {
  activeShops: number;
  totalShops: number;
}

export default function ShopStatusWidget({ activeShops, totalShops }: ShopStatusWidgetProps) {
  // 활성 비율 계산 (%)
  const activeRatio = totalShops > 0 ? (activeShops / totalShops) * 100 : 0;
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Store className="h-5 w-5 mr-2 text-blue-500" />
          전문점 활성 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>활성 전문점</span>
            <span className="font-medium">
              {activeShops} / {totalShops}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${activeRatio}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">
              {activeRatio.toFixed(1)}%
            </div>
            <span className="text-sm text-gray-500">
              활성 비율
            </span>
          </div>
          
          <div className="pt-3">
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/shops" className="flex items-center justify-center">
                전문점 순위 보기
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 