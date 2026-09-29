"use client";

import type {ReactNode} from "react";
import {ArrowRight} from "lucide-react";
import SiteChrome from "@/components/site-chrome";

export type RelatedToolLink = {
  href: string;
  title: string;
  description: string;
  reason?: string;
};

type Props = {
  title: string;
  description: string;
  detail?: string;
  category: string;
  children: ReactNode;
  related?: RelatedToolLink[];
};

export default function ToolPageLayout({title, description, detail, category, children, related = []}: Props) {
  return <SiteChrome active="tools">
    <main className="tool-page page-frame" id="main-content">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="/tools">Tools</a><span aria-hidden="true">/</span><span>{category}</span><span aria-hidden="true">/</span><strong>{title}</strong>
      </nav>
      <header className="tool-page-header">
        <span className="section-label">{category}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {detail && <small>{detail}</small>}
      </header>
      <div className="tool-workspace" id="tool-workspace">{children}</div>
      {related.length > 0 && <section className="related-section" aria-labelledby="related-tools-heading">
        <div className="related-heading"><h2 id="related-tools-heading">Related tools</h2><a href="/tools">Browse all tools <ArrowRight size={16}/></a></div>
        <div className="more-grid">{related.map((item) => <a className="more-card" href={item.href} key={item.href}>
          {item.reason && <span>{item.reason}</span>}<b>{item.title}</b><p>{item.description}</p><ArrowRight className="more-arrow" size={18}/>
        </a>)}</div>
      </section>}
    </main>
  </SiteChrome>;
}
