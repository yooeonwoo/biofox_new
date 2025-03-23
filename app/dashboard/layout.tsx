import Link from "next/link";
import { Sidebar } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings,
  Wallet,
  Store
} from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <Sidebar className="hidden md:flex w-64 flex-col fixed inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200">
          <div className="flex items-center justify-center h-14 border-b border-gray-200">
            <span className="text-xl font-semibold">BIOFOX KOL</span>
          </div>
          <div className="flex flex-col flex-grow px-4 mt-5">
            <nav className="flex-1 space-y-1">
              <p className="px-2 pt-4 text-xs font-semibold text-gray-400 uppercase">
                대시보드
              </p>
              <Link href="/dashboard" className="flex items-center px-2 py-2 mt-1 text-sm rounded-md hover:bg-gray-100">
                <LayoutDashboard className="w-5 h-5 mr-3 text-gray-500" />
                홈
              </Link>
              
              <p className="px-2 pt-4 text-xs font-semibold text-gray-400 uppercase">
                매출/수당 관리
              </p>
              <Link href="/dashboard/sales" className="flex items-center px-2 py-2 mt-1 text-sm rounded-md hover:bg-gray-100">
                <BarChart3 className="w-5 h-5 mr-3 text-gray-500" />
                대시보드
              </Link>
              <Link href="/dashboard/shops" className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100">
                <Store className="w-5 h-5 mr-3 text-gray-500" />
                전문점 순위
              </Link>
              <Link href="/dashboard/commissions" className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100">
                <Wallet className="w-5 h-5 mr-3 text-gray-500" />
                수당 내역
              </Link>
              
              <p className="px-2 pt-4 text-xs font-semibold text-gray-400 uppercase">
                관리
              </p>
              <Link href="/dashboard/products" className="flex items-center px-2 py-2 mt-1 text-sm rounded-md hover:bg-gray-100">
                <ShoppingBag className="w-5 h-5 mr-3 text-gray-500" />
                제품
              </Link>
              <Link href="/dashboard/users" className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100">
                <Users className="w-5 h-5 mr-3 text-gray-500" />
                사용자
              </Link>
              <Link href="/dashboard/settings" className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-gray-100">
                <Settings className="w-5 h-5 mr-3 text-gray-500" />
                설정
              </Link>
            </nav>
          </div>
        </div>
      </Sidebar>
      
      {/* 메인 콘텐츠 */}
      <div className="flex flex-col md:pl-64 w-full">
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
} 