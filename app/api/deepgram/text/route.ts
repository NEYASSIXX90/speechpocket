import {reserveUsage} from "@/lib/usage-limit";

const fail = (error: string, status: number) => Response.json({error}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  let body: {text?: unknown};
  try { body = await request.json(); } catch { return fail("Invalid text request.", 400); }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 20 || text.length > 20_000) return fail("Enter between 20 and 20,000 characters.", 400);
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return fail("Deepgram is not configured yet.", 503);
  const quota = await reserveUsage(request, "transcribe");
  if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status});
  const url = new URL("https://api.deepgram.com/v1/read");
  url.searchParams.set("summarize", "true");
  url.searchParams.set("sentiment", "true");
  url.searchParams.set("intents", "true");
  url.searchParams.set("topics", "true");
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": "application/json"},
      body: JSON.stringify({text}),
      signal: AbortSignal.timeout(30_000),
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload) return fail("Text analysis could not be completed.", 502);
    return Response.json(payload, {headers: {"Cache-Control": "no-store"}});
  } catch { return fail("Text analysis timed out.", 504); }
}
