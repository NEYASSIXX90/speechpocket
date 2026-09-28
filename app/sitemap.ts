import type {MetadataRoute} from "next";
import {tools} from "@/lib/tool-data";
import {advancedTools} from "@/lib/advanced-tools";
import {getNewsArticles} from "@/lib/news";

export default function sitemap():MetadataRoute.Sitemap{
 const site=process.env.NEXT_PUBLIC_SITE_URL||"https://speechpocket.vercel.app";
 const now=new Date();
 return [
  {url:site,lastModified:now,changeFrequency:"weekly",priority:1},
  {url:`${site}/tools`,lastModified:now,changeFrequency:"weekly",priority:.9},
  {url:`${site}/ai-news`,lastModified:now,changeFrequency:"daily",priority:.8},
  {url:`${site}/privacy`,lastModified:now,changeFrequency:"monthly",priority:.4},
  ...tools.map(tool=>({url:`${site}/en/${tool.slug}`,lastModified:now,changeFrequency:"monthly" as const,priority:.7})),
  ...advancedTools.filter(tool=>tool.kind!=="enterprise").map(tool=>({url:`${site}/en/${tool.slug}`,lastModified:now,changeFrequency:"monthly" as const,priority:tool.slug==="audio-language-detector"?.95:.8})),
  ...getNewsArticles().map(article=>({url:`${site}/ai-news/${article.slug}`,lastModified:new Date(article.updatedAt||article.publishedAt),changeFrequency:"weekly" as const,priority:.7})),
 ];
}
