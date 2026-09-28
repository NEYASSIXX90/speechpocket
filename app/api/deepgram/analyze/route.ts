import {buildListenUrl, normalizeDeepgramResult, type AudioMode} from "@/lib/deepgram-capabilities";
import {reserveUsage} from "@/lib/usage-limit";

const MAX_BYTES = 2 * 1024 * 1024;
const modes = new Set<AudioMode>([
  "audio-language-detector", "mixed-language-transcription", "speaker-diarization",
  "multichannel-call-transcription", "verbatim-transcription", "transcript-redactor",
  "vocabulary-transcription", "search-inside-audio", "transcript-confidence-checker",
  "audio-intelligence",
]);
const accepted = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a", "video/mp4", "audio/ogg", "audio/webm"]);
const fail = (error: string, status: number) => Response.json({error}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES + 16_000) return fail("File must be 2 MB or smaller.", 413);
  let form: FormData;
  try { form = await request.formData(); } catch { return fail("Could not read the request.", 400); }
  const file = form.get("file");
  const mode = form.get("mode");
  if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) return fail("Choose an audio or video file up to 2 MB.", 400);
  if (file.type && !accepted.has(file.type)) return fail("Use an MP3, M4A, WAV, MP4, OGG, or WebM file.", 400);
  if (typeof mode !== "string" || !modes.has(mode as AudioMode)) return fail("Choose a supported analysis mode.", 400);

  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return fail("Deepgram is not configured yet.", 503);
  const quota = await reserveUsage(request, "transcribe");
  if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status, headers: quota.retryAfter ? {"Retry-After": String(quota.retryAfter)} : {}});

  const keyterms = String(form.get("keyterms") || "").split(",").map((value) => value.trim()).filter(Boolean);
  const replacements = String(form.get("replacements") || "").split("\n").map((line) => {
    const [find, ...rest] = line.split("=>");
    return {find: find?.trim() || "", replace: rest.join("=>").trim()};
  }).filter((pair) => pair.find && pair.replace);

  const url = buildListenUrl(mode as AudioMode, {
    language: String(form.get("language") || "en"),
    redaction: String(form.get("redaction") || "pii"),
    keyterms,
    replacements,
    search: String(form.get("search") || "").trim(),
    profanity: form.get("profanity") === "true",
  });

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": file.type || "application/octet-stream"},
      body: await file.arrayBuffer(),
      signal: AbortSignal.timeout(45_000),
    });
    const payload = await upstream.json().catch(() => null) as Record<string, unknown> | null;
    if (!upstream.ok || !payload) {
      console.error("Deepgram analysis failed", {status: upstream.status, mode});
      return fail("The audio could not be processed with these settings. Try a shorter recording or another mode.", 502);
    }
    return Response.json(normalizeDeepgramResult(payload), {headers: {"Cache-Control": "no-store"}});
  } catch {
    return fail("Audio processing timed out. Try a shorter recording.", 504);
  }
}
