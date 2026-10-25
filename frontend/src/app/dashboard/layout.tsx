"use client";

import { ReactNode, Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuthStore } from "@/stores/authStore";

function Shell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (isLoading || !isAuthenticated) return <LoadingSpinner label="à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”..." />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-70 border-r border-border-custom lg:block">
        <Sidebar />
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-70 shadow-xl"><Sidebar onNavigate={() => setMenuOpen(false)} /></div>
        </div>
      )}
      <div className="dash-content flex min-w-0 flex-1 flex-col lg:pl-70">
        <DashboardHeader onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner label="กำลังโหลด..." />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
