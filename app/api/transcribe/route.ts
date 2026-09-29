import {readAudioRequest} from "@/lib/audio-upload";
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
  let audio: Awaited<ReturnType<typeof readAudioRequest>>;
  try { audio = await readAudioRequest(request); }
  catch (error) {
    const message = error instanceof Error ? error.message : "The audio could not be read.";
    return fail(message, message.includes("4.5 MB") ? 413 : 400);
  }

  const language = new URL(request.url).searchParams.get("language") || "en";
  if (!["en", "fr", "es", "de", "it", "nl"].includes(language)) return fail("Choose a supported spoken language.", 400);
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return fail("Audio transcription is temporarily unavailable.", 503);

  const quota = await reserveUsage(request, "transcribe");
  if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status, headers: quota.retryAfter ? {"Retry-After": String(quota.retryAfter)} : {}});
  const endpoint = new URL("https://api.deepgram.com/v1/listen");
  endpoint.searchParams.set("model", "nova-3");
  endpoint.searchParams.set("smart_format", "true");
  endpoint.searchParams.set("language", language);
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": audio.contentType},
      body: audio.bytes,
      signal: AbortSignal.timeout(120_000),
    });
    if (!upstream.ok) return fail("Audio transcription could not be completed. Try another recording.", 502);
    const data = await upstream.json() as {results?: {channels?: Array<{alternatives?: Array<{transcript?: string; words?: Word[]}>}>}};
    const alternative = data.results?.channels?.[0]?.alternatives?.[0];
    return Response.json({transcript: alternative?.transcript?.trim() || "", srt: makeSrt(alternative?.words || [])}, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    console.error("Audio transcription failed", error instanceof Error ? error.message : "Unknown error");
    return fail("Audio processing timed out. Try again with another recording.", 504);
  }
}
