import type {Metadata} from "next";
import SiteChrome from "@/components/site-chrome";
export const metadata:Metadata={title:"Privacy and processing",description:"How Voculo processes audio, text, temporary uploads, request limits, and operational logs.",robots:{index:true,follow:true},alternates:{canonical:"/privacy"}};
export default function Privacy(){
 return <SiteChrome active="privacy"><main className="privacy-page" id="main-content">
  <a className="privacy-back" href="/tools">← Back to tools</a>
  <h1>Privacy and processing</h1>
  <p><strong>Last updated:</strong> 29 September 2026.</p>
  <div className="privacy-summary"><strong>In short</strong><p>Voculo has no user accounts. Local conversions stay in your browser. Speech tools temporarily store an unlisted file, send it to Deepgram, and remove the temporary copy after processing. Do not upload confidential recordings.</p></div>
  <nav className="privacy-toc" aria-label="Privacy page sections"><a href="#uploads">Uploads</a><a href="#provider-processing">Provider processing</a><a href="#limits">Usage limits</a><a href="#logs-and-security">Logs and security</a><a href="#ads-and-launch">Ads and launch</a></nav>
  <h2 id="uploads">What happens to uploads and microphone audio</h2>
  <p>After you start transcription or audio analysis, your browser uploads the selected recording directly to temporary Vercel Blob storage. Voculo sends Deepgram an unlisted file URL for processing, then deletes that temporary copy when the request finishes. A scheduled cleanup removes abandoned uploads after 24 hours. The URL is not listed or indexed, but anyone who obtains it may be able to access the file until it is deleted.</p>
  <p>The transcript or analysis is returned to your browser and is not saved in a Voculo account. Audio-to-WAV conversion and PDF text extraction happen locally in your browser. When you generate speech, entered text is sent to Deepgram and generated audio is returned to your browser. Provider processing and logs follow <a href="https://deepgram.com/privacy">Deepgram&apos;s privacy policy</a> and <a href="https://vercel.com/legal/privacy-policy">Vercel&apos;s privacy policy</a>.</p>
  <h2 id="provider-processing">Provider processing</h2>
  <p>Provider-processed tools send the selected file, entered text, or live microphone stream only after you start the tool. Voculo uses Deepgram for speech recognition, text analysis and speech generation, and Vercel Blob for temporary audio upload storage. Provider infrastructure may retain operational or security logs under its own policies.</p>
  <h2 id="limits">Fair-use limits</h2>
  <p>Free processing is protected by per-address and site-wide request limits. The Vercel deployment uses Upstash Redis for those short-lived counters. If a request cannot be accepted, the tool explains what to do next. Limits reset automatically.</p>
  <h2 id="logs-and-security">Logs and security</h2>
  <p>Requests are capped to protect provider credits. Rate-limit counters use a keyed hash of the connecting IP address; the app does not store the original address in its counter database. Counters expire automatically. The hosting platform and providers may maintain their own security and operational logs.</p>
  <h2 id="ads-and-launch">Ads and public launch</h2>
  <p>When enabled for the deployed Vercel project, Vercel Web Analytics records page views and a limited “Tool completed” event with only the tool name and action; file names, text, and transcripts are not included. No advertising network is installed in this build. If an ad network is added later, this page and any required consent controls must be updated before ads are shown.</p>
 </main></SiteChrome>;
}
