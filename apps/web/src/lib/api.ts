export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}
let sessionPromise: Promise<void> | undefined;

export function ensureSession(): Promise<void> {
  if (!sessionPromise) {
    sessionPromise = fetch("/api/v1/session", {
      method: "POST",
      headers: { "X-StudyPilot": "1" },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new ApiError(data.detail, data.code, response.status);
        }
      })
      .catch((error) => {
        sessionPromise = undefined;
        throw error;
      });
  }
  return sessionPromise;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  await ensureSession();
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-StudyPilot": "1",
      ...init.headers,
    },
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({
        detail: "The request could not be completed.",
        code: "network",
      }));
    if (response.status === 401) sessionPromise = undefined;
    throw new ApiError(error.detail, error.code, response.status);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });

export async function uploadPdf<T>(
  file: File,
  progress: (value: number) => void,
): Promise<T> {
  await ensureSession();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v1/documents");
    xhr.setRequestHeader("X-StudyPilot", "1");
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress(Math.round((100 * event.loaded) / event.total));
    };
    xhr.onerror = () =>
      reject(
        new Error("Upload interrupted. Check your connection and try again."),
      );
    xhr.ontimeout = () =>
      reject(new Error("Upload timed out. Try a smaller PDF."));
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(result);
        else
          reject(
            new ApiError(
              result.detail ?? "Upload failed.",
              result.code,
              xhr.status,
            ),
          );
      } catch {
        reject(new Error("The server returned an invalid response."));
      }
    };
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Please try again.";
}
export function dateLabel(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}
export function todayISO(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}
export function cn(...values: (string | boolean | undefined | null)[]): string {
  return values.filter(Boolean).join(" ");
}
