/**
 * apiClient.ts — Single source of truth for all Plannora backend communication.
 *
 * Every fetch to the FastAPI backend goes through here so that:
 * - the backend base URL is configured in exactly one place
 * - network failures never surface as raw "Failed to fetch"
 * - HTTP and AI errors are distinguished with user-safe messages
 */

export const BACKEND_ROOT: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:8000";

export const API_BASE: string = `${BACKEND_ROOT}/api/v1`;

export class PlannoraApiError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string = "API_ERROR", status?: number) {
    super(message);
    this.name = "PlannoraApiError";
    this.code = code;
    this.status = status;
  }
}

export const NETWORK_ERROR_MESSAGE =
  "Unable to connect to the Plannora AI server. Please make sure the backend is running.";

function friendlyHttpMessage(status: number, detail: unknown): string {
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }
  if (status === 503) {
    return "Plannora AI is temporarily unavailable. Please try again.";
  }
  if (status === 429) {
    return "Plannora AI is experiencing high demand. Please try again in a few moments.";
  }
  if (status >= 500) {
    return "Server returned an error. Please try again.";
  }
  if (status === 422) {
    return "The request was invalid. Please check your input and try again.";
  }
  return `Request failed (${status}).`;
}

function extractDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  if (typeof b.detail === "string") return b.detail;
  const err = b.error as Record<string, unknown> | undefined;
  if (err && typeof err.message === "string") return err.message;
  if (Array.isArray(b.detail) && b.detail.length > 0) {
    const first = b.detail[0] as Record<string, unknown>;
    if (typeof first?.msg === "string") return `Invalid request: ${first.msg}`;
  }
  return undefined;
}

async function parseJsonSafely(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Core JSON request wrapper for GET/POST/PATCH/DELETE against /api/v1.
 * Never sets a Content-Type for FormData bodies — the browser must
 * generate the multipart boundary itself.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && options.body != null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new PlannoraApiError(NETWORK_ERROR_MESSAGE, "NETWORK_ERROR");
  }

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    throw new PlannoraApiError(
      friendlyHttpMessage(res.status, extractDetail(data)),
      `HTTP_${res.status}`,
      res.status
    );
  }

  if (data === null) {
    throw new PlannoraApiError(
      "The AI response could not be processed. Please try again.",
      "INVALID_RESPONSE",
      res.status
    );
  }

  return data as T;
}

/**
 * Absolute-URL request wrapper (e.g. backend root endpoints like /health).
 */
export async function apiRequestAbsolute<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new PlannoraApiError(NETWORK_ERROR_MESSAGE, "NETWORK_ERROR");
  }

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    throw new PlannoraApiError(
      friendlyHttpMessage(res.status, extractDetail(data)),
      `HTTP_${res.status}`,
      res.status
    );
  }

  return data as T;
}
