"use client";

import {useMemo, useState} from "react";
import {ArrowRight, Search} from "lucide-react";
import {advancedTools, advancedLink} from "@/lib/advanced-tools";
import {tools, linkFor} from "@/lib/tool-data";

type DirectoryItem = {slug: string; title: string; description: string; category: string; href: string};

const categoryBySlug: Record<string, string> = {
  "audio-to-text": "Transcribe", "m4a-to-text": "Transcribe", "audio-to-subtitles": "Transcribe",
  "speaker-diarization": "Transcribe", "mixed-language-transcription": "Transcribe", "verbatim-transcription": "Transcribe", "multichannel-call-transcription": "Transcribe",
  "text-to-speech": "Create audio", pronunciation: "Create audio", "ivr-menu": "Create audio", "streaming-voice-studio": "Create audio", "pdf-read-aloud": "Create audio",
  "audio-language-detector": "Analyze audio", "search-inside-audio": "Analyze audio", "transcript-confidence-checker": "Analyze audio", "audio-intelligence": "Analyze audio", "conversation-lab": "Analyze audio", "live-transcription": "Analyze audio",
  "transcript-redactor": "Clean up & convert", "vocabulary-transcription": "Clean up & convert", "audio-converter": "Clean up & convert", "text-intelligence": "Clean up & convert",
};

const allItems: DirectoryItem[] = [
  ...tools.map((tool) => ({slug: tool.slug, title: tool.title, description: tool.description, category: categoryBySlug[tool.slug], href: linkFor(tool.slug, "en")})),
  ...advancedTools.filter((tool) => tool.kind !== "enterprise").map((tool) => ({slug: tool.slug, title: tool.shortTitle, description: tool.description, category: categoryBySlug[tool.slug], href: advancedLink(tool.slug)})),
];

const categories = ["Transcribe", "Create audio", "Analyze audio", "Clean up & convert"];
const featured = new Set(["audio-to-text", "audio-to-subtitles", "text-to-speech", "audio-language-detector"]);

export default function ToolDirectory({compact = false, initialCategory = "All"}: {compact?: boolean; initialCategory?: string}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "All");
  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (!needle && compact && category === "All") return featured.has(item.slug);
      const categoryMatch = category === "All" || item.category === category;
      const queryMatch = !needle || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(needle);
      return categoryMatch && queryMatch;
    });
  }, [query, category, compact]);

  return <section className={`tool-directory ${compact ? "compact" : ""}`} id="all-tools" aria-labelledby="tool-directory-title">
    <div className="directory-heading">
      <div><span className="section-label">Tool directory</span><h2 id="tool-directory-title">{compact ? "Start with a different job" : "Find the right audio tool"}</h2></div>
      {compact && <a href="/tools">View all tools <ArrowRight size={16}/></a>}
    </div>
    <label className="directory-search"><span className="sr-only">Search tools</span><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools, for example “speaker labels”"/></label>
    <div className="directory-filters" aria-label="Tool categories">
      {["All", ...categories].map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
    </div>
    <div className="directory-grid">
      {items.map((item) => <a href={item.href} key={item.slug}><span>{item.category}</span><b>{item.title}</b><p>{item.description}</p><ArrowRight size={17}/></a>)}
    </div>
    {!items.length && <div className="directory-empty" role="status">No tool matches that search. Try a task such as “subtitles”, “language”, or “voice”.</div>}
  </section>;
}
