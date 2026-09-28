import fs from "node:fs/promises";
import path from "node:path";

const root=process.cwd();
const contentDir=path.join(root,"content","ai-news");
const exaKey=process.env.EXA_API_KEY;
const llmKey=process.env.NEWS_LLM_API_KEY;
const llmBase=(process.env.NEWS_LLM_BASE_URL||"").replace(/\/$/,"");
const llmModel=process.env.NEWS_LLM_MODEL;
if(!exaKey||!llmKey||!llmBase||!llmModel){console.log("News generation skipped: configure EXA_API_KEY and NEWS_LLM_* secrets.");process.exit(0);}

await fs.mkdir(contentDir,{recursive:true});
const existingFiles=(await fs.readdir(contentDir)).filter(name=>name.endsWith(".json"));
const existing=await Promise.all(existingFiles.map(async name=>JSON.parse(await fs.readFile(path.join(contentDir,name),"utf8"))));
const previousUrls=new Set(existing.flatMap(article=>(article.sources||[]).map(source=>source.url)));
const previousTitles=existing.slice(0,80).map(article=>article.title);
const now=new Date();
const startDate=new Date(now.getTime()-36*60*60*1000).toISOString();

const searchResponse=await fetch("https://api.exa.ai/search",{method:"POST",headers:{"x-api-key":exaKey,"Content-Type":"application/json"},body:JSON.stringify({query:"important new AI tool launch product update model release coding agent image video voice productivity software",type:"auto",category:"news",numResults:12,startPublishedDate:startDate,contents:{text:{maxCharacters:5000},highlights:{numSentences:5}}})});
if(!searchResponse.ok)throw new Error(`News search failed with ${searchResponse.status}`);
const searchData=await searchResponse.json();
const candidates=(searchData.results||[]).filter(item=>item.url&&!previousUrls.has(item.url)).slice(0,8);
if(!candidates.length){console.log("No fresh, non-duplicate news candidate found.");process.exit(0);}

const sourcePack=candidates.map((item,index)=>({id:index+1,title:item.title,url:item.url,publishedDate:item.publishedDate||null,author:item.author||null,evidence:(item.highlights||[]).join("\n")||String(item.text||"").slice(0,5000)}));
const prompt=`You are the editor of SpeechPocket AI Tools News. Select ONE genuinely important, recent AI-tool story from the supplied evidence and write an original, useful report for people who use AI software.

Hard rules:
- Use only facts supported by the supplied evidence. Never invent quotes, prices, dates, availability, benchmarks, or features.
- Prefer a primary company announcement. Important claims should have a second supporting source when available.
- Do not copy source sentences. Do not produce a generic stitched summary.
- Add original analysis: who benefits, limitations, practical consequences, and what readers should watch next.
- Reject rumors, politics without a product impact, funding-only stories, celebrity stories, and vague opinion pieces.
- Do not mention SpeechPocket unless there is a natural, relevant connection.
- 700-1,100 words total. Plain English. No hype.
- Sources in the output must be chosen only from the supplied URLs.
- If no story meets the standard, return {"skip":true,"reason":"..."}.

Return strict JSON only with this shape:
{"slug":"lowercase-hyphen-slug","title":"specific factual headline","description":"140-160 character search description","dek":"one strong paragraph","category":"AI tools|Models|Coding|Voice|Video|Images|Productivity","sourceEventDate":"YYYY-MM-DD or null","takeaways":["three concise points"],"sections":[{"heading":"...","paragraphs":["..."]}],"sources":[{"title":"...","url":"..."}]}

Already published titles to avoid:\n${previousTitles.join("\n")||"None"}

Candidate evidence:\n${JSON.stringify(sourcePack)}`;
const llmResponse=await fetch(`${llmBase}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${llmKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:llmModel,temperature:.2,response_format:{type:"json_object"},messages:[{role:"system",content:"You are a rigorous technology news editor. Return valid JSON only."},{role:"user",content:prompt}]})});
if(!llmResponse.ok)throw new Error(`News writing failed with ${llmResponse.status}`);
const llmData=await llmResponse.json();
const raw=llmData.choices?.[0]?.message?.content;
if(!raw)throw new Error("The news model returned no content");
const article=JSON.parse(raw.replace(/^```json\s*|\s*```$/g,""));
if(article.skip){console.log(`News generation skipped: ${article.reason||"quality gate"}`);process.exit(0);}

const allowedUrls=new Set(sourcePack.map(item=>item.url));
const sourceUrls=(article.sources||[]).map(source=>source.url);
const wordCount=(article.sections||[]).flatMap(section=>section.paragraphs||[]).join(" ").trim().split(/\s+/).filter(Boolean).length;
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug||""))throw new Error("Invalid article slug");
if(existing.some(item=>item.slug===article.slug))throw new Error("Duplicate article slug");
if(!article.title||!article.description||!Array.isArray(article.sections)||article.sections.length<3)throw new Error("Incomplete article");
if(wordCount<650)throw new Error(`Article failed depth gate: ${wordCount} words`);
if(sourceUrls.length<1||sourceUrls.some(url=>!allowedUrls.has(url)))throw new Error("Article contains an unverified source URL");
article.publishedAt=now.toISOString();
article.updatedAt=now.toISOString();
article.author="SpeechPocket Editorial";
await fs.writeFile(path.join(contentDir,`${article.slug}.json`),JSON.stringify(article,null,2)+"\n","utf8");
console.log(`Published draft: ${article.slug} (${wordCount} words)`);
