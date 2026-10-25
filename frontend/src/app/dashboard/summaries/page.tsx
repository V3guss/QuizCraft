"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Eye, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import summaryService from "@/services/summary.service";
import subjectService from "@/services/subject.service";
import type { Subject, SummaryItem } from "@/lib/types";
import { errorMessage, formatDate } from "@/lib/utils";

const levelLabel = { brief: "สั้น", standard: "มาตรฐาน", detailed: "ละเอียด" };

export default function SummariesPage() {
  const [items, setItems] = useState<SummaryItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<SummaryItem | null>(null);

  useEffect(() => {
    setQ(new URLSearchParams(window.location.search).get("q") || "");
    subjectService.getAll().then(setSubjects).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    summaryService.getAll(subjectId || undefined).then(setItems).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, [subjectId]);
  useEffect(load, [load]);

  const shown = useMemo(() => items.filter((s) => s.title.toLowerCase().includes(q.toLowerCase())), [items, q]);

  const remove = async () => {
    if (!deleting) return;
    try {
      await summaryService.remove(deleting.id);
      toast.success("ลบสรุปแล้ว");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-heading">สรุปของฉัน</h1>
          <p className="text-sm text-text-secondary">เปิดอ่านย้อนหลังได้ทุกเวลา</p>
        </div>
        <Link href="/dashboard/create-summary"><Button><Plus className="h-4 w-4" />สร้างสรุปใหม่</Button></Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-11 rounded-xl border border-border-custom bg-surface px-3 text-sm outline-none focus:border-primary">
          <option value="">ทุกวิชา</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อสรุป..." className="h-11 w-64 rounded-xl border border-border-custom bg-surface px-3 text-sm outline-none focus:border-primary" />
      </div>

      {loading ? <LoadingSpinner /> : shown.length === 0 ? (
        <EmptyState icon={<FileText />} title="ไม่พบสรุป" description="สร้างสรุปจากเอกสารที่อัปโหลดไว้" action={<Link href="/dashboard/create-summary"><Button>สร้างสรุป</Button></Link>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <Card key={s.id} hover className="flex flex-col p-5">
              <div className="flex flex-wrap gap-1.5">
                <Badge>{s.language === "th" ? "ไทย" : "English"}</Badge>
                <Badge tone="gray">{levelLabel[s.detailLevel]}</Badge>
                {s.isEdited && <Badge tone="green">แก้ไขแล้ว</Badge>}
              </div>
              <h3 className="mt-3 line-clamp-2 font-semibold text-heading">{s.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{s.subject?.name}</p>
              <p className="text-xs text-text-secondary">{formatDate(s.createdAt)}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Link href={`/dashboard/summaries/${s.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-light px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"><Eye className="h-3.5 w-3.5" />เปิดอ่าน</Link>
                <Link href={`/dashboard/summaries/${s.id}?edit=1`} className="rounded-lg border border-border-custom px-3 py-1.5 text-xs hover:border-primary">แก้ไข</Link>
                <Link href={`/dashboard/summaries/${s.id}?print=1`} className="rounded-lg border border-border-custom px-3 py-1.5 text-xs hover:border-primary">PDF</Link>
                <button onClick={() => setDeleting(s)} className="ml-auto cursor-pointer rounded-lg p-1.5 text-text-secondary hover:bg-red-500/10 hover:text-error" aria-label="ลบ"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="ลบสรุป">
        <p className="text-sm text-text-secondary">ต้องการลบ “{deleting?.title}” ใช่หรือไม่?</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>ยกเลิก</Button>
          <Button variant="danger" onClick={remove}>ลบสรุป</Button>
        </div>
      </Modal>
    </div>
  );
}
