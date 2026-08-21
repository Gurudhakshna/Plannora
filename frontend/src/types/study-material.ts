export type MaterialStatus = "uploaded" | "analyzing" | "analyzed" | "failed";

export type MaterialType = "pdf" | "image" | "text";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
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
  formulas: { name: string; formula: string }[];
  importantPoints: string[];
  examples: { title: string; detail: string }[];
  quickRevision: string[];
  thingsToRemember: string[];
  createdAt: string;
  userId: string;
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
