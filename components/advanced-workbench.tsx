"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {ArrowDownToLine, ArrowRight, Check, Copy, FileAudio, Mic, Search, ShieldCheck, Sparkles, Square, Upload, Volume2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import {advancedLink, advancedTools, type AdvancedTool} from "@/lib/advanced-tools";
import {audioLanguages} from "@/lib/tool-data";

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

function SiteChrome({children}: {children: React.ReactNode}) {
  return <div className="site-shell">
    <header className="site-header">
      <a href="/" className="brand" aria-label="SpeechPocket home"><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span className="brand-copy"><b>SpeechPocket</b><small>Speech intelligence tools</small></span></a>
      <nav className="top-nav" aria-label="Main navigation"><a href="/">Tools</a><a href="/ai-news">AI news</a><a href="/privacy">Privacy</a></nav>
      <a className="header-action" href="#tool-workspace">Open tool <ArrowRight size={16}/></a>
    </header>
    {children}
  </div>;
}

function ResultPanel({result}: {result: AnalysisResult}) {
  const [copied, setCopied] = useState(false);
  const readable = result.transcript || JSON.stringify(result, null, 2);
  const detected = result.channels?.map((channel) => channel.detectedLanguage).filter(Boolean).join(", ");
  const utterances = result.utterances || [];
  return <div className="result advanced-result" aria-live="polite">
    <div className="result-heading"><div><span>Result</span><strong>{detected ? `Detected language: ${detected}` : "Analysis complete"}</strong></div><Check size={21}/></div>
    {result.transcript && <pre>{result.transcript}</pre>}
    {utterances.length > 0 && <div className="utterance-list">{utterances.map((item, index) => <div key={index}><b>Speaker {(item.speaker ?? 0) + 1}</b><span>{item.transcript}</span></div>)}</div>}
    {Boolean(result.summary || result.sentiments || result.intents || result.topics || result.entities) && <details className="insight-details" open><summary>Intelligence results</summary><pre>{JSON.stringify({summary: result.summary, sentiments: result.sentiments, intents: result.intents, topics: result.topics, entities: result.entities}, null, 2)}</pre></details>}
    {result.channels?.some((channel) => channel.words.length > 0) && <details className="insight-details"><summary>Word-level metadata</summary><pre>{JSON.stringify(result.channels.flatMap((channel) => channel.words), null, 2)}</pre></details>}
    <div className="action-row"><Button variant="outline" onClick={async () => {await navigator.clipboard.writeText(readable); setCopied(true); setTimeout(() => setCopied(false), 1_500);}}>{copied ? <Check/> : <Copy/>}{copied ? "Copied" : "Copy"}</Button><Button variant="outline" onClick={() => download(readable, "speechpocket-result.txt")}><ArrowDownToLine/>Download</Button></div>
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function run() {
    if (!file) return setError("Choose an audio or video file first.");
    if (file.size > 2 * 1024 * 1024) return setError("Files must be 2 MB or smaller in the public beta.");
    if (tool.slug === "search-inside-audio" && !search.trim()) return setError("Enter a word or phrase to find.");
    setBusy(true); setError(""); setResult(null);
    const body = new FormData();
    body.append("file", file); body.append("mode", tool.slug); body.append("language", language);
    body.append("redaction", redaction); body.append("keyterms", keyterms); body.append("replacements", replacements);
    body.append("search", search); body.append("profanity", String(profanity));
    try {
      const response = await fetch("/api/deepgram/analyze", {method: "POST", body});
      const data = await response.json() as AnalysisResult;
      if (!response.ok) throw new Error(data.error || "The recording could not be processed.");
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The recording could not be processed."); }
    finally { setBusy(false); }
  }

  const needsLanguage = !["audio-language-detector", "mixed-language-transcription"].includes(tool.slug);
  return <section className="editor-card advanced-editor" aria-label={tool.title}>
    <div className="card-top"><strong>Analyze a recording</strong><small>Private request · 2 MB public-beta limit</small></div>
    <div className="card-body">
      <label className="dropzone"><Upload size={25} aria-hidden="true"/><strong>Choose audio or video</strong><span>{file ? file.name : "MP3, WAV, M4A, MP4, OGG or WebM"}</span><input type="file" accept="audio/*,video/mp4" onChange={(event) => {setFile(event.target.files?.[0] || null); setResult(null); setError("");}}/></label>
      <div className="advanced-controls">
        {needsLanguage && <label><span>Spoken language</span><NativeSelect value={language} onChange={(event) => setLanguage(event.target.value)}>{audioLanguages.map((item) => <NativeSelectOption value={item.code} key={item.code}>{item.label}</NativeSelectOption>)}</NativeSelect></label>}
        {tool.slug === "transcript-redactor" && <label><span>Information to remove</span><NativeSelect value={redaction} onChange={(event) => setRedaction(event.target.value)}><NativeSelectOption value="numbers">Numbers</NativeSelectOption><NativeSelectOption value="pii">Personal information</NativeSelectOption><NativeSelectOption value="pci">Payment-card information</NativeSelectOption><NativeSelectOption value="phi">Health information</NativeSelectOption></NativeSelect></label>}
        {tool.slug === "vocabulary-transcription" && <><label><span>Important terms, comma separated</span><input className="text-input" value={keyterms} onChange={(event) => setKeyterms(event.target.value)} placeholder="SpeechPocket, Nova-3, product name"/></label><label><span>Replacements, one per line</span><textarea className="input-lg compact" value={replacements} onChange={(event) => setReplacements(event.target.value)} placeholder={"spoken phrase => preferred output"}/></label></>}
        {tool.slug === "search-inside-audio" && <label><span>Word or phrase to find</span><div className="input-with-icon"><Search size={17}/><input className="text-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="refund policy"/></div></label>}
        {tool.slug === "verbatim-transcription" && <label className="check-control"><input type="checkbox" checked={profanity} onChange={(event) => setProfanity(event.target.checked)}/><span>Mask recognized profanity</span></label>}
      </div>
      <div className="action-row"><Button className="primary-action" disabled={!file || busy} onClick={run}><FileAudio/>{busy ? "Analyzing…" : "Analyze recording"}</Button><span className="muted-line">No account needed</span></div>
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
  return <section className="editor-card advanced-editor"><div className="card-top"><strong>Analyze text</strong><small>20–20,000 characters</small></div><div className="card-body"><label className="field-label" htmlFor="intelligence-text">Text to analyze</label><textarea id="intelligence-text" className="input-lg" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste a review, call transcript, article, or support conversation…"/><div className="muted-line counter">{text.length.toLocaleString()} / 20,000</div><div className="action-row"><Button className="primary-action" disabled={busy || text.trim().length < 20} onClick={run}><Sparkles/>{busy ? "Analyzing…" : "Analyze text"}</Button></div>{error && <div className="error">{error}</div>}{result && <ResultPanel result={result}/>}</div></section>;
}

function VoiceStudio() {
  const [text, setText] = useState(""); const [language, setLanguage] = useState("en"); const [engine, setEngine] = useState("aura");
  const [speed, setSpeed] = useState(1); const [expressivity, setExpressivity] = useState(0); const [word, setWord] = useState(""); const [ipa, setIpa] = useState("");
  const [audio, setAudio] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => () => {if (audio) URL.revokeObjectURL(audio);}, [audio]);
  async function run() {setBusy(true); setError(""); if (audio) URL.revokeObjectURL(audio); setAudio(""); try {const response = await fetch("/api/deepgram/speak", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text, language, engine, speed, expressivity, word, ipa})}); if (!response.ok) {const data = await response.json().catch(() => ({})) as {error?: string}; throw new Error(data.error || "Voice generation failed.");} setAudio(URL.createObjectURL(await response.blob()));} catch (reason) {setError(reason instanceof Error ? reason.message : "Voice generation failed.");} finally {setBusy(false);}}
  return <section className="editor-card advanced-editor"><div className="card-top"><strong>Shape the voice</strong><small>Aura-2 or Flux TTS</small></div><div className="card-body"><label className="field-label">Text</label><textarea className="input-lg" value={text} onChange={(event) => setText(event.target.value)} maxLength={2_000} placeholder="Write what the voice should say…"/><div className="advanced-controls two-column"><label><span>Engine</span><NativeSelect value={engine} onChange={(event) => setEngine(event.target.value)}><NativeSelectOption value="aura">Aura-2 — pronunciation</NativeSelectOption><NativeSelectOption value="flux">Flux — expressive</NativeSelectOption></NativeSelect></label><label><span>Language</span><NativeSelect value={language} disabled={engine === "flux"} onChange={(event) => setLanguage(event.target.value)}>{audioLanguages.map((item) => <NativeSelectOption value={item.code} key={item.code}>{item.label}</NativeSelectOption>)}</NativeSelect></label><label><span>Speed: {speed.toFixed(2)}×</span><input type="range" min={engine === "flux" ? .5 : .7} max="1.5" step="0.05" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}/></label>{engine === "flux" ? <label><span>Delivery: {expressivity.toFixed(1)}</span><input type="range" min="-2" max="2" step="0.25" value={expressivity} onChange={(event) => setExpressivity(Number(event.target.value))}/></label> : <><label><span>Word to override</span><input className="text-input" value={word} onChange={(event) => setWord(event.target.value)} placeholder="SpeechPocket"/></label><label><span>IPA pronunciation</span><input className="text-input" value={ipa} onChange={(event) => setIpa(event.target.value)} placeholder="spiːtʃ ˈpɒkɪt"/></label></>}</div><div className="action-row"><Button className="primary-action" disabled={busy || !text.trim()} onClick={run}><Volume2/>{busy ? "Generating…" : "Generate voice"}</Button></div>{error && <div className="error">{error}</div>}{audio && <div className="result"><strong>Your audio</strong><div className="audio-player"><audio controls src={audio}/></div><a className="download-link" href={audio} download="speechpocket-voice.mp3"><ArrowDownToLine size={17}/>Download audio</a></div>}</div></section>;
}

function LiveRecorder({flux}: {flux: boolean}) {
  const [status, setStatus] = useState("Ready"); const [transcript, setTranscript] = useState(""); const [interim, setInterim] = useState(""); const [events, setEvents] = useState<string[]>([]); const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null); const recorderRef = useRef<MediaRecorder | null>(null); const streamRef = useRef<MediaStream | null>(null);
  function stop() {recorderRef.current?.stop(); socketRef.current?.close(); streamRef.current?.getTracks().forEach((track) => track.stop()); recorderRef.current = null; socketRef.current = null; streamRef.current = null; setStatus("Stopped"); setInterim("");}
  useEffect(() => stop, []);
  async function start() {setError(""); setTranscript(""); setEvents([]); try {setStatus("Connecting…"); const tokenResponse = await fetch("/api/deepgram/token", {method: "POST"}); const tokenData = await tokenResponse.json() as {access_token?: string; error?: string}; if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error || "Could not start a live session."); const stream = await navigator.mediaDevices.getUserMedia({audio: true}); streamRef.current = stream; const params = flux ? "model=flux-general-en&eot_timeout_ms=1500&eager_eot_threshold=0.7" : "model=nova-3&smart_format=true&interim_results=true&endpointing=300&utterance_end_ms=1000&vad_events=true"; const socket = new WebSocket(`wss://api.deepgram.com/${flux ? "v2" : "v1"}/listen?${params}`, ["bearer", tokenData.access_token]); socketRef.current = socket; socket.onopen = () => {const recorder = new MediaRecorder(stream, {mimeType: "audio/webm;codecs=opus"}); recorderRef.current = recorder; recorder.ondataavailable = async (event) => {if (event.data.size && socket.readyState === WebSocket.OPEN) socket.send(await event.data.arrayBuffer());}; recorder.start(250); setStatus("Listening");}; socket.onmessage = (message) => {const data = JSON.parse(message.data) as Record<string, unknown>; const type = String(data.type || "Event"); setEvents((previous) => [type, ...previous].slice(0, 12)); const channel = data.channel as {alternatives?: Array<{transcript?: string}>} | undefined; const next = channel?.alternatives?.[0]?.transcript || (typeof data.transcript === "string" ? data.transcript : ""); if (next) {if (data.is_final || type === "TurnInfo" || type === "EndOfTurn") {setTranscript((previous) => `${previous} ${next}`.trim()); setInterim("");} else setInterim(next);}}; socket.onerror = () => setError("The live connection failed. Check the microphone and Deepgram configuration."); socket.onclose = () => {stream.getTracks().forEach((track) => track.stop()); setStatus("Stopped");};} catch (reason) {stop(); setError(reason instanceof Error ? reason.message : "Could not start the microphone.");}}
  return <section className="editor-card advanced-editor"><div className="card-top"><strong>{flux ? "Inspect conversation turns" : "Transcribe the microphone"}</strong><small>{status}</small></div><div className="card-body"><div className="live-display"><div className={`live-orb ${status === "Listening" ? "active" : ""}`}><Mic/></div><div><span>Microphone status</span><strong>{status}</strong></div></div><div className="action-row">{status !== "Listening" ? <Button className="primary-action" onClick={start}><Mic/>Start microphone</Button> : <Button variant="destructive" onClick={stop}><Square/>Stop</Button>}</div>{error && <div className="error">{error}</div>}<div className="result live-transcript"><strong>{flux ? "Conversation transcript and events" : "Live transcript"}</strong><pre>{transcript || interim || "Your transcript will appear here."}{interim && transcript ? ` ${interim}` : ""}</pre>{flux && events.length > 0 && <div className="event-row">{events.map((event, index) => <span key={`${event}-${index}`}>{event}</span>)}</div>}</div></div></section>;
}

function EnterprisePanel() {return <section className="editor-card advanced-editor"><div className="card-top"><strong>Enterprise deployment planner</strong><small>Deepgram commercial access required</small></div><div className="card-body"><div className="enterprise-grid"><div><ShieldCheck/><h3>Custom speech model</h3><p>Train for your terminology, accents, acoustic conditions, and domain-specific recordings.</p></div><div><ShieldCheck/><h3>Self-hosted inference</h3><p>Run supported speech models inside your controlled cloud, data center, or restricted environment.</p></div></div><p className="muted-line">These are not self-serve public tools. SpeechPocket can collect deployment requirements after commercial Deepgram access is approved.</p></div></section>}

export default function AdvancedWorkbench({tool}: {tool: AdvancedTool}) {
  const related = useMemo(() => advancedTools.filter((item) => item.slug !== tool.slug && item.kind !== "enterprise").slice(0, 4), [tool.slug]);
  return <SiteChrome><div className="page-frame"><section className="advanced-hero"><div><div className="eyebrow"><span className="eyebrow-dot"/>Free Deepgram-powered tool</div><h1>{tool.title}</h1><p>{tool.description}</p><div className="capability-list">{tool.capabilities.map((item) => <span key={item}>{item}</span>)}</div></div><aside><span>Search target</span><strong>{tool.keyword}</strong><small>{tool.detail}</small></aside></section><div className="advanced-layout" id="tool-workspace"><main>{tool.kind === "audio" && <AudioAnalyzer tool={tool}/>} {tool.kind === "text" && <TextAnalyzer/>} {tool.kind === "tts" && <VoiceStudio/>} {tool.kind === "live" && <LiveRecorder flux={tool.slug === "conversation-lab"}/>} {tool.kind === "enterprise" && <EnterprisePanel/>}<section className="seo-copy"><h2>What this tool does</h2><p>{tool.description} SpeechPocket exposes this capability as a focused browser tool with clear limits and downloadable results.</p><h2>Included capabilities</h2><ul>{tool.capabilities.map((item) => <li key={item}>{item}</li>)}</ul><h2>Privacy and accuracy</h2><p>Files are sent to Deepgram only to complete the requested operation and are not published as web pages. Always review names, numbers, sensitive information, and low-confidence words before relying on the output.</p></section></main><aside className="advanced-sidebar"><span className="sidebar-label">More speech tools</span>{related.map((item) => <a href={advancedLink(item.slug)} key={item.slug}><b>{item.shortTitle}</b><span>{item.detail}</span><ArrowRight size={16}/></a>)}<a className="news-promo" href="/ai-news"><Sparkles/><b>AI tools news</b><span>Product launches, updates, and practical analysis.</span></a></aside></div><footer className="site-footer"><a href="/" className="footer-brand">SpeechPocket</a><p>Free speech intelligence tools and practical AI news.</p><a href="/ai-news">AI news</a><a href="/privacy">Privacy</a></footer></div></SiteChrome>;
}
