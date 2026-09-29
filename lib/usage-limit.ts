import {Ratelimit, type Duration} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";

type Kind="speak"|"transcribe"|"upload";
type LimitResult={ok:true}|{ok:false;status:429|503;error:string;retryAfter?:number};
type D1Result={success:boolean;meta:{changes:number}};
type D1Database={prepare(sql:string):{bind(...values:unknown[]):{run():Promise<D1Result>}}};

const memoryCounters=new Map<string,{count:number;expiresAt:number}>();
let redis:Redis|undefined;
const vercelLimiters=new Map<string,Ratelimit>();

function vercelLimiter(name:string,limit:number,window:Duration){
 const cacheKey=`${name}:${limit}:${window}`;
 let limiter=vercelLimiters.get(cacheKey);
 if(!limiter){
  redis ||= Redis.fromEnv();
  limiter=new Ratelimit({redis,limiter:Ratelimit.fixedWindow(limit,window),prefix:"voculo:limit",analytics:false});
  vercelLimiters.set(cacheKey,limiter);
 }
 return limiter;
}

async function cloudflareBindings():Promise<{DB?:D1Database;RATE_LIMIT_SALT?:string}|null>{
 if(process.env.VERCEL)return null;
 try{
  const load=new Function("specifier","return import(specifier)") as (specifier:string)=>Promise<{env?:{DB?:D1Database;RATE_LIMIT_SALT?:string}}>;
  return (await load("cloudflare:workers")).env||null;
 }catch{return null}
}

async function fingerprint(ip:string,secret:string){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(ip)));
 return Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join("");
}

export async function reserveUsage(request:Request,kind:Kind):Promise<LimitResult>{
 const bindings=await cloudflareBindings();
 const ip=request.headers.get("CF-Connecting-IP")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
 const salt=bindings?.RATE_LIMIT_SALT||process.env.RATE_LIMIT_SALT;
 if(!ip){
  console.error("Audio quota configuration missing",{database:!!bindings?.DB,clientAddress:!!ip,salt:!!salt});
  return {ok:false,status:503,error:"Audio processing is temporarily unavailable."};
 }
 if(!salt){
  console.error("Rate-limit salt is not configured");
  return {ok:false,status:503,error:"Audio processing is temporarily unavailable."};
 }
 try{
  const now=Date.now(),day=Math.floor(now/86400000),hour=Math.floor(now/3600000);
  const id=await fingerprint(ip,salt);
  const policies:Array<{name:string;id:string;limit:number;window:Duration;bucket:string;expiry:number}>=[
   {name:`ip-day:${kind}`,id:`${id}:${day}`,limit:kind==="speak"?3:kind==="upload"?3:2,window:"1 d",bucket:`ip:${kind}:${id}:${day}`,expiry:(day+1)*86400000},
   {name:`ip-hour:${kind}`,id:`${id}:${hour}`,limit:kind==="speak"?2:1,window:"1 h",bucket:`hour:${kind}:${id}:${hour}`,expiry:(hour+1)*3600000},
   {name:`global-day:${kind}`,id:`${day}`,limit:kind==="speak"?40:kind==="upload"?10:20,window:"1 d",bucket:`global:${kind}:${day}`,expiry:(day+1)*86400000}
  ];
  if(process.env.VERCEL){
   if(!process.env.UPSTASH_REDIS_REST_URL||!process.env.UPSTASH_REDIS_REST_TOKEN)return {ok:false,status:503,error:"Audio processing is temporarily unavailable."};
   for(const rule of policies){
    const result=await vercelLimiter(rule.name,rule.limit,rule.window).limit(rule.id);
    if(!result.success)return {ok:false,status:429,error:"Today's free limit has been reached. Try again later.",retryAfter:Math.max(1,Math.ceil((result.reset-now)/1000))};
   }
   return {ok:true};
  }
  if(!bindings?.DB){
   for(const rule of policies){
    const current=memoryCounters.get(rule.bucket),count=current&&current.expiresAt>now?current.count:0;
    if(count>=rule.limit)return {ok:false,status:429,error:"Today's free limit has been reached. Try again later.",retryAfter:Math.max(1,Math.ceil((rule.expiry-now)/1000))};
   }
   for(const rule of policies){const current=memoryCounters.get(rule.bucket);memoryCounters.set(rule.bucket,{count:(current&&current.expiresAt>now?current.count:0)+1,expiresAt:rule.expiry});}
   if(memoryCounters.size>2500)for(const [bucket,value] of memoryCounters)if(value.expiresAt<now)memoryCounters.delete(bucket);
   return {ok:true};
  }
  if(!bindings?.DB)throw new Error("Cloudflare database binding missing");
  for(const rule of policies){
   const result=await bindings.DB.prepare(
    "INSERT INTO usage_counters(bucket,count,expires_at) VALUES (?,1,?) "+
    "ON CONFLICT(bucket) DO UPDATE SET count=count+1 "+
    "WHERE usage_counters.count < ?"
   ).bind(rule.bucket,rule.expiry,rule.limit).run();
   if(!result.success)throw new Error("Database write did not succeed");
   if(result.meta.changes===0)return {ok:false,status:429,error:"Today's free limit has been reached. Try again later.",retryAfter:Math.max(1,Math.ceil((rule.expiry-now)/1000))};
  }
  // Expired hashed counters are cleared opportunistically; raw addresses are never stored.
  if(crypto.getRandomValues(new Uint8Array(1))[0]<6)
   await bindings.DB.prepare("DELETE FROM usage_counters WHERE expires_at < ?").bind(now).run();
  return {ok:true};
 }catch(error){
  console.error("Audio quota database failed",error instanceof Error?error.message:"Unknown database error");
  return {ok:false,status:503,error:"Audio processing is temporarily unavailable."};
 }
}
