"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PenTool, Sparkles, FolderOpen, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import FileIcon from "@/components/ui/FileIcon";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Markdown from "@/components/ui/Markdown";
import documentService from "@/services/document.service";
import summaryService from "@/services/summary.service";
import type { DocumentItem, SummaryItem } from "@/lib/types";
import { cn, errorMessage, formatBytes } from "@/lib/utils";

type Level = "brief" | "standard" | "detailed";
const levels: { v: Level; l: string; d: string }[] = [
  { v: "brief", l: "สรุปสั้น", d: "เฉพาะประเด็นหลัก" },
  { v: "standard", l: "มาตรฐาน", d: "ครบทุกหัวข้อสำคัญ" },
  { v: "detailed", l: "ละเอียด", d: "อธิบายเชิงลึกพร้อมตัวอย่าง" },
];

export default function CreateSummaryPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentId, setDocumentId] = useState("");
  const [language, setLanguage] = useState<"th" | "en">("th");
  const [level, setLevel] = useState<Level>("standard");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SummaryItem | null>(null);

  useEffect(() => {
    setDocumentId(new URLSearchParams(window.location.search).get("documentId") || "");
    documentService.getAll().then(setDocs).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    if (!documentId) return toast.error("กรุณาเลือกเอกสาร");
    setGenerating(true);
    try {
      setResult(await summaryService.generate({ documentId, language, detailLevel: level }));
      toast.success("สร้างสรุปสำเร็จ และบันทึกแล้ว");
    } catch (e) {
      toast.error(errorMessage(e, "สร้างสรุปไม่สำเร็จ"));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (result)
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-heading">{result.title}</h1>
            <p className="text-sm text-success">บันทึกลงในสรุปของฉันแล้ว</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setResult(null)}>สร้างอีกชุด</Button>
            <Link href={`/dashboard/summaries/${result.id}?edit=1`}><Button><Pencil className="h-4 w-4" />แก้ไขและบันทึก</Button></Link>
            <Link href={`/dashboard/summaries/${result.id}`}><Button variant="secondary">เปิดอ่าน</Button></Link>
          </div>
        </div>
        <Card className="p-6 md:p-8"><Markdown>{result.content}</Markdown></Card>
      </div>
    );

  if (generating)
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-light text-primary">
          <Sparkles className="h-9 w-9 animate-pulse" />
        </div>
        <h2 className="text-lg font-semibold text-heading">AI กำลังอ่านและสรุปเอกสาร...</h2>
        <p className="mt-1 text-sm text-text-secondary">อาจใช้เวลาสักครู่ขึ้นอยู่กับความยาวของเอกสาร</p>
        <div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] rounded-full bg-primary" /></div>
        <style>{`@keyframes slide{0%{margin-left:-35%}100%{margin-left:100%}}`}</style>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">สร้างสรุป</h1>
        <p className="mt-1 text-sm text-text-secondary">เลือกเอกสาร ตั้งค่า แล้วให้ AI สร้างชีทสรุปให้คุณ</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-heading">1. เลือกเอกสาร</h2>
        {docs.length === 0 ? (
          <EmptyState icon={<FolderOpen />} title="ยังไม่มีเอกสาร" description="อัปโหลดเอกสารก่อนสร้างสรุป" action={<Link href="/dashboard/upload"><Button>อัปโหลดเอกสาร</Button></Link>} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {docs.map((d) => (
              <button key={d.id} onClick={() => setDocumentId(d.id)} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border bg-surface p-3.5 text-left", documentId === d.id ? "border-primary ring-4 ring-blue-100" : "border-border-custom hover:border-primary")}>
                <FileIcon type={d.fileType} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="truncate text-xs text-text-secondary">{d.subject?.name} • {formatBytes(d.fileSize)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-heading">2. ตั้งค่าสรุป</h2>
        <Card className="space-y-5 p-5">
          <div>
            <p className="mb-2 text-sm font-medium">ภาษาที่ต้องการ</p>
            <div className="flex gap-3">
              {([["th", "ไทย"], ["en", "อังกฤษ"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setLanguage(v)} className={cn("flex-1 cursor-pointer rounded-xl border py-2.5 text-sm", language === v ? "border-primary bg-primary-light font-medium text-primary" : "border-border-custom")}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">ระดับความละเอียด</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {levels.map((x) => (
                <button key={x.v} onClick={() => setLevel(x.v)} className={cn("cursor-pointer rounded-xl border p-3 text-left", level === x.v ? "border-primary bg-primary-light" : "border-border-custom")}>
                  <p className={cn("text-sm font-medium", level === x.v && "text-primary")}>{x.l}</p>
                  <p className="text-xs text-text-secondary">{x.d}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <Button size="lg" className="w-full" disabled={!documentId} onClick={generate}><PenTool className="h-4 w-4" />สร้างสรุปด้วย AI</Button>
    </div>
  );
}
