"use client";

import { useRouter } from "next/navigation";
import { DragEvent, useEffect, useRef, useState } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FileIcon from "@/components/ui/FileIcon";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import documentService from "@/services/document.service";
import subjectService from "@/services/subject.service";
import type { Subject } from "@/lib/types";
import { cn, errorMessage, formatBytes } from "@/lib/utils";

const ALLOWED = [".pdf", ".docx", ".pptx", ".txt"];
type Status = "idle" | "uploading" | "done" | "error";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [maxSize, setMaxSize] = useState(20 * 1024 * 1024);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    subjectService.getAll().then(setSubjects).catch(() => {});
    api.get<{ data: { maxFileSize: number } }>("/config").then((r) => setMaxSize(r.data.data.maxFileSize)).catch(() => {});
  }, []);

  const pick = (f?: File) => {
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setFile(null);
      return setFileError("รองรับเฉพาะไฟล์ PDF, DOCX, PPTX และ TXT");
    }
    if (f.size > maxSize) {
      setFile(null);
      return setFileError(`ไฟล์มีขนาดเกิน ${formatBytes(maxSize)}`);
    }
    setFileError("");
    setFile(f);
    setStatus("idle");
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!file) return toast.error("กรุณาเลือกไฟล์");
    if (!subjectId) return toast.error("กรุณาเลือกวิชา");
    if (!title.trim()) return toast.error("กรุณากรอกชื่อบทเรียน");
    setStatus("uploading");
    setProgress(0);
    try {
      await documentService.upload({ file, title: title.trim(), subjectId, description: description.trim() || undefined }, setProgress);
      setStatus("done");
      toast.success("อัปโหลดเอกสารสำเร็จ");
      setTimeout(() => router.push("/dashboard/documents"), 900);
    } catch (e) {
      setStatus("error");
      toast.error(errorMessage(e, "อัปโหลดไม่สำเร็จ"));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">อัปโหลดเอกสาร</h1>
        <p className="mt-1 text-sm text-text-secondary">
          อัปโหลดไฟล์เอกสารที่ได้รับจากอาจารย์ใน Google Classroom เพื่อให้ AI ช่วยสรุปเนื้อหาสำหรับเตรียมสอบ
        </p>
      </div>

      <Card className="p-6">
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center",
              dragging ? "border-primary bg-primary-light" : "border-border-custom hover:border-primary hover:bg-primary-light/40"
            )}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary"><UploadCloud className="h-7 w-7" /></div>
            <p className="font-medium text-heading">ลากไฟล์มาวางที่นี่ หรือ</p>
            <Button type="button" variant="secondary" size="sm" className="mt-3">เลือกไฟล์</Button>
            <p className="mt-4 text-xs text-text-secondary">รองรับ PDF, DOCX, PPTX, TXT • ขนาดสูงสุด {formatBytes(maxSize)}</p>
            <input ref={inputRef} type="file" accept={ALLOWED.join(",")} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-border-custom p-4">
            <FileIcon type={file.name.split(".").pop() || ""} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-xs text-text-secondary">{(file.name.split(".").pop() || "").toUpperCase()} • {formatBytes(file.size)}</p>
              {status === "uploading" && (
                <div className="mt-2">
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                  <p className="mt-1 text-xs text-text-secondary">กำลังอัปโหลด {progress}%{progress === 100 && " • กำลังอ่านเนื้อหา..."}</p>
                </div>
              )}
              {status === "done" && <p className="mt-1 flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" />อัปโหลดสำเร็จ</p>}
              {status === "error" && <p className="mt-1 flex items-center gap-1 text-xs text-error"><AlertCircle className="h-3.5 w-3.5" />อัปโหลดไม่สำเร็จ</p>}
            </div>
            {status !== "uploading" && status !== "done" && (
              <button onClick={() => setFile(null)} className="cursor-pointer rounded-lg p-2 text-text-secondary hover:bg-red-500/10 hover:text-error" aria-label="ลบไฟล์"><X className="h-5 w-5" /></button>
            )}
          </div>
        )}
        {fileError && <p className="mt-3 flex items-center gap-1.5 text-sm text-error"><AlertCircle className="h-4 w-4" />{fileError}</p>}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">ชื่อวิชา</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-11 w-full rounded-xl border border-border-custom bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100">
              <option value="">เลือกวิชา</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {subjects.length === 0 && <p className="mt-1 text-xs text-text-secondary">ยังไม่มีวิชา — <a href="/dashboard/subjects" className="text-primary hover:underline">เพิ่มวิชาก่อน</a></p>}
          </div>
          <Input label="ชื่อบทเรียน" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น บทที่ 3 Binary Search Tree" />
          <div>
            <label className="mb-1.5 block text-sm font-medium">คำอธิบายเพิ่มเติม <span className="text-text-secondary">(ไม่บังคับ)</span></label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-border-custom p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-blue-100" />
          </div>
        </div>

        <Button className="mt-6 w-full" size="lg" loading={status === "uploading"} disabled={status === "done"} onClick={submit}>อัปโหลดเอกสาร</Button>
      </Card>
    </div>
  );
}
