import type {Tool} from "@/lib/tool-data";

const guidance: Record<string, {heading: string; body: string; question: string; answer: string}> = {
  "audio-to-text": {heading: "From a recording to an editable transcript", body: "Add a supported audio file, choose the spoken language, and start transcription. Review the returned words in this page before copying or downloading them.", question: "What should I check in the transcript?", answer: "Listen again around names, numbers, overlapping speech, and quiet sections. Automatic transcription can miss or mishear words."},
  "m4a-to-text": {heading: "Transcribe a voice memo", body: "M4A recordings from phones can be sent directly to transcription. Choose the language spoken in the memo to help produce a readable transcript.", question: "Can I use a phone voice memo?", answer: "Yes. Export or choose the M4A recording from your device, then review the transcript for names and short phrases."},
  "audio-to-subtitles": {heading: "Create timed subtitles from speech", body: "Voculo returns an SRT file with speech split into short, timed caption segments. Download the SRT and check its timing in your video editor before publishing.", question: "What subtitle format is created?", answer: "The downloadable result is an SRT subtitle file with timestamps. You can also copy the transcript text."},
  "text-to-speech": {heading: "Listen to short text", body: "Enter the text, choose a voice language, and generate an MP3 preview. Listen through once before downloading so you can catch unusual pronunciation.", question: "Can I edit the audio after generating it?", answer: "Edit the text and generate it again. This tool creates a new audio file for each request."},
  pronunciation: {heading: "Hear a word or phrase", body: "Enter a short expression and choose its language. Names and borrowed words may sound different from your preferred pronunciation, so listen before sharing.", question: "How do I improve a pronunciation?", answer: "Try a spelling that better reflects the sound or use the advanced voice studio for pronunciation controls."},
  "ivr-menu": {heading: "Draft a phone menu before recording it", body: "Enter a business name and opening hours to create an editable greeting script. Review the wording, then send it to speech generation when it is ready.", question: "Can I change the generated phone menu?", answer: "Yes. The script is editable before you create audio, and you can change it and generate another version."},
  "audio-converter": {heading: "Convert audio to WAV in this browser", body: "Choose an audio file and convert it to a WAV download. The conversion runs locally in your browser; the selected file is not uploaded for this task.", question: "Does conversion send my file to Voculo?", answer: "No. Audio-to-WAV conversion runs on your device in this browser."},
  "pdf-read-aloud": {heading: "Extract and listen to PDF text", body: "Choose a text-based PDF to extract a short passage, then generate speech from the extracted text. Scanned pages without selectable text are not supported.", question: "Does PDF extraction happen online?", answer: "Text extraction happens in your browser. If you generate speech, the extracted text is sent to the speech provider."},
};

export default function ToolGuidance({tool}: {tool: Tool}) {
  const content = guidance[tool.slug];
  if (!content) return null;
  return <section className="tool-seo-section" aria-labelledby="tool-guidance-title">
    <h2 id="tool-guidance-title">{content.heading}</h2>
    <p>{content.body}</p>
    <details><summary>{content.question}</summary><p>{content.answer}</p></details>
  </section>;
}
