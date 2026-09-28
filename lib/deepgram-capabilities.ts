export type AudioMode =
  | "audio-language-detector"
  | "mixed-language-transcription"
  | "speaker-diarization"
  | "multichannel-call-transcription"
  | "verbatim-transcription"
  | "transcript-redactor"
  | "vocabulary-transcription"
  | "search-inside-audio"
  | "transcript-confidence-checker"
  | "audio-intelligence";

type AudioOptions = {
  language?: string;
  redaction?: string;
  keyterms?: string[];
  search?: string;
  replacements?: Array<{find: string; replace: string}>;
  profanity?: boolean;
};

const supportedLanguages = new Set(["en", "fr", "es", "de", "it", "nl", "ja"]);

export function buildListenUrl(mode: AudioMode, options: AudioOptions) {
  const url = new URL("https://api.deepgram.com/v1/listen");
  url.searchParams.set("model", "nova-3");
  url.searchParams.set("smart_format", "true");

  if (mode === "audio-language-detector") {
    url.searchParams.set("detect_language", "true");
  } else if (mode === "mixed-language-transcription") {
    url.searchParams.set("language", "multi");
  } else if (options.language && supportedLanguages.has(options.language)) {
    url.searchParams.set("language", options.language);
  } else {
    url.searchParams.set("language", "en");
  }

  switch (mode) {
    case "speaker-diarization":
      url.searchParams.set("diarize_model", "latest");
      url.searchParams.set("utterances", "true");
      url.searchParams.set("utt_split", "0.8");
      break;
    case "multichannel-call-transcription":
      url.searchParams.set("multichannel", "true");
      break;
    case "verbatim-transcription":
      url.searchParams.set("filler_words", "true");
      url.searchParams.set("dictation", "true");
      if (options.profanity) url.searchParams.set("profanity_filter", "true");
      break;
    case "transcript-redactor":
      url.searchParams.append("redact", ["numbers", "pii", "pci", "phi"].includes(options.redaction || "") ? options.redaction! : "pii");
      break;
    case "vocabulary-transcription":
      for (const keyterm of (options.keyterms || []).slice(0, 100)) url.searchParams.append("keyterm", keyterm);
      for (const pair of (options.replacements || []).slice(0, 20)) {
        if (pair.find && pair.replace) url.searchParams.append("replace", `${pair.find}:${pair.replace}`);
      }
      break;
    case "search-inside-audio":
      if (options.search) url.searchParams.append("search", options.search);
      break;
    case "audio-intelligence":
      url.searchParams.set("summarize", "v2");
      url.searchParams.set("sentiment", "true");
      url.searchParams.set("intents", "true");
      url.searchParams.set("topics", "true");
      url.searchParams.set("detect_entities", "true");
      break;
    case "transcript-confidence-checker":
      break;
  }
  return url;
}

type DgWord = {word?: string; punctuated_word?: string; start?: number; end?: number; confidence?: number; speaker?: number; language?: string};
type DgAlternative = {transcript?: string; confidence?: number; words?: DgWord[]; languages?: string[]};

export function normalizeDeepgramResult(data: Record<string, unknown>) {
  const results = (data.results || {}) as Record<string, unknown>;
  const channels = Array.isArray(results.channels) ? results.channels as Array<Record<string, unknown>> : [];
  const normalizedChannels = channels.map((channel, index) => {
    const alternatives = Array.isArray(channel.alternatives) ? channel.alternatives as DgAlternative[] : [];
    const best = alternatives[0] || {};
    return {
      channel: index,
      transcript: best.transcript || "",
      confidence: best.confidence ?? null,
      detectedLanguage: channel.detected_language || null,
      languageConfidence: channel.language_confidence || null,
      languages: best.languages || [],
      words: (best.words || []).map((word) => ({
        word: word.punctuated_word || word.word || "",
        start: word.start ?? null,
        end: word.end ?? null,
        confidence: word.confidence ?? null,
        speaker: word.speaker ?? null,
        language: word.language || null,
      })),
    };
  });
  return {
    transcript: normalizedChannels.map((channel) => channel.transcript).filter(Boolean).join("\n\n"),
    channels: normalizedChannels,
    utterances: Array.isArray(results.utterances) ? results.utterances : [],
    summary: results.summary || null,
    sentiments: results.sentiments || null,
    intents: results.intents || null,
    topics: results.topics || null,
    entities: results.entities || null,
    search: results.channels ? normalizedChannels.map((channel) => channel) : [],
    metadata: data.metadata || null,
  };
}
