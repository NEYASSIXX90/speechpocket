import "server-only";
import fs from "node:fs";
import path from "node:path";

export type NewsSource={title:string;url:string};
export type NewsSection={heading:string;paragraphs:string[]};
export type NewsArticle={
 slug:string;title:string;description:string;dek:string;category:string;
 publishedAt:string;updatedAt?:string;author:string;sourceEventDate?:string;
 takeaways:string[];sections:NewsSection[];sources:NewsSource[];
};

const newsDirectory=path.join(process.cwd(),"content","ai-news");
export function getNewsArticles():NewsArticle[]{
 try{return fs.readdirSync(newsDirectory).filter(name=>name.endsWith(".json")).map(name=>JSON.parse(fs.readFileSync(path.join(newsDirectory,name),"utf8")) as NewsArticle).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));}
 catch{return [];}
}
export function getNewsArticle(slug:string){return getNewsArticles().find(article=>article.slug===slug);}
