"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { SheetTitle } from "@/components/ui/sheet";

const menuItems = [
    { name: "셀프 성장 시스템", href: "/shop/customer-manager", icon: Users },
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
        </nav>
    </div>
  );
} 