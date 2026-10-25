"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Plus, Trash2, PenTool, LayoutGrid, List } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import FileIcon from "@/components/ui/FileIcon";
import documentService from "@/services/document.service";
import subjectService from "@/services/subject.service";
import type { DocumentItem, Subject } from "@/lib/types";
import { cn, errorMessage, formatBytes, formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [grid, setGrid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<DocumentItem | null>(null);

  useEffect(() => {
    setSubjectId(new URLSearchParams(window.location.search).get("subjectId") || "");
    subjectService.getAll().then(setSubjects).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    documentService.getAll(subjectId || undefined).then(setDocs).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, [subjectId]);
  useEffect(load, [load]);

  const remove = async () => {
    if (!deleting) return;
    try {
      await documentService.remove(deleting.id);
      toast.success("ลบเอกสารแล้ว");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const actions = (d: DocumentItem) => (
    <div className="flex gap-2">
      <Link href={`/dashboard/create-summary?documentId=${d.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-light px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
        <PenTool className="h-3.5 w-3.5" />สร้างสรุป
      </Link>
      <button onClick={() => setDeleting(d)} className="cursor-pointer rounded-lg p-1.5 text-text-secondary hover:bg-red-500/10 hover:text-error" aria-label="ลบ"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-heading">เอกสารของฉัน</h1>
          <p className="text-sm text-text-secondary">เอกสารที่อัปโหลดทั้งหมด</p>
        </div>
        <Link href="/dashboard/upload"><Button><Plus className="h-4 w-4" />อัปโหลดเอกสาร</Button></Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-11 rounded-xl border border-border-custom bg-surface px-3 text-sm outline-none focus:border-primary">
          <option value="">ทุกวิชา</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="ml-auto flex rounded-xl border border-border-custom bg-surface p-1">
          {[{ v: true, I: LayoutGrid }, { v: false, I: List }].map(({ v, I }) => (
            <button key={String(v)} onClick={() => setGrid(v)} className={cn("cursor-pointer rounded-lg p-2", grid === v ? "bg-primary text-white" : "text-text-secondary")}><I className="h-4 w-4" /></button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : docs.length === 0 ? (
        <EmptyState icon={<FolderOpen />} title="ไม่พบเอกสาร" description="อัปโหลดไฟล์จาก Google Classroom เพื่อเริ่มต้น" action={<Link href="/dashboard/upload"><Button>อัปโหลดเอกสาร</Button></Link>} />
      ) : grid ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Card key={d.id} hover className="p-5">
              <div className="flex items-start gap-3">
                <FileIcon type={d.fileType} size="lg" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-heading">{d.title}</h3>
                  <p className="truncate text-sm text-text-secondary">{d.subject?.name}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-secondary">{d.fileType.replace(".", "").toUpperCase()} • {formatBytes(d.fileSize)} • {formatDate(d.createdAt)}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-text-secondary">{d._count?.summaries ?? 0} สรุป</span>
                {actions(d)}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-border-custom">
          {docs.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-4 p-4">
              <FileIcon type={d.fileType} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="text-xs text-text-secondary">{d.subject?.name} • {formatBytes(d.fileSize)} • {formatDate(d.createdAt)}</p>
              </div>
              {actions(d)}
            </div>
          ))}
        </Card>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="ลบเอกสาร">
        <p className="text-sm text-text-secondary">ต้องการลบ “{deleting?.title}” ใช่หรือไม่? สรุปที่สร้างจากเอกสารนี้จะถูกลบด้วย</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>ยกเลิก</Button>
          <Button variant="danger" onClick={remove}>ลบเอกสาร</Button>
        </div>
      </Modal>
    </div>
  );
}
