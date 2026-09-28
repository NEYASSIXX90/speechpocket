export type AdvancedToolKind = "audio" | "text" | "tts" | "live" | "enterprise";

export type AdvancedTool = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  detail: string;
  kind: AdvancedToolKind;
  keyword: string;
  capabilities: string[];
};

export const advancedTools: AdvancedTool[] = [
  {
    slug: "audio-language-detector",
    title: "Audio language detector",
    shortTitle: "Language detector",
    description: "Identify the language in an audio or video file, see the confidence score, and generate a transcript.",
    detail: "Automatic language detection · transcript included",
    kind: "audio",
    keyword: "audio language detector",
    capabilities: ["Automatic language detection", "Language confidence", "Transcript generation"],
  },
  {
    slug: "mixed-language-transcription",
    title: "Mixed-language transcription",
    shortTitle: "Mixed languages",
    description: "Transcribe recordings where speakers switch languages during the same conversation.",
    detail: "Multilingual Nova-3 · code-switching",
    kind: "audio",
    keyword: "multilingual transcription",
    capabilities: ["Code-switching", "Per-word language metadata", "Smart formatting"],
  },
  {
    slug: "speaker-diarization",
    title: "Speaker diarization",
    shortTitle: "Speaker labels",
    description: "Separate speakers and receive a readable, speaker-labelled conversation transcript.",
    detail: "Latest diarization model · semantic utterances",
    kind: "audio",
    keyword: "speaker diarization",
    capabilities: ["Speaker labels", "Utterance segmentation", "Speaker confidence"],
  },
  {
    slug: "multichannel-call-transcription",
    title: "Multichannel call transcription",
    shortTitle: "Call channels",
    description: "Transcribe caller and agent channels independently for cleaner call analysis.",
    detail: "Up to 20 audio channels",
    kind: "audio",
    keyword: "multichannel transcription",
    capabilities: ["Independent channels", "Channel labels", "Call-ready output"],
  },
  {
    slug: "verbatim-transcription",
    title: "Verbatim transcription",
    shortTitle: "Verbatim transcript",
    description: "Keep filler words, false starts, dictation punctuation, or filter profanity.",
    detail: "Filler words · dictation · profanity controls",
    kind: "audio",
    keyword: "verbatim transcription",
    capabilities: ["Filler words", "Spoken punctuation", "Profanity filtering"],
  },
  {
    slug: "transcript-redactor",
    title: "Private transcript redactor",
    shortTitle: "PII redactor",
    description: "Remove numbers, personal data, payment-card data, or health information while transcribing.",
    detail: "Numbers · PII · PCI · PHI",
    kind: "audio",
    keyword: "PII redaction",
    capabilities: ["Numeric redaction", "PII redaction", "PCI redaction", "PHI redaction"],
  },
  {
    slug: "vocabulary-transcription",
    title: "Custom vocabulary transcription",
    shortTitle: "Custom vocabulary",
    description: "Improve difficult names and terminology, then normalize selected phrases in the result.",
    detail: "Keyterms · find and replace",
    kind: "audio",
    keyword: "custom vocabulary transcription",
    capabilities: ["Keyterm prompting", "Find and replace", "Domain terminology"],
  },
  {
    slug: "search-inside-audio",
    title: "Search inside audio",
    shortTitle: "Audio search",
    description: "Find where a word or phrase was spoken and return its timestamped matches.",
    detail: "Acoustic phrase search",
    kind: "audio",
    keyword: "search spoken words in audio",
    capabilities: ["Acoustic phrase search", "Timestamped matches", "Transcript context"],
  },
  {
    slug: "transcript-confidence-checker",
    title: "Transcript confidence checker",
    shortTitle: "Confidence checker",
    description: "Inspect transcript confidence and identify words that may need manual review.",
    detail: "Word and transcript confidence",
    kind: "audio",
    keyword: "transcription confidence score",
    capabilities: ["Word confidence", "Transcript confidence", "Low-confidence review"],
  },
  {
    slug: "audio-intelligence",
    title: "Audio intelligence analyzer",
    shortTitle: "Audio intelligence",
    description: "Summarize a recording and detect its sentiment, intent, topics, and named entities.",
    detail: "Summary · sentiment · intent · topics · entities",
    kind: "audio",
    keyword: "audio summarization",
    capabilities: ["Summarization", "Sentiment", "Intent", "Topics", "Entity extraction"],
  },
  {
    slug: "text-intelligence",
    title: "Text intelligence analyzer",
    shortTitle: "Text intelligence",
    description: "Analyze pasted text for summaries, sentiment, intent, topics, and entities.",
    detail: "Native Deepgram Text Intelligence",
    kind: "text",
    keyword: "text sentiment analysis",
    capabilities: ["Text summary", "Text sentiment", "Text intent", "Text topics"],
  },
  {
    slug: "streaming-voice-studio",
    title: "Advanced voice studio",
    shortTitle: "Voice studio",
    description: "Generate speech with speed control, IPA pronunciation overrides, and expressive delivery.",
    detail: "Aura-2 and Flux TTS controls",
    kind: "tts",
    keyword: "streaming text to speech",
    capabilities: ["Speaking speed", "IPA pronunciation", "Expressivity", "Bilingual synthesis"],
  },
  {
    slug: "live-transcription",
    title: "Live transcription",
    shortTitle: "Live transcript",
    description: "Transcribe your microphone in real time with interim results and speech-boundary events.",
    detail: "Streaming Nova-3 · temporary browser token",
    kind: "live",
    keyword: "real time transcription",
    capabilities: ["Interim results", "Speech start", "Endpointing", "Utterance end"],
  },
  {
    slug: "conversation-lab",
    title: "Conversation turn lab",
    shortTitle: "Conversation lab",
    description: "Inspect turn completion, interruptions, resumed speech, and other Flux conversation events.",
    detail: "Deepgram Flux turn intelligence",
    kind: "live",
    keyword: "voice agent turn detection",
    capabilities: ["End of turn", "Eager end of turn", "Turn resumed", "Interruption detection"],
  },
  {
    slug: "enterprise-speech",
    title: "Enterprise speech deployment",
    shortTitle: "Enterprise speech",
    description: "Plan a custom-trained or self-hosted speech deployment for controlled infrastructure.",
    detail: "Custom models · self-hosted inference",
    kind: "enterprise",
    keyword: "on premise speech to text",
    capabilities: ["Custom-trained models", "Self-hosted STT", "Self-hosted TTS"],
  },
];

export function advancedLink(slug: string, locale = "en") {
  return `/${locale}/${slug}`;
}

export function getAdvancedTool(slug: string) {
  return advancedTools.find((tool) => tool.slug === slug);
}
