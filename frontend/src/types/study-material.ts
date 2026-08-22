export type MaterialStatus = "uploaded" | "analyzing" | "analyzed" | "failed";

export type MaterialType = "pdf" | "image" | "text";

export type TaskType = "learn" | "understand" | "practice" | "test" | "recall";

export type ConceptStatus = "not-started" | "studying" | "understood";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  file?: File;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: MaterialType;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  content: string;
  topic?: string;
  createdAt: string;
  userId: string;
  analysisStatus: MaterialStatus;
  hasNotes: boolean;
  hasTasks: boolean;
}

export interface AINoteSection {
  heading: string;
  content: string[];
}

export interface AIStudyNotes {
  id: string;
  materialId: string;
  topic: string;
  summary: string;
  keyConcepts: string[];
  definitions: { term: string; definition: string }[];
  formulas: { name: string; formula: string; when?: string }[];
  importantPoints: string[];
  examples: { title: string; detail: string }[];
  quickRevision: string[];
  thingsToRemember: string[];
  createdAt: string;
  userId: string;
  /* Phase 1 & 2 — extended content-aware fields */
  concepts?: DetectedConcept[];
  executiveSummary?: string;
  stepByStepExplanations?: { topic: string; steps: string[] }[];
  commonMistakes?: string[];
  memoryTricks?: string[];
  examFocusedNotes?: string[];
}

export interface AIStudyTask {
  id: string;
  materialId: string;
  title: string;
  completed: boolean;
  priority: "Low" | "Medium" | "High";
  estimatedMinutes: number;
  topic: string;
  dueDate?: string;
  createdAt: string;
  userId: string;
  /* Phase 1 — concept-specific fields */
  conceptRef?: string;
  taskType?: TaskType;
}

export interface AIStudyPlanDay {
  date: string;
  label: string;
  sessions: { duration: string; activity: string }[];
}

export interface AIStudyPlan {
  id: string;
  materialId: string;
  days: AIStudyPlanDay[];
  createdAt: string;
  userId: string;
}

export interface AnalysisResult {
  material: StudyMaterial;
  notes: AIStudyNotes;
  tasks: AIStudyTask[];
  studyPlan: AIStudyPlan;
}

/* ===== Phase 1 — Content-Aware Analysis Types ===== */

export interface DetectedConcept {
  name: string;
  priority: "high" | "medium" | "low";
  category: string;
  estimatedMinutes: number;
  dependencies: string[];
  simpleExplanation: string;
  detailedExplanation: string;
  example: string;
  commonMistake: string;
  keyTakeaway: string;
  analogy: string;
  miniQuestion: string;
  miniQuestionAnswer: string;
  /* runtime state — not from AI */
  status?: ConceptStatus;
}

export interface TopicHierarchy {
  name: string;
  subtopics: string[];
}

export interface StudyOrderStep {
  step: number;
  topic: string;
  reason: string;
}

export interface ExamQuestion {
  question: string;
  type: "theory" | "programming" | "application";
  topic: string;
}

export interface ExamIntelligence {
  mustKnow: string[];
  highPriority: string[];
  likelyQuestions: ExamQuestion[];
}

export interface AIAnalysis {
  materialTitle: string;
  detectedTopics: string[];
  estimatedStudyMinutes: number;
  topicHierarchy: TopicHierarchy[];
  concepts: DetectedConcept[];
  definitions: { term: string; definition: string }[];
  formulas: { name: string; formula: string; when?: string }[];
  tasks: {
    title: string;
    taskType: TaskType;
    conceptRef: string;
    priority: "High" | "Medium" | "Low";
    estimatedMinutes: number;
  }[];
  studyOrder: StudyOrderStep[];
  examIntelligence: ExamIntelligence;
  executiveSummary: string;
  stepByStepExplanations?: { topic: string; steps: string[] }[];
  commonMistakes: string[];
  memoryTricks: string[];
  examFocusedNotes: string[];
}

export interface LearningProgress {
  materialId: string;
  conceptsTotal: number;
  conceptsStudied: number;
  conceptsUnderstood: number;
  questionsAnswered: number;
  questionsCorrect: number;
  overallPct: number;
}
