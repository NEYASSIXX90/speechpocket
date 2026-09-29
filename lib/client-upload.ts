"use client";

import {upload} from "@vercel/blob/client";

type UploadPurpose = "transcribe" | "analyze";
const mimeByExtension: Record<string, string> = {
  mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", mp4: "video/mp4", ogg: "audio/ogg", webm: "audio/webm",
};

export async function uploadAndProcess<T>(
  file: File,
  purpose: UploadPurpose,
  endpoint: string,
  options: Record<string, unknown>,
  onProgress?: (percentage: number | null) => void,
): Promise<T> {
  const extension = file.name.split(".").at(-1)?.toLowerCase() || "";
  const contentType = file.type.startsWith("audio/") || file.type === "video/mp4" ? file.type : mimeByExtension[extension];
  if (!contentType) throw new Error("This file type is not supported. Choose an audio file and try again.");
  const blob = await upload(`voculo-tmp/${crypto.randomUUID()}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    clientPayload: JSON.stringify({purpose}),
    contentType,
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: ({percentage}) => onProgress?.(Math.round(percentage)),
  });
  onProgress?.(null);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({...options, blobUrl: blob.url}),
  });
  const result = await response.json().catch(() => ({})) as T & {error?: string};
  if (!response.ok) throw new Error(result.error || "The recording could not be processed. Try again.");
  return result;
}
