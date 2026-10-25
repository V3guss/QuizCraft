"use client";

import { useEffect, useState } from "react";
import { Clock, UploadCloud, PenTool, Eye, HelpCircle, Layers } from "lucide-react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import dashboardService from "@/services/dashboard.service";
import type { HistoryItem } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const meta: Record<string, { label: string; icon: typeof Clock }> = {
  upload_document: { label: "อัปโหลดเอกสาร", icon: UploadCloud },
  create_summary: { label: "สร้างสรุป", icon: PenTool },
  view_summary: { label: "เปิดอ่านสรุป", icon: Eye },
  take_quiz: { label: "ทำแบบทดสอบ", icon: HelpCircle },
  review_flashcard: { label: "ทบทวน Flashcard", icon: Layers },
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getActivity().then(setItems).finally(() => setLoading(false));
  }, []);

  const shown = filter ? items.filter((i) => i.action === filter) : items;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">ประวัติการเรียน</h1>
        <p className="text-sm text-text-secondary">กิจกรรมล่าสุดของคุณ</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[["", "ทั้งหมด"], ...Object.entries(meta).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("cursor-pointer rounded-full border px-3.5 py-1.5 text-xs", filter === k ? "border-primary bg-primary text-white" : "border-border-custom bg-surface hover:border-primary")}>{l}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : shown.length === 0 ? (
        <EmptyState icon={<Clock />} title="ยังไม่มีกิจกรรม" />
      ) : (
        <Card className="p-5">
          <ol className="relative space-y-5 border-l border-border-custom pl-6">
            {shown.map((i) => {
              const m = meta[i.action] || { label: i.action, icon: Clock };
              const Icon = m.icon;
              return (
                <li key={i.id} className="relative">
                  <span className="absolute -left-9.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary ring-4 ring-surface"><Icon className="h-3.5 w-3.5" /></span>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-text-secondary">{formatDateTime(i.createdAt)}</p>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}
