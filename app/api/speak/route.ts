import {reserveUsage} from "@/lib/usage-limit";
const voices:Record<string,string>={
 en:"aura-2-thalia-en",fr:"aura-2-agathe-fr",es:"aura-2-diana-es",
 de:"aura-2-viktoria-de",it:"aura-2-flavio-it",nl:"aura-2-rhea-nl"
};
const fail=(error:string,status:number)=>Response.json({error},{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>4096)return fail("The text request is too large.",413);
 let body:{text?:unknown;language?:unknown};
 try{body=await request.json()}catch{return fail("Invalid text request.",400)}
 const text=typeof body.text==="string"?body.text.trim():"";
 const lang=typeof body.language==="string"?body.language:"en";
 if(!text||text.length>600||!voices[lang])return fail("Enter up to 600 characters and choose a supported language.",400);
 const key=process.env.DEEPGRAM_API_KEY;
 if(!key)return fail("Speech generation is temporarily unavailable in this preview.",503);
 const quota=await reserveUsage(request,"speak");
 if(!quota.ok)return Response.json({error:quota.error},{status:quota.status,headers:quota.retryAfter?{"Retry-After":String(quota.retryAfter)}:{}});
 try{
  const endpoint=new URL("https://api.deepgram.com/v1/speak");
  endpoint.searchParams.set("model",voices[lang]);endpoint.searchParams.set("encoding","mp3");
  const upstream=await fetch(endpoint,{method:"POST",headers:{"Authorization":`Token ${key}`,"Content-Type":"application/json"},body:JSON.stringify({text}),signal:AbortSignal.timeout(18000)});
  if(!upstream.ok)return fail("Speech generation could not be completed. Try again later.",502);
  return new Response(upstream.body,{headers:{"Content-Type":"audio/mpeg","Content-Disposition":'attachment; filename="speechpocket-audio.mp3"',"Cache-Control":"no-store"}});
 }catch{return fail("Speech generation timed out. Try again later.",504)}
}
