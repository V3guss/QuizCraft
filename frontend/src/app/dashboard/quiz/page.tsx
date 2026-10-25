"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, HelpCircle, Sparkles, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import quizService from "@/services/quiz.service";
import summaryService from "@/services/summary.service";
import type { QuizQuestion, QuizSubmitResult, SummaryItem } from "@/lib/types";
import { cn, errorMessage } from "@/lib/utils";

export default function QuizPage() {
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [summaryId, setSummaryId] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    summaryService.getAll().then(setSummaries).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setResult(null);
    setAnswers({});
    quizService.getQuestions(summaryId || undefined).then((q) => setQuestions(q.slice(0, 20))).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, [summaryId]);
  useEffect(load, [load]);

  const generate = async () => {
    if (!summaryId) return toast.error("กรุณาเลือกสรุปก่อน");
    setBusy(true);
    try {
      await quizService.generate(summaryId, 10);
      toast.success("สร้างแบบทดสอบแล้ว");
      load();
    } catch (e) {
      toast.error(errorMessage(e, "สร้างแบบทดสอบไม่สำเร็จ"));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) return toast.error("กรุณาตอบให้ครบทุกข้อ");
    setBusy(true);
    try {
      setResult(await quizService.submit(questions.map((q) => ({ questionId: q.id, selectedAnswer: answers[q.id] }))));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const byId = Object.fromEntries((result?.results || []).map((r) => [r.questionId, r]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">แบบทดสอบ</h1>
        <p className="text-sm text-text-secondary">ทดสอบความเข้าใจจากเนื้อหาสรุป</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={summaryId} onChange={(e) => setSummaryId(e.target.value)} className="h-11 min-w-0 flex-1 rounded-xl border border-border-custom bg-surface px-3 text-sm outline-none focus:border-primary">
          <option value="">ทุกสรุป</option>
          {summaries.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <Button variant="secondary" loading={busy && !result} onClick={generate}><Sparkles className="h-4 w-4" />สร้างจากสรุปนี้</Button>
      </div>

      {result && (
        <Card className="p-6 text-center">
          <p className="text-sm text-text-secondary">ผลคะแนนของคุณ</p>
          <p className="mt-1 text-4xl font-bold text-primary">{result.score}/{result.totalQuestions}</p>
          <p className="text-sm text-text-secondary">{result.percentage}%</p>
          <Button className="mt-4" variant="outline" onClick={load}>ทำใหม่</Button>
        </Card>
      )}

      {loading ? <LoadingSpinner /> : questions.length === 0 ? (
        <EmptyState icon={<HelpCircle />} title="ยังไม่มีแบบทดสอบ" description="เลือกสรุปแล้วกด “สร้างจากสรุปนี้”" />
      ) : (
        <>
          {questions.map((q, i) => {
            const r = byId[q.id];
            return (
              <Card key={q.id} className="p-5">
                <p className="font-medium text-heading">{i + 1}. {q.question}</p>
                <div className="mt-3 space-y-2">
                  {q.options.map((o, oi) => {
                    const chosen = answers[q.id] === oi;
                    const isCorrect = r && r.correctAnswer === oi;
                    const isWrong = r && chosen && !r.correct;
                    return (
                      <button
                        key={oi}
                        disabled={!!result}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm",
                          isCorrect ? "border-success bg-green-500/10" : isWrong ? "border-error bg-red-500/10" : chosen ? "border-primary bg-primary-light" : "border-border-custom hover:border-primary"
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{String.fromCharCode(65 + oi)}</span>
                        <span className="flex-1">{o}</span>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {isWrong && <XCircle className="h-4 w-4 text-error" />}
                      </button>
                    );
                  })}
                </div>
                {r?.explanation && <p className="mt-3 rounded-lg bg-primary-light p-3 text-sm text-heading">คำอธิบาย: {r.explanation}</p>}
              </Card>
            );
          })}
          {!result && <Button size="lg" className="w-full" loading={busy} onClick={submit}>ส่งคำตอบ</Button>}
        </>
      )}
    </div>
  );
}
