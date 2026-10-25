import Link from "next/link";
import { useId } from "react";

/** QuizCraft AI mark: a gradient squircle holding a "Q" whose tail is a pencil, plus an AI spark. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="30" y1="6" x2="42" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#A5F3FC" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#g${id})`} />
      <rect x="1" y="1" width="46" height="46" rx="13" stroke="white" strokeOpacity="0.18" strokeWidth="2" />
      {/* Q ring */}
      <circle cx="22" cy="24" r="10.5" stroke="white" strokeWidth="4.2" />
      {/* pencil tail */}
      <path d="M28.5 30.5L36.5 38.5" stroke="white" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M35 37L39 41" stroke="#A5F3FC" strokeWidth="4.2" strokeLinecap="round" />
      {/* AI spark */}
      <path d="M35 7.5l1.7 4.3 4.3 1.7-4.3 1.7L35 19.5l-1.7-4.3-4.3-1.7 4.3-1.7z" fill={`url(#s${id})`} />
    </svg>
  );
}

export default function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark size={38} className="drop-shadow-[0_6px_10px_rgba(79,70,229,0.45)]" />
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-heading"}`}>
        QuizCraft<span className="text-gradient"> AI</span>
      </span>
    </Link>
  );
}
