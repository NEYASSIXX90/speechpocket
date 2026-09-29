import type { Metadata } from "next";
import type {Viewport} from "next";
import {GeistSans} from "geist/font/sans";
import {Analytics} from "@vercel/analytics/next";
import "./globals.css";
const googleVerification=process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
export const metadata: Metadata = {
  title: {default:"Voculo — turn audio into text you can use",template:"%s | Voculo"},
  description:"Transcribe recordings, create subtitles, generate speech, analyze audio, and convert files with focused browser tools.",
  metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||"https://speechpocket.vercel.app"),
  ...(googleVerification?{verification:{google:googleVerification}}:{}),
  robots: {index:true,follow:true},
  icons:{icon:"/favicon.svg"},
  openGraph:{siteName:"Voculo",type:"website",url:"/"},
  twitter:{card:"summary",title:"Voculo — turn audio into text you can use",description:"Transcribe recordings, create subtitles, generate speech, analyze audio, and convert files with focused browser tools."},
};
export const viewport:Viewport={themeColor:"#FFFFFF",colorScheme:"light"};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={GeistSans.variable}><body className={GeistSans.className}><a className="skip-link" href="#main-content">Skip to main content</a>{children}<Analytics/></body></html>;
}
