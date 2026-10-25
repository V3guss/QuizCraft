export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  createdAt: string;
}

export interface SubjectRef {
  id: string;
  name: string;
  color?: string | null;
}

export interface Subject extends SubjectRef {
  description?: string | null;
  createdAt: string;
  _count?: { documents: number; summaries: number };
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  subjectId: string;
  subject?: SubjectRef;
  createdAt: string;
  _count?: { summaries: number };
}

export interface SummaryItem {
  id: string;
  title: string;
  content: string;
  language: "th" | "en";
  detailLevel: "brief" | "standard" | "detailed";
  documentId: string;
  subjectId: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  subject?: SubjectRef;
  document?: { id: string; title: string; fileName: string };
  _count?: { flashcards: number; quizQuestions: number };
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  summaryId: string;
  summary?: { id: string; title: string };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string | null;
  summaryId: string;
  summary?: { id: string; title: string };
}

export interface QuizResultItem {
  questionId: string;
  question?: string;
  correct: boolean;
  selectedAnswer: number;
  correctAnswer: number;
  explanation?: string | null;
  options?: string[];
}

export interface QuizSubmitResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  results: QuizResultItem[];
}

export interface DashboardStats {
  documents: number;
  summaries: number;
  flashcards: number;
  quizzes: number;
  subjects: number;
}

export interface HistoryItem {
  id: string;
  action: string;
  resourceId?: string | null;
  resourceType?: string | null;
  createdAt: string;
}
