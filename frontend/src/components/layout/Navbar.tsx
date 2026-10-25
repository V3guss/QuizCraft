"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "#home", label: "หน้าแรก" },
  { href: "#features", label: "ฟีเจอร์" },
  { href: "#how", label: "วิธีใช้งาน" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 bg-surface/90 backdrop-blur", scrolled ? "shadow-sm" : "border-b border-transparent")}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-text-secondary hover:text-primary">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="rounded-xl border border-border-custom px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
            ลงทะเบียน
          </Link>
        </div>
        <button className="cursor-pointer md:hidden" onClick={() => setOpen((o) => !o)} aria-label="เมนู">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="space-y-1 border-t border-border-custom bg-surface px-5 py-4 md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-primary-light">
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="flex-1 rounded-xl border border-border-custom py-2 text-center text-sm">เข้าสู่ระบบ</Link>
            <Link href="/register" className="flex-1 rounded-xl bg-primary py-2 text-center text-sm text-white">ลงทะเบียน</Link>
          </div>
        </div>
      )}
    </header>
  );
}
