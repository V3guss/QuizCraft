import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  blue: "bg-primary-light text-primary",
  green: "bg-green-500/10 text-success",
  gray: "bg-muted text-text-secondary",
  red: "bg-red-500/10 text-error",
  navy: "bg-navy text-white",
};

export default function Badge({
  tone = "blue",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
