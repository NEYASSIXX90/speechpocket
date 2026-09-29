import {ArrowRight} from "lucide-react";
import VoculoLogo from "@/components/voculo-logo";

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
      <a href="/" className="brand" aria-label="Voculo home">
        <VoculoLogo/>
      </a>
      <nav className="top-nav" aria-label="Main navigation">
        <a href="/tools" aria-current={active === "tools" ? "page" : undefined}>Tools</a>
        <a href="/ai-news" aria-current={active === "news" ? "page" : undefined}>AI notes</a>
        <a href="/privacy" aria-current={active === "privacy" ? "page" : undefined}>Privacy</a>
        <a href="/contact">Contact</a>
      </nav>
      <a className="header-action" href={actionHref}>{actionLabel} <ArrowRight size={16}/></a>
    </header>
    {children}
    <footer className="site-footer page-frame">
      <a href="/" className="footer-brand"><VoculoLogo/></a>
      <p>Audio in. Useful work out.</p>
      <a href="/tools">Tools</a>
      <a href="/ai-news">AI notes</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/contact">Contact</a>
      <small>Some tools send content to a third-party speech provider for processing. Privacy explains what happens before you start.</small>
    </footer>
  </div>;
}
