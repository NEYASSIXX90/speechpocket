import type {Metadata} from "next";
export const metadata:Metadata={title:"Privacy and usage limits",robots:{index:false,follow:false}};
export default function Privacy(){
 return <main className="privacy-page">
  <a className="privacy-back" href="/">← SpeechPocket</a>
  <h1>Privacy and usage limits</h1>
  <p><strong>Last updated:</strong> 27 September 2026.</p>
  <h2>What happens to your content</h2>
  <p>When you upload a recording, our server forwards it to Deepgram for speech recognition. The app returns the transcript to your browser. When you generate speech, we send your entered text to Deepgram and return an audio file. Do not upload sensitive recordings to this site.</p>
  <p>Audio-to-WAV conversion and PDF text extraction happen in your browser. The app does not save uploaded recordings, text, or results in a user account or public page. Provider processing and logs follow <a href="https://deepgram.com/privacy">Deepgram&apos;s privacy policy</a>.</p>
  <h2>Usage protection</h2>
  <p>Requests are capped to protect provider credits. We keep a keyed hash of the connecting IP address in short-lived counters; the app does not store the original address in its counter database. Expired counters are removed opportunistically. The hosting platform and providers may maintain their own security and operational logs.</p>
  <p>Speech generation accepts up to 600 characters per request, up to 3 requests per address per day. Transcription accepts up to 2 MB per file and 2 requests per address per day. A recording must be under 2 minutes. Additional hourly and site-wide limits apply. Limits reset on UTC boundaries.</p>
  <h2>Ads and public launch</h2>
  <p>No advertising network is installed in this preview. A public launch may introduce ads and associated data processing; this page will be updated before that happens.</p>
 </main>;
}
