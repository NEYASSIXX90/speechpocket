import {reserveUsage} from "@/lib/usage-limit";

export async function POST(request: Request) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return Response.json({error: "Deepgram is not configured yet."}, {status: 503});
  const quota = await reserveUsage(request, "transcribe");
  if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status});
  try {
    const upstream = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": "application/json"},
      body: JSON.stringify({ttl_seconds: 60}),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload) return Response.json({error: "A live-session token could not be created."}, {status: 502});
    return Response.json(payload, {headers: {"Cache-Control": "no-store"}});
  } catch { return Response.json({error: "A live-session token could not be created."}, {status: 504}); }
}
