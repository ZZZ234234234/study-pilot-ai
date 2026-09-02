import { chineseErrorMessage } from "./locale";
import { getLocale, translateText, type Locale } from "./i18n";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(chineseErrorMessage(message, code));
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
    const error = await response.json().catch(() => ({
      detail: "请求未能完成，请稍后重试。",
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
    xhr.onerror = () => reject(new Error("上传中断，请检查网络后重试。"));
    xhr.ontimeout = () =>
      reject(new Error("上传超时，请稍后重试，或选择较小的 PDF。"));
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(result);
        else
          reject(
            new ApiError(
              result.detail ?? "上传失败，请稍后重试。",
              result.code,
              xhr.status,
            ),
          );
      } catch {
        reject(new Error("服务返回的数据异常，请稍后重试。"));
      }
    };
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}

export function errorMessage(
  error: unknown,
  locale: Locale = getLocale(),
): string {
  return error instanceof Error
    ? translateText(
        chineseErrorMessage(
          translateText(error.message, "zh-CN"),
          error instanceof ApiError ? error.code : undefined,
        ),
        locale,
      )
    : translateText("请稍后重试。", locale);
}
export function dateLabel(value: string, locale: Locale = getLocale()): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return date.toLocaleDateString(locale, {
    month: locale === "en" ? "short" : "long",
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
