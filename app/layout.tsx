import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {default:"SpeechPocket — free speech and audio tools",template:"%s | SpeechPocket"},
  description:"Convert short audio to text, turn text into speech, and work with pronunciation, subtitles and more.",
  robots: {index:false,follow:false},
  icons:{icon:"/favicon.svg"},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><a className="skip-link" href="#tool-workspace">Skip to audio tool</a>{children}</body></html>;
}
