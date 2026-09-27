import {notFound} from "next/navigation";
import type {Metadata} from "next";
import Workbench from "@/components/workbench";
import {tools,locales,linkFor} from "@/lib/tool-data";
type Props={params:Promise<{locale:string;tool:string}>};
export function generateStaticParams(){return locales.flatMap(locale=>tools.map(tool=>({locale,tool:tool.slug})));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,tool:slug}=await params;
 const tool=tools.find(x=>x.slug===slug);
 if(!tool||!locales.includes(locale as typeof locales[number])) return {};
 const frenchEntry=locale==="fr"&&slug==="audio-to-text";
 return {title:frenchEntry?"Transcription audio en texte gratuit":tool.title,
  description:frenchEntry?"Transcrivez un court fichier audio français en texte modifiable. Importez un MP3, M4A, WAV ou MP4 de 2 Mo maximum.":tool.description,
  alternates:{canonical:linkFor(slug,locale)},
  robots:{index:false,follow:false}};
}
export default async function ToolPage({params}:Props){
 const {locale,tool}=await params;
 if(!tools.some(x=>x.slug===tool)||!locales.includes(locale as typeof locales[number])) notFound();
 return <Workbench initialTool={tool} initialLocale={locale}/>;
}
