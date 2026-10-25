"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Pencil, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Markdown from "@/components/ui/Markdown";
import summaryService from "@/services/summary.service";
import type { SummaryItem } from "@/lib/types";
import { errorMessage, formatDate } from "@/lib/utils";

const levelLabel = { brief: "สรุปสั้น", standard: "มาตรฐาน", detailed: "ละเอียด" };

export default function SummaryReaderPage() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<SummaryItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    summaryService.getById(id).then((d) => {
      setS(d); setTitle(d.title); setContent(d.content);
      if (p.get("edit")) setEditing(true);
      if (p.get("print")) setTimeout(() => window.print(), 600);
    }).catch((e) => toast.error(errorMessage(e, "ไม่พบสรุป")));
  }, [id]);

  const toc = useMemo(
    () => (s?.content || "").split("\n").filter((l) => /^#{1,2}\s/.test(l)).map((l) => l.replace(/^#+\s*/, "")),
    [s?.content]
  );

  const save = async () => {
    setSaving(true);
    try {
      const d = await summaryService.update(id, { title, content });
      setS({ ...s!, ...d });
      setEditing(false);
      toast.success("บันทึกการแก้ไขแล้ว");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!s) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/summaries" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary"><ArrowLeft className="h-4 w-4" />ย้อนกลับ</Link>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setTitle(s.title); setContent(s.content); }}><X className="h-4 w-4" />ยกเลิก</Button>
              <Button loading={saving} onClick={save}><Save className="h-4 w-4" />บันทึก</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />แก้ไข</Button>
              <Button onClick={() => window.print()}><Download className="h-4 w-4" />ดาวน์โหลด PDF</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <Card className="print-card p-6 md:p-10">
          {editing ? (
            <div className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-xl border border-border-custom px-3 text-lg font-semibold outline-none focus:border-primary" />
              <p className="text-xs text-text-secondary">แก้ไขได้ด้วย Markdown (# หัวข้อ, - รายการ, **ตัวหนา**)</p>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={28} className="w-full rounded-xl border border-border-custom p-4 font-mono text-sm leading-relaxed outline-none focus:border-primary" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-heading">{s.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-border-custom pb-5">
                {s.subject && <Badge tone="navy">{s.subject.name}</Badge>}
                <Badge>{s.language === "th" ? "ไทย" : "English"}</Badge>
                <Badge tone="gray">{levelLabel[s.detailLevel]}</Badge>
                <span className="text-xs text-text-secondary">{formatDate(s.createdAt)}</span>
              </div>
              <Markdown>{s.content}</Markdown>
              <p className="mt-10 border-t border-border-custom pt-3 text-center text-xs text-text-secondary">สร้างด้วย QuizCraft AI</p>
            </>
          )}
        </Card>

        {!editing && toc.length > 0 && (
          <aside className="no-print hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border-custom bg-surface p-4">
              <p className="mb-2 text-sm font-semibold text-heading">สารบัญ</p>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {toc.map((t, i) => <li key={i} className="line-clamp-2">{t}</li>)}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
