"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {ArrowDownToLine, ArrowRight, BookOpen, Check, FileText, Repeat2, Upload, Volume2, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import SiteChrome from "@/components/site-chrome";
import ToolPageLayout from "@/components/tool-page-layout";
import ToolDirectory from "@/components/tool-directory";
import ProcessingNote from "@/components/processing-note";
import ResultActions from "@/components/result-actions";
import ToolGuidance from "@/components/tool-guidance";
import {tools, audioLanguages, linkFor, type Tool} from "@/lib/tool-data";
import {uploadAndProcess} from "@/lib/client-upload";
import {getUploadContentType, MAX_UPLOAD_BYTES} from "@/lib/upload-constants";
import {trackToolCompleted} from "@/lib/client-analytics";

type Props = {initialTool: string; initialLocale: string; home?: boolean};

function writeWav(samples: Float32Array, rate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
  const word = (index: number, value: string) => {for (let n = 0; n < value.length; n++) view.setUint8(index + n, value.charCodeAt(n));};
  word(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true); word(8, "WAVE"); word(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); word(36, "data"); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {const value = Math.max(-1, Math.min(1, samples[i])); view.setInt16(44 + i * 2, value < 0 ? value * 32768 : value * 32767, true);}
  return new Blob([buffer], {type: "audio/wav"});
}

async function durationOf(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {return await new Promise((resolve, reject) => {
    const media = document.createElement("audio");
    const timer = setTimeout(() => {media.src = ""; reject(new Error("We could not read this recording. Choose a different file."));}, 6_500);
    media.preload = "metadata";
    media.onloadedmetadata = () => {clearTimeout(timer); const seconds = media.duration; media.src = ""; if (Number.isFinite(seconds)) resolve(seconds); else reject(new Error("Choose a recording with a readable duration."));};
    media.onerror = () => {clearTimeout(timer); media.src = ""; reject(new Error("This audio format could not be read by your browser."));};
    media.src = url;
  });} finally {URL.revokeObjectURL(url);}
}

function fileSize(bytes: number) {return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;}
function durationLabel(seconds: number) {const total = Math.round(seconds), minutes = Math.floor(total / 60); return `${minutes}:${String(total % 60).padStart(2, "0")}`;}

const relatedBySlug: Record<string, string[]> = {
  "audio-to-text": ["audio-to-subtitles", "m4a-to-text", "audio-converter"],
  "m4a-to-text": ["audio-to-text", "audio-to-subtitles", "text-to-speech"],
  "audio-to-subtitles": ["audio-to-text", "m4a-to-text", "text-to-speech"],
  "text-to-speech": ["pronunciation", "ivr-menu", "pdf-read-aloud"],
  pronunciation: ["text-to-speech", "ivr-menu", "pdf-read-aloud"],
  "ivr-menu": ["text-to-speech", "pronunciation", "pdf-read-aloud"],
  "audio-converter": ["audio-to-text", "audio-to-subtitles", "m4a-to-text"],
  "pdf-read-aloud": ["text-to-speech", "pronunciation", "audio-to-text"],
};

const nextReason: Record<string, string> = {
  "audio-to-subtitles": "Need timed captions?", "m4a-to-text": "Working with a voice memo?", "audio-converter": "Need a WAV file?",
  "audio-to-text": "Need a plain transcript?", "text-to-speech": "Want to hear the text?", pronunciation: "Checking one word or phrase?",
  "ivr-menu": "Creating phone-menu audio?", "pdf-read-aloud": "Want to listen to a PDF?",
};

export default function Workbench({initialTool, initialLocale, home = false}: Props) {
  const tool = tools.find((item) => item.slug === initialTool) || tools[0];
  const [text, setText] = useState(""); const [lang, setLang] = useState(initialLocale);
  const [file, setFile] = useState<File | null>(null); const [fileDuration, setFileDuration] = useState<number | null>(null);
  const [validating, setValidating] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState(""); const [subResult, setSubResult] = useState(""); const [audioUrl, setAudioUrl] = useState(""); const [sourceAudioUrl, setSourceAudioUrl] = useState("");
  const [business, setBusiness] = useState(""); const [hours, setHours] = useState(""); const [options, setOptions] = useState("Press 1 for sales.\nPress 2 for support.");
  const related = useMemo(() => (relatedBySlug[tool.slug] || []).map((slug) => tools.find((item) => item.slug === slug)).filter(Boolean) as Tool[], [tool.slug]);
  useEffect(() => () => {if (audioUrl) URL.revokeObjectURL(audioUrl);}, [audioUrl]);
  useEffect(() => () => {if (sourceAudioUrl) URL.revokeObjectURL(sourceAudioUrl);}, [sourceAudioUrl]);

  const isUpload = tool.kind === "upload", isSpeech = tool.kind === "speech" || tool.kind === "greeting" || tool.kind === "pdf";
  const resetResult = () => {setError(""); setResult(""); setSubResult(""); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl("");};
  const removeFile = () => {setFile(null); setFileDuration(null); if (sourceAudioUrl) URL.revokeObjectURL(sourceAudioUrl); setSourceAudioUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; resetResult();};

  async function selectFile(next: File | null) {
    resetResult(); setFile(null); setFileDuration(null);
    if (sourceAudioUrl) URL.revokeObjectURL(sourceAudioUrl);
    setSourceAudioUrl("");
    if (!next) return;
    if (isUpload && next.size > MAX_UPLOAD_BYTES) return setError("Audio uploads must be 4.5 MB or smaller.");
    if (isUpload && !getUploadContentType(next)) return setError("This file type is not supported. Choose MP3, M4A, WAV, MP4, OGG or WebM.");
    const localMax = tool.kind === "converter" ? 10 * 1024 * 1024 : tool.kind === "pdf" ? 5 * 1024 * 1024 : MAX_UPLOAD_BYTES;
    if (next.size > localMax) return setError(tool.kind === "pdf" ? "This PDF is too large to read in this browser." : "This file cannot be processed here. Choose another file.");
    if (tool.kind === "pdf" && !(next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf"))) return setError("Choose a text-based PDF file.");
    if (tool.kind !== "pdf" && !next.type.startsWith("audio/") && !/\.(mp3|m4a|wav|mp4)$/i.test(next.name)) return setError("This file type is not supported. Choose MP3, M4A, WAV or MP4.");
    setFile(next);
    if (next.type.startsWith("audio/") || /\.(mp3|m4a|wav|mp4)$/i.test(next.name)) setSourceAudioUrl(URL.createObjectURL(next));
    if (tool.kind !== "pdf") {
      setValidating(true);
      try {const seconds = await durationOf(next); if (seconds > 120) {setFile(null); setError("This recording cannot be processed here. Try a shorter clip.");} else setFileDuration(seconds);}
      catch (reason) {setFile(null); setError(reason instanceof Error ? reason.message : "We could not validate this recording.");}
      finally {setValidating(false);}
    }
  }

  async function makeAudio(input: string) {
    if (!input.trim()) return setError("Enter text first.");
    if (input.length > 600) return setError("The limit is 600 characters per recording.");
    setBusy(true); resetResult();
    try {const response = await fetch("/api/speak", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({text: input, language: lang})});
      if (!response.ok) {const body = await response.json().catch(() => ({})) as {error?: string}; throw new Error(body.error || "We could not create the audio. Try again.");}
      setAudioUrl(URL.createObjectURL(await response.blob())); trackToolCompleted(tool.slug, "speech");
    } catch (reason) {setError(reason instanceof Error ? reason.message : "We could not create the audio. Try again.");} finally {setBusy(false);}
  }

  async function processAudio() {
    if (!file) return setError("Choose an audio file first.");
    setBusy(true); setUploadProgress(0); resetResult();
    try {
      const data = await uploadAndProcess<{transcript?: string; srt?: string}>(file, "transcribe", "/api/transcribe", {language: lang}, setUploadProgress);
      trackToolCompleted(tool.slug, "transcribe");
      setResult(data.transcript || "No speech was detected in this recording."); if (tool.slug === "audio-to-subtitles") setSubResult(data.srt || "");
    } catch (reason) {setError(reason instanceof Error ? reason.message : "We could not reach the processing service. Try again.");} finally {setBusy(false);}
  }

  async function convert() {
    if (!file) return setError("Choose an audio file first.");
    setBusy(true); resetResult(); let context: AudioContext | undefined;
    try {context = new AudioContext(); const buffer = await context.decodeAudioData(await file.arrayBuffer()); const mono = new Float32Array(buffer.length);
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {const samples = buffer.getChannelData(channel); for (let i = 0; i < samples.length; i++) mono[i] += samples[i] / buffer.numberOfChannels;}
      setAudioUrl(URL.createObjectURL(writeWav(mono, buffer.sampleRate))); setResult("Your WAV file is ready. The conversion happened in this browser."); trackToolCompleted(tool.slug, "convert");
    } catch {setError("This browser could not decode the file. Choose a different audio format and try again.");} finally {await context?.close(); setBusy(false);}
  }

  async function readPdf() {
    if (!file) return setError("Choose a PDF first.");
    setBusy(true); resetResult();
    try {const pdfjs = await import("pdfjs-dist"); pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"; const pdf = await pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer())}).promise;
      if (pdf.numPages > 6) throw new Error("Choose a PDF with six pages or fewer."); const pages: string[] = [];
      for (let index = 1; index <= pdf.numPages; index++) {const page = await pdf.getPage(index); const content = await page.getTextContent(); pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));}
      const extracted = pages.join("\n\n").trim(); if (!extracted) throw new Error("This appears to be a scanned PDF. Text extraction is unavailable for scans."); setText(extracted.slice(0, 600)); setResult(extracted.slice(0, 3_000)); trackToolCompleted(tool.slug, "extract");
    } catch (reason) {setError(reason instanceof Error ? reason.message : "We could not read this PDF.");} finally {setBusy(false);}
  }

  function makeGreeting() {const name = business.trim() || "our team"; const schedule = hours.trim() ? ` Our hours are ${hours.trim()}.` : ""; setText(`Thank you for calling ${name}.${schedule} ${options.replace(/\n+/g, " ")} If you know your party's extension, you may dial it at any time.`);}

  const title = initialLocale === "fr" && tool.slug === "audio-to-text" ? "Transcrire un enregistrement court" : tool.title;
  const actionLabel = tool.slug === "audio-to-subtitles" ? "Create subtitles" : isUpload ? "Transcribe audio" : tool.kind === "converter" ? "Convert to WAV" : "Generate audio";

  const workspace = <section className={`editor-card ${home ? "home-upload-card" : ""}`} id={home ? "tool-workspace" : undefined} aria-label={tool.title}>
    <div className="card-top"><strong>{tool.kind === "converter" ? "Convert in your browser" : tool.kind === "pdf" ? "Start with a PDF" : isUpload ? "Start with a recording" : "Start with text"}</strong><small>{tool.detail}</small></div>
    <div className="card-body">
      {(isUpload || tool.kind === "converter" || tool.kind === "pdf") && <>
        {!file ? <label className="dropzone"><Upload size={24} aria-hidden="true"/><strong>{tool.kind === "pdf" ? "Drop a PDF here or choose a file" : "Drop audio here or choose a file"}</strong><span>{tool.kind === "pdf" ? "Text-based PDF" : tool.kind === "converter" ? "Supported audio formats" : "MP3, M4A, WAV, MP4, OGG or WebM · Maximum file size: 4.5 MB"}</span><input ref={fileInputRef} type="file" aria-label="Choose file" accept={tool.kind === "pdf" ? ".pdf,application/pdf" : tool.kind === "converter" ? "audio/*" : ".mp3,.wav,.m4a,.mp4,.ogg,.webm,audio/*,video/mp4"} onChange={(event) => {const next = event.target.files?.[0] || null; event.currentTarget.value = ""; void selectFile(next);}}/></label> :
        <div className="file-summary"><div><FileText/><span><b>{file.name}</b><small>{fileSize(file.size)}{fileDuration !== null ? ` · ${durationLabel(fileDuration)}` : validating ? " · checking duration…" : ""}</small></span></div><button type="button" onClick={removeFile} aria-label={`Remove ${file.name}`}><X size={18}/></button></div>}
        <ProcessingNote title={tool.kind === "converter" ? "Runs in your browser" : tool.kind === "pdf" ? "PDF extraction runs in your browser" : "Before you upload"} local={tool.kind === "converter"} details={tool.kind !== "converter" && <p>Audio passes through a Voculo Function to Deepgram. Voculo does not save it to a file store. <a href="/privacy#uploads">Read the privacy details.</a></p>}>{tool.kind === "converter" ? "Voculo does not upload this file while converting it." : tool.kind === "pdf" ? "The PDF stays in this browser while text is extracted. Generated speech sends extracted text to the speech provider." : "Your recording is sent to the speech provider only after you start. Voculo does not save it to a file store. Avoid confidential recordings."}</ProcessingNote>
      </>}
      {tool.kind === "greeting" && <><div className="row"><div className="field"><label className="field-label" htmlFor="business">Business name</label><input className="text-input" id="business" value={business} onChange={(event) => setBusiness(event.target.value)} placeholder="Northside Studio"/></div><div className="field"><label className="field-label" htmlFor="hours">Business hours (optional)</label><input className="text-input" id="hours" value={hours} onChange={(event) => setHours(event.target.value)} placeholder="9 AM to 5 PM, Monday to Friday"/></div></div><label className="field-label spaced-label" htmlFor="menu">Menu options</label><textarea className="input-lg compact" id="menu" value={options} onChange={(event) => setOptions(event.target.value)}/><div className="action-row"><Button variant="secondary" onClick={makeGreeting}>Create editable script</Button></div><hr className="separator"/></>}
      {isSpeech && <><label className="field-label" htmlFor="speech-text">{tool.kind === "pdf" ? "Extracted text" : tool.slug === "pronunciation" ? "Word or phrase" : "Text to turn into audio"}</label><textarea className="input-lg" id="speech-text" value={text} maxLength={600} onChange={(event) => setText(event.target.value)} placeholder={tool.slug === "pronunciation" ? "Type a word or phrase…" : "Paste or type your text here…"}/><div className="muted-line counter">{text.length} / 600 characters</div><ProcessingNote title="How text is processed" details={<p>Your text is sent to the speech provider for audio generation. <a href="/privacy#provider-processing">Read the privacy details.</a></p>}>Your text is used to create audio and is not published or saved in a user account.</ProcessingNote></>}
      {(isUpload || isSpeech) && <div className="row option-row"><div className="field"><label className="field-label" htmlFor="audio-language">{isUpload ? "Spoken language" : "Voice language"}</label><NativeSelect id="audio-language" value={lang} onChange={(event) => setLang(event.target.value)}>{audioLanguages.map((language) => <NativeSelectOption key={language.code} value={language.code}>{language.label}</NativeSelectOption>)}</NativeSelect></div></div>}
      <div className="action-row">
        {isUpload && <Button disabled={busy || validating || !file} className="primary-action" onClick={processAudio}><FileText/>{busy ? uploadProgress !== null && uploadProgress < 100 ? `Uploading ${uploadProgress}%…` : "Processing your recording…" : actionLabel}</Button>}
        {isSpeech && <Button disabled={busy || !text.trim()} className="primary-action" onClick={() => makeAudio(text)}><Volume2/>{busy ? "Creating audio…" : actionLabel}</Button>}
        {tool.kind === "converter" && <Button disabled={busy || validating || !file} className="primary-action" onClick={convert}><Repeat2/>{busy ? "Converting…" : actionLabel}</Button>}
        {tool.kind === "pdf" && <Button disabled={busy || !file} variant="secondary" onClick={readPdf}><BookOpen/>{busy ? "Reading PDF…" : "Extract PDF text"}</Button>}
        <span className="muted-line">No account required</span>
      </div>
      <div className="status-region" aria-live="polite">{validating && <p>Checking this file…</p>}{busy && <p>{isUpload && uploadProgress !== null && uploadProgress < 100 ? `Uploading your recording… ${uploadProgress}%` : isUpload ? "Processing your recording…" : "Preparing your result…"}</p>}{error && <div role="alert" className="error">{error}</div>}</div>
      {(result || subResult || audioUrl) && <div className="result" aria-live="polite">
        <div className="result-heading"><div><span>Result</span><strong>Your result is ready</strong></div><Check size={20}/></div>
        {sourceAudioUrl && result && <div className="audio-player"><audio src={sourceAudioUrl} controls preload="metadata" aria-label="Original recording"/></div>}
        {result && <textarea className="result-editor" aria-label="Editable result text" value={result} onChange={(event) => setResult(event.target.value)}/>}{subResult && <><label className="field-label result-subtitle-label" htmlFor="subtitle-result">Timed subtitles</label><textarea id="subtitle-result" className="result-editor subtitle-editor" aria-label="Editable timed subtitles" value={subResult} onChange={(event) => setSubResult(event.target.value)}/></>}
        {audioUrl && <><div className="audio-player"><audio src={audioUrl} controls aria-label="Audio result"/></div><a className="download-link" href={audioUrl} download={tool.kind === "converter" ? "voculo-converted.wav" : "voculo-audio.mp3"}><ArrowDownToLine size={17}/>Download {tool.kind === "converter" ? "WAV" : "MP3"}</a></>}
        {result && tool.kind !== "converter" && <ResultActions contents={subResult || result} filename={tool.slug === "audio-to-subtitles" ? "subtitles.srt" : "transcript.txt"} downloadLabel={tool.slug === "audio-to-subtitles" ? "Download SRT" : "Download TXT"}/>}
        <p className="review-note">Review names, numbers and low-confidence words before sharing this result.</p>
        <button type="button" className="text-action" onClick={() => {resetResult(); if (isUpload || tool.kind === "converter") removeFile();}}>Start over</button>
      </div>}
    </div>
  </section>;

  if (home) return <SiteChrome active="tools"><main id="main-content">
    <section className="home-hero page-frame"><div className="home-hero-copy"><p className="hero-kicker">A clear first step for every recording</p><h1>Turn audio into text you can use.</h1><p>Upload a recording, review an editable transcript, then copy or download what you need.</p><div className="hero-actions"><a className="primary-link" href="#tool-workspace">Choose audio <ArrowRight size={17}/></a><a className="secondary-link" href="/tools">Browse all tools</a></div><ul className="hero-assurance" aria-label="Before you start"><li>No account required</li><li>Your file is not listed publicly</li><li><a href="/privacy#uploads">How processing works</a></li></ul></div><div className="home-workspace-frame"><div className="frame-bar"><span className="frame-title"><span className="frame-mark" aria-hidden="true"/>Audio to text</span><span className="frame-status">Ready when you are</span></div>{workspace}</div></section>
    <section className="job-section page-frame" aria-labelledby="jobs-title"><div className="section-heading"><p>One workspace, four ways to use it.</p><h2 id="jobs-title">Start with the outcome.</h2></div><div className="job-grid">
      <a href="/tools?category=Transcribe"><b>Create subtitles</b><p>Turn speech into a timed SRT file.</p><span>Create subtitles <ArrowRight size={16}/></span></a>
      <a href="/tools?category=Create%20audio"><b>Create audio</b><p>Turn text into a short MP3 or practise pronunciation.</p><span>Create audio <ArrowRight size={16}/></span></a>
      <a href="/tools?category=Analyze%20audio"><b>Understand a recording</b><p>Find the language, speakers, topics or key moments.</p><span>Analyze audio <ArrowRight size={16}/></span></a>
      <a href="/tools?category=Clean%20up%20%26%20convert"><b>Convert a file</b><p>Convert supported audio locally in your browser.</p><span>Convert audio <ArrowRight size={16}/></span></a>
    </div></section>
    <section className="process-band" id="how-it-works"><div className="process-section page-frame"><div className="process-copy"><p>From recording to result</p><h2>Four deliberate steps. Nothing hidden.</h2></div><ol><li><span>01</span><div><b>Add audio</b><p>Choose the recording you want to work with.</p></div></li><li><span>02</span><div><b>Process</b><p>Voculo sends it only after you start the tool.</p></div></li><li><span>03</span><div><b>Review</b><p>Check names, numbers and uncertain words.</p></div></li><li><span>04</span><div><b>Export</b><p>Copy the result or download the format you need.</p></div></li></ol></div></section>
    <section className="trust-panel page-frame" aria-labelledby="trust-title"><div><p>Before you start</p><h2 id="trust-title">Know what happens to your recording.</h2></div><div className="trust-copy"><p>Audio uploads are sent only after you start processing. Voculo does not save them to an upload library.</p><p>Audio-to-WAV conversion stays in your browser. Speech requests pass through a Voculo Function to Deepgram; avoid sending confidential recordings.</p><details><summary>How processing works</summary><p>The audio travels from your browser through a temporary request to Deepgram and the result returns here. Provider processing follows <a href="https://deepgram.com/privacy">Deepgram’s privacy policy</a>. <a href="/privacy#uploads">Read Voculo’s processing details.</a></p></details></div></section>
    <div className="page-frame"><ToolDirectory compact/></div>
  </main></SiteChrome>;

  return <ToolPageLayout title={title} description={tool.description} detail={tool.detail} category={tool.group === "Transcribe & transform" ? "Transcribe" : "Create audio"} related={related.map((item) => ({href: linkFor(item.slug, initialLocale),title: item.title,description: item.description,reason: nextReason[item.slug] || "Another useful step"}))}>
    {workspace}
    <ToolGuidance tool={tool}/>
  </ToolPageLayout>;
}
