"use client";

import { Menu, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardHeader({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/dashboard/summaries?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border-custom bg-surface/90 px-4 backdrop-blur md:px-8">
      <button onClick={onMenu} className="cursor-pointer rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="เมนู">
        <Menu className="h-5 w-5" />
      </button>
      <form onSubmit={submit} className="relative max-w-md flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาสรุปของคุณ..."
          className="h-10 w-full rounded-xl border border-border-custom bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:bg-surface"
        />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-text-primary">{user?.name}</p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
