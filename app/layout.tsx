import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {default:"SpeechPocket — free speech and audio tools",template:"%s | SpeechPocket"},
  description:"Free transcription, speaker diarization, language detection, audio intelligence, text-to-speech, and practical AI tools news.",
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://speechpocket.vercel.app"),
  robots: {index:true,follow:true},
  icons:{icon:"/favicon.svg"},
  openGraph:{siteName:"SpeechPocket",type:"website"},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><a className="skip-link" href="#tool-workspace">Skip to audio tool</a>{children}</body></html>;
}
