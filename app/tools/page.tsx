import type {Metadata} from "next";
import SiteChrome from "@/components/site-chrome";
import ToolDirectory from "@/components/tool-directory";

export const metadata: Metadata = {
  title: "Audio tools",
  description: "Browse Voculo tools for transcription, subtitles, speech generation, audio analysis, redaction, and local conversion.",
  alternates: {canonical: "/tools"},
};

export default async function ToolsPage({searchParams}: {searchParams: Promise<{category?: string}>}) {
  const {category = "All"} = await searchParams;
  return <SiteChrome active="tools">
    <main className="directory-page page-frame" id="main-content">
      <header><span className="section-label">Voculo audio tools</span><h1>What are you trying to do?</h1><p>Choose a task. Each tool shows its input, processing method, and result before you begin.</p></header>
      <ToolDirectory initialCategory={category}/>
    </main>
  </SiteChrome>;
}
