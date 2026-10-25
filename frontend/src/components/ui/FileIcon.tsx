import { FileText, FileType2, Presentation, FileCode2 } from "lucide-react";

export function fileKind(type: string): "pdf" | "docx" | "pptx" | "txt" {
  const t = type.replace(".", "").toLowerCase();
  return (["pdf", "docx", "pptx"].includes(t) ? t : "txt") as "pdf" | "docx" | "pptx" | "txt";
}

const map = {
  pdf: { Icon: FileText, cls: "bg-red-500/10 text-red-600" },
  docx: { Icon: FileType2, cls: "bg-blue-500/10 text-blue-600" },
  pptx: { Icon: Presentation, cls: "bg-orange-500/10 text-orange-600" },
  txt: { Icon: FileCode2, cls: "bg-muted text-slate-600" },
};

export default function FileIcon({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  const { Icon, cls } = map[fileKind(type)];
  const box = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-xl ${box} ${cls}`}>
      <Icon className={size === "lg" ? "h-7 w-7" : "h-5 w-5"} />
    </div>
  );
}
