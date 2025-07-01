"use client";
import { GraduationCap, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function HQTrainingDashboard() {
  const cards = [
    {
      href: "/hq-training/head-office",
      icon: <ClipboardCheck className="size-8 text-blue-600" />,
      label: "실무 교육",
    },
    {
      href: "/hq-training/expert",
      icon: <GraduationCap className="size-8 text-blue-600" />,
      label: "전문가 교육",
    },
  ];

  return (
    <section className="grid gap-4 place-items-center sm:grid-cols-2">
      {cards.map(({ href, icon, label }) => (
        <Link
          key={href}
          href={href}
          className="w-full max-w-[220px] h-[120px] flex flex-col items-center
                     justify-center gap-3 bg-white border rounded-lg shadow-sm
                     hover:shadow-md transition-shadow"
        >
          {icon}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </Link>
      ))}
    </section>
  );
} 