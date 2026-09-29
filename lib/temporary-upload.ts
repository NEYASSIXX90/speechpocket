import {del} from "@vercel/blob";
import {TEMP_UPLOAD_PREFIX} from "@/lib/upload-constants";

export {MAX_UPLOAD_BYTES, TEMP_UPLOAD_PREFIX} from "@/lib/upload-constants";

export function isVoculoTemporaryBlobUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith(`/${TEMP_UPLOAD_PREFIX}`) &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function removeTemporaryBlob(url: string) {
  try {
    await del(url);
  } catch (error) {
    console.error("Temporary upload cleanup failed", error instanceof Error ? error.message : "Unknown error");
  }
}
