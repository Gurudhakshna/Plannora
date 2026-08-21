import type {
  StudyMaterial,
  AIStudyNotes,
  AIStudyTask,
  AIStudyPlan,
  AnalysisResult,
} from "../types/study-material";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function uploadMaterial(
  file: File,
  textContent: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<StudyMaterial> {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (textContent) formData.append("text", textContent);
  formData.append("userId", userId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/materials/upload`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.send(formData);
  });
}

export async function analyzeMaterial(
  materialId: string
): Promise<AnalysisResult> {
  return request<AnalysisResult>(`/materials/${materialId}/analyze`, {
    method: "POST",
  });
}

export async function fetchMaterials(
  userId: string
): Promise<StudyMaterial[]> {
  return request<StudyMaterial[]>(`/materials?userId=${userId}`);
}

export async function fetchAINotes(
  materialId: string
): Promise<AIStudyNotes> {
  return request<AIStudyNotes>(`/materials/${materialId}/notes`);
}

export async function fetchStudyTasks(
  userId: string
): Promise<AIStudyTask[]> {
  return request<AIStudyTask[]>(`/tasks/ai?userId=${userId}`);
}

export async function fetchStudyPlan(
  materialId: string
): Promise<AIStudyPlan> {
  return request<AIStudyPlan>(`/materials/${materialId}/plan`);
}

export async function toggleTaskComplete(
  taskId: string,
  completed: boolean
): Promise<void> {
  await request(`/tasks/ai/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export async function deleteMaterial(
  materialId: string
): Promise<void> {
  await request(`/materials/${materialId}`, { method: "DELETE" });
}

export async function saveTypedNotes(
  userId: string,
  title: string,
  content: string
): Promise<StudyMaterial> {
  return request<StudyMaterial>("/materials/text", {
    method: "POST",
    body: JSON.stringify({ userId, title, content }),
  });
}
