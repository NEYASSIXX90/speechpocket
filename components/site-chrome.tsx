import {ArrowRight, Menu} from "lucide-react";
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
        <a href="/#how-it-works">How it works</a>
        <a href="/privacy" aria-current={active === "privacy" ? "page" : undefined}>Privacy</a>
      </nav>
      <a className="header-action" href={actionHref}>{actionLabel} <ArrowRight size={16}/></a>
      <details className="mobile-nav">
        <summary aria-label="Open navigation"><Menu size={20}/></summary>
        <nav aria-label="Mobile navigation">
          <a href="/tools" aria-current={active === "tools" ? "page" : undefined}>Tools</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/privacy" aria-current={active === "privacy" ? "page" : undefined}>Privacy</a>
          <a href="/ai-news" aria-current={active === "news" ? "page" : undefined}>AI notes</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </nav>
      </details>
    </header>
    {children}
    <footer className="site-footer page-frame">
      <div className="footer-identity"><a href="/" className="footer-brand"><VoculoLogo/></a><p>Audio in. Useful work out.</p><small>Use focused tools to transcribe, create speech and work with recordings.</small></div>
      <nav aria-label="Explore Voculo"><strong>Explore</strong><a href="/tools">All tools</a><a href="/ai-news">AI notes</a></nav>
      <nav aria-label="Company information"><strong>Information</strong><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></nav>
      <p className="footer-disclosure">Some tools send content to an external service to process your request. Review the privacy details before uploading sensitive material.</p>
      <small className="footer-copyright">© Voculo. All rights reserved.</small>
    </footer>
  </div>;
}
