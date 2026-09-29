"use client";

import {getUploadContentType, MAX_UPLOAD_BYTES} from "@/lib/upload-constants";

export async function uploadAndProcess<T>(
  file: File,
  purpose: "transcribe" | "analyze",
  endpoint: string,
  options: Record<string, unknown>,
  onProgress?: (percentage: number | null) => void,
): Promise<T> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Audio files must be 4.5 MB or smaller.");
  const contentType = getUploadContentType(file);
  if (!contentType) throw new Error("This file type is not supported. Choose MP3, M4A, WAV, MP4, OGG, or WebM.");

  const url = new URL(endpoint, window.location.origin);
  if (purpose === "analyze") {
    url.searchParams.set("mode", String(options.mode || ""));
    for (const [key, value] of Object.entries(options)) {
      if (key === "mode" || value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  } else {
    url.searchParams.set("language", String(options.language || "en"));
  }

  const response = await new Promise<{status: number; body: T & {error?: string}}>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url.toString());
    xhr.responseType = "text";
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100));
    };
    xhr.upload.onload = () => onProgress?.(null);
    xhr.onerror = () => reject(new Error("The upload could not reach Voculo. Check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("Audio processing took too long. Try a shorter recording."));
    xhr.timeout = 180_000;
    xhr.onload = () => {
      let body: T & {error?: string};
      try { body = JSON.parse(xhr.responseText) as T & {error?: string}; }
      catch { body = {} as T & {error?: string}; }
      resolve({status: xhr.status, body});
    };
    xhr.send(file);
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(response.body.error || "The recording could not be processed. Try again.");
  }
  return response.body;
}
