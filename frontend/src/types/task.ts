export type Priority = "Low" | "Medium" | "High";

export type Page = "dashboard" | "plan" | "tasks" | "calendar" | "progress" | "materials" | "profile" | "settings";

export interface Task {
  id: string;
  title: string;
  subject: string;
  date: string;
  priority: Priority;
  description: string;
  duration: string;
  notes: string;
  completed: boolean;
  createdAt: string;
  userId: string;
  source?: "ai";
}

export interface StudyPlan {
  studyGoal: string;
  subjects: string[];
  targetExam: string;
  startDate: string;
  endDate: string;
  dailyHours: string;
  preferredStudyTime: string;
  daysPerWeek: string;
  prioritySubjects: string;
  dailyTarget: string;
  notes: string;
  createdAt: string;
  userId: string;
}
