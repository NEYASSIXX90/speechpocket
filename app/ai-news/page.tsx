import type {Metadata} from "next";
import {ArrowRight,Clock3,Sparkles} from "lucide-react";
import {getNewsArticles} from "@/lib/news";
import SiteChrome from "@/components/site-chrome";

export const metadata:Metadata={title:"AI tools notes",description:"Verified AI product launches, updates, comparisons, and practical analysis from Voculo.",alternates:{canonical:"/ai-news"},robots:{index:true,follow:true},openGraph:{title:"AI tools notes | Voculo",description:"Verified AI product launches, updates, comparisons, and practical analysis.",type:"website"}};

export default function NewsIndex(){
 const articles=getNewsArticles();
 return <SiteChrome active="news" className="news-shell" actionHref="/tools" actionLabel="Browse tools"><main className="news-main" id="main-content"><section className="news-hero"><div><span className="section-label">Source-linked coverage</span><h1>Practical notes on AI tools.</h1><p>Short, source-linked coverage for people who use AI software.</p></div>{articles.length>0&&<aside><Sparkles/><strong>Published when there is something useful to share</strong><span>Every article must pass source, duplication, and originality checks.</span></aside>}</section><div className="news-filter"><span>Latest notes</span>{articles.length>0&&<a href="/rss.xml">RSS feed</a>}</div>{articles.length?<section className="news-grid">{articles.map((article,index)=><article className={index===0?"featured":""} key={article.slug}><a href={`/ai-news/${article.slug}`}><div className="news-card-meta"><span>{article.category}</span><time dateTime={article.publishedAt}><Clock3 size={14}/>{new Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(article.publishedAt))}</time></div><h2>{article.title}</h2><p>{article.description}</p><span className="read-link">Read analysis <ArrowRight size={16}/></span></a></article>)}</section>:<section className="news-empty"><Sparkles/><h2>No articles yet.</h2><p>We’re preparing the first issue and will publish only when there is something useful to share.</p><a href="/tools">Try a speech tool <ArrowRight size={16}/></a></section>}</main></SiteChrome>;
}
