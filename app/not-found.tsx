import {ArrowRight} from "lucide-react";
import SiteChrome from "@/components/site-chrome";

export default function NotFound() {
  return <SiteChrome actionHref="/tools" actionLabel="Browse tools">
    <main className="not-found page-frame" id="main-content">
      <span className="section-label">Page not found</span>
      <h1>This page is not in SpeechPocket.</h1>
      <p>The address may have changed, or the tool may no longer exist. Browse the current directory to keep working.</p>
      <a className="primary-link" href="/tools">Browse audio tools <ArrowRight size={17}/></a>
    </main>
  </SiteChrome>;
}
