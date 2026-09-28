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
    title: "Find the language in a recording",
    shortTitle: "Language detector",
    description: "Identify the language in an audio or video file, see the confidence score, and generate a transcript.",
    detail: "Detected language, confidence, and transcript",
    kind: "audio",
    keyword: "audio language detector",
    capabilities: ["Automatic language detection", "Language confidence", "Transcript generation"],
  },
  {
    slug: "mixed-language-transcription",
    title: "Transcribe recordings that switch languages",
    shortTitle: "Mixed languages",
    description: "Transcribe recordings where speakers switch languages during the same conversation.",
    detail: "Language changes captured in one transcript",
    kind: "audio",
    keyword: "multilingual transcription",
    capabilities: ["Code-switching", "Per-word language metadata", "Smart formatting"],
  },
  {
    slug: "speaker-diarization",
    title: "Get a transcript with speaker labels",
    shortTitle: "Speaker labels",
    description: "Separate speakers and receive a readable, speaker-labelled conversation transcript.",
    detail: "Readable turns separated by speaker",
    kind: "audio",
    keyword: "speaker diarization",
    capabilities: ["Speaker labels", "Utterance segmentation", "Speaker confidence"],
  },
  {
    slug: "multichannel-call-transcription",
    title: "Keep caller and agent audio separate",
    shortTitle: "Call channels",
    description: "Transcribe caller and agent channels independently for cleaner call analysis.",
    detail: "Channel-separated call transcript",
    kind: "audio",
    keyword: "multichannel transcription",
    capabilities: ["Independent channels", "Channel labels", "Call-ready output"],
  },
  {
    slug: "verbatim-transcription",
    title: "Keep the words exactly as spoken",
    shortTitle: "Verbatim transcript",
    description: "Keep filler words, false starts, dictation punctuation, or filter profanity.",
    detail: "Optional filler words and profanity controls",
    kind: "audio",
    keyword: "verbatim transcription",
    capabilities: ["Filler words", "Spoken punctuation", "Profanity filtering"],
  },
  {
    slug: "transcript-redactor",
    title: "Remove sensitive details from a transcript",
    shortTitle: "Transcript redactor",
    description: "Remove selected numbers, personal details, payment-card data, or health information while transcribing.",
    detail: "Choose which sensitive details to remove",
    kind: "audio",
    keyword: "PII redaction",
    capabilities: ["Numeric redaction", "PII redaction", "PCI redaction", "PHI redaction"],
  },
  {
    slug: "vocabulary-transcription",
    title: "Help the transcript recognize names and jargon",
    shortTitle: "Custom vocabulary",
    description: "Improve difficult names and terminology, then normalize selected phrases in the result.",
    detail: "Add important terms and preferred spellings",
    kind: "audio",
    keyword: "custom vocabulary transcription",
    capabilities: ["Keyterm prompting", "Find and replace", "Domain terminology"],
  },
  {
    slug: "search-inside-audio",
    title: "Find where a word was spoken",
    shortTitle: "Audio search",
    description: "Find where a word or phrase was spoken and return its timestamped matches.",
    detail: "Timestamped matches with transcript context",
    kind: "audio",
    keyword: "search spoken words in audio",
    capabilities: ["Acoustic phrase search", "Timestamped matches", "Transcript context"],
  },
  {
    slug: "transcript-confidence-checker",
    title: "Find transcript text that needs review",
    shortTitle: "Confidence checker",
    description: "Inspect transcript confidence and identify words that may need manual review.",
    detail: "Word-level confidence and review cues",
    kind: "audio",
    keyword: "transcription confidence score",
    capabilities: ["Word confidence", "Transcript confidence", "Low-confidence review"],
  },
  {
    slug: "audio-intelligence",
    title: "Summarize a recording and find its key themes",
    shortTitle: "Audio intelligence",
    description: "Summarize a recording and detect its sentiment, intent, topics, and named entities.",
    detail: "Summary, themes, sentiment, and entities",
    kind: "audio",
    keyword: "audio summarization",
    capabilities: ["Summarization", "Sentiment", "Intent", "Topics", "Entity extraction"],
  },
  {
    slug: "text-intelligence",
    title: "Summarize and analyze pasted text",
    shortTitle: "Text intelligence",
    description: "Analyze pasted text for summaries, sentiment, intent, topics, and entities.",
    detail: "Summary, sentiment, topics, and entities",
    kind: "text",
    keyword: "text sentiment analysis",
    capabilities: ["Text summary", "Text sentiment", "Text intent", "Text topics"],
  },
  {
    slug: "streaming-voice-studio",
    title: "Create a voice track with delivery controls",
    shortTitle: "Voice studio",
    description: "Generate speech with speed control, IPA pronunciation overrides, and expressive delivery.",
    detail: "Optional speed, pronunciation, and delivery controls",
    kind: "tts",
    keyword: "streaming text to speech",
    capabilities: ["Speaking speed", "IPA pronunciation", "Expressivity", "Bilingual synthesis"],
  },
  {
    slug: "live-transcription",
    title: "See your words appear while you speak",
    shortTitle: "Live transcript",
    description: "Transcribe your microphone in real time with interim results and speech-boundary events.",
    detail: "Live microphone transcript with interim text",
    kind: "live",
    keyword: "real time transcription",
    capabilities: ["Interim results", "Speech start", "Endpointing", "Utterance end"],
  },
  {
    slug: "conversation-lab",
    title: "Review conversation turns as they happen",
    shortTitle: "Conversation lab",
    description: "Review turn completion, interruptions, resumed speech, and other conversation events while people speak.",
    detail: "Turn completion, pauses, and interruptions",
    kind: "live",
    keyword: "voice agent turn detection",
    capabilities: ["End of turn", "Eager end of turn", "Turn resumed", "Interruption detection"],
  },
  {
    slug: "enterprise-speech",
    title: "Plan a controlled speech deployment",
    shortTitle: "Enterprise speech",
    description: "Review custom-model, self-hosted, and controlled-infrastructure requirements before choosing a commercial deployment.",
    detail: "Advanced deployment planning",
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
