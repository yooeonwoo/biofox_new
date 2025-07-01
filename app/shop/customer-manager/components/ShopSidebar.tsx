"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Camera, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoxLogo } from "@/components/ui/fox-logo";

const menuItems = [
    { name: "셀프 성장 시스템", href: "/shop/customer-manager", icon: Users },
    { name: "임상사진", href: "/shop/clinical-photos", icon: Camera },
];

const externalLinks = [
    {
        name: '전문가몰',
        href: 'https://biofoxpro.co.kr/',
        icon: ShoppingBag,
        external: true
    },
    {
        name: '폭시',
        href: 'https://ad.biofoxi.com/',
        icon: FoxLogo,
        external: true
    }
];

export default function ShopSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-60 bg-white border-r border-gray-200 flex-col hidden md:flex shrink-0">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-center">전문점 관리</h2>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {/* 메인 메뉴 */}
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
                
                {/* 외부 링크 섹션 */}
                <div className="pt-6">
                    <div className="text-xs font-semibold leading-6 text-gray-400 mb-2 px-3">
                        외부 링크
                    </div>
                    <div className="space-y-1">
                        {externalLinks.map((item) => (
                            <Button
                                key={item.name}
                                asChild
                                variant="ghost"
                                className="w-full justify-start text-base"
                            >
                                <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </a>
                            </Button>
                        ))}
                    </div>
                </div>
            </nav>
        </aside>
    );
} 