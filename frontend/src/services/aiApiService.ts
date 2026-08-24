/**
 * Centralized Frontend AI API Client for Plannora.
 * Communicates exclusively with the FastAPI backend.
 * Never accesses or exposes Groq/AI API keys.
 */

import type { AIAnalysis } from "../types/study-material";
import {
  BACKEND_ROOT,
  PlannoraApiError,
  apiRequest,
  apiRequestAbsolute,
} from "./apiClient";

export type { PlannoraApiError };

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(endpoint, options);
}

// ============================================================================
// Types
// ============================================================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

export interface QuizGenerateResponse {
  success: boolean;
  quiz_id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizAnswerSubmission {
  question_id: string;
  selected_option: string;
  correct_answer: string;
  topic: string;
}

export interface TopicPerformance {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface QuizSubmitResponse {
  success: boolean;
  score: number;
  total: number;
  percentage: number;
  correct: number;
  incorrect: number;
  topic_performance: TopicPerformance[];
  weak_topics: string[];
  message: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  difficulty: string;
}

export interface FlashcardsGenerateResponse {
  success: boolean;
  deck_id: string;
  title: string;
  cards: Flashcard[];
}

export interface ConceptMapNode {
  id: string;
  label: string;
  description: string;
  importance: "high" | "medium" | "low";
  category?: string;
  mastery?: string;
}

export interface ConceptMapEdge {
  id?: string;
  source: string;
  target: string;
  relationship: string;
  label?: string;
}

export interface ConceptMapGenerateResponse {
  success: boolean;
  topic: string;
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
}

export interface TeachMeResponse {
  success: boolean;
  concept: string;
  level: "beginner" | "intermediate" | "advanced";
  simple_explanation: string;
  detailed_explanation: string;
  analogy: string;
  example: string;
  common_mistakes: string[];
  key_takeaways: string[];
  practice_question: {
    question: string;
    answer: string;
  };
}

export interface WeakTopicItem {
  topic: string;
  subject: string;
  accuracy: number;
  attempts: number;
  confidence: "low" | "medium" | "high";
  weakness_level: "Weak" | "Needs Practice" | "Good" | "Strong";
  recommendation: string;
  action_steps: string[];
}

export interface WeakTopicsResponse {
  success: boolean;
  weak_topics: WeakTopicItem[];
  summary: string;
}

export interface TopicActivityPayload {
  topic: string;
  subject?: string;
  correct_count: number;
  total_count: number;
  ratings?: string[];
}

export interface StudyPlanDaySession {
  topic: string;
  activity: string;
  duration_minutes: number;
  notes?: string;
}

export interface StudyPlanDay {
  date: string;
  label: string;
  sessions: StudyPlanDaySession[];
}

export interface StudyPlanGenerateResponse {
  success: boolean;
  plan_id: string;
  title: string;
  overview: string;
  total_study_hours: number;
  days: StudyPlanDay[];
}

// ============================================================================
// Service API Functions
// ============================================================================

export const aiApiService = {
  /**
   * Health Check
   */
  async checkHealth(): Promise<{ status: string; ai_provider: string; model: string }> {
    const res = await apiRequestAbsolute<{ status: string; ai_provider: string; model: string }>(
      `${BACKEND_ROOT}/health`
    );
    return res;
  },

  /**
   * 1. Analyze Study Material with Groq
   */
  async analyzeMaterial(text: string, filename?: string, subject?: string): Promise<AIAnalysis> {
    const res = await request<{ success: boolean; analysis: AIAnalysis }>("/analyze/text", {
      method: "POST",
      body: JSON.stringify({ text, filename, subject }),
    });
    return res.analysis;
  },

  /**
   * 2. Generate Quiz via Groq
   */
  async generateQuiz(
    subject: string,
    topic: string,
    context?: string,
    questionCount: number = 5,
    difficulty: string = "medium"
  ): Promise<QuizGenerateResponse> {
    return request<QuizGenerateResponse>("/quizzes/generate", {
      method: "POST",
      body: JSON.stringify({
        subject,
        topic,
        context,
        question_count: questionCount,
        difficulty: difficulty.toLowerCase(),
      }),
    });
  },

  /**
   * 3. Submit Quiz for Deterministic Scoring
   */
  async submitQuiz(
    topic: string,
    answers: QuizAnswerSubmission[],
    subject: string = "General",
    quizId?: string
  ): Promise<QuizSubmitResponse> {
    return request<QuizSubmitResponse>("/quizzes/submit", {
      method: "POST",
      body: JSON.stringify({
        quiz_id: quizId,
        subject,
        topic,
        answers,
      }),
    });
  },

  /**
   * 4. Generate Flashcards via Groq
   */
  async generateFlashcards(
    topic: string,
    context?: string,
    count: number = 10,
    difficulty: string = "medium"
  ): Promise<FlashcardsGenerateResponse> {
    return request<FlashcardsGenerateResponse>("/flashcards/generate", {
      method: "POST",
      body: JSON.stringify({
        topic,
        context,
        count,
        difficulty: difficulty.toLowerCase(),
      }),
    });
  },

  /**
   * 5. Rate Flashcard
   */
  async rateFlashcard(
    cardId: string,
    rating: "easy" | "medium" | "hard",
    topic: string
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>("/flashcards/rate", {
      method: "POST",
      body: JSON.stringify({
        card_id: cardId,
        rating: rating.toLowerCase(),
        topic,
      }),
    });
  },

  /**
   * 6. Generate Concept Knowledge Graph via Groq
   */
  async generateConceptMap(topic: string, context?: string): Promise<ConceptMapGenerateResponse> {
    return request<ConceptMapGenerateResponse>("/concept-map/generate", {
      method: "POST",
      body: JSON.stringify({ topic, context }),
    });
  },

  /**
   * 7. Interactive Teach Me Lesson via Groq
   */
  async teachConcept(
    concept: string,
    context?: string,
    studentLevel: "beginner" | "intermediate" | "advanced" = "beginner"
  ): Promise<TeachMeResponse> {
    return request<TeachMeResponse>("/teach", {
      method: "POST",
      body: JSON.stringify({
        concept,
        context,
        student_level: studentLevel.toLowerCase(),
      }),
    });
  },

  /**
   * 8. Calculate Weak Topics & Get Groq Study Recommendations
   */
  async calculateWeakTopics(
    activityData: TopicActivityPayload[],
    context?: string
  ): Promise<WeakTopicsResponse> {
    return request<WeakTopicsResponse>("/weak-topics/calculate", {
      method: "POST",
      body: JSON.stringify({
        activity_data: activityData,
        context,
      }),
    });
  },

  /**
   * 9. Generate Complete Study Plan via Groq + Deterministic Calendar
   */
  async generateStudyPlan(
    goal: string,
    subjects: string[],
    availableHoursPerDay: number = 2.0,
    daysPerWeek: number = 5,
    startDate?: string,
    targetDate?: string,
    context?: string
  ): Promise<StudyPlanGenerateResponse> {
    return request<StudyPlanGenerateResponse>("/planner/generate-plan", {
      method: "POST",
      body: JSON.stringify({
        goal,
        subjects,
        available_hours_per_day: availableHoursPerDay,
        days_per_week: daysPerWeek,
        start_date: startDate,
        target_date: targetDate,
        context,
      }),
    });
  },
};
