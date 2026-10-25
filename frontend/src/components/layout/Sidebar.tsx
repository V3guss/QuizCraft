"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, FolderOpen, PenTool, FileText, Layers,
  HelpCircle, Clock, Settings, LogOut, ShieldCheck,
} from "lucide-react";
import Logo from "./Logo";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/subjects", label: "วิชาของฉัน", icon: BookOpen },
  { href: "/dashboard/documents", label: "เอกสารของฉัน", icon: FolderOpen },
  { href: "/dashboard/create-summary", label: "สร้างสรุป", icon: PenTool },
  { href: "/dashboard/summaries", label: "สรุปของฉัน", icon: FileText },
  { href: "/dashboard/flashcards", label: "Flashcards", icon: Layers },
  { href: "/dashboard/quiz", label: "แบบทดสอบ", icon: HelpCircle },
  { href: "/dashboard/history", label: "ประวัติการเรียน", icon: Clock },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  const menu = user?.role === "ADMIN"
    ? [...items.slice(0, -1), { href: "/dashboard/admin", label: "จัดการระบบ", icon: ShieldCheck }, items[items.length - 1]]
    : items;

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="px-6 py-5"><Logo /></div>
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-primary-light p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-white">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-heading">{user?.name}</p>
          <p className="text-xs text-text-secondary">{user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : user?.role === "TEACHER" ? "อาจารย์" : "นักศึกษา"}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {menu.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium",
              isActive(href) ? "bg-primary text-white shadow-sm shadow-blue-600/25" : "text-text-secondary hover:bg-primary-light hover:text-primary"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border-custom p-4">
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-secondary hover:bg-red-500/10 hover:text-error"
        >
          <LogOut className="h-[18px] w-[18px]" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
