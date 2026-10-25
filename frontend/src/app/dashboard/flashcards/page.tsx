"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import flashcardService from "@/services/flashcard.service";
import summaryService from "@/services/summary.service";
import type { Flashcard, SummaryItem } from "@/lib/types";
import { cn, errorMessage } from "@/lib/utils";

export default function FlashcardsPage() {
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [summaryId, setSummaryId] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    summaryService.getAll().then(setSummaries).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    flashcardService.getAll(summaryId || undefined).then((c) => { setCards(c); setIdx(0); setFlipped(false); }).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, [summaryId]);
  useEffect(load, [load]);

  const generate = async () => {
    if (!summaryId) return toast.error("กรุณาเลือกสรุปก่อน");
    setGenerating(true);
    try {
      await flashcardService.generate(summaryId, 10);
      toast.success("สร้าง Flashcards แล้ว");
      load();
    } catch (e) {
      toast.error(errorMessage(e, "สร้าง Flashcards ไม่สำเร็จ"));
    } finally {
      setGenerating(false);
    }
  };

  const go = (d: number) => { setFlipped(false); setIdx((i) => (i + d + cards.length) % cards.length); };
  const card = cards[idx];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Flashcards</h1>
        <p className="text-sm text-text-secondary">ทบทวนคำศัพท์และแนวคิดสำคัญ</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={summaryId} onChange={(e) => setSummaryId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-border-custom bg-surface px-3 text-sm outline-none focus:border-primary">
          <option value="">ทุกสรุป</option>
          {summaries.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <Button variant="secondary" loading={generating} onClick={generate}><Sparkles className="h-4 w-4" />สร้างจากสรุปนี้</Button>
      </div>

      {loading ? <LoadingSpinner /> : !card ? (
        <EmptyState icon={<Layers />} title="ยังไม่มี Flashcards" description="เลือกสรุปแล้วกด “สร้างจากสรุปนี้”" />
      ) : (
        <>
          <p className="text-center text-sm text-text-secondary">การ์ด {idx + 1} จาก {cards.length}</p>
          <div className={cn("flip-card h-72 cursor-pointer", flipped && "flipped")} onClick={() => setFlipped((f) => !f)}>
            <div className="flip-card-inner relative h-full w-full">
              <div className="flip-card-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border-custom bg-surface p-8 text-center shadow-sm">
                <span className="mb-3 text-xs font-medium text-primary">คำถาม</span>
                <p className="text-xl font-semibold text-heading">{card.front}</p>
                <span className="mt-6 text-xs text-text-secondary">คลิกเพื่อพลิกการ์ด</span>
              </div>
              <div className="flip-card-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-navy p-8 text-center text-white">
                <span className="mb-3 text-xs font-medium text-blue-300">คำตอบ</span>
                <p className="text-lg leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => go(-1)} aria-label="ก่อนหน้า"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${((idx + 1) / cards.length) * 100}%` }} /></div>
            <Button variant="outline" onClick={() => go(1)} aria-label="ถัดไป"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </>
      )}
    </div>
  );
}
