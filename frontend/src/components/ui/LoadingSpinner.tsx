import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-secondary">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
