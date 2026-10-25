import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Difficulty,
  DetailLevel,
  Lang,
  QuizItem,
  localFlashcards,
  localQuiz,
  localSummary,
} from './local.analyzer';

export interface AIResult<T> {
  data: T;
  engine: 'gemini' | 'local';
  warning?: string;
}

const SINGLE_PASS_LIMIT = 120_000; // chars sent in one request
const CHUNK_SIZE = 60_000; // chars per map step for very long documents
const MAX_CHUNKS = 40;
const QUIZ_SOURCE_LIMIT = 70_000;
const QUIZ_BATCH = 20;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Split on paragraph boundaries so slides/sections are not cut mid-way. */
function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  let cur = '';
  for (const para of text.split(/\n{2,}/)) {
    if (cur.length + para.length > size && cur) {
      chunks.push(cur);
      cur = '';
    }
    if (para.length > size) {
      for (let i = 0; i < para.length; i += size) chunks.push(para.slice(i, i + size));
    } else {
      cur += (cur ? '\n\n' : '') + para;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/** Evenly sample windows across the document so quizzes cover the whole file, not just the start. */
function sampleText(text: string, max: number): string {
  if (text.length <= max) return text;
  const windows = 8;
  const w = Math.floor(max / windows);
  const step = (text.length - w) / (windows - 1);
  return Array.from({ length: windows }, (_, i) => text.slice(Math.floor(i * step), Math.floor(i * step) + w)).join('\n\n[...]\n\n');
}

export class AIService {
  private static genAI: GoogleGenerativeAI | null = null;

  static get isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  private static modelName(): string {
    return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  private static client(): GoogleGenerativeAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    if (!this.genAI) this.genAI = new GoogleGenerativeAI(key);
    return this.genAI;
  }

  private static async call(prompt: string, json = false): Promise<string> {
    const client = this.client();
    if (!client) throw new Error('No API key');
    const model = client.getGenerativeModel({
      model: this.modelName(),
      generationConfig: json ? { responseMimeType: 'application/json', temperature: 0.7 } : { temperature: 0.3 },
    });
    let lastErr: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await model.generateContent(prompt);
        return res.response.text();
      } catch (e: any) {
        lastErr = e;
        const msg = String(e?.message || e);
        if (!/429|503|500|overloaded|quota|timeout|fetch failed/i.test(msg)) break;
        await sleep(1500 * (attempt + 1));
      }
    }
    throw lastErr;
  }

  private static parseJsonArray(raw: string): any[] {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    const parsed = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
    return parsed;
  }

  // ───────────────────────────── Summary ─────────────────────────────

  static async generateSummary(text: string, language: Lang = 'th', level: DetailLevel = 'standard'): Promise<AIResult<string>> {
    if (!this.isConfigured) {
      return { data: localSummary(text, language, level), engine: 'local' };
    }
    try {
      console.log('[AI] GEMINI_API_KEY configured:', this.isConfigured);
      console.log('[AI] Model:', this.modelName());
      console.log('[AI] Source length:', text.length);
      let source = text;
      if (text.length > SINGLE_PASS_LIMIT) source = await this.condenseLongDocument(text);
      const data = await this.call(this.summaryPrompt(source, language, level, text.length > SINGLE_PASS_LIMIT));
      return { data: data.trim(), engine: 'gemini' };
    } catch (e: any) {
      console.error('AI summary error:', e?.message || e);
      return {
        data: localSummary(text, language, level),
        engine: 'local',
        warning: 'AI service unavailable, used the local content analyzer instead.',
      };
    }
  }

  /** Map step for very long documents: extract detailed notes per chunk, then summarize the notes. */
  private static async condenseLongDocument(text: string): Promise<string> {
    const chunks = chunkText(text, CHUNK_SIZE).slice(0, MAX_CHUNKS);
    const notes: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const n = await this.call(
        `You are preparing study notes. Read part ${i + 1} of ${chunks.length} of a long course document and write DETAILED notes in the document's own language.
Keep every topic/slide title, definition, formula, number, example, and cause-effect relationship. Do not invent anything. Use compact bullet points grouped under the original headings.

--- DOCUMENT PART ---
${chunks[i]}`
      );
      notes.push(`### Part ${i + 1}\n${n.trim()}`);
    }
    const joined = notes.join('\n\n');
    return joined.length > SINGLE_PASS_LIMIT ? sampleText(joined, SINGLE_PASS_LIMIT) : joined;
  }

  private static summaryPrompt(source: string, language: Lang, level: DetailLevel, fromNotes: boolean): string {
    const lang = language === 'th' ? 'Write the entire summary in Thai (ภาษาไทย). Keep technical terms in English in parentheses where useful.' : 'Write the entire summary in English.';
    const detail: Record<DetailLevel, string> = {
      brief: 'BRIEF: only the most exam-critical points, about 300-500 words.',
      standard: 'STANDARD: cover every major topic with the key explanation of each, about 900-1400 words.',
      detailed: 'DETAILED: cover every section/slide in depth with explanations, examples, steps and reasoning, 2000-3500 words.',
    };
    return `You are an expert tutor who writes exam-preparation study sheets. Carefully READ the whole ${fromNotes ? 'set of notes' : 'document'} below and produce a faithful, well-organised study summary.

Rules:
- ${lang}
- Detail level — ${detail[level]}
- Use ONLY information in the document. Never invent facts. If something is unclear, leave it out.
- Follow the document's own structure (chapters / slides / headings) and do not skip sections.
- Explain ideas in plain language, but keep exact numbers, formulas, names and definitions correct.
- Explain ideas in plain language, but keep exact numbers, formulas, names and definitions correct.
- Write natural, grammatically correct Thai.
- Explain concepts as if teaching a university student who is learning the topic for the first time.
- Never concatenate unrelated sentences or topics.
- Preserve the original meaning of every technical term, command, formula, and example.
- For programming and Linux commands, explain what the command does and give a practical example if supported by the document.
- Separate each topic with a clear heading.
- Use short paragraphs and bullet points.
- If the source text is corrupted or ambiguous, identify the unclear part instead of guessing.
- Before returning the summary, check that every sentence is understandable and relevant to its heading.
- Output clean GitHub-flavoured Markdown using exactly these sections:

## 📋 Overview
2-4 sentences: what the document is about and why it matters.

## 📚 Key Topics
One "### N. Topic title" per topic/section with concise bullet points (cause → effect, steps, comparisons, examples).

## 🔑 Key Points to Remember
The most important takeaways likely to appear in an exam, as bullets (bold the key term).

## 📖 Important Vocabulary & Definitions
A Markdown table: | Term | Definition |

## 🧮 Important Formulas & Principles
Formulas/rules/theorems in \`code\` formatting with a one-line meaning each. Write "- None in this document" if there are none.

## ❓ Review Questions
5-8 thought-provoking questions that test understanding of the material.

--- DOCUMENT ---
${source}`;
  }

  // ───────────────────────────── Flashcards ─────────────────────────────

  static async generateFlashcards(
    source: string,
    count = 10,
    language: Lang = 'th'
  ): Promise<AIResult<{ front: string; back: string }[]>> {
    if (!this.isConfigured) return { data: localFlashcards(source, language, count), engine: 'local' };
    try {
      const raw = await this.call(
        `Create exactly ${count} high-quality study flashcards from the document below.
- Language: ${language === 'th' ? 'Thai (ภาษาไทย), technical terms may stay in English' : 'English'}.
- Cover different parts of the document; prefer definitions, key concepts, formulas, comparisons and cause-effect questions.
- "front": a clear question or term. "back": a precise, concise answer (1-3 sentences).
- Use ONLY facts in the document.
Return ONLY a JSON array: [{"front":"...","back":"..."}]

--- DOCUMENT ---
${sampleText(source, QUIZ_SOURCE_LIMIT)}`,
        true
      );
      const cards = this.parseJsonArray(raw)
        .map((c: any) => ({ front: String(c.front || '').trim(), back: String(c.back || '').trim() }))
        .filter((c) => c.front && c.back)
        .slice(0, count);
      if (!cards.length) throw new Error('empty');
      return { data: cards, engine: 'gemini' };
    } catch (e: any) {
      console.error('AI flashcard error:', e?.message || e);
      return {
        data: localFlashcards(source, language, count),
        engine: 'local',
        warning: 'AI service unavailable, used the local content analyzer instead.',
      };
    }
  }

  // ───────────────────────────── Quiz ─────────────────────────────

  static async generateQuizQuestions(
    source: string,
    count: number,
    opts: { difficulty: Difficulty; language: Lang }
  ): Promise<AIResult<QuizItem[]>> {
    const { difficulty, language } = opts;
    if (!this.isConfigured) return { data: localQuiz(source, language, count, difficulty), engine: 'local' };
    try {
      const text = sampleText(source, QUIZ_SOURCE_LIMIT);
      const all: QuizItem[] = [];
      let guard = 0;
      while (all.length < count && guard++ < 4) {
        const n = Math.min(QUIZ_BATCH, count - all.length);
        const batch = await this.quizBatch(text, n, difficulty, language, all.map((q) => q.question));
        all.push(...batch);
        if (!batch.length) break;
      }
      if (!all.length) throw new Error('empty');
      return { data: all.slice(0, count), engine: 'gemini' };
    } catch (e: any) {
      console.error('AI quiz error:', e?.message || e);
      return {
        data: localQuiz(source, language, count, difficulty),
        engine: 'local',
        warning: 'AI service unavailable, used the local content analyzer instead.',
      };
    }
  }

  private static async quizBatch(text: string, n: number, difficulty: Difficulty, language: Lang, avoid: string[]): Promise<QuizItem[]> {
    const level: Record<Difficulty, string> = {
      easy: 'EASY: direct recall of definitions, terms, facts and simple identification. Distractors clearly different from the answer.',
      medium: 'MEDIUM: test understanding — explain why/how, compare concepts, apply a rule to a simple example. Distractors plausible.',
      hard: 'HARD: test analysis and application — multi-step reasoning, scenarios, calculations, edge cases, "which statement is NOT true". Every distractor must be plausible and based on common misconceptions.',
      mixed: 'MIXED: about 30% easy, 40% medium and 30% hard questions, ordered from easy to hard.',
    };
    const raw = await this.call(
      `You are an expert exam writer. Write exactly ${n} multiple-choice questions based ONLY on the document below.
- Language: ${language === 'th' ? 'Thai (ภาษาไทย); technical terms may stay in English' : 'English'}.
- Difficulty — ${level[difficulty]}
- Cover different sections of the document; no duplicate or near-duplicate questions.
- Exactly 4 options per question, exactly one correct. Do not write "all of the above". Spread the correct answer position randomly.
- Each question needs a short "explanation" of why the answer is correct (cite the idea from the document).
${avoid.length ? `- Do NOT repeat these questions: ${JSON.stringify(avoid.slice(-30))}\n` : ''}Return ONLY a JSON array:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]

--- DOCUMENT ---
${text}`,
      true
    );
    return this.parseJsonArray(raw)
      .map((q: any) => ({
        question: String(q.question || '').trim(),
        options: Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim()) : [],
        correctAnswer: Number(q.correctAnswer),
        explanation: String(q.explanation || '').trim(),
      }))
      .filter((q) => q.question && q.options.length === 4 && Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < 4);
  }
}
