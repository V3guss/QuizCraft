/**
 * Local (offline) content analyzer.
 *
 * Used when no Gemini API key is configured, or when the AI call fails. Unlike a canned demo text,
 * it actually READS the document: it detects headings/slides, scores sentences by term frequency,
 * extracts definitions and formulas, and builds summaries, flashcards and quiz questions from them.
 */

export type Lang = 'th' | 'en';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type DetailLevel = 'brief' | 'standard' | 'detailed';

interface Section {
  title: string;
  sentences: string[];
  score: number;
}

interface Definition {
  term: string;
  def: string;
}

export interface Analysis {
  sections: Section[];
  sentences: string[];
  tf: Map<string, number>;
  keyTerms: string[];
  definitions: Definition[];
  formulas: string[];
  wordCount: number;
}

export interface QuizItem {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const STOP = new Set(
  (
    'the a an and or but if of to in on at by for with from as is are was were be been being this that these those it its ' +
    'we you they he she i our your their his her not no can will may should would could also than then so such into over under ' +
    'about between each other more most some any all one two three has have had do does did which who whom what when where why how ' +
    'และ หรือ แต่ ที่ ซึ่ง ของ ใน บน ที่ เป็น คือ มี ได้ ให้ จะ ก็ แล้ว กับ จาก โดย เพื่อ ว่า นี้ นั้น การ ความ ใช้ อยู่ ไป มา ไม่ ถ้า เมื่อ ต้อง ด้วย ยัง อีก แต่ละ หนึ่ง'
  ).split(/\s+/)
);

let segmenter: Intl.Segmenter | null = null;
function tokenize(text: string): string[] {
  if (!segmenter) segmenter = new Intl.Segmenter(['th', 'en'], { granularity: 'word' });
  const out: string[] = [];
  for (const s of segmenter.segment(text)) {
    if (!s.isWordLike) continue;
    const w = s.segment.toLowerCase();
    if (/^\d+([.,]\d+)?$/.test(w)) continue;
    const thai = /[\u0E00-\u0E7F]/.test(w);
    if (w.length < (thai ? 2 : 3) || STOP.has(w)) continue;
    out.push(w);
  }
  return out;
}

const isBullet = (l: string) => /^(\s*[-•*●▪◦·]|\s*\d+[.)]\s|\s*[a-zA-Z][.)]\s)/.test(l);

function looksLikeHeading(line: string, next?: string): boolean {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (/^#{1,6}\s+\S/.test(t)) return true;
  if (isBullet(t)) return false;
  if (/[.!?。:;,]$/.test(t)) return false;
  if (!next || !next.trim()) return false;
  if (/^(บทที่|หัวข้อ|chapter|section|part|unit|lecture)\s*\d*/i.test(t)) return true;
  if (/^\d+(\.\d+)*[.)]?\s+\S/.test(t) && t.split(/\s+/).length <= 10) return true;
  const words = t.split(/\s+/).length;
  return words <= 9 && next.trim().length > t.length;
}

function splitSentences(block: string): string[] {
  const out: string[] = [];
  for (const rawLine of block.split(/\n+/)) {
    const line = rawLine.replace(/^\s*([-•*●▪◦·]|\d+[.)])\s*/, '').trim();
    if (!line) continue;
    const parts = line.split(/(?<=[.!?。])\s+(?=[A-Zก-๛"“(])/);
    for (const p of parts) {
      let s = p.trim();
      while (s.length > 220 && /\s/.test(s.slice(110, 220))) {
        const cut = s.indexOf(' ', 140) > 0 ? s.indexOf(' ', 140) : 160;
        out.push(s.slice(0, cut).trim());
        s = s.slice(cut).trim();
      }
      if (s.length >= 14) out.push(s);
    }
  }
  return out;
}

const DEF_PATTERNS: RegExp[] = [
  /^(?:the\s+)?([A-Za-z][\w\s\-()/]{1,48}?)\s+(?:is|are|refers to|means|is defined as|can be defined as|is called)\s+(.{15,260})$/i,
  /^(.{2,40}?)\s*(?:คือ|หมายถึง|หมายความว่า|ได้แก่|เรียกว่า)\s*(.{10,260})$/,
  /^([^:：\n]{2,40})[:：]\s+(.{15,260})$/,
];

function extractDefinition(sentence: string): Definition | null {
  for (const re of DEF_PATTERNS) {
    const m = sentence.match(re);
    if (!m) continue;
    const term = m[1].replace(/^(the|a|an)\s+/i, '').trim();
    const def = m[2].trim().replace(/[.。]$/, '');
    if (term.split(/\s+/).length > 6 || /[,;]/.test(term)) continue;
    if (/^(this|that|it|there|which|what|การ|ความ)$/i.test(term)) continue;
    return { term, def };
  }
  return null;
}

const FORMULA_RE = /(?:[A-Za-z0-9_)\]]\s*=\s*[^=]{2,}|[∑∫√±≤≥≈≠∞π∂Δ]|\bO\([^)]+\)|\^\s*\d|\bΘ\(|\bΩ\()/;

export function analyze(rawText: string): Analysis {
  const text = rawText.replace(/\r/g, '').replace(/\u0000/g, '');
  const lines = text.split('\n');

  // 1. split into sections by headings
  const rawSections: { title: string; body: string[] }[] = [];
  let cur = { title: '', body: [] as string[] };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (looksLikeHeading(line, lines.slice(i + 1).find((l) => l.trim()))) {
      if (cur.body.length || cur.title) rawSections.push(cur);
      cur = { title: line.trim().replace(/^#{1,6}\s*/, '').replace(/^\d+(\.\d+)*[.)]?\s+/, ''), body: [] };
    } else {
      cur.body.push(line);
    }
  }
  if (cur.body.length || cur.title) rawSections.push(cur);

  // 2. term frequencies over the whole document
  const tf = new Map<string, number>();
  for (const tok of tokenize(text)) tf.set(tok, (tf.get(tok) || 0) + 1);

  const scoreSentence = (s: string, first: boolean): number => {
    const toks = tokenize(s);
    if (!toks.length) return 0;
    let sc = toks.reduce((a, t) => a + (tf.get(t) || 0), 0) / Math.sqrt(toks.length);
    if (first) sc *= 1.25;
    if (extractDefinition(s)) sc *= 1.3;
    if (/\d/.test(s)) sc *= 1.05;
    return sc;
  };

  let sections: Section[] = rawSections
    .map((s) => ({ title: s.title, sentences: splitSentences(s.body.join('\n')), score: 0 }))
    .filter((s) => s.sentences.length > 0);

  // 3. no usable headings -> chunk the document into pseudo-sections titled by keywords
  if (sections.length <= 1) {
    const all = sections.flatMap((s) => s.sentences);
    const per = Math.max(5, Math.ceil(all.length / 8));
    sections = [];
    for (let i = 0; i < all.length; i += per) {
      const chunk = all.slice(i, i + per);
      const local = new Map<string, number>();
      for (const t of tokenize(chunk.join(' '))) local.set(t, (local.get(t) || 0) + 1);
      const kw = [...local.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
      sections.push({ title: kw.join(', '), sentences: chunk, score: 0 });
    }
  }

  for (const s of sections) {
    s.score = s.sentences.reduce((a, x, i) => a + scoreSentence(x, i === 0), 0);
    if (!s.title) s.title = s.sentences[0].slice(0, 50);
  }

  const sentences = sections.flatMap((s) => s.sentences);
  const definitions: Definition[] = [];
  const seen = new Set<string>();
  for (const s of sentences) {
    const d = extractDefinition(s);
    if (d && !seen.has(d.term.toLowerCase())) {
      seen.add(d.term.toLowerCase());
      definitions.push(d);
    }
  }

  const formulas = [
    ...new Set(
      lines
        .map((l) => l.trim())
        .filter((l) => l.length >= 4 && l.length <= 120 && FORMULA_RE.test(l) && !/[ก-๛]{12,}/.test(l))
    ),
  ].slice(0, 30);

  const keyTerms = [...tf.entries()]
    .filter(([w, n]) => n >= 2 && w.length >= (/[\u0E00-\u0E7F]/.test(w) ? 3 : 4))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)
    .map(([w]) => w);

  return { sections, sentences, tf, keyTerms, definitions, formulas, wordCount: tokenize(text).length };
}

function topSentences(list: string[], tf: Map<string, number>, n: number): string[] {
  const scored = list.map((s, i) => {
    const toks = tokenize(s);
    const sc = toks.length ? toks.reduce((a, t) => a + (tf.get(t) || 0), 0) / Math.sqrt(toks.length) : 0;
    return { s, i, sc: sc * (i === 0 ? 1.25 : 1) };
  });
  return scored
    .sort((a, b) => b.sc - a.sc)
    .slice(0, n)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}

const LIMITS: Record<DetailLevel, { topics: number; per: number; points: number; vocab: number; questions: number }> = {
  brief: { topics: 4, per: 2, points: 5, vocab: 5, questions: 3 },
  standard: { topics: 8, per: 3, points: 8, vocab: 10, questions: 5 },
  detailed: { topics: 16, per: 5, points: 12, vocab: 20, questions: 8 },
};

const L = {
  th: {
    overview: '📋 ภาพรวม',
    topics: '📚 หัวข้อหลัก',
    points: '🔑 ประเด็นสำคัญที่ควรจำ',
    vocab: '📖 คำศัพท์และนิยามสำคัญ',
    formulas: '🧮 สูตรและหลักการสำคัญ',
    review: '❓ คำถามทบทวน',
    term: 'คำศัพท์',
    definition: 'ความหมาย',
    stats: (sec: number, words: number) => `เอกสารนี้มี **${sec} หัวข้อ/ส่วน** และประมาณ **${words.toLocaleString()} คำ** ระบบสรุปประเด็นหลักให้ดังนี้`,
    none: '- ไม่พบสูตรหรือสมการในเอกสาร',
    explain: (t: string) => `อธิบายสาระสำคัญของหัวข้อ "${t}"`,
    whatIs: (t: string) => `"${t}" คืออะไร?`,
    note: '_สรุปด้วยโหมดวิเคราะห์เนื้อหาในเครื่อง (ไม่ใช้ AI ออนไลน์) — ตั้งค่า `GEMINI_API_KEY` ใน backend/.env เพื่อให้ AI เรียบเรียงสรุปเชิงลึกยิ่งขึ้น_',
  },
  en: {
    overview: '📋 Overview',
    topics: '📚 Key Topics',
    points: '🔑 Key Points to Remember',
    vocab: '📖 Important Vocabulary & Definitions',
    formulas: '🧮 Important Formulas & Principles',
    review: '❓ Review Questions',
    term: 'Term',
    definition: 'Definition',
    stats: (sec: number, words: number) => `This document has **${sec} sections** and about **${words.toLocaleString()} words**. Main points:`,
    none: '- No formulas or equations found in the document',
    explain: (t: string) => `Explain the main ideas of "${t}"`,
    whatIs: (t: string) => `What is "${t}"?`,
    note: '_Generated by the built-in local content analyzer (no online AI). Set `GEMINI_API_KEY` in backend/.env for deeper AI-written summaries._',
  },
};

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const cell = (s: string) => s.replace(/\|/g, '/').replace(/\n/g, ' ');

export function localSummary(text: string, language: Lang, level: DetailLevel): string {
  const a = analyze(text);
  const t = L[language];
  const lim = LIMITS[level];

  // choose the most important sections but keep their original order
  const picked = a.sections
    .map((s, i) => ({ s, i }))
    .sort((x, y) => y.s.score - x.s.score)
    .slice(0, lim.topics)
    .sort((x, y) => x.i - y.i)
    .map((x) => x.s);

  const overview = topSentences(a.sentences, a.tf, level === 'brief' ? 2 : 3);
  const md: string[] = [];
  md.push(`## ${t.overview}`, t.stats(a.sections.length, a.wordCount), '', ...overview.map((s) => `> ${clip(s, 300)}`), '');

  md.push(`## ${t.topics}`, '');
  picked.forEach((s, i) => {
    md.push(`### ${i + 1}. ${clip(s.title, 80)}`);
    for (const x of topSentences(s.sentences, a.tf, lim.per)) md.push(`- ${clip(x, 260)}`);
    md.push('');
  });

  const points = topSentences(a.sentences, a.tf, lim.points);
  md.push(`## ${t.points}`, ...points.map((s) => `- **${clip(s, 240)}**`), '');

  if (a.definitions.length) {
    md.push(`## ${t.vocab}`, `| ${t.term} | ${t.definition} |`, '|---|---|');
    for (const d of a.definitions.slice(0, lim.vocab)) md.push(`| **${cell(clip(d.term, 50))}** | ${cell(clip(d.def, 220))} |`);
    md.push('');
  } else if (a.keyTerms.length) {
    md.push(`## ${t.vocab}`, a.keyTerms.slice(0, lim.vocab).map((k) => `\`${k}\``).join(' · '), '');
  }

  md.push(`## ${t.formulas}`);
  md.push(...(a.formulas.length ? a.formulas.slice(0, lim.vocab).map((f) => `- \`${f}\``) : [t.none]), '');

  const qs: string[] = [
    ...a.definitions.slice(0, Math.ceil(lim.questions / 2)).map((d) => t.whatIs(d.term)),
    ...picked.map((s) => t.explain(clip(s.title, 60))),
  ].slice(0, lim.questions);
  md.push(`## ${t.review}`, ...qs.map((q, i) => `${i + 1}. ${q}`), '', '---', t.note);
  return md.join('\n');
}

export function localFlashcards(text: string, language: Lang, count: number): { front: string; back: string }[] {
  const a = analyze(text);
  const t = L[language];
  const cards: { front: string; back: string }[] = a.definitions.map((d) => ({ front: t.whatIs(d.term), back: clip(d.def, 300) }));
  for (const s of a.sections) {
    if (cards.length >= count * 2) break;
    cards.push({ front: language === 'th' ? `สาระสำคัญของ "${clip(s.title, 60)}"` : `Key idea of "${clip(s.title, 60)}"`, back: topSentences(s.sentences, a.tf, 2).map((x) => clip(x, 220)).join(' ') });
  }
  return shuffle(cards.slice(0, Math.max(count * 2, count))).slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOptions(correct: string, distractors: string[]): { options: string[]; correctAnswer: number } | null {
  const uniq = [...new Set(distractors.filter((d) => d && d.toLowerCase() !== correct.toLowerCase()))];
  if (uniq.length < 3) return null;
  const opts = shuffle([correct, ...uniq.slice(0, 3)]);
  return { options: opts, correctAnswer: opts.indexOf(correct) };
}

export function localQuiz(text: string, language: Lang, count: number, difficulty: Difficulty): QuizItem[] {
  const a = analyze(text);
  const th = language === 'th';
  const out: QuizItem[] = [];
  const usedSentences = new Set<string>();

  const plan: Exclude<Difficulty, 'mixed'>[] = [];
  for (let i = 0; i < count; i++) {
    plan.push(difficulty === 'mixed' ? (['easy', 'medium', 'hard', 'medium', 'easy'] as const)[i % 5] : difficulty);
  }

  const defs = shuffle(a.definitions);
  const cloze = shuffle(a.sentences.filter((s) => s.length >= 30 && s.length <= 260)).map((s) => {
    const toks = [...new Set(tokenize(s))].filter((w) => a.keyTerms.includes(w));
    const target = toks.sort((x, y) => (a.tf.get(y) || 0) - (a.tf.get(x) || 0))[0];
    return target ? { s, target } : null;
  }).filter(Boolean) as { s: string; target: string }[];

  const blank = (s: string, w: string) => s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____');
  const swap = (s: string, w: string, other: string) => s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), other);
  const defIdx = { n: 0 };
  const clozeIdx = { n: 0 };

  for (const level of plan) {
    let made: QuizItem | null = null;
    for (let tries = 0; tries < 12 && !made; tries++) {
      if (level === 'easy' && defIdx.n < defs.length) {
        const d = defs[defIdx.n++];
        const o = pickOptions(clip(d.def, 130), defs.filter((x) => x !== d).map((x) => clip(x.def, 130)));
        if (o) {
          made = {
            question: th ? `ข้อใดคือความหมายของ "${d.term}" ตามเอกสาร?` : `Which of the following best describes "${d.term}" according to the document?`,
            ...o,
            explanation: `${d.term}: ${d.def}`,
          };
        }
      } else if (level === 'hard' && clozeIdx.n < cloze.length) {
        const c = cloze[clozeIdx.n++];
        if (usedSentences.has(c.s)) continue;
        const alt = a.keyTerms.filter((k) => k !== c.target).slice(0, 12);
        const distract = shuffle(alt).slice(0, 3).map((k) => clip(swap(c.s, c.target, k), 150));
        const o = pickOptions(clip(c.s, 150), distract);
        if (o) {
          usedSentences.add(c.s);
          made = {
            question: th ? 'ข้อใดเป็นข้อความที่ถูกต้องตรงตามเนื้อหาในเอกสาร?' : 'Which statement is correct according to the document?',
            ...o,
            explanation: (th ? 'ข้อความที่ถูกต้อง: ' : 'Correct statement: ') + c.s,
          };
        }
      } else if (clozeIdx.n < cloze.length) {
        const c = cloze[clozeIdx.n++];
        if (usedSentences.has(c.s)) continue;
        const o = pickOptions(c.target, shuffle(a.keyTerms.filter((k) => k !== c.target)).slice(0, 6));
        if (o) {
          usedSentences.add(c.s);
          made = {
            question: (th ? 'เติมคำที่ขาดหายไปให้ถูกต้อง: ' : 'Fill in the blank: ') + blank(c.s, c.target),
            ...o,
            explanation: (th ? 'ประโยคเต็ม: ' : 'Full sentence: ') + c.s,
          };
        }
      } else break; // preferred type exhausted - the top-up loop below fills the rest
    }
    if (made) out.push(made);
  }

  // top up from any unused definitions / clozes when the preferred type ran out
  while (out.length < count && (defIdx.n < defs.length || clozeIdx.n < cloze.length)) {
    if (defIdx.n < defs.length) {
      const d = defs[defIdx.n++];
      const o = pickOptions(clip(d.def, 130), defs.filter((x) => x !== d).map((x) => clip(x.def, 130)));
      if (o) out.push({ question: th ? `ข้อใดคือความหมายของ "${d.term}" ตามเอกสาร?` : `Which of the following best describes "${d.term}" according to the document?`, ...o, explanation: `${d.term}: ${d.def}` });
    } else {
      const c = cloze[clozeIdx.n++];
      const o = pickOptions(c.target, shuffle(a.keyTerms.filter((k) => k !== c.target)).slice(0, 6));
      if (o) out.push({ question: (th ? 'เติมคำที่ขาดหายไปให้ถูกต้อง: ' : 'Fill in the blank: ') + blank(c.s, c.target), ...o, explanation: (th ? 'ประโยคเต็ม: ' : 'Full sentence: ') + c.s });
    }
  }
  return out.slice(0, count);
}
