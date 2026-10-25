import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Card({
  className,
  hover,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-custom bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
        hover && "card-hover",
        className
      )}
      {...rest}
    />
  );
}
