import type {Metadata} from "next";
import SiteChrome from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using Voculo's audio and speech tools.",
  alternates: {canonical: "/terms"},
};

export default function TermsPage() {
  return <SiteChrome className="legal-shell"><main className="privacy-page legal-page" id="main-content">
    <a className="privacy-back" href="/tools">← Back to tools</a>
    <h1>Terms of use</h1>
    <p><strong>Effective date:</strong> 29 September 2026.</p>
    <div className="privacy-summary"><strong>In short</strong><p>Use Voculo only with content you have the right to process. Check generated transcripts and speech before relying on or publishing them.</p></div>
    <h2>Using the tools</h2>
    <p>Voculo provides browser-based audio, transcription, speech-generation, and analysis tools. The tools are provided without a guarantee that a particular result will be available, accurate, or suitable for your purpose. Features may change or be unavailable while we maintain the service.</p>
    <h2>Your content and results</h2>
    <p>You keep your rights to the content you submit. You are responsible for having permission to upload recordings, use any included voices, and process personal information in them. Do not submit material that is confidential, unlawful, or that you are not authorized to use.</p>
    <p>Speech recognition and generated voices can make mistakes. Review names, numbers, sensitive details, and pronunciations before you act on, share, or publish a result.</p>
    <h2>Processing providers</h2>
    <p>Some requests are sent to Deepgram to complete speech processing. Audio uploads use temporary storage so larger files do not have to pass through the application function. See <a href="/privacy">Privacy and processing</a> for the data flow and cleanup details.</p>
    <h2>Fair use and restrictions</h2>
    <p>Do not use automated scripts to exhaust free processing, interfere with the service, probe for other users’ files, or bypass request limits. We may limit or block requests that threaten service reliability or provider account security.</p>
    <h2>Contact</h2>
    <p>For questions about these terms, use the <a href="/contact">contact page</a>.</p>
  </main></SiteChrome>;
}
