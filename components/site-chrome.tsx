import {ArrowRight} from "lucide-react";

type Props = {
  children: React.ReactNode;
  active?: "tools" | "news" | "privacy";
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export default function SiteChrome({
  children,
  active,
  actionHref = "/en/audio-to-text#tool-workspace",
  actionLabel = "Transcribe audio",
  className = "",
}: Props) {
  return <div className={`site-shell ${className}`.trim()}>
    <header className="site-header">
      <a href="/" className="brand" aria-label="SpeechPocket home">
        <span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span>
        <span className="brand-copy"><b>SpeechPocket</b><small>Short audio tools</small></span>
      </a>
      <nav className="top-nav" aria-label="Main navigation">
        <a href="/tools" aria-current={active === "tools" ? "page" : undefined}>Tools</a>
        <a href="/ai-news" aria-current={active === "news" ? "page" : undefined}>AI notes</a>
        <a href="/privacy" aria-current={active === "privacy" ? "page" : undefined}>Privacy</a>
      </nav>
      <a className="header-action" href={actionHref}>{actionLabel} <ArrowRight size={16}/></a>
    </header>
    {children}
    <footer className="site-footer page-frame">
      <a href="/" className="footer-brand">SpeechPocket</a>
      <p>Short audio tools for getting from recording to result.</p>
      <a href="/tools">Tools</a>
      <a href="/ai-news">AI notes</a>
      <a href="/privacy">Privacy</a>
      <small>Some tools send content to a third-party speech provider for processing. See Privacy for details.</small>
    </footer>
  </div>;
}
