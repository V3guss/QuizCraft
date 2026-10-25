"use client";

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, icon, type = "text", className, id, ...rest },
  ref
) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon}
          </span>
        )}
        <input
          id={id}
          ref={ref}
          type={isPassword && show ? "text" : type}
          className={cn(
            "h-11 w-full rounded-xl border bg-surface text-sm text-text-primary outline-none placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-blue-100",
            icon ? "pl-10" : "pl-3.5",
            isPassword ? "pr-11" : "pr-3.5",
            error ? "border-error" : "border-border-custom",
            className
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-text-secondary hover:text-primary"
            aria-label="แสดง/ซ่อนรหัสผ่าน"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
});

export default Input;
