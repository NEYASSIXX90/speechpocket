import {del, list} from "@vercel/blob";
import {TEMP_UPLOAD_PREFIX} from "@/lib/temporary-upload";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({error: "Unauthorized"}, {status: 401, headers: {"Cache-Control": "no-store"}});
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({error: "Storage is not configured."}, {status: 503});

  const cutoff = Date.now() - 24 * 60 * 60 * 1_000;
  let cursor: string | undefined;
  let removed = 0;
  for (let page = 0; page < 5; page++) {
    const result = await list({prefix: TEMP_UPLOAD_PREFIX, limit: 1_000, cursor});
    const expired = result.blobs.filter((blob) => blob.uploadedAt.getTime() < cutoff);
    for (let index = 0; index < expired.length; index += 25) {
      await del(expired.slice(index, index + 25).map((blob) => blob.url));
      removed += Math.min(25, expired.length - index);
    }
    if (!result.hasMore || !result.cursor) break;
    cursor = result.cursor;
  }
  return Response.json({ok: true, removed}, {headers: {"Cache-Control": "no-store"}});
}
