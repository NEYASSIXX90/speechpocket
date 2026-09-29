import {MAX_UPLOAD_BYTES, normalizeAudioContentType} from "@/lib/upload-constants";

export function isSupportedAudioType(contentType: string) {
  return Boolean(normalizeAudioContentType(contentType));
}

export function hasSupportedAudioSignature(bytes: Uint8Array, contentType: string) {
  const type = normalizeAudioContentType(contentType);
  const text = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (type === "audio/wav") return bytes.length >= 12 && text(0, 4) === "RIFF" && text(8, 4) === "WAVE";
  if (type === "audio/ogg") return bytes.length >= 4 && text(0, 4) === "OggS";
  if (type === "audio/webm") return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (type === "audio/mp4" || type === "video/mp4") return bytes.length >= 12 && text(4, 4) === "ftyp";
  if (type === "audio/mpeg") {
    return bytes.length >= 3 && (text(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
  }
  return false;
}

export async function readAudioRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!isSupportedAudioType(contentType)) throw new Error("Choose MP3, M4A, WAV, MP4, OGG, or WebM.");
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_UPLOAD_BYTES) throw new Error("Audio files must be 4.5 MB or smaller.");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) throw new Error("Choose an audio file and try again.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error("Audio files must be 4.5 MB or smaller.");
  if (!hasSupportedAudioSignature(bytes, contentType)) throw new Error("This file does not appear to be a supported audio format.");
  return {bytes, contentType: normalizeAudioContentType(contentType)};
}
