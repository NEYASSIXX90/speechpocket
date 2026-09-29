export const MAX_UPLOAD_BYTES = 4_500_000;

const audioMimeTypes = new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm", "video/mp4"]);
const mimeAliases: Record<string, string> = {"audio/m4a": "audio/mp4", "audio/x-m4a": "audio/mp4", "audio/wave": "audio/wav", "audio/x-wav": "audio/wav"};
const mimeByExtension: Record<string, string> = {mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", mp4: "video/mp4", ogg: "audio/ogg", webm: "audio/webm"};

export function normalizeAudioContentType(contentType: string) {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  const canonical = mimeAliases[normalized] || normalized;
  return audioMimeTypes.has(canonical) ? canonical : "";
}

export function getUploadContentType(file: Pick<File, "name" | "type">) {
  const declaredType = normalizeAudioContentType(file.type);
  if (declaredType) return declaredType;
  const extension = file.name.split(".").at(-1)?.toLowerCase() || "";
  return mimeByExtension[extension] || "";
}
