"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
    { name: "셀프 성장 시스템", href: "/shop/customer-manager", icon: Users },
    // { name: "대시보드", href: "/shop", icon: Home },
];

export default function ShopSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-60 bg-white border-r border-gray-200 flex-col hidden md:flex shrink-0">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-center">전문점 관리</h2>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => (
                    <Button
                        key={item.name}
                        asChild
                        variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                        className="w-full justify-start text-base"
                    >
                        <Link href={item.href}>
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </Link>
                    </Button>
                ))}
            </nav>
        </aside>
    );
} 