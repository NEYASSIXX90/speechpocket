export type ToolKind="upload"|"speech"|"greeting"|"converter"|"pdf";
export type Tool={slug:string;title:string;description:string;kind:ToolKind;icon:string;group:"Listen & create"|"Transcribe & transform";detail:string;};
export const tools:Tool[]=[
 {slug:"audio-to-text",title:"Audio to text",description:"Upload a short recording and get editable text.",kind:"upload",icon:"file",group:"Transcribe & transform",detail:"MP3, M4A, WAV, or MP4 · Up to 2 MB"},
 {slug:"m4a-to-text",title:"M4A to text",description:"Turn a voice memo into text you can copy.",kind:"upload",icon:"file",group:"Transcribe & transform",detail:"M4A voice memos · Up to 2 MB"},
 {slug:"audio-to-subtitles",title:"Audio to subtitles",description:"Create a timed SRT subtitle file from spoken audio.",kind:"upload",icon:"captions",group:"Transcribe & transform",detail:"Timed SRT · Up to 2 MB"},
 {slug:"text-to-speech",title:"Text to speech",description:"Paste short text, listen, and download an MP3.",kind:"speech",icon:"audio",group:"Listen & create",detail:"600 characters per generation"},
 {slug:"pronunciation",title:"Pronunciation",description:"Hear a word or phrase and replay it.",kind:"speech",icon:"volume",group:"Listen & create",detail:"Synthetic voice; verify unfamiliar names"},
 {slug:"ivr-menu",title:"IVR menu",description:"Write a phone menu, then record its spoken version.",kind:"greeting",icon:"phone",group:"Listen & create",detail:"Editable script before audio generation"},
 {slug:"audio-converter",title:"Audio to WAV",description:"Convert a supported audio recording to WAV in your browser.",kind:"converter",icon:"repeat",group:"Listen & create",detail:"Local conversion; no upload"},
 {slug:"pdf-read-aloud",title:"PDF read aloud",description:"Extract text from a PDF and listen to it.",kind:"pdf",icon:"book",group:"Listen & create",detail:"Text-based PDFs only"}
];
export const locales=["en","fr","es","de","it","nl"] as const;
export const audioLanguages=[
 {code:"en",label:"English"},{code:"fr",label:"French"},{code:"es",label:"Spanish"},{code:"de",label:"German"},{code:"it",label:"Italian"},{code:"nl",label:"Dutch"}
];
export function linkFor(slug:string,locale:string){return "/"+locale+"/"+slug;}
