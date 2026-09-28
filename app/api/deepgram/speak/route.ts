import {reserveUsage} from "@/lib/usage-limit";

const auraVoices: Record<string, string> = {
  en: "aura-2-thalia-en", fr: "aura-2-agathe-fr", es: "aura-2-diana-es",
  de: "aura-2-viktoria-de", it: "aura-2-flavio-it", nl: "aura-2-rhea-nl",
};
const fail = (error: string, status: number) => Response.json({error}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  let body: {text?: unknown; language?: unknown; speed?: unknown; expressivity?: unknown; engine?: unknown; word?: unknown; ipa?: unknown};
  try { body = await request.json(); } catch { return fail("Invalid voice request.", 400); }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const language = typeof body.language === "string" && auraVoices[body.language] ? body.language : "en";
  const engine = body.engine === "flux" ? "flux" : "aura";
  const speed = Math.max(engine === "flux" ? 0.5 : 0.7, Math.min(1.5, Number(body.speed) || 1));
  const expressivity = Math.max(-2, Math.min(2, Number(body.expressivity) || 0));
  if (!text || text.length > 2_000) return fail("Enter up to 2,000 characters.", 400);
  if (engine === "flux" && language !== "en") return fail("The expressive voice style currently uses an English voice.", 400);
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return fail("The speech provider is not configured yet.", 503);
  const quota = await reserveUsage(request, "speak");
  if (!quota.ok) return Response.json({error: quota.error}, {status: quota.status});

  let preparedText = text;
  const word = typeof body.word === "string" ? body.word.trim() : "";
  const ipa = typeof body.ipa === "string" ? body.ipa.trim() : "";
  if (engine === "aura" && word && ipa && text.includes(word)) {
    preparedText = text.replaceAll(word, `\\{"word":"${word.replaceAll('"', '')}","pronounce":"${ipa.replaceAll('"', '')}"\\}`);
  }
  const url = new URL(engine === "flux" ? "https://api.deepgram.com/v2/speak" : "https://api.deepgram.com/v1/speak");
  url.searchParams.set("model", engine === "flux" ? "flux-alexis-en" : auraVoices[language]);
  url.searchParams.set("speed", speed.toFixed(2));
  if (engine === "flux") url.searchParams.set("expressivity", expressivity.toFixed(2));
  if (engine === "aura") url.searchParams.set("encoding", "mp3");
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {Authorization: `Token ${key}`, "Content-Type": "application/json"},
      body: JSON.stringify({text: preparedText}),
      signal: AbortSignal.timeout(30_000),
    });
    if (!upstream.ok) return fail("Speech generation could not be completed with these controls.", 502);
    return new Response(upstream.body, {headers: {"Content-Type": upstream.headers.get("content-type") || "audio/mpeg", "Cache-Control": "no-store"}});
  } catch { return fail("Speech generation timed out.", 504); }
}
