"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {ArrowDownToLine, ArrowRight, Check, Copy, FileAudio, Mic, Search, ShieldCheck, Sparkles, Square, Upload, Volume2, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import SiteChrome from "@/components/site-chrome";
import {advancedLink, advancedTools, type AdvancedTool} from "@/lib/advanced-tools";
import {audioLanguages} from "@/lib/tool-data";
import {uploadAndProcess} from "@/lib/client-upload";
import {MAX_UPLOAD_BYTES} from "@/lib/upload-constants";
import {trackToolCompleted} from "@/lib/client-analytics";

type AnalysisResult = {
  transcript?: string;
  channels?: Array<{channel: number; transcript: string; confidence: number | null; detectedLanguage: unknown; languageConfidence: unknown; languages: string[]; words: Array<{word: string; confidence: number | null; speaker: number | null; language: string | null; start: number | null; end: number | null}>}>;
  utterances?: Array<{speaker?: number; transcript?: string; start?: number; end?: number}>;
  summary?: unknown;
  sentiments?: unknown;
  intents?: unknown;
  topics?: unknown;
  entities?: unknown;
  error?: string;
  [key: string]: unknown;
};

function download(contents: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([contents], {type: "text/plain;charset=utf-8"}));
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1_000);
}

async function validateAudioDuration(file: File) {
  const url = URL.createObjectURL(file);
  try {return await new Promise<number>((resolve, reject) => {
    const audio = document.createElement("audio");
    const timer = setTimeout(() => reject(new Error("We could not read this recording. Choose a different file.")), 6_500);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {clearTimeout(timer); if (Number.isFinite(audio.duration)) resolve(audio.duration); else reject(new Error("Choose a recording with a readable duration."));};
    audio.onerror = () => {clearTimeout(timer); reject(new Error("This audio format could not be read by your browser."));};
    audio.src = url;
  });} finally {URL.revokeObjectURL(url);}
}

function ResultPanel({result}: {result: AnalysisResult}) {
  const [copied, setCopied] = useState(false);
  const readable = result.transcript || JSON.stringify(result, null, 2);
  const detected = result.channels?.map((channel) => channel.detectedLanguage).filter(Boolean).join(", ");
  const utterances = result.utterances || [];
  return <div className="result advanced-result" aria-live="polite">
    <div className="result-heading"><div><span>Result</span><strong>{detected ? `Detected language: ${detected}` : "Your result is ready"}</strong></div><Check size={21}/></div>
    {result.transcript && <pre>{result.transcript}</pre>}
    {utterances.length > 0 && <div className="utterance-list">{utterances.map((item, index) => <div key={index}><b>Speaker {(item.speaker ?? 0) + 1}</b><span>{item.transcript}</span></div>)}</div>}
    {Boolean(result.summary || result.sentiments || result.intents || result.topics || result.entities) && <details className="insight-details" open><summary>Intelligence results</summary><pre>{JSON.stringify({summary: result.summary, sentiments: result.sentiments, intents: result.intents, topics: result.topics, entities: result.entities}, null, 2)}</pre></details>}
    {result.channels?.some((channel) => channel.words.length > 0) && <details className="insight-details"><summary>Word-level metadata</summary><pre>{JSON.stringify(result.channels.flatMap((channel) => channel.words), null, 2)}</pre></details>}
    <div className="action-row"><Button variant="outline" onClick={async () => {await navigator.clipboard.writeText(readable); setCopied(true); setTimeout(() => setCopied(false), 1_500);}}>{copied ? <Check/> : <Copy/>}{copied ? "Copied" : "Copy text"}</Button><Button variant="outline" onClick={() => download(readable, "voculo-result.txt")}><ArrowDownToLine/>Download</Button></div>
    <p className="review-note">Review names, numbers and low-confidence words before relying on this result.</p>
  </div>;
}

function AudioAnalyzer({tool}: {tool: AdvancedTool}) {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [redaction, setRedaction] = useState("pii");
  const [keyterms, setKeyterms] = useState("");
  const [replacements, setReplacements] = useState("");
  const [search, setSearch] = useState("");
  const [profanity, setProfanity] = useState(false);
  const [validating, setValidating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function run() {
    if (!file) return setError("Choose an audio or video file first.");
    if (tool.slug === "search-inside-audio" && !search.trim()) return setError("Enter a word or phrase to find.");
    setBusy(true); setError(""); setResult(null);
    try {
      const data = await uploadAndProcess<AnalysisResult>(file, "analyze", "/api/deepgram/analyze", {
        mode: tool.slug, language, redaction, keyterms, replacements, search, profanity,
      }, setUploadProgress);
      trackToolCompleted(tool.slug, "analyze");
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The recording could not be processed."); }
    finally { setBusy(false); }
  }

  async function chooseFile(next: File | null) {
    setFile(null); setResult(null); setError("");
    if (!next) return;
    if (next.size > MAX_UPLOAD_BYTES) return setError("This file cannot be processed here. Choose another file.");
    if (!next.type.startsWith("audio/") && !next.type.startsWith("video/") && !/\.(mp3|m4a|wav|mp4|ogg|webm)$/i.test(next.name)) return setError("This file type is not supported. Choose MP3, M4A, WAV, MP4, OGG or WebM.");
    setFile(next); setValidating(true);
    try {if (await validateAudioDuration(next) > 120) {setFile(null); setError("This recording cannot be processed here. Try a shorter clip.");}}
    catch (reason) {setFile(null); setError(reason instanceof Error ? reason.message : "We could not validate this recording.");}
    finally {setValidating(false);}
  }

  const needsLanguage = !["audio-language-detector", "mixed-language-transcription"].includes(tool.slug);
  const actionLabels: Record<string, string> = {"audio-language-detector": "Detect language", "mixed-language-transcription": "Transcribe languages", "speaker-diarization": "Label speakers", "multichannel-call-transcription": "Separate channels", "verbatim-transcription": "Create verbatim transcript", "transcript-redactor": "Redact transcript", "vocabulary-transcription": "Use custom vocabulary", "search-inside-audio": "Find phrase", "transcript-confidence-checker": "Check transcript", "audio-intelligence": "Analyze recording"};
  return <section className="editor-card advanced-editor" aria-label={tool.title}>
    <div className="card-top"><strong>Upload a recording</strong><small>MP3, WAV, M4A, MP4, OGG or WebM</small></div>
    <div className="card-body">
      {!file ? <label className="dropzone"><Upload size={25} aria-hidden="true"/><strong>Drop audio here or choose a file</strong><span>MP3, WAV, M4A, MP4, OGG or WebM</span><input type="file" aria-label="Choose audio or video" accept="audio/*,video/mp4" onChange={(event) => {const next = event.target.files?.[0] || null; event.currentTarget.value = ""; void chooseFile(next);}}/></label> : <div className="file-summary"><div><FileAudio/><span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(1)} MB{validating ? " · checking duration…" : " · ready"}</small></span></div><button type="button" onClick={() => {setFile(null); setResult(null); setError("");}} aria-label={`Remove ${file.name}`}><X size={18}/></button></div>}
      <div className="privacy-note"><strong>Before you upload</strong><p>A temporary copy is stored by Vercel and sent to our speech provider. It is deleted after processing; its unlisted link can be opened until then. Do not upload confidential recordings.</p><details><summary>How processing works</summary><p>Voculo uses temporary Vercel storage and sends the file to the provider, then returns the result to this browser. <a href="/privacy#uploads">Read the privacy details.</a></p></details></div>
      <details className="advanced-options" open={tool.slug === "search-inside-audio" || tool.slug === "transcript-redactor"}><summary>Options</summary><div className="advanced-controls">
        {needsLanguage && <label><span>Spoken language</span><NativeSelect value={language} onChange={(event) => setLanguage(event.target.value)}>{audioLanguages.map((item) => <NativeSelectOption value={item.code} key={item.code}>{item.label}</NativeSelectOption>)}</NativeSelect></label>}
        {tool.slug === "transcript-redactor" && <label><span>Information to remove</span><NativeSelect value={redaction} onChange={(event) => setRedaction(event.target.value)}><NativeSelectOption value="numbers">Numbers</NativeSelectOption><NativeSelectOption value="pii">Personal information</NativeSelectOption><NativeSelectOption value="pci">Payment-card information</NativeSelectOption><NativeSelectOption value="phi">Health information</NativeSelectOption></NativeSelect></label>}
        {tool.slug === "vocabulary-transcription" && <><label><span>Important terms, comma separated</span><input className="text-input" value={keyterms} onChange={(event) => setKeyterms(event.target.value)} placeholder="Voculo, customer name, product name"/></label><label><span>Replacements, one per line</span><textarea className="input-lg compact" value={replacements} onChange={(event) => setReplacements(event.target.value)} placeholder={"spoken phrase => preferred output"}/></label></>}
        {tool.slug === "search-inside-audio" && <label><span>Word or phrase to find</span><div className="input-with-icon"><Search size={17}/><input className="text-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="refund policy"/></div></label>}
        {tool.slug === "verbatim-transcription" && <label className="check-control"><input type="checkbox" checked={profanity} onChange={(event) => setProfanity(event.target.checked)}/><span>Mask recognized profanity</span></label>}
      </div></details>
      <div className="action-row"><Button className="primary-action" disabled={!file || busy || validating} onClick={run}><FileAudio/>{busy ? uploadProgress !== null && uploadProgress < 100 ? `Uploading ${uploadProgress}%…` : "Processing your recording…" : actionLabels[tool.slug] || "Process recording"}</Button><span className="muted-line">No account required</span></div>
      <div className="status-region" aria-live="polite">{validating && <p>Checking this file…</p>}{busy && <p>{uploadProgress !== null && uploadProgress < 100 ? `Uploading your recording… ${uploadProgress}%` : "Processing your recording…"}</p>}</div>
      {error && <div className="error" role="alert">{error}</div>}
      {result && <ResultPanel result={result}/>} 
    </div>
  </section>;
}

function TextAnalyzer() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  async function run() {
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/deepgram/text", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text})});
      const data = await response.json() as AnalysisResult;
      if (!response.ok) throw new Error(data.error || "Text analysis failed.");
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Text analysis failed."); }
    finally { setBusy(false); }
  }
  return <section className="editor-card advanced-editor"><div className="card-top"><strong>Paste text to analyze</strong><small>20–20,000 characters</small></div><div className="card-body"><label className="field-label" htmlFor="intelligence-text">Text</label><textarea id="intelligence-text" className="input-lg" value={text} maxLength={20_000} onChange={(event) => setText(event.target.value)} placeholder="Paste a review, call transcript, article, or support conversation…"/><div className="muted-line counter">{text.length.toLocaleString()} / 20,000</div><div className="privacy-note"><strong>How text is processed</strong><p>Your text is sent to our analysis provider to return the summary and themes. Voculo does not publish it or save it in a user account.</p></div><div className="action-row"><Button className="primary-action" disabled={busy || text.trim().length < 20} onClick={run}><Sparkles/>{busy ? "Analyzing text…" : "Analyze text"}</Button><span className="muted-line">No account required</span></div>{error && <div className="error" role="alert">{error}</div>}{result && <ResultPanel result={result}/>}</div></section>;
}

function VoiceStudio() {
  const [text, setText] = useState(""); const [language, setLanguage] = useState("en"); const [engine, setEngine] = useState("aura");
  const [speed, setSpeed] = useState(1); const [expressivity, setExpressivity] = useState(0); const [word, setWord] = useState(""); const [ipa, setIpa] = useState("");
  const [audio, setAudio] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => () => {if (audio) URL.revokeObjectURL(audio);}, [audio]);
  async function run() {setBusy(true); setError(""); if (audio) URL.revokeObjectURL(audio); setAudio(""); try {const response = await fetch("/api/deepgram/speak", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text, language, engine, speed, expressivity, word, ipa})}); if (!response.ok) {const data = await response.json().catch(() => ({})) as {error?: string}; throw new Error(data.error || "Voice generation failed.");} setAudio(URL.createObjectURL(await response.blob())); trackToolCompleted("voice-studio", "speech");} catch (reason) {setError(reason instanceof Error ? reason.message : "Voice generation failed.");} finally {setBusy(false);}}
  return <section className="editor-card advanced-editor"><div className="card-top"><strong>Create a voice track</strong><small>Up to 2,000 characters</small></div><div className="card-body"><label className="field-label" htmlFor="voice-text">Text</label><textarea id="voice-text" className="input-lg" value={text} onChange={(event) => setText(event.target.value)} maxLength={2_000} placeholder="Write what the voice should say…"/><div className="muted-line counter">{text.length.toLocaleString()} / 2,000</div><div className="advanced-controls two-column"><label><span>Voice style</span><NativeSelect value={engine} onChange={(event) => setEngine(event.target.value)}><NativeSelectOption value="aura">Clear narration</NativeSelectOption><NativeSelectOption value="flux">Expressive delivery</NativeSelectOption></NativeSelect></label><label><span>Language</span><NativeSelect value={language} disabled={engine === "flux"} onChange={(event) => setLanguage(event.target.value)}>{audioLanguages.map((item) => <NativeSelectOption value={item.code} key={item.code}>{item.label}</NativeSelectOption>)}</NativeSelect></label></div><details className="advanced-options"><summary>Advanced voice controls</summary><div className="advanced-controls two-column"><label><span>Speed: {speed.toFixed(2)}×</span><input type="range" min={engine === "flux" ? .5 : .7} max="1.5" step="0.05" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}/></label>{engine === "flux" ? <label><span>Delivery: {expressivity.toFixed(1)}</span><input type="range" min="-2" max="2" step="0.25" value={expressivity} onChange={(event) => setExpressivity(Number(event.target.value))}/></label> : <><label><span>Word to override</span><input className="text-input" value={word} onChange={(event) => setWord(event.target.value)} placeholder="Voculo"/></label><label><span>IPA pronunciation</span><input className="text-input" value={ipa} onChange={(event) => setIpa(event.target.value)} placeholder="vəʊˈkjuːləʊ"/></label></>}</div></details><div className="privacy-note"><strong>How text is processed</strong><p>Your text is sent to our speech provider to create this audio. Review unusual names and pronunciations before using the result.</p></div><div className="action-row"><Button className="primary-action" disabled={busy || !text.trim()} onClick={run}><Volume2/>{busy ? "Creating voice track…" : "Create voice track"}</Button></div>{error && <div className="error" role="alert">{error}</div>}{audio && <div className="result"><div className="result-heading"><div><span>Result</span><strong>Your voice track is ready</strong></div><Check size={20}/></div><div className="audio-player"><audio controls src={audio} aria-label="Generated voice track"/></div><a className="download-link" href={audio} download="voculo-voice.mp3"><ArrowDownToLine size={17}/>Download audio</a><p className="review-note">Synthetic voices can mispronounce unusual words and names. Check the result before publishing it.</p></div>}</div></section>;
}

function LiveRecorder({flux}: {flux: boolean}) {
  const [status, setStatus] = useState("Your microphone is off"); const [transcript, setTranscript] = useState(""); const [interim, setInterim] = useState(""); const [events, setEvents] = useState<string[]>([]); const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null); const recorderRef = useRef<MediaRecorder | null>(null); const streamRef = useRef<MediaStream | null>(null);
  function cleanup() {recorderRef.current?.stop(); socketRef.current?.close(); streamRef.current?.getTracks().forEach((track) => track.stop()); recorderRef.current = null; socketRef.current = null; streamRef.current = null; setInterim("");}
  function stop() {cleanup(); setStatus("Stopped");}
  useEffect(() => cleanup, []);
  async function start() {
    setError(""); setEvents([]);
    try {
      setStatus("Requesting microphone");
      const stream = await navigator.mediaDevices.getUserMedia({audio: true}); streamRef.current = stream; setStatus("Connecting");
      const tokenResponse = await fetch("/api/deepgram/token", {method: "POST"}); const tokenData = await tokenResponse.json() as {access_token?: string; error?: string};
      if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error || "We could not start the live transcription service.");
      const params = flux ? "model=flux-general-en&eot_timeout_ms=1500&eager_eot_threshold=0.7" : "model=nova-3&smart_format=true&interim_results=true&endpointing=300&utterance_end_ms=1000&vad_events=true";
      const socket = new WebSocket(`wss://api.deepgram.com/${flux ? "v2" : "v1"}/listen?${params}`, ["bearer", tokenData.access_token]); socketRef.current = socket;
      socket.onopen = () => {const recorder = new MediaRecorder(stream, {mimeType: "audio/webm;codecs=opus"}); recorderRef.current = recorder; recorder.ondataavailable = async (event) => {if (event.data.size && socket.readyState === WebSocket.OPEN) socket.send(await event.data.arrayBuffer());}; recorder.start(250); setStatus("Listening");};
      socket.onmessage = (message) => {const data = JSON.parse(message.data) as Record<string, unknown>; const type = String(data.type || "Event"); setEvents((previous) => [type, ...previous].slice(0, 12)); const channel = data.channel as {alternatives?: Array<{transcript?: string}>} | undefined; const next = channel?.alternatives?.[0]?.transcript || (typeof data.transcript === "string" ? data.transcript : ""); if (next) {if (data.is_final || type === "TurnInfo" || type === "EndOfTurn") {setTranscript((previous) => `${previous} ${next}`.trim()); setInterim("");} else setInterim(next);}};
      socket.onerror = () => {setStatus("Connection lost"); setError("The live connection ended. Your transcript is safe so far. Try reconnecting.");};
      socket.onclose = () => {stream.getTracks().forEach((track) => track.stop()); setStatus((current) => current === "Connection lost" ? current : "Stopped");};
    } catch (reason) {
      cleanup();
      if (reason instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(reason.name)) {setStatus("Microphone blocked"); setError("Microphone access is blocked. Allow it in your browser settings, then try again.");}
      else {setStatus("Connection lost"); setError(reason instanceof Error ? reason.message : "We could not start the microphone. Try again.");}
    }
  }
  const listening = status === "Listening";
  const pending = status === "Requesting microphone" || status === "Connecting";
  return <section className="editor-card advanced-editor"><div className="card-top"><strong>{flux ? "Review conversation turns" : "Transcribe your microphone"}</strong><small>{status}</small></div><div className="card-body"><div className="privacy-note"><strong>Before you start</strong><p>While this tool is active, microphone audio is streamed to our speech provider for transcription. Stop at any time.</p></div><div className="live-display" aria-live="polite"><div className={`live-orb ${listening ? "active" : ""}`}><Mic/></div><div><span>Microphone status</span><strong>{status}</strong><small>{listening ? "Speak near your microphone. Your words will appear below." : pending ? "Waiting for microphone and service access…" : "Allow microphone access to begin."}</small></div></div><div className="action-row">{!listening ? <Button className="primary-action" disabled={pending} onClick={start}><Mic/>{pending ? "Starting…" : status === "Microphone blocked" || status === "Connection lost" ? "Try again" : status === "Stopped" ? "Start again" : "Allow microphone"}</Button> : <Button variant="destructive" onClick={stop}><Square/>Stop transcription</Button>}</div>{error && <div className="error" role="alert">{error}</div>}<div className="result live-transcript"><div className="result-heading"><div><span>Live transcript</span><strong>{transcript || interim ? "Transcript in progress" : "Speak near your microphone"}</strong></div></div><pre>{transcript || interim || "Your words will appear here."}{interim && transcript ? ` ${interim}` : ""}</pre>{flux && events.length > 0 && <details className="insight-details"><summary>Conversation events</summary><div className="event-row">{events.map((event, index) => <span key={`${event}-${index}`}>{event}</span>)}</div></details>}</div></div></section>;
}

function EnterprisePanel() {return <section className="editor-card advanced-editor"><div className="card-top"><strong>For teams evaluating deployment</strong><small>Advanced planning guide</small></div><div className="card-body"><div className="enterprise-banner"><b>This is not a self-serve free tool.</b><p>Use this page to understand the requirements involved before choosing a commercial speech deployment.</p></div><div className="enterprise-grid"><div><ShieldCheck/><h3>Custom speech model</h3><p>Define terminology, accents, acoustic conditions, evaluation data, and domain-specific recordings.</p></div><div><ShieldCheck/><h3>Controlled infrastructure</h3><p>Review supported cloud, data-centre, regional-processing, security, and operational requirements.</p></div></div><p className="muted-line">Voculo does not currently offer a sales or deployment service. Verify availability and commercial terms directly with the speech provider.</p></div></section>}

export default function AdvancedWorkbench({tool}: {tool: AdvancedTool}) {
  const related = useMemo(() => advancedTools.filter((item) => item.slug !== tool.slug && item.kind !== "enterprise").slice(0, 3), [tool.slug]);
  const category = tool.kind === "tts" ? "Create audio" : tool.kind === "text" ? "Analyze text" : tool.kind === "enterprise" ? "Advanced deployment" : tool.kind === "live" ? "Live audio" : "Analyze audio";
  return <SiteChrome active="tools"><main className="page-frame tool-page" id="main-content"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/tools">Tools</a><span>/</span><span>{category}</span><span>/</span><strong>{tool.shortTitle}</strong></nav><header className="tool-page-header advanced-title"><span className="section-label">Voculo audio tool</span><h1>{tool.title}</h1><p>{tool.description}</p><small>{tool.detail}</small></header><div className="advanced-layout" id="tool-workspace"><div>{tool.kind === "audio" && <AudioAnalyzer tool={tool}/>} {tool.kind === "text" && <TextAnalyzer/>} {tool.kind === "tts" && <VoiceStudio/>} {tool.kind === "live" && <LiveRecorder flux={tool.slug === "conversation-lab"}/>} {tool.kind === "enterprise" && <EnterprisePanel/>}<section className="seo-copy"><h2>What you’ll get</h2><p>{tool.description}</p><details className="advanced-options"><summary>Output and processing details</summary><ul>{tool.capabilities.map((item) => <li key={item}>{item}</li>)}</ul><p>This request is handled by a third-party speech provider. Provider and model details are available in the <a href="/privacy#provider-processing">privacy policy</a>.</p></details><h2>Review before you use it</h2><p>{tool.slug === "transcript-redactor" ? "Automated redaction can miss or incorrectly change sensitive information. Review the full transcript before sharing." : "Review names, numbers, sensitive information, and low-confidence words before relying on the output."}</p></section></div><aside className="advanced-sidebar"><span className="sidebar-label">Next steps</span>{related.map((item) => <a href={advancedLink(item.slug)} key={item.slug}><b>{item.shortTitle}</b><span>{item.detail}</span><ArrowRight size={16}/></a>)}<a className="news-promo" href="/tools"><Sparkles/><b>Browse all tools</b><span>Find transcription, audio creation, analysis, and conversion tools.</span></a></aside></div></main></SiteChrome>;
}
