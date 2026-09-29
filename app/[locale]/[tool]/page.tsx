import {notFound} from "next/navigation";
import type {Metadata} from "next";
import Workbench from "@/components/workbench";
import AdvancedWorkbench from "@/components/advanced-workbench";
import {tools,locales,linkFor} from "@/lib/tool-data";
import {advancedTools,getAdvancedTool} from "@/lib/advanced-tools";
type Props={params:Promise<{locale:string;tool:string}>};
export function generateStaticParams(){return [...locales.flatMap(locale=>tools.map(tool=>({locale,tool:tool.slug}))),...advancedTools.map(tool=>({locale:"en",tool:tool.slug}))];}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,tool:slug}=await params;
 const tool=tools.find(x=>x.slug===slug);
 const advanced=getAdvancedTool(slug);
 if((!tool&&!advanced)||!locales.includes(locale as typeof locales[number])||(advanced&&locale!=="en")) return {};
 const frenchEntry=locale==="fr"&&slug==="audio-to-text";
 const title=advanced?`${advanced.shortTitle} — free online tool`:frenchEntry?"Transcription audio en texte gratuit":tool!.title;
 const description=advanced?advanced.description:frenchEntry?"Transcrivez un court enregistrement audio français et obtenez un texte modifiable.":tool!.description;
 return {title,description,alternates:{canonical:linkFor(slug,locale)},robots:{index:(locale==="en"||frenchEntry)&&slug!=="enterprise-speech",follow:true},openGraph:{title,description,type:"website",url:linkFor(slug,locale)}};
}
export default async function ToolPage({params}:Props){
 const {locale,tool}=await params;
 const advanced=getAdvancedTool(tool);
 if((!tools.some(x=>x.slug===tool)&&!advanced)||!locales.includes(locale as typeof locales[number])||(advanced&&locale!=="en")) notFound();
 if(advanced)return <AdvancedWorkbench tool={advanced}/>;
 return <Workbench initialTool={tool} initialLocale={locale}/>;
}
