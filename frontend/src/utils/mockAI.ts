import type { AIStudyNotes, AIStudyTask, AIStudyPlan } from "../types/study-material";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function extractTopic(filename: string): string {
  return (
    filename
      .replace(/\.(pdf|png|jpg|jpeg)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Study Material"
  );
}

export function generateMockNotes(topic: string, materialId: string, userId: string): AIStudyNotes {
  return {
    id: generateId(),
    materialId,
    topic,
    summary: `This material covers key concepts related to ${topic}. The content includes fundamental definitions, important principles, and practical applications that form the foundation for understanding this subject area.`,
    keyConcepts: [
      `Core principles and foundational theory of ${topic}`,
      `Key terminology and their relationships within ${topic}`,
      `Practical applications and real-world use cases`,
      `Important historical context and development`,
    ],
    definitions: [
      { term: topic.includes(" ") ? topic.split(" ")[0] : "Primary Concept", definition: `The fundamental building block that describes the essential characteristics of this area of study.` },
      { term: "Key Principle", definition: `A core rule or guideline that governs how concepts within ${topic} interact and function.` },
      { term: "Application", definition: `The practical implementation of theoretical concepts in real-world scenarios.` },
    ],
    formulas: [
      { name: "Core Formula", formula: "Result = Input x Efficiency Factor" },
      { name: "Rate Formula", formula: "Rate = Change / Time Interval" },
    ],
    importantPoints: [
      `Understanding the basics of ${topic} is essential for advanced study`,
      `Practice problems regularly to reinforce learning`,
      `Connect theoretical concepts with practical examples`,
      `Review key definitions before exams`,
    ],
    examples: [
      { title: "Basic Example", detail: `A straightforward illustration of how ${topic} concepts apply in practice. This helps build intuition before tackling complex problems.` },
      { title: "Advanced Example", detail: `A more complex scenario combining multiple concepts from ${topic} to solve a multi-step problem.` },
    ],
    quickRevision: [
      `Key definition 1: Remember the core meaning`,
      `Key formula 1: Know when and how to apply it`,
      `Key concept 2: Understand the relationship to the main topic`,
      `Common mistake: Watch out for similar-sounding but different concepts`,
      `Tip: Use flashcards for quick recall during revision`,
    ],
    thingsToRemember: [
      `Focus on understanding, not memorization`,
      `Review notes within 24 hours for better retention`,
      `Practice active recall instead of passive reading`,
    ],
    createdAt: new Date().toISOString(),
    userId,
  };
}

export function generateMockTasks(topic: string, materialId: string, userId: string): AIStudyTask[] {
  const now = new Date();
  return [
    { id: generateId(), materialId, title: `Read ${topic} fundamentals`, completed: false, priority: "High" as const, estimatedMinutes: 30, topic, dueDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`, createdAt: new Date().toISOString(), userId },
    { id: generateId(), materialId, title: `Revise ${topic} key definitions`, completed: false, priority: "Medium" as const, estimatedMinutes: 20, topic, createdAt: new Date().toISOString(), userId },
    { id: generateId(), materialId, title: `Learn 5 important concepts from ${topic}`, completed: false, priority: "Medium" as const, estimatedMinutes: 25, topic, createdAt: new Date().toISOString(), userId },
    { id: generateId(), materialId, title: `Practice questions on ${topic}`, completed: false, priority: "Low" as const, estimatedMinutes: 30, topic, createdAt: new Date().toISOString(), userId },
    { id: generateId(), materialId, title: `Quick revision of ${topic}`, completed: false, priority: "Low" as const, estimatedMinutes: 15, topic, createdAt: new Date().toISOString(), userId },
  ];
}

export function generateMockPlan(topic: string, materialId: string, userId: string): AIStudyPlan {
  const today = new Date();
  const days: AIStudyPlan["days"] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "long" });
    days.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label,
      sessions: [
        { duration: "30 min", activity: `Read ${topic} concepts` },
        { duration: "20 min", activity: "Review short notes" },
        { duration: "15 min", activity: "Practice questions" },
      ],
    });
  }
  return { id: generateId(), materialId, days, createdAt: new Date().toISOString(), userId };
}
