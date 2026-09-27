import {reserveUsage} from "@/lib/usage-limit";
const MAX_BYTES=2*1024*1024;
const accepted=["audio/mpeg","audio/mp3","audio/wav","audio/x-wav","audio/mp4","audio/x-m4a","audio/m4a","video/mp4","audio/ogg","audio/webm"];
type Word={word:string;start:number;end:number};
function clock(seconds:number){const s=Math.max(0,Math.floor(seconds)),ms=Math.round((seconds-s)*1000);return `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor(s/60)%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")},${String(ms).padStart(3,"0")}`;}
function makeSrt(words:Word[]){const groups:Word[][]=[];for(let i=0;i<words.length;i+=8)groups.push(words.slice(i,i+8));return groups.map((g,i)=>`${i+1}\n${clock(g[0].start)} --> ${clock(g.at(-1)!.end)}\n${g.map(w=>w.word).join(" ")}\n`).join("\n");}
const fail=(error:string,status:number)=>Response.json({error},{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 const length=Number(request.headers.get("content-length")||0);
 if(length>MAX_BYTES+2000)return fail("File must be 2 MB or smaller.",413);
 let form:FormData;try{form=await request.formData()}catch{return fail("Could not read the uploaded file.",400)}
 const audio=form.get("file"),language=form.get("language");
 if(!(audio instanceof File)||audio.size===0||audio.size>MAX_BYTES)return fail("Choose a file up to 2 MB.",400);
 const type=audio.type||"application/octet-stream";
 if(type!=="application/octet-stream"&&!accepted.includes(type))return fail("Use an MP3, M4A, WAV, MP4, OGG, or WebM audio file.",400);
 if(typeof language!=="string"||!["en","fr","es","de","it","nl"].includes(language))return fail("Choose a supported spoken language.",400);
 const key=process.env.DEEPGRAM_API_KEY;
 if(!key)return fail("Audio transcription is temporarily unavailable in this preview.",503);
 const quota=await reserveUsage(request,"transcribe");
 if(!quota.ok)return Response.json({error:quota.error},{status:quota.status,headers:quota.retryAfter?{"Retry-After":String(quota.retryAfter)}:{}});
 try{
  const endpoint=new URL("https://api.deepgram.com/v1/listen");
  endpoint.searchParams.set("model","nova-3");endpoint.searchParams.set("smart_format","true");endpoint.searchParams.set("language",language);
  const res=await fetch(endpoint,{method:"POST",headers:{"Authorization":`Token ${key}`,"Content-Type":type},body:await audio.arrayBuffer(),signal:AbortSignal.timeout(30000)});
  if(!res.ok)return fail("Audio transcription could not be completed. Try a shorter recording.",502);
  const data=await res.json() as {metadata?:{duration?:number};results?:{channels?:Array<{alternatives?:Array<{transcript?:string;words?:Word[]}>}>}};
  if((data.metadata?.duration||0)>120)return fail("Use a recording shorter than two minutes.",400);
  const alternative=data.results?.channels?.[0]?.alternatives?.[0],transcript=alternative?.transcript?.trim()||"";
  if(!transcript)return Response.json({transcript:"",srt:""},{headers:{"Cache-Control":"no-store"}});
  return Response.json({transcript,srt:makeSrt(alternative?.words||[])},{headers:{"Cache-Control":"no-store"}});
 }catch{return fail("Audio processing timed out. Try a shorter recording.",504)}
}
