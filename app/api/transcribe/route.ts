import {removeTemporaryBlob, isVoculoTemporaryBlobUrl} from "@/lib/temporary-upload";
import {reserveUsage} from "@/lib/usage-limit";

export const runtime = "nodejs";

type Word = {word: string; start: number; end: number};
function clock(seconds: number) {
  const totalMilliseconds = Math.max(0, Math.round(seconds * 1_000));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor(totalMilliseconds / 60_000) % 60;
  const secondsPart = Math.floor(totalMilliseconds / 1_000) % 60;
  const milliseconds = totalMilliseconds % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}
function makeSrt(words: Word[]) {
  const groups: Word[][] = [];
  for (let index = 0; index < words.length; index += 8) groups.push(words.slice(index, index + 8));
  return groups.map((group, index) => `${index + 1}\n${clock(group[0].start)} --> ${clock(group.at(-1)!.end)}\n${group.map((word) => word.word).join(" ")}\n`).join("\n");
}
const fail = (error: string, status: number) => Response.json({error}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 8_000) return fail("The processing request is too large.", 413);
  let body: {blobUrl?: unknown; language?: unknown};
  try { body = await request.json(); } catch { return fail("The processing request could not be read.", 400); }
  if (!isVoculoTemporaryBlobUrl(body.blobUrl)) return fail("Choose an audio file and try again.", 400);
  const blobUrl = body.blobUrl;
  if (typeof body.language !== "string" || !["en", "fr", "es", "de", "it", "nl"].includes(body.language)) {
    await removeTemporaryBlob(blobUrl);
    return fail("Choose a supported spoken language.", 400);
  }
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) { await removeTemporaryBlob(blobUrl); return fail("Audio transcription is temporarily unavailable.", 503); }

  try {
    const quota = await reserveUsage(request, "transcribe");
    if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status, headers: quota.retryAfter ? {"Retry-After": String(quota.retryAfter)} : {}});
    const endpoint = new URL("https://api.deepgram.com/v1/listen");
    endpoint.searchParams.set("model", "nova-3");
    endpoint.searchParams.set("smart_format", "true");
    endpoint.searchParams.set("language", body.language);
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": "application/json"},
      body: JSON.stringify({url: blobUrl}),
      signal: AbortSignal.timeout(120_000),
    });
    if (!upstream.ok) return fail("Audio transcription could not be completed. Try again with another recording.", 502);
    const data = await upstream.json() as {results?: {channels?: Array<{alternatives?: Array<{transcript?: string; words?: Word[]}>}>}};
    const alternative = data.results?.channels?.[0]?.alternatives?.[0];
    const transcript = alternative?.transcript?.trim() || "";
    return Response.json({transcript, srt: makeSrt(alternative?.words || [])}, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    console.error("Audio transcription failed", error instanceof Error ? error.message : "Unknown error");
    return fail("Audio processing timed out. Try again with another recording.", 504);
  } finally {
    await removeTemporaryBlob(blobUrl);
  }
}
