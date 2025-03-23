import { Metadata } from "next";
import { SalesContent } from "./SalesContent";

export const metadata: Metadata = {
  title: "매출 관리 - BIOFOX 관리자",
  description: "관리자가 전문점의 매출을 등록하고 관리할 수 있는 페이지입니다.",
};

export default function AdminSalesPage() {
  return <SalesContent />;
} 