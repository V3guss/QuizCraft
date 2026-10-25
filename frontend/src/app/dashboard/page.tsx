"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, FolderOpen, Layers, HelpCircle, UploadCloud, PenTool, ArrowRight, Activity } from "lucide-react";
import Card from "@/components/ui/Card";
import FileIcon from "@/components/ui/FileIcon";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import dashboardService from "@/services/dashboard.service";
import documentService from "@/services/document.service";
import summaryService from "@/services/summary.service";
import type { DashboardStats, DocumentItem, HistoryItem, SummaryItem } from "@/lib/types";
import { formatBytes, formatDate, formatDateTime } from "@/lib/utils";

const actionLabel: Record<string, string> = {
  upload_document: "อัปโหลดเอกสาร",
  create_summary: "สร้างสรุป",
  view_summary: "เปิดอ่านสรุป",
  take_quiz: "ทำแบบทดสอบ",
  review_flashcard: "ทบทวน Flashcard",
};

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [sums, setSums] = useState<SummaryItem[]>([]);
  const [activity, setActivity] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      documentService.getRecent(),
      summaryService.getRecent(),
      dashboardService.getActivity(),
    ])
      .then(([s, d, su, a]) => {
        setStats(s); setDocs(d); setSums(su); setActivity(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="กำลังโหลดข้อมูล..." />;

  const cards = [
    { label: "เอกสารทั้งหมด", value: stats?.documents ?? 0, icon: FolderOpen, tone: "bg-blue-500/10 text-primary" },
    { label: "สรุปทั้งหมด", value: stats?.summaries ?? 0, icon: FileText, tone: "bg-green-500/10 text-success" },
    { label: "Flashcards", value: stats?.flashcards ?? 0, icon: Layers, tone: "bg-indigo-500/10 text-indigo-600" },
    { label: "แบบทดสอบ", value: stats?.quizzes ?? 0, icon: HelpCircle, tone: "bg-sky-500/10 text-sky-600" },
  ];

  const actions = [
    { href: "/dashboard/upload", label: "อัปโหลดเอกสาร", icon: UploadCloud },
    { href: "/dashboard/create-summary", label: "สร้างสรุปใหม่", icon: PenTool },
    { href: "/dashboard/summaries", label: "ดูสรุปของฉัน", icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-navy p-7 text-white">
        <h1 className="text-2xl font-bold">สวัสดี, {user?.name}!</h1>
        <p className="mt-1 text-blue-200">พร้อมเตรียมสอบวันนี้หรือยัง?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
            <p className="text-2xl font-bold text-heading">{value}</p>
            <p className="text-sm text-text-secondary">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="card-hover group flex items-center justify-between rounded-2xl border border-border-custom bg-surface p-4">
            <span className="flex items-center gap-3 font-medium text-heading"><Icon className="h-5 w-5 text-primary" />{label}</span>
            <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-primary" />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-semibold text-heading">เอกสารล่าสุด</h2>
          {docs.length === 0 ? (
            <EmptyState icon={<FolderOpen />} title="ยังไม่มีเอกสาร" description="อัปโหลดเอกสารแรกเพื่อเริ่มต้น" />
          ) : (
            <Card className="divide-y divide-border-custom">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-4">
                  <FileIcon type={d.fileType} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-text-secondary">{d.subject?.name} • {formatBytes(d.fileSize)} • {formatDate(d.createdAt)}</p>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-heading">สรุปล่าสุด</h2>
          {sums.length === 0 ? (
            <EmptyState icon={<FileText />} title="ยังไม่มีสรุป" description="สรุปที่สร้างด้วย AI จะแสดงที่นี่" />
          ) : (
            <Card className="divide-y divide-border-custom">
              {sums.map((s) => (
                <Link key={s.id} href={`/dashboard/summaries/${s.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-primary-light/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-text-secondary">{s.subject?.name} • {formatDate(s.createdAt)}</p>
                  </div>
                  <Badge>{s.language === "th" ? "ไทย" : "EN"}</Badge>
                </Link>
              ))}
            </Card>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-heading"><Activity className="h-4 w-4 text-primary" />กิจกรรมการเรียนล่าสุด</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-text-secondary">ยังไม่มีกิจกรรม</p>
        ) : (
          <Card className="divide-y divide-border-custom">
            {activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 text-sm">
                <span>{actionLabel[a.action] || a.action}</span>
                <span className="text-xs text-text-secondary">{formatDateTime(a.createdAt)}</span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
