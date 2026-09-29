import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {ImageResponse} from "next/og";

export const runtime = "nodejs";
export const alt = "Voculo — focused tools for audio";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

const regularFont = readFile(join(process.cwd(), "app/Geist-Regular.ttf"));
const semiboldFont = readFile(join(process.cwd(), "app/Geist-SemiBold.ttf"));

export default async function OpenGraphImage() {
  const [regular, semibold] = await Promise.all([regularFont, semiboldFont]);
  return new ImageResponse(
    <div style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 64, backgroundColor: "#FAFAF8", color: "#0A0A0A", fontFamily: "Geist"}}>
      <div style={{display: "flex", alignItems: "center", gap: 17}}>
        <svg width="52" height="52" viewBox="0 0 98 96">
          <path d="M0 0H20L49 74L78 0H98L59 96H39Z" fill="#0A0A0A"/>
          <path d="M43 0H55V45L49 61L43 45Z" fill="#E0A533"/>
        </svg>
        <span style={{fontSize: 40, fontWeight: 600, letterSpacing: -2}}>voculo</span>
        <span style={{display: "flex", marginLeft: "auto", padding: "10px 16px", border: "1px solid #D9D7D0", borderRadius: 999, color: "#6C6B67", fontSize: 18}}>Free audio tools</span>
      </div>
      <div style={{display: "flex", alignItems: "center", flex: 1, gap: 48}}>
        <div style={{display: "flex", flexDirection: "column", flex: 1}}>
          <div style={{display: "flex", flexDirection: "column", fontSize: 67, lineHeight: 1.04, letterSpacing: -3.2, fontWeight: 600}}><span>Turn audio into</span><span>text you can use.</span></div>
          <div style={{marginTop: 24, color: "#6C6B67", fontSize: 25}}>Transcribe. Create speech. Understand recordings.</div>
        </div>
        <div style={{display: "flex", flexDirection: "column", width: 350, height: 248, padding: 10, backgroundColor: "#E0A533", borderRadius: 22}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", fontSize: 14}}><span>Audio to text</span><span>Ready when you are</span></div>
          <div style={{display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 13, backgroundColor: "#FFFFFF", borderRadius: 15}}>
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: 64, height: 64, border: "1px solid #D9D7D0", borderRadius: 999, fontSize: 32}}>+</div>
            <div style={{fontSize: 18, fontWeight: 600}}>Choose an audio file</div>
            <div style={{fontSize: 14, color: "#6C6B67"}}>MP3 · M4A · WAV · MP4</div>
          </div>
        </div>
      </div>
      <div style={{display: "flex", alignItems: "center", borderTop: "1px solid #D9D7D0", paddingTop: 18, color: "#6C6B67", fontSize: 17}}>
        <span>Audio in. Useful work out.</span><span style={{display: "flex", marginLeft: "auto"}}>No account required</span>
      </div>
    </div>,
    { ...size, fonts: [
      {name: "Geist", data: regular, weight: 400, style: "normal"},
      {name: "Geist", data: semibold, weight: 600, style: "normal"},
    ]},
  );
}
