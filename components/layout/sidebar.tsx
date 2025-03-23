import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState, ReactNode } from "react";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Users, 
  BadgeCheck, 
  Store, 
  Shield, 
  CreditCard, 
  User,
  ChevronDown,
  ChevronRight,
  X,
  DollarSign,
  BarChart
} from "lucide-react";
import { FoxLogo } from '@/components/ui/fox-logo';
import { AuroraText } from '@/components/ui/aurora-gradient';
import { cn } from '@/lib/utils';

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  label: string;
  href: string;
  icon: ReactNode;
  isGroup?: boolean;
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  role: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ role, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "사용자 관리": false,
    "KOL 관리": true,
    "전문점 관리": false
  });

  // 관리자 메뉴
  const adminMenuItems: MenuItem[] = [
    { 
      label: "대시보드", 
      href: "/admin", 
      icon: <LayoutDashboard size={18} /> 
    },
    { 
      label: "사용자 관리", 
      href: "/admin/user-management", 
      icon: <Users size={18} />,
      isGroup: true,
      subItems: [
        { label: "모든 사용자", href: "/admin/user-management" }
      ]
    },
    { 
      label: "KOL 관리", 
      href: "/admin/kols", 
      icon: <BadgeCheck size={18} />,
      isGroup: true,
      subItems: [
        { label: "모든 KOL", href: "/admin/kols" }
      ]
    },
    { 
      label: "전문점 관리", 
      href: "/admin/stores", 
      icon: <Store size={18} /> 
    },
    { 
      label: "매출 관리", 
      href: "/admin/sales", 
      icon: <DollarSign size={18} /> 
    }
  ];

  // KOL 메뉴
  const kolMenuItems: MenuItem[] = [
    { 
      label: "대시보드", 
      href: "/kol/dashboard", 
      icon: <LayoutDashboard size={18} /> 
    },
    { 
      label: "소속 전문점", 
      href: "/kol/stores", 
      icon: <Store size={18} /> 
    },
    { 
      label: "매출 현황", 
      href: "/kol/sales", 
      icon: <BarChart size={18} /> 
    },
    { 
      label: "수당 내역", 
      href: "/kol/dashboard/commissions", 
      icon: <CreditCard size={18} /> 
    },
    { 
      label: "프로필", 
      href: "/kol/dashboard/profile", 
      icon: <User size={18} /> 
    },
  ];

  // 현재 역할에 맞는 메뉴 선택
  const menuItems = role === "본사관리자" ? adminMenuItems : kolMenuItems;

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-purple-800 flex flex-col 
    transition-transform duration-300 ease-in-out shadow-xl
    md:relative md:transform-none md:shadow-none
    ${isMobileOpen ? 'transform-none' : '-translate-x-full md:translate-x-0'}
  `;

  const mainMenuItems = [
    {
      label: '관리자 모드',
      url: '/admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
      isActive: pathname?.startsWith('/admin'),
    },
    {
      label: '대시보드',
      url: '/admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      isActive: pathname === '/admin',
    },
    {
      label: '사용자 관리',
      url: '/admin/user-management',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      isActive: pathname === '/admin/user-management',
    },
    {
      label: 'KOL 관리',
      url: '/admin/kols',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      isActive: pathname === '/admin/kols',
    },
    {
      label: '전문점 관리',
      url: '/admin/stores',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
          <path d="M12 3v6" />
        </svg>
      ),
      isActive: pathname === '/admin/stores',
    },
    {
      label: '매출 관리',
      url: '/admin/sales',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      isActive: pathname === '/admin/sales',
    }
  ];

  const renderMenuItems = () => {
    return mainMenuItems.map((item, index) => (
      <li key={index} className="my-1">
        <Link
          href={item.url}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
            'text-gray-300 hover:text-purple-800',
            item.isActive
              ? 'bg-gradient-to-r from-purple-900/70 to-indigo-900/50 text-purple-800 shadow-inner'
              : 'hover:bg-white/5'
          )}
          onClick={onCloseMobile}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span>{item.label}</span>
          {item.isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-300"></span>
          )}
        </Link>
      </li>
    ));
  };

  return (
    <div className={sidebarClasses}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FoxLogo className="h-8 w-8" />
          <h1 className="text-xl font-bold biofox-gradient-text">
            <AuroraText text="BIOFOX" className="text-xl font-semibold" />
          </h1>
        </div>
        <button 
          onClick={onCloseMobile} 
          className="md:hidden text-gray-400 hover:text-purple-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="p-4">
          <div className="mb-4 p-3 rounded-lg bg-gray-800/50">
            <p className="text-sm font-medium text-gray-200">
              {role === "본사관리자" ? "관리자 모드" : "KOL 모드"}
            </p>
            <p className="text-xs text-purple-400 mt-1">
              {role === "본사관리자" ? "전체 시스템 관리" : "파트너십 관리"}
            </p>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Fragment key={item.href}>
                {item.isGroup ? (
                  <div className="mb-1">
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-md transition-colors
                        ${pathname.includes(item.href) ? 'bg-purple-900/50 text-purple-200' : 'text-gray-300 hover:bg-gray-800'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-purple-400">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span>
                        {expandedGroups[item.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    
                    {expandedGroups[item.label] && item.subItems && (
                      <div className="mt-1 ml-9 space-y-1 animate-slide-in-right">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block p-2 rounded-md text-sm transition-colors
                              ${pathname === subItem.href 
                                ? 'bg-purple-900/30 text-purple-200' 
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 p-2.5 rounded-md transition-all duration-200
                      ${pathname === item.href 
                        ? 'bg-gradient-to-r from-purple-900/70 to-purple-800/50 text-purple-800 shadow-inner' 
                        : 'text-gray-300 hover:bg-gray-800 hover:translate-x-1'}`}
                  >
                    <span className={pathname === item.href ? 'text-purple-300' : 'text-purple-500'}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )}
              </Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center justify-center">
          <p className="text-xs text-gray-500 text-center">
            &copy; {new Date().getFullYear()} BIOFOX
          </p>
        </div>
      </div>
    </div>
  );
} 