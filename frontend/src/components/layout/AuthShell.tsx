import { ReactNode } from "react";
import Logo from "@/components/layout/Logo";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-border-custom bg-surface p-8 shadow-[0_10px_40px_-12px_rgba(23,37,84,0.15)]">
          <h1 className="text-2xl font-bold text-heading">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-text-secondary">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
