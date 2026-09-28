import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {default:"SpeechPocket — turn short recordings into useful text",template:"%s | SpeechPocket"},
  description:"Short audio tools for transcription, subtitles, speaker labels, language detection, speech generation, and local conversion.",
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://speechpocket.vercel.app"),
  robots: {index:true,follow:true},
  icons:{icon:"/favicon.svg"},
  openGraph:{siteName:"SpeechPocket",type:"website"},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to main content</a>{children}</body></html>;
}
