import type {Metadata} from "next";
import SiteChrome from "@/components/site-chrome";
export const metadata:Metadata={title:"Privacy and usage limits",description:"How SpeechPocket processes uploads, text, microphone audio, local conversions, request limits, and operational logs.",robots:{index:true,follow:true},alternates:{canonical:"/privacy"}};
export default function Privacy(){
 return <SiteChrome active="privacy"><main className="privacy-page" id="main-content">
  <a className="privacy-back" href="/tools">← Back to tools</a>
  <h1>Privacy and usage limits</h1>
  <p><strong>Last updated:</strong> 28 September 2026.</p>
  <div className="privacy-summary"><strong>In short</strong><p>SpeechPocket does not create user accounts or publish your files. Some tools send content to Deepgram to complete a request. Local audio conversion and PDF text extraction stay in your browser. Do not upload confidential recordings.</p></div>
  <nav className="privacy-toc" aria-label="Privacy page sections"><a href="#uploads">Uploads</a><a href="#provider-processing">Provider processing</a><a href="#limits">Usage limits</a><a href="#logs-and-security">Logs and security</a><a href="#ads-and-launch">Ads and launch</a></nav>
  <h2 id="uploads">What happens to uploads and microphone audio</h2>
  <p>When you upload a recording, our server forwards it to Deepgram for speech recognition. The app returns the transcript to your browser. When you generate speech, we send your entered text to Deepgram and return an audio file. Do not upload sensitive recordings to this site.</p>
  <p>Audio-to-WAV conversion and PDF text extraction happen in your browser. The app does not save uploaded recordings, text, or results in a user account or public page. Provider processing and logs follow <a href="https://deepgram.com/privacy">Deepgram&apos;s privacy policy</a>.</p>
  <h2 id="provider-processing">Provider processing</h2>
  <p>Provider-processed tools send the selected file, entered text, or live microphone stream only after you start the tool. SpeechPocket uses Deepgram for speech recognition, text analysis and speech generation. Provider infrastructure may retain operational or security logs under its own policies.</p>
  <h2 id="limits">Usage limits</h2>
  <p>Speech generation accepts up to 600 characters per request, up to 3 requests per address per day. Transcription accepts up to 2 MB per file and 2 requests per address per day. A recording must be under 2 minutes. Additional hourly and site-wide limits apply. Limits reset on UTC boundaries.</p>
  <h2 id="logs-and-security">Logs and security</h2>
  <p>Requests are capped to protect provider credits. We keep a keyed hash of the connecting IP address in short-lived counters; the app does not store the original address in its counter database. Expired counters are removed opportunistically. The hosting platform and providers may maintain their own security and operational logs.</p>
  <h2 id="ads-and-launch">Ads and public launch</h2>
  <p>No advertising network is installed in this preview. A public launch may introduce ads and associated data processing; this page will be updated before that happens.</p>
 </main></SiteChrome>;
}
