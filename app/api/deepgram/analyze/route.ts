import {buildListenUrl, normalizeDeepgramResult, type AudioMode} from "@/lib/deepgram-capabilities";
import {isVoculoTemporaryBlobUrl, removeTemporaryBlob} from "@/lib/temporary-upload";
import {reserveUsage} from "@/lib/usage-limit";

export const runtime = "nodejs";

const modes = new Set<AudioMode>([
  "audio-language-detector", "mixed-language-transcription", "speaker-diarization",
  "multichannel-call-transcription", "verbatim-transcription", "transcript-redactor",
  "vocabulary-transcription", "search-inside-audio", "transcript-confidence-checker", "audio-intelligence",
]);
const fail = (error: string, status: number) => Response.json({error}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 64_000) return fail("The processing request is too large.", 413);
  let body: {blobUrl?: unknown; mode?: unknown; language?: unknown; redaction?: unknown; keyterms?: unknown; replacements?: unknown; search?: unknown; profanity?: unknown};
  try { body = await request.json(); } catch { return fail("The processing request could not be read.", 400); }
  if (!isVoculoTemporaryBlobUrl(body.blobUrl)) return fail("Choose an audio file and try again.", 400);
  const blobUrl = body.blobUrl;
  if (typeof body.mode !== "string" || !modes.has(body.mode as AudioMode)) {
    await removeTemporaryBlob(blobUrl);
    return fail("Choose a supported analysis mode.", 400);
  }
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) { await removeTemporaryBlob(blobUrl); return fail("Audio analysis is temporarily unavailable.", 503); }

  try {
    const quota = await reserveUsage(request, "transcribe");
    if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status, headers: quota.retryAfter ? {"Retry-After": String(quota.retryAfter)} : {}});
    const keyterms = typeof body.keyterms === "string" ? body.keyterms.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 100) : [];
    const replacements = typeof body.replacements === "string" ? body.replacements.split("\n").slice(0, 20).map((line) => {
      const [find, ...rest] = line.split("=>");
      return {find: find?.trim() || "", replace: rest.join("=>").trim()};
    }).filter((pair) => pair.find && pair.replace) : [];
    const url = buildListenUrl(body.mode as AudioMode, {
      language: typeof body.language === "string" ? body.language : "en",
      redaction: typeof body.redaction === "string" ? body.redaction : "pii",
      keyterms,
      replacements,
      search: typeof body.search === "string" ? body.search.trim().slice(0, 200) : "",
      profanity: body.profanity === true,
    });
    const upstream = await fetch(url, {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": "application/json"},
      body: JSON.stringify({url: blobUrl}),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = await upstream.json().catch(() => null) as Record<string, unknown> | null;
    if (!upstream.ok || !payload) {
      console.error("Deepgram analysis failed", {status: upstream.status, mode: body.mode});
      return fail("The audio could not be processed with these settings. Try again with another recording.", 502);
    }
    return Response.json(normalizeDeepgramResult(payload), {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    console.error("Deepgram analysis failed", error instanceof Error ? error.message : "Unknown error");
    return fail("Audio processing timed out. Try again with another recording.", 504);
  } finally {
    await removeTemporaryBlob(blobUrl);
  }
}
