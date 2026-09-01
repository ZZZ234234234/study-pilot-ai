import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const base = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";
  const target = new URL(
    `/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
    base,
  );
  const headers = new Headers();
  for (const key of [
    "content-type",
    "content-length",
    "cookie",
    "origin",
    "x-studypilot",
    "range",
  ]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "manual",
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      // Node fetch requires duplex for streaming PDF uploads; credentials remain server-side.
      ...({ duplex: "half" } as RequestInit),
      signal: AbortSignal.timeout(300_000),
    });
    const outgoing = new Headers();
    for (const key of [
      "content-type",
      "set-cookie",
      "content-disposition",
      "content-range",
      "accept-ranges",
      "content-length",
    ]) {
      const value = response.headers.get(key);
      if (value) outgoing.set(key, value);
    }
    outgoing.set("Cache-Control", "no-store");
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    });
  } catch {
    return Response.json(
      {
        detail:
          "The API is unavailable. Start the backend and PDF worker, then retry.",
        code: "api_unavailable",
      },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
