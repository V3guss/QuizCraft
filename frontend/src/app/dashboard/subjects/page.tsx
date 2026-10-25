"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Search, Pencil, Trash2, FolderOpen, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import subjectService from "@/services/subject.service";
import type { Subject } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

const colors = ["#2563EB", "#1E40AF", "#0EA5E9", "#6366F1", "#0F766E", "#475569"];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Subject | "new" | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: colors[0] });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    subjectService.getAll().then(setSubjects).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(
    () => subjects.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())),
    [subjects, query]
  );

  const openForm = (s: Subject | "new") => {
    setEditing(s);
    setForm(s === "new" ? { name: "", description: "", color: colors[0] } : { name: s.name, description: s.description || "", color: s.color || colors[0] });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("กรุณากรอกชื่อวิชา");
    setBusy(true);
    try {
      if (editing === "new") await subjectService.create(form);
      else if (editing) await subjectService.update(editing.id, form);
      toast.success("บันทึกวิชาแล้ว");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await subjectService.remove(deleting.id);
      toast.success("ลบวิชาแล้ว");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-heading">วิชาของฉัน</h1>
          <p className="text-sm text-text-secondary">จัดกลุ่มเอกสารและสรุปตามรายวิชา</p>
        </div>
        <Button onClick={() => openForm("new")}><Plus className="h-4 w-4" />เพิ่มวิชา</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาวิชา..." className="h-11 w-full rounded-xl border border-border-custom bg-surface pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100" />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<BookOpen />} title={query ? "ไม่พบวิชาที่ค้นหา" : "ยังไม่มีวิชา"} description="เพิ่มวิชาเพื่อเริ่มอัปโหลดเอกสาร" action={!query && <Button onClick={() => openForm("new")}><Plus className="h-4 w-4" />เพิ่มวิชา</Button>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} hover className="overflow-hidden">
              <div className="h-1.5" style={{ background: s.color || colors[0] }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-heading">{s.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openForm(s)} className="cursor-pointer rounded-lg p-1.5 text-text-secondary hover:bg-primary-light hover:text-primary" aria-label="แก้ไข"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleting(s)} className="cursor-pointer rounded-lg p-1.5 text-text-secondary hover:bg-red-500/10 hover:text-error" aria-label="ลบ"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-text-secondary">{s.description || "ไม่มีคำอธิบาย"}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5"><FolderOpen className="h-4 w-4" />{s._count?.documents ?? 0} เอกสาร</span>
                  <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" />{s._count?.summaries ?? 0} สรุป</span>
                </div>
                <Link href={`/dashboard/documents?subjectId=${s.id}`} className="mt-4 block rounded-xl bg-primary-light py-2 text-center text-sm font-medium text-primary hover:bg-primary/20">
                  เปิดดูเอกสาร
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "เพิ่มวิชา" : "แก้ไขวิชา"}>
        <div className="space-y-4">
          <Input label="ชื่อวิชา" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium">คำอธิบาย</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-border-custom p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100" />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">สี</p>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{ background: c }} className={`h-8 w-8 cursor-pointer rounded-full ${form.color === c ? "ring-2 ring-offset-2 ring-primary" : ""}`} aria-label={c} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)}>ยกเลิก</Button>
            <Button loading={busy} onClick={save}>บันทึก</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="ลบวิชา">
        <p className="text-sm text-text-secondary">ต้องการลบวิชา “{deleting?.name}” ใช่หรือไม่? เอกสารและสรุปในวิชานี้จะถูกลบด้วย</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>ยกเลิก</Button>
          <Button variant="danger" loading={busy} onClick={remove}>ลบวิชา</Button>
        </div>
      </Modal>
    </div>
  );
}
