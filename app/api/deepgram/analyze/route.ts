import {buildListenUrl, normalizeDeepgramResult, type AudioMode} from "@/lib/deepgram-capabilities";
import {readAudioRequest} from "@/lib/audio-upload";
import {reserveUsage} from "@/lib/usage-limit";

export const runtime = "nodejs";

const modes = new Set<AudioMode>([
  "audio-language-detector", "mixed-language-transcription", "speaker-diarization",
  "multichannel-call-transcription", "verbatim-transcription", "transcript-redactor",
  "vocabulary-transcription", "search-inside-audio", "transcript-confidence-checker", "audio-intelligence",
]);
const fail = (error: string, status: number) => Response.json({error}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  let audio: Awaited<ReturnType<typeof readAudioRequest>>;
  try { audio = await readAudioRequest(request); }
  catch (error) {
    const message = error instanceof Error ? error.message : "The audio could not be read.";
    return fail(message, message.includes("4.5 MB") ? 413 : 400);
  }

  const params = new URL(request.url).searchParams;
  const mode = params.get("mode");
  if (!mode || !modes.has(mode as AudioMode)) return fail("Choose a supported analysis mode.", 400);
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return fail("Audio analysis is temporarily unavailable.", 503);

  const quota = await reserveUsage(request, "transcribe");
  if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status, headers: quota.retryAfter ? {"Retry-After": String(quota.retryAfter)} : {}});
  let replacements: Array<{find: string; replace: string}> = [];
  try {
    const parsed = JSON.parse(params.get("replacements") || "[]");
    if (Array.isArray(parsed)) replacements = parsed.filter((item): item is {find: string; replace: string} =>
      item && typeof item.find === "string" && typeof item.replace === "string",
    ).slice(0, 20);
  } catch { return fail("The replacement options could not be read.", 400); }

  const url = buildListenUrl(mode as AudioMode, {
    language: params.get("language") || "en",
    redaction: params.get("redaction") || "pii",
    keyterms: (params.get("keyterms") || "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 100),
    replacements,
    search: (params.get("search") || "").trim().slice(0, 200),
    profanity: params.get("profanity") === "true",
  });
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": audio.contentType},
      body: audio.bytes,
      signal: AbortSignal.timeout(120_000),
    });
    const payload = await upstream.json().catch(() => null) as Record<string, unknown> | null;
    if (!upstream.ok || !payload) {
      console.error("Deepgram analysis failed", {status: upstream.status, mode});
      return fail("The audio could not be processed with these settings. Try another recording.", 502);
    }
    return Response.json(normalizeDeepgramResult(payload), {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    console.error("Deepgram analysis failed", error instanceof Error ? error.message : "Unknown error");
    return fail("Audio processing timed out. Try another recording.", 504);
  }
}
