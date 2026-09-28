import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{
 const site=process.env.NEXT_PUBLIC_SITE_URL||"https://speechpocket.vercel.app";
 return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/signin-with-chatgpt","/callback"]},sitemap:[`${site}/sitemap.xml`,`${site}/news-sitemap.xml`]};
}
