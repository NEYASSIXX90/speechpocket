import {handleUpload} from "@vercel/blob/client";
import {MAX_UPLOAD_BYTES, TEMP_UPLOAD_PREFIX} from "@/lib/temporary-upload";
import {reserveUsage} from "@/lib/usage-limit";

export const runtime = "nodejs";

const fail = (error: string, status: number) => Response.json({error}, {status, headers: {"Cache-Control": "no-store"}});

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fail("File processing is not configured yet.", 503);
  let body: Parameters<typeof handleUpload>[0]["body"];
  try {
    body = await request.json() as Parameters<typeof handleUpload>[0]["body"];
  } catch {
    return fail("The upload could not be started.", 400);
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(TEMP_UPLOAD_PREFIX) || pathname.includes("..")) throw new Error("Upload path is not allowed.");
        let purpose: unknown;
        try { purpose = JSON.parse(clientPayload || "{}").purpose; } catch { throw new Error("Upload purpose is invalid."); }
        if (purpose !== "transcribe" && purpose !== "analyze") throw new Error("Upload purpose is not supported.");
        const quota = await reserveUsage(request, "upload");
        if (!quota.ok) throw new Error(quota.error);
        return {
          addRandomSuffix: true,
          allowOverwrite: false,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          allowedContentTypes: ["audio/*", "video/mp4"],
          validUntil: Date.now() + 60 * 60 * 1_000,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({purpose}),
        };
      },
    });
    return Response.json(result, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const message = error instanceof Error ? error.message : "The upload could not be started.";
    const limited = message.includes("free limit");
    const unavailable = message.includes("temporarily unavailable");
    return fail(limited ? message : "The upload could not be started. Try again.", limited ? 429 : unavailable ? 503 : 400);
  }
}
