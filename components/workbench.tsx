"use client";
import {useEffect,useMemo,useState} from "react";
import {AudioLines,BookOpen,Captions,FileAudio,FileText,Phone,Repeat2,Upload,Volume2,ArrowDownToLine,Check,Copy,ArrowRight,Sparkles} from "lucide-react";
import {Button} from "@/components/ui/button";
import {NativeSelect,NativeSelectOption} from "@/components/ui/native-select";
import {tools,audioLanguages,linkFor} from "@/lib/tool-data";
import {advancedTools,advancedLink} from "@/lib/advanced-tools";

const icons={file:FileAudio,captions:Captions,audio:AudioLines,volume:Volume2,phone:Phone,repeat:Repeat2,book:BookOpen};
type Props={initialTool:string;initialLocale:string};
function downloadText(contents:string,extension:string){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([contents],{type:"text/plain;charset=utf-8"}));a.download="speechpocket-"+extension;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function writeWav(samples:Float32Array,rate:number){const b=new ArrayBuffer(44+samples.length*2),v=new DataView(b);const word=(i:number,s:string)=>{for(let n=0;n<s.length;n++)v.setUint8(i+n,s.charCodeAt(n))};word(0,"RIFF");v.setUint32(4,36+samples.length*2,true);word(8,"WAVE");word(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,"data");v.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,x<0?x*32768:x*32767,true)}return new Blob([b],{type:"audio/wav"});}
async function durationOf(file:File):Promise<number>{
 const url=URL.createObjectURL(file);
 try{return await new Promise((resolve,reject)=>{
  const media=document.createElement("audio"),timer=setTimeout(()=>{media.src="";reject(new Error("Could not read audio duration."))},6500);
  media.preload="metadata";
  media.onloadedmetadata=()=>{clearTimeout(timer);const seconds=media.duration;media.src="";if(Number.isFinite(seconds))resolve(seconds);else reject(new Error("Use a recording with a readable duration."));};
  media.onerror=()=>{clearTimeout(timer);media.src="";reject(new Error("This audio format could not be read by your browser."))};
  media.src=url;
 })}finally{URL.revokeObjectURL(url)}
}
const locText:Record<string,{eyebrow:string,upload:string,button:string}>={
 en:{eyebrow:"Free audio tools",upload:"Choose a short audio file",button:"Transcribe audio"},
 fr:{eyebrow:"Outils audio gratuits",upload:"Choisissez un court fichier audio",button:"Transcrire l’audio"},
 es:{eyebrow:"Herramientas de audio gratuitas",upload:"Elige un archivo de audio corto",button:"Transcribir audio"},
 de:{eyebrow:"Kostenlose Audiowerkzeuge",upload:"Kurze Audiodatei auswählen",button:"Audio transkribieren"},
 it:{eyebrow:"Strumenti audio gratuiti",upload:"Scegli un breve file audio",button:"Trascrivi audio"},
 nl:{eyebrow:"Gratis audiotools",upload:"Kies een kort audiobestand",button:"Audio transcriberen"}
};

export default function Workbench({initialTool,initialLocale}:Props){
 const tool=tools.find(t=>t.slug===initialTool)||tools[0];
 const [text,setText]=useState(""),[lang,setLang]=useState(initialLocale),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState(""),[subResult,setSubResult]=useState(""),[audioUrl,setAudioUrl]=useState(""),[copied,setCopied]=useState(false);
 const [business,setBusiness]=useState(""),[hours,setHours]=useState(""),[options,setOptions]=useState("Press 1 for sales.\nPress 2 for support.");
 const copy=locText[initialLocale]||locText.en;
 const frenchEntry=initialLocale==="fr"&&tool.slug==="audio-to-text";
 const related=useMemo(()=>tools.filter(t=>t.slug!==tool.slug).slice(0,3),[tool.slug]);
 useEffect(()=>()=>{if(audioUrl)URL.revokeObjectURL(audioUrl)},[audioUrl]);
 const reset=()=>{setError("");setResult("");setSubResult("");setAudioUrl("")};
 async function makeAudio(input:string){
  if(!input.trim())return setError("Enter text first.");
  if(input.length>600)return setError("The limit is 600 characters per recording.");
  setBusy(true);reset();
  try{
   const response=await fetch("/api/speak",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:input,language:lang})});
   if(!response.ok){const body=await response.json().catch(()=>({})) as {error?:string};throw new Error(body.error||"Speech is temporarily unavailable.");}
   setAudioUrl(URL.createObjectURL(await response.blob()));
  }catch(e){setError(e instanceof Error?e.message:"Speech is temporarily unavailable.");}finally{setBusy(false)}
 }
 async function processAudio(){
  if(!file)return setError("Choose an audio file first.");
  if(file.size>2*1024*1024)return setError("Files must be 2 MB or smaller.");
  setBusy(true);reset();
  try{
   if(await durationOf(file)>120)throw new Error("Use a recording shorter than two minutes.");
   const body=new FormData();body.append("file",file);body.append("language",lang);
   const response=await fetch("/api/transcribe",{method:"POST",body});
   const data=await response.json().catch(()=>({})) as {error?:string;transcript?:string;srt?:string};
   if(!response.ok)throw new Error(data.error||"Audio processing is temporarily unavailable.");
   setResult(data.transcript||"No speech detected.");
   if(tool.slug==="audio-to-subtitles")setSubResult(data.srt||"");
  }catch(e){setError(e instanceof Error?e.message:"Audio processing is temporarily unavailable.");}finally{setBusy(false)}
 }
 async function convert(){
  if(!file)return setError("Choose an audio file first.");
  if(file.size>10*1024*1024)return setError("Files must be 10 MB or smaller.");
  setBusy(true);reset();
  let context:AudioContext|undefined;
  try{
   context=new AudioContext();const buffer=await context.decodeAudioData(await file.arrayBuffer());
   if(buffer.duration>120)throw new Error("Use a recording shorter than two minutes.");
   const mono=new Float32Array(buffer.length);
   for(let c=0;c<buffer.numberOfChannels;c++){const samples=buffer.getChannelData(c);for(let i=0;i<samples.length;i++)mono[i]+=samples[i]/buffer.numberOfChannels;}
   setAudioUrl(URL.createObjectURL(writeWav(mono,buffer.sampleRate)));
   setResult("Your WAV file is ready. Conversion happened in this browser; your file was not uploaded.");
  }catch(e){setError(e instanceof Error?e.message:"This audio format cannot be decoded in this browser.");}finally{await context?.close();setBusy(false)}
 }
 async function readPdf(){
  if(!file)return setError("Choose a PDF first.");
  if(file.size>5*1024*1024)return setError("PDFs must be 5 MB or smaller.");
  setBusy(true);reset();
  try{
   const pdfjs=await import("pdfjs-dist");
   pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs";
   const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
   if(pdf.numPages>6)throw new Error("Use a PDF of six pages or fewer.");
   const pages:string[]=[];
   for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent();pages.push(content.items.map(item=>("str" in item?item.str:"")).join(" "));}
   const extracted=pages.join("\n\n").trim();
   if(!extracted)throw new Error("This appears to be a scanned PDF. Text extraction is unavailable for scans.");
   setText(extracted.slice(0,600));setResult(extracted.slice(0,3000));
  }catch(e){setError(e instanceof Error?e.message:"Could not read this PDF.");}finally{setBusy(false)}
 }
 function makeGreeting(){const name=business.trim()||"our team";const h=hours.trim()? ` Our hours are ${hours.trim()}.`:"";setText(`Thank you for calling ${name}.${h} ${options.replace(/\n+/g," ")} If you know your party's extension, you may dial it at any time.`);}
 const isUpload=tool.kind==="upload",isSpeech=tool.kind==="speech"||tool.kind==="greeting"||tool.kind==="pdf";
 const active=tools.some(t=>t.slug===tool.slug);
 return <div className="site-shell">
  <header className="site-header">
   <a href="/" className="brand" aria-label="SpeechPocket home"><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span className="brand-copy"><b>SpeechPocket</b><small>Free speech and audio tools</small></span></a>
   <nav className="top-nav" aria-label="Main navigation"><a href="/" aria-current="page">Tools</a><a href="/ai-news">AI news</a><a href="/privacy">Privacy</a></nav>
   <a className="header-action" href="#tool-workspace">Open tool <ArrowRight size={16}/></a>
  </header>
  <div className="page-frame">
   <section className="hero" aria-labelledby="page-title">
    <div><div className="eyebrow"><span className="eyebrow-dot"/> {copy.eyebrow}</div>
    <h1 className="heading" id="page-title">Sound in.<br/><span>Something useful out.</span></h1>
    <p className="intro">Transcribe recordings, generate speech, check pronunciation, and convert audio—all in one focused workspace.</p></div>
    <div className="hero-note"><span>23 focused tools</span><strong>No account needed</strong><small>Transcription, intelligence, voice, and live audio.</small></div>
   </section>
   <div className="workspace" id="tool-workspace">
   <nav className="rail" aria-label="Audio tools">
    <div className="rail-heading"><span>Pick a tool</span><small>Choose what you want to do</small></div>
    {(["Transcribe & transform","Listen & create"] as const).map(group=><div className="rail-group" key={group}><div className="rail-title">{group}</div>{tools.filter(t=>t.group===group).map(t=>{const Icon=icons[t.icon as keyof typeof icons];return <a key={t.slug} className={"rail-link "+(active&&t.slug===tool.slug?"active":"")} href={linkFor(t.slug,initialLocale)} aria-current={t.slug===tool.slug?"page":undefined}><span className="rail-icon"><Icon aria-hidden="true"/></span><span>{t.title}</span></a>})}</div>)}
   </nav>
   <main className="main">
    <div className="tool-intro"><div className="tool-intro-copy"><div className="tool-kicker">{tool.group}</div>
    <h2 className="tool-heading">{initialLocale==="fr"&&tool.slug==="audio-to-text"?"Transcription audio en texte":initialLocale==="de"&&tool.slug==="text-to-speech"?"Text vorlesen lassen":tool.title}</h2>
    <p className="tool-description">{frenchEntry?"Importez un court enregistrement en français et obtenez un texte modifiable. Sans compte. Votre fichier est envoyé à Deepgram pour traiter cette demande.":tool.description+" No account needed. Uploaded recordings are sent to Deepgram to complete your request."}</p></div><div className="soundmark" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
    <section className="editor-card" aria-label={tool.title}>
     <div className="card-top"><strong>{tool.kind==="converter"?"Convert in your browser":tool.kind==="pdf"?"Read your PDF":isUpload?"Start with a recording":"Start with text"}</strong><small>{tool.detail}</small></div>
     <div className="card-body">
      {(isUpload||tool.kind==="converter"||tool.kind==="pdf")&&<><label className="dropzone"><Upload size={25} color="#00ffff" aria-hidden="true"/><strong>{tool.kind==="pdf"?"Choose a text-based PDF":copy.upload}</strong><span>{file?file.name:tool.kind==="pdf"?"PDF · 5 MB max · 6 pages":tool.kind==="converter"?"Audio · 10 MB max · 2 minutes":"MP3, WAV, M4A, MP4 · 2 MB max · 2 minutes"}</span><input type="file" aria-label="Choose file" accept={tool.kind==="pdf"?".pdf,application/pdf":tool.kind==="converter"?"audio/*":".mp3,.wav,.m4a,.mp4,audio/*,video/mp4"} onChange={e=>{setFile(e.target.files?.[0]||null);reset()}}/></label>{isUpload&&<p className="muted-line">Short recordings only. Files are processed for this task and are not published.</p>}</>}
      {tool.kind==="greeting"&&<><div className="row"><div className="field"><label className="field-label" htmlFor="business">Business name</label><input className="text-input" id="business" value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Northside Studio"/></div><div className="field"><label className="field-label" htmlFor="hours">Business hours (optional)</label><input className="text-input" id="hours" value={hours} onChange={e=>setHours(e.target.value)} placeholder="9 AM to 5 PM, Monday to Friday"/></div></div><label className="field-label" htmlFor="menu" style={{marginTop:18}}>Menu options</label><textarea className="input-lg" style={{minHeight:90}} id="menu" value={options} onChange={e=>setOptions(e.target.value)}/><div className="action-row"><Button variant="secondary" onClick={makeGreeting}>Create editable script</Button></div><hr className="separator"/></>}
      {isSpeech&&<><label className="field-label" htmlFor="speech-text">{tool.kind==="pdf"?"Extracted text (up to 600 characters per recording)":tool.slug==="pronunciation"?"Word or phrase":"Text to turn into audio"}</label><textarea className="input-lg" id="speech-text" value={text} maxLength={600} onChange={e=>setText(e.target.value)} placeholder={tool.slug==="pronunciation"?"Type a word or phrase…":"Paste or type your text here…"}/><div className="muted-line" style={{textAlign:"right",marginTop:4}}>{text.length} / 600 characters</div></>}
      {(isUpload||isSpeech)&&<div className="row" style={{marginTop:20}}><div className="field"><label className="field-label" htmlFor="audio-language">{frenchEntry?"Langue parlée":isUpload?"Spoken language":"Voice language"}</label><NativeSelect id="audio-language" value={lang} onChange={e=>setLang(e.target.value)}>{audioLanguages.map(l=><NativeSelectOption key={l.code} value={l.code}>{l.label}</NativeSelectOption>)}</NativeSelect></div></div>}
      <div className="action-row">
       {isUpload&&<Button disabled={busy||!file} className="primary-action" onClick={processAudio}><FileText/>{busy?"Processing…":tool.slug==="audio-to-subtitles"?"Make subtitles":copy.button}</Button>}
       {isSpeech&&<Button disabled={busy||!text.trim()} className="primary-action" onClick={()=>makeAudio(text)}><Volume2/>{busy?"Generating…":"Generate audio"}</Button>}
       {tool.kind==="converter"&&<Button disabled={busy||!file} className="primary-action" onClick={convert}><Repeat2/>{busy?"Converting…":"Convert to WAV"}</Button>}
       {tool.kind==="pdf"&&<Button disabled={busy||!file} variant="secondary" onClick={readPdf}><BookOpen/>{busy?"Reading…":"Extract PDF text"}</Button>}
       <span className="muted-line">Free to use · no sign-up</span>
      </div>
      {error&&<div role="alert" className="error">{error}</div>}
      {(result||subResult||audioUrl)&&<div className="result" aria-live="polite">
       {result&&<><strong>{tool.slug==="audio-to-subtitles"?"Transcript":tool.slug==="pdf-read-aloud"?"Extracted text":tool.kind==="converter"?"Result":"Your transcript"}</strong><pre>{result}</pre></>}
       {subResult&&<><strong>Timed subtitles</strong><pre>{subResult}</pre></>}
       {audioUrl&&<><strong>{tool.kind==="converter"?"Converted audio":"Your audio"}</strong><div className="audio-player"><audio src={audioUrl} controls aria-label="Audio result"/></div><a className="download-link" href={audioUrl} download={tool.kind==="converter"?"speechpocket-converted.wav":"speechpocket-audio.mp3"}><ArrowDownToLine size={17}/> Download {tool.kind==="converter"?"WAV":"MP3"}</a></>}
       {result&&tool.kind!=="converter"&&<div className="action-row"><Button variant="outline" onClick={async()=>{await navigator.clipboard.writeText(subResult||result);setCopied(true);setTimeout(()=>setCopied(false),1600)}}>{copied?<Check/>:<Copy/>}{copied?"Copied":"Copy text"}</Button><Button variant="outline" onClick={()=>downloadText(subResult||result,tool.slug==="audio-to-subtitles"?"subtitles.srt":"transcript.txt")}><ArrowDownToLine/>Download {tool.slug==="audio-to-subtitles"?"SRT":"TXT"}</Button></div>}
      </div>}
     </div>
    </section>
    {frenchEntry&&<section className="article-copy">
      <h2 style={{fontSize:21,fontWeight:700}}>Transcrire un enregistrement court</h2>
      <p>Choisissez un fichier MP3, M4A, WAV ou MP4 de 2 Mo maximum, sélectionnez la langue parlée, puis lancez la transcription. Vous pouvez copier le texte obtenu ou le télécharger en fichier TXT. Vérifiez les noms propres et les chiffres avant de réutiliser le résultat.</p>
      <h3 style={{fontSize:17,fontWeight:700,marginTop:18}}>Quelles sont les limites ?</h3>
      <p>Les enregistrements doivent durer moins de deux minutes. Deux transcriptions par adresse et par jour sont disponibles pendant cette phase d’essai. Les fichiers ne sont pas publiés sur le site. <a href="/privacy">Confidentialité et limites</a>.</p>
    </section>}
    <h2 className="secondary-title">Keep working with audio</h2><div className="more-grid">{related.map(t=>{const Icon=icons[t.icon as keyof typeof icons];return <a className="more-card" href={linkFor(t.slug,initialLocale)} key={t.slug}><span className="more-icon"><Icon size={19}/></span><b>{t.title}</b><span>{t.description}</span><ArrowRight className="more-arrow" size={18}/></a>})}</div>
    <p className="fineprint">Synthetic voices can mispronounce unusual words and names. Check the result before using it in a recording. Audio transcription may contain mistakes. <a href="/privacy" style={{textDecoration:"underline"}}>Privacy and usage limits</a>.</p>
   </main>
  </div>
   <section className="advanced-discovery" aria-labelledby="advanced-tools-title"><div className="advanced-discovery-heading"><div><span>Deepgram capability lab</span><h2 id="advanced-tools-title">Go beyond basic transcription</h2></div><a href={advancedLink("audio-language-detector")}>Start with language detection <ArrowRight size={17}/></a></div><div className="advanced-discovery-grid">{advancedTools.filter(item=>item.kind!=="enterprise").map(item=><a href={advancedLink(item.slug)} key={item.slug}><span><Sparkles size={17}/></span><b>{item.shortTitle}</b><small>{item.detail}</small><ArrowRight className="advanced-card-arrow" size={17}/></a>)}</div></section>
   <footer className="site-footer"><a href="/" className="footer-brand">SpeechPocket</a><p>Free speech intelligence tools and practical AI news.</p><a href="/ai-news">AI news</a><a href="/privacy">Privacy &amp; usage limits</a></footer>
  </div>
 </div>;
}
