"use client";

import Link from "next/link";
import { Users, Camera, ShoppingBag } from "lucide-react";
import { SheetTitle } from "@/components/ui/sheet";
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

interface ShopMobileMenuProps {
    setMobileMenuOpen: (open: boolean) => void;
}

export default function ShopMobileMenu({ setMobileMenuOpen }: ShopMobileMenuProps) {
    const handleLinkClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="p-4 pt-8">
            <SheetTitle className="text-lg font-semibold mb-4 px-2">Shop Menu</SheetTitle>
            <nav className="flex flex-col space-y-2">
                {/* 메인 메뉴 */}
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleLinkClick}
                        className="flex items-center p-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
                    >
                        <item.icon className="mr-3 h-6 w-6" />
                        {item.name}
                    </Link>
                ))}
                
                {/* 외부 링크 섹션 */}
                <div className="pt-4">
                    <div className="text-xs font-semibold leading-6 text-gray-400 mb-2 px-3">
                        외부 링크
                    </div>
                    <div className="space-y-2">
                        {externalLinks.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleLinkClick}
                                className="flex items-center p-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100"
                            >
                                <item.icon className="mr-3 h-6 w-6" />
                                {item.name}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>
        </div>
    );
} 