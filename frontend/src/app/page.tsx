import Link from "next/link";
import {
  Brain, Target, BookOpen, Download, Layers, GraduationCap,
  UploadCloud, Cpu, FileText, Check, ArrowRight, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Logo from "@/components/layout/Logo";

const features = [
  { icon: Brain, title: "AI Smart Summarization", desc: "สรุปเนื้อหาอัตโนมัติด้วย AI ที่เข้าใจบริบทเอกสาร" },
  { icon: Target, title: "Smart Key Points", desc: "ไฮไลต์ประเด็นสำคัญที่ควรจำก่อนสอบ" },
  { icon: BookOpen, title: "Study Notes", desc: "จัดระเบียบสรุปเป็นหมวดหมู่ตามวิชา เปิดอ่านย้อนหลังได้ทุกเวลา" },
  { icon: Download, title: "PDF Export", desc: "ดาวน์โหลดสรุปเป็น PDF ขนาด A4 พร้อมพิมพ์" },
  { icon: Layers, title: "Flashcards", desc: "สร้าง Flashcard สำหรับทบทวนคำศัพท์และแนวคิดสำคัญ" },
  { icon: GraduationCap, title: "Exam Preparation", desc: "สร้างแนวข้อสอบเพื่อทดสอบความรู้ของตัวเอง" },
];

const steps = [
  { icon: UploadCloud, title: "อัปโหลดเอกสาร", desc: "PDF, PPTX, DOCX, TXT" },
  { icon: Cpu, title: "ให้ AI วิเคราะห์", desc: "อ่านและแยกหัวข้อสำคัญ" },
  { icon: FileText, title: "รับชีทสรุป", desc: "แก้ไขและบันทึกได้" },
  { icon: Download, title: "ดาวน์โหลด PDF", desc: "อ่านก่อนสอบได้ทุกที่" },
];

function Mockup() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-border-custom bg-surface p-4 shadow-[0_20px_50px_-12px_rgba(23,37,84,0.2)]">
        <div className="mb-3 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted" /><span className="h-2.5 w-2.5 rounded-full bg-muted" /><span className="h-2.5 w-2.5 rounded-full bg-muted" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[["เอกสาร", "12"], ["สรุป", "8"], ["Flashcards", "64"]].map(([l, n]) => (
            <div key={l} className="rounded-xl bg-primary-light p-3">
              <p className="text-[11px] text-text-secondary">{l}</p>
              <p className="text-xl font-bold text-heading">{n}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-border-custom p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary">Summary Reader</span>
            <span className="text-[10px] text-text-secondary">Data Structures • บทที่ 3</span>
          </div>
          <p className="text-sm font-semibold text-heading">Binary Search Tree</p>
          <div className="mt-2 space-y-1.5">
            <div className="h-2 w-full rounded bg-muted" /><div className="h-2 w-11/12 rounded bg-muted" /><div className="h-2 w-3/4 rounded bg-muted" />
          </div>
          <div className="mt-3 rounded-lg border-l-4 border-primary bg-primary-light p-2.5 text-[11px] text-heading">
            ★ ประเด็นสำคัญ: การค้นหาใช้เวลา O(log n) เมื่อต้นไม้สมดุล
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-5 hidden w-44 rounded-xl border border-border-custom bg-surface p-3 shadow-lg sm:block">
        <p className="text-[10px] text-text-secondary">Flashcard</p>
        <p className="mt-1 text-xs font-semibold text-heading">AVL Tree คืออะไร?</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-surface">
      <Navbar />

      <section id="home" className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 lg:grid-cols-2 lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3.5 py-1.5 text-xs font-medium text-primary">
            <Brain className="h-3.5 w-3.5" /> AI Study Companion
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-heading sm:text-5xl">
            เปลี่ยนเอกสารเรียนให้เป็น<span className="text-primary">ชีทสรุปพร้อมสอบ</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-secondary">
            อัปโหลดเอกสารการเรียน ให้ AI ช่วยสรุปเนื้อหาสำคัญ เพื่อให้คุณอ่านเข้าใจและเตรียมสอบได้ง่ายขึ้น
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white shadow-sm shadow-blue-600/30 hover:bg-primary-dark">
              เริ่มสร้างสรุปฟรี <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="rounded-xl border border-border-custom px-6 py-3 font-medium text-text-primary hover:border-primary hover:text-primary">
              ดูวิธีใช้งาน
            </a>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
            {["ใช้งานฟรี", "ไม่ต้องติดตั้ง", "รองรับ PDF / DOCX / PPTX / TXT"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" />{t}</li>
            ))}
          </ul>
        </div>
        <Mockup />
      </section>

      <section id="features" className="bg-background py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-heading">ทุกอย่างที่ต้องใช้เตรียมสอบ</h2>
            <p className="mt-3 text-text-secondary">จากไฟล์เอกสารของอาจารย์ สู่ชีทสรุป Flashcard และแบบทดสอบในที่เดียว</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover rounded-2xl border border-border-custom bg-surface p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary"><Icon className="h-6 w-6" /></div>
                <h3 className="font-semibold text-heading">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold text-heading">ใช้งานง่ายใน 4 ขั้นตอน</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-text-secondary">
            ดาวน์โหลดไฟล์จาก Google Classroom แล้วอัปโหลดเข้ามาได้เลย
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative text-center">
                {i < steps.length - 1 && <ChevronRight className="absolute -right-5 top-6 hidden h-6 w-6 text-blue-200 md:block" />}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-navy text-white"><Icon className="h-7 w-7" /></div>
                <p className="mt-4 text-xs font-semibold text-primary">ขั้นตอนที่ {i + 1}</p>
                <h3 className="mt-1 font-semibold text-heading">{title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-navy px-8 py-14 text-center">
          <h2 className="text-3xl font-bold text-white">พร้อมเปลี่ยนการเตรียมสอบให้ง่ายขึ้น?</h2>
          <p className="mt-3 text-blue-200">สร้างชีทสรุปฉบับแรกของคุณได้ภายในไม่กี่นาที</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-surface px-7 py-3 font-medium text-heading hover:bg-primary-light">
            ลงทะเบียนเลย <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-custom bg-surface py-12">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-5 md:flex-row">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-text-secondary">ผู้ช่วย AI สำหรับสรุปเอกสารการเรียนและเตรียมสอบ</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-text-secondary">
            <a href="#home" className="hover:text-primary">เกี่ยวกับเรา</a>
            <a href="#features" className="hover:text-primary">ฟีเจอร์</a>
            <a href="mailto:support@quizcraft.ai" className="hover:text-primary">ติดต่อ</a>
            <a href="#home" className="hover:text-primary">นโยบายความเป็นส่วนตัว</a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-text-secondary">© 2026 QuizCraft AI. สงวนลิขสิทธิ์</p>
      </footer>
    </div>
  );
}
