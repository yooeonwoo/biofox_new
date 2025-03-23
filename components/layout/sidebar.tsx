import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  // 관리자 메뉴
  const adminMenuItems = [
    { label: "대시보드", href: "/admin/dashboard" },
    { label: "사용자 관리", href: "/admin/dashboard/user-management" },
    { label: "KOL 관리", href: "/admin/dashboard/kols" },
    { label: "전문점 관리", href: "/admin/dashboard/shops" },
    { label: "화이트리스트", href: "/admin/dashboard/whitelist" },
  ];

  // KOL 메뉴
  const kolMenuItems = [
    { label: "대시보드", href: "/kol/dashboard" },
    { label: "내 전문점", href: "/kol/dashboard/shops" },
    { label: "수당 내역", href: "/kol/dashboard/commissions" },
    { label: "프로필", href: "/kol/dashboard/profile" },
  ];

  // 현재 역할에 맞는 메뉴 선택
  const menuItems = role === "본사관리자" ? adminMenuItems : kolMenuItems;

  return (
    <div className="h-full w-64 bg-gray-900 text-white p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">BIOFOX KOL</h1>
        <p className="text-sm text-gray-400">
          {role === "본사관리자" ? "관리자 모드" : "KOL 모드"}
        </p>
      </div>

      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block p-2 rounded transition-colors ${
                  pathname === item.href
                    ? "bg-blue-700 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-sm text-gray-500 text-center">
          &copy; {new Date().getFullYear()} BIOFOX
        </p>
      </div>
    </div>
  );
} 