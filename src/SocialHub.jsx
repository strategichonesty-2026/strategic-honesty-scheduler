import { useState, useEffect, useCallback, useRef } from "react";

const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || 'dev';
const GREEN = "#24b47e";
const BSKY_COLOR = "#0085FF";
const BACKEND = 'https://strategic-honesty-scheduler-production.up.railway.app';
const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const C = {
  bg:'#F4F6F8', sidebar:'#FFFFFF', card:'#FFFFFF', border:'#E2E8F0',
  text:'#0f172a', muted:'#64748b', label:'#334155',
  green:'#24b47e', greenLight:'#E6F7F2', greenDark:'#0f6e56',
  gold:'#BA7517', goldLight:'#FEF3C7',
  purple:'#7c3aed', purpleLight:'#F5F3FF',
  blue:'#0A66C2', blueLight:'#EFF6FF',
  red:'#DC2626', redLight:'#FEE2E2',
  navy:'#1E293B',
  shadow:'0 1px 3px rgba(0,0,0,0.07)',
  shadowMd:'0 4px 12px rgba(0,0,0,0.08)',
};

const CONTENT_TYPES = [
  { id:'video-long',  label:'Video Long',      emoji:'🎬', desc:'YouTube, Facebook' },
  { id:'video-short', label:'Video Short/Reel', emoji:'📱', desc:'TikTok, Reels, Shorts' },
  { id:'image',       label:'Image + Caption',  emoji:'📸', desc:'Instagram, Facebook…' },
  { id:'text-short',  label:'Text Short <280',  emoji:'✍️', desc:'X, Bluesky, Threads' },
  { id:'text-medium', label:'Text Medium <700', emoji:'📝', desc:'LinkedIn, Facebook…' },
  { id:'text-long',   label:'Text Long',        emoji:'📄', desc:'LinkedIn Articles…' },
  { id:'link',        label:'Link Share',       emoji:'🔗', desc:'LinkedIn, Bluesky…' },
];
const ROUTER_MAP = {
  'video-long':['yt','fb'],'video-short':['tt','ig','yt','fb'],
  'image':['ig','fb','pi','li'],'text-short':['tw','bs','th'],
  'text-medium':['li','fb','bs'],'text-long':['li','ss'],'link':['li','fb','bs','tw'],
};
const CHAR_LIMITS = {
  li:{label:'LinkedIn',limit:3000,warn:2800,color:'#0A66C2'},
  bs:{label:'Bluesky',limit:300,warn:260,color:'#0085FF',hard:true},
  tw:{label:'X/Twitter',limit:280,warn:250,color:'#000000'},
  fb:{label:'Facebook',limit:63206,warn:60000,color:'#1877F2'},
  ig:{label:'Instagram',limit:2200,warn:2000,color:'#E1306C'},
  tt:{label:'TikTok',limit:2200,warn:2000,color:'#010101'},
  yt:{label:'YouTube',limit:5000,warn:4500,color:'#FF0000'},
};
const BUFFER_PLATFORMS = {
  fb:{name:'Facebook',icon:'👥',color:'#1877F2',time:'13:00'},
  tt:{name:'TikTok',icon:'🎵',color:'#010101',time:'19:00'},
  ig:{name:'Instagram',icon:'📸',color:'#E1306C',time:'11:00'},
};
function computeScheduleDates(pattern,startDate) {
  const base=new Date(startDate);
  if(pattern==='once') return [new Date(base)];
  if(pattern==='weekly4') return Array.from({length:4},(_,i)=>new Date(base.getTime()+i*7*24*60*60*1000));
  if(pattern==='biweekly4') return Array.from({length:4},(_,i)=>new Date(base.getTime()+i*14*24*60*60*1000));
  if(pattern==='monthly3') return Array.from({length:3},(_,i)=>{const d=new Date(base);d.setMonth(d.getMonth()+i);return d;});
  return [new Date(base)];
}
function generateScheduledCSV(platformId,content,imageUrl,schedTimes,schedPattern,schedStart) {
  const cfg=BUFFER_PLATFORMS[platformId];if(!cfg)return null;
  const timeStr=schedTimes[platformId]||cfg.time;
  const dates=computeScheduleDates(schedPattern,schedStart);
  const escape=v=>`"${(v||'').replace(/"/g,'""')}"`;
  const header='Text,Image URL,Tags,Posting Time';
  const rows=dates.map(d=>{const ymd=d.toISOString().split('T')[0];return[escape(content),escape(imageUrl||''),'""',escape(`${ymd} ${timeStr}`)].join(',');});
  return `${header}\n${rows.join('\n')}`;
}
function downloadScheduledCSV(platformId,content,imageUrl,schedTimes,schedPattern,schedStart) {
  const cfg=BUFFER_PLATFORMS[platformId];if(!cfg)return;
  const csv=generateScheduledCSV(platformId,content,imageUrl,schedTimes,schedPattern,schedStart);
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
  a.download=`Buffer_${cfg.name}_${schedPattern}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();URL.revokeObjectURL(url);
}
function downloadCSV(platformId,content,imageUrl,scheduleDate) {
  const cfg=BUFFER_PLATFORMS[platformId];if(!cfg)return;
  const escape=v=>`"${(v||'').replace(/"/g,'""')}"`;
  const postingDate=scheduleDate?scheduleDate.split('T')[0]:new Date().toISOString().split('T')[0];
  const csv=`Text,Image URL,Tags,Posting Time\n${[escape(content),escape(imageUrl||''),'""',escape(`${postingDate} ${cfg.time}`)].join(',')}`;
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
  a.download=`Buffer_${cfg.name}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();URL.revokeObjectURL(url);
}
function getUserId() {
  let id=localStorage.getItem('sh_user_id');
  if(!id){id='user_'+Math.random().toString(36).slice(2,10);localStorage.setItem('sh_user_id',id);}
  return id;
}
async function bskyCreateSession(identifier,appPassword) {
  const res=await fetch('https://bsky.social/xrpc/com.atproto.server.createSession',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password:appPassword})});
  if(!res.ok){const e=await res.json();throw new Error(e.message||'Login failed');}
  return res.json();
}
async function bskyPost(accessJwt,did,text) {
  const res=await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${accessJwt}`},body:JSON.stringify({repo:did,collection:'app.bsky.feed.post',record:{$type:'app.bsky.feed.post',text,createdAt:new Date().toISOString()}})});
  if(!res.ok){const e=await res.json();throw new Error(e.message||'Post failed');}
  return res.json();
}
const STATIC_CHANNELS=[
  {id:'fb',name:'Strategic Honesty',handle:'Facebook Page',platform:'Facebook',icon:'👥',color:'#1877F2',avatar:'https://img.youtube.com/vi/pSRmFFI-eWs/default.jpg',initials:'SH',type:'Facebook Page',posts:10,status:'active'},
  {id:'tt',name:'strategichonesty1',handle:'TikTok Account',platform:'TikTok',icon:'🎵',color:'#010101',avatar:'',initials:'S1',type:'TikTok Account',posts:10,status:'active'},
  {id:'ig',name:'strategichonesty',handle:'Instagram Professional',platform:'Instagram',icon:'📸',color:'#E1306C',avatar:'',initials:'SH',type:'Instagram Professional',posts:10,status:'active'},
];
const ALL_PLATFORMS=[
  {id:'li',name:'LinkedIn',icon:'💼',color:'#0A66C2',sub:'Page or Profile'},
  {id:'fb',name:'Facebook',icon:'👥',color:'#1877F2',sub:'Page or Group'},
  {id:'tw',name:'X / Twitter',icon:'🐦',color:'#000000',sub:'Profile'},
  {id:'th',name:'Threads',icon:'🧵',color:'#101010',sub:'Profile'},
  {id:'bs',name:'Bluesky',icon:'🦋',color:'#0085FF',sub:'Profile'},
  {id:'pi',name:'Pinterest',icon:'📌',color:'#E60023',sub:'Business account'},
  {id:'ss',name:'Substack',icon:'📰',color:'#FF6719',sub:'Newsletter'},
  {id:'gb',name:'Google Business',icon:'🏢',color:'#4285F4',sub:'Business Profile'},
  {id:'yt',name:'YouTube',icon:'▶️',color:'#FF0000',sub:'Channel'},
  {id:'mm',name:'Mailmeteor',icon:'📧',color:'#1D9E75',sub:'Email campaigns'},
  {id:'ig',name:'Instagram',icon:'📸',color:'#E1306C',sub:'Professional Account'},
  {id:'tt',name:'TikTok',icon:'🎵',color:'#010101',sub:'Creator Account'},
];
const SCHEDULE_POSTS=[
  {day:18,color:'#0A66C2',text:'LinkedIn: Integrity edge...'},
  {day:19,color:'#E1306C',text:'Integrity wins...'},{day:19,color:'#010101',text:'Integrity TikTok...'},
  {day:20,color:'#BA7517',text:'Quote: Sand vs bedrock...'},{day:21,color:'#D85A30',text:'Book: True North...'},
  {day:22,color:'#E1306C',text:'Integrity: Strategic asset...'},{day:22,color:'#010101',text:'Strategic asset TT...'},
  {day:25,color:'#0A66C2',text:'LinkedIn: Reputation...'},{day:26,color:'#E1306C',text:'Reputation asset...'},
  {day:26,color:'#010101',text:'Reputation TT...'},{day:27,color:'#BA7517',text:'Quote: Shortcuts are loans...'},
  {day:28,color:'#D85A30',text:'Book: Strategic Honesty...'},{day:29,color:'#E1306C',text:'Integrity always wins...'},
  {day:29,color:'#010101',text:'Always wins TT...'},
];
const QUOTES={
  integrity:"Integrity isn't a soft skill. It's the hardest competitive edge in business.\n\nSand leaders optimize for today.\nBedrock leaders optimize for trust.\n\nAnd trust? It compounds like interest.\n\nI grew up in rural Nepal. The one thing I never gave up was my word. Turns out — that was everything.\n\n#StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell",
  reputation:"Your reputation is built in years. Destroyed in one shortcut.\n\nEvery honest call you made is still working for you right now.\n\n#StrategicHonesty #Reputation #Leadership",
  shortcuts:"Every shortcut is a loan — and the interest is your integrity.\n\nSave this for the next time you feel pressure to cut corners.\n\n#StrategicHonesty #Leadership #BeGoodDoGoodDoWell #Integrity",
  nepal:"I grew up on dirt floors in Nepal.\n\nNo shortcuts. No safety net. No plan B.\n\nYour word. Your integrity. Your True North.\n\nThat's what everything I've built is made of.\n\n#StrategicHonesty #Nepal #Leadership",
  ai:"The real battle is not human vs. machine.\nIt is integrity vs. exploitation.\n\nAI won't replace your craft — it exposes organizational lies.\n\n#StrategicHonesty #AI #HumanEdge #YouStillMatter",
  trust:"Trust compounds like interest.\n\nEvery honest call you make today is an investment.\nEvery shortcut is a withdrawal.\n\nThe math always catches up.\n\n#StrategicHonesty #Trust #Leadership #BeGoodDoGoodDoWell"
};

// ─── Content Ideas constants ──────────────────────────────────────────────────
const BRAND_SYSTEM=`You are the Strategic Honesty Content Engine — personal AI editorial board for Gopu Shrestha. Background: grew up in rural Nepal (no running water, no plan B), Senior Program Manager at Wells Fargo Minneapolis, PMP/PgMP/PMI-ACP/PSM II certified, PhD candidate, Distinguished Toastmaster, District Director Toastmasters International District 106, author of 7 books including "Unlocking Integrity-Centered Leadership" "You Still Matter" "The Strategic Honesty Playbook". Two sons: US Army veteran and Environmental Engineer. Runs StrategicHonesty.com. Philosophy: "Be Good. Do Good. Do Well." Voice: warm mentor-toned conversational, mix short punchy and longer reflective sentences, anchor in Nepal/immigration journey, avoid jargon cold minimalism hype passive voice, 8th-10th grade reading level. Hashtags: #StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell. Write first-person as Gopu. Never generic motivation. Root everything in lived experience or concrete professional insight. Respond ONLY with requested content — no preamble, no labels.`;
const CI_PLATFORMS=[
  {id:'li',label:'LinkedIn',icon:'💼',color:'#0A66C2',fmt:'Thought-leadership post 150–300 words, line breaks, strong opening hook, no external links in body'},
  {id:'tt',label:'TikTok',icon:'🎵',color:'#333',fmt:'45–60 sec script [0-3sec HOOK] [3-15sec PROBLEM] [15-40sec STORY] [40-55sec CTA], raw authentic tone'},
  {id:'yt',label:'YouTube Shorts',icon:'▶️',color:'#FF0000',fmt:'55-sec script Hook→Problem→Proof→CTA with timing, suggest search-optimized title at top'},
  {id:'ig',label:'Instagram',icon:'📸',color:'#E1306C',fmt:'Caption 150–220 words, strong first line, save-optimized, [visual suggestion] in brackets, hashtags at end'},
  {id:'tw',label:'X / Twitter',icon:'🐦',color:'#555',fmt:'Thread opener under 280 chars ending 🧵 then 5 numbered replies each under 280 chars'},
  {id:'fb',label:'Facebook',icon:'👥',color:'#1877F2',fmt:'Narrative 200–350 words, legacy/values framing, share-optimized CTA at end'},
  {id:'th',label:'Threads',icon:'🧵',color:'#444',fmt:'2 connected micro-posts separated by ---. First=hook 2–5 lines. Second=reframe. No hashtags.'},
];
const CI_ACTIONS=[
  {id:'rewrite',label:'Rewrite',icon:'↩'},{id:'emotion',label:'+Emotion',icon:'❤'},
  {id:'contrarian',label:'Contrarian',icon:'⚡'},{id:'trust',label:'+Trust',icon:'🔒'},
  {id:'vulnerable',label:'+Vulnerable',icon:'🌱'},{id:'analytical',label:'+Data',icon:'📊'},
  {id:'video',label:'→ Pictory Script',icon:'🎬'},{id:'carousel',label:'→ Carousel',icon:'📲'},
  {id:'longform',label:'→ Long Form',icon:'📄'},{id:'variations',label:'3 Variations',icon:'◈'},
];
const ACTION_MODS={
  rewrite:'Rewrite completely with a different angle but same Strategic Honesty message.',
  emotion:'Rewrite with significantly more emotional depth, vulnerability, and personal feeling.',
  contrarian:'Rewrite with a sharper contrarian perspective challenging conventional leadership wisdom.',
  trust:'Rewrite to maximize trust-building — specific proof points, credentials used naturally.',
  vulnerable:'Rewrite more personally vulnerable — admit uncertainty, past mistakes, hard moments.',
  analytical:'Rewrite with data-driven frameworks-based analytical tone, keeping warmth.',
  video:'Convert into a Pictory-ready video script. Format: SCENE 1: [visual description] | NARRATION: [spoken text]. Repeat for 6-8 scenes. 60-90 seconds total. Suggest background music mood at top.',
  carousel:'Convert into a 7-slide carousel. Slide 1=cover bold headline. Slides 2-6=one key point each with headline + 1-2 sentence body. Slide 7=CTA slide.',
  longform:'Expand into a 600-word LinkedIn article. Include: strong headline, 4 titled sections, pull quote, closing CTA.',
  variations:'Write 3 distinct variations labeled VARIATION 1, VARIATION 2, VARIATION 3. Separate with ---',
};
const RESEARCH_QUERIES=[
  'viral LinkedIn posts integrity leadership authenticity high engagement 2025 2026',
  'TikTok trending leadership personal development immigrant success story viral 2026',
  'viral Instagram leadership carousel saves self-improvement 2026',
  'YouTube Shorts leadership motivation retention hooks 2026 trending',
  'integrity AI era leadership content trends messaging resonance 2026',
  'immigrant success story leadership brand viral social media content 2026',
];
async function ciCallClaude(prompt,onChunk,maxTokens=1100) {
  const res=await fetch('https://sh-claude-proxy.strategichonesty.workers.dev/',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens:maxTokens,
      stream:false,
      system:BRAND_SYSTEM,
      messages:[{role:'user',content:prompt}]
    })
  });
  if(!res.ok) throw new Error('API error '+res.status);
  const data=await res.json();
  const text=data.content?.[0]?.text||'';
  if(onChunk) onChunk(text);
  return text;
}

function Avatar({ch,size=32}) {
  const [err,setErr]=useState(false);
  return (
    <div style={{position:'relative',flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:8,background:ch.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.45,fontWeight:600,color:ch.color,overflow:'hidden',border:'1px solid '+ch.color+'33'}}>
        {ch.avatar&&!err?<img src={ch.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>:<span>{ch.initials||ch.icon}</span>}
      </div>
      <div style={{position:'absolute',bottom:-3,right:-3,width:14,height:14,borderRadius:'50%',background:ch.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,border:'1.5px solid #fff'}}>{ch.icon}</div>
    </div>
  );
}
function CharCounter({content,selectedPlatforms}) {
  const relevant=Object.entries(CHAR_LIMITS).filter(([id])=>selectedPlatforms.has(id));
  if(!relevant.length||!content)return null;
  const len=content.length;
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
      {relevant.map(([id,cfg])=>{
        const over=len>cfg.limit,warn=len>cfg.warn&&!over,pct=Math.min(len/cfg.limit,1);
        return (
          <div key={id} style={{padding:'5px 10px',borderRadius:8,fontSize:11,border:`1px solid ${over?'#fca5a5':warn?'#fcd34d':C.border}`,background:over?'#fef2f2':warn?'#fffbeb':'#f8f8f8',minWidth:110}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontWeight:600,color:cfg.color}}>{cfg.label}</span><span style={{color:over?'#dc2626':warn?'#d97706':C.muted,fontWeight:over||warn?600:400}}>{len}/{cfg.limit}</span></div>
            <div style={{height:3,background:C.border,borderRadius:2,overflow:'hidden'}}><div style={{width:`${pct*100}%`,height:'100%',background:over?'#dc2626':warn?'#d97706':cfg.color,borderRadius:2,transition:'width .2s'}}/></div>
            {over&&cfg.hard&&<div style={{fontSize:10,color:'#dc2626',marginTop:3,fontWeight:600}}>🚫 Must trim to {cfg.limit}</div>}
            {over&&!cfg.hard&&<div style={{fontSize:10,color:'#dc2626',marginTop:3}}>Over by {len-cfg.limit}</div>}
            {warn&&<div style={{fontSize:10,color:'#d97706',marginTop:3}}>⚠ {cfg.limit-len} left</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── ContentIdeasPanel ────────────────────────────────────────────────────────
function ContentIdeasPanel({setApprovedQueue}) {
  const [ciTab,setCiTab]=useState('research');
  const [resStatus,setResStatus]=useState('idle');
  const [resProgress,setResProgress]=useState(0);
  const [resLabel,setResLabel]=useState('');
  const [findings,setFindings]=useState(()=>{try{return JSON.parse(localStorage.getItem('sh_ci_findings')||'[]');}catch{return[];}});
  const [ideas,setIdeas]=useState(()=>{try{return JSON.parse(localStorage.getItem('sh_ci_ideas')||'[]');}catch{return[];}});
  const [queue,setQueue]=useState(()=>{try{return JSON.parse(localStorage.getItem('sh_ci_queue')||'[]');}catch{return[];}});
  const [lastRun,setLastRun]=useState(()=>localStorage.getItem('sh_ci_lastrun')||'');
  const [nextRun,setNextRun]=useState(()=>localStorage.getItem('sh_ci_nextrun')||'');
  const [activeIdea,setActiveIdea]=useState(null);
  const [cards,setCards]=useState({});
  const fmtDate=iso=>iso?new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Never';
  const persist=useCallback((f,id,q,lr,nr,rs)=>{
    try{localStorage.setItem('sh_ci_findings',JSON.stringify(f));localStorage.setItem('sh_ci_ideas',JSON.stringify(id));localStorage.setItem('sh_ci_queue',JSON.stringify(q));localStorage.setItem('sh_ci_lastrun',lr);localStorage.setItem('sh_ci_nextrun',nr);localStorage.setItem('sh_ci_resstatus',JSON.stringify(rs));}catch{}
  },[]);
  useEffect(()=>{
    if(lastRun&&nextRun&&new Date()>new Date(nextRun)&&resStatus!=='running') runResearch();
    if(setApprovedQueue) setApprovedQueue(queue);
  },[]);
  useEffect(()=>{if(setApprovedQueue) setApprovedQueue(queue);},[queue]);
  const getCard=useCallback((iid,pid)=>{const key=`${iid}_${pid}`;return cards[key]||{content:'',loading:false,editing:false,editVal:'',expanded:false,actionLoading:null};},[cards]);
  const setCard=useCallback((iid,pid,upd)=>{const key=`${iid}_${pid}`;setCards(prev=>({...prev,[key]:{...(prev[key]||{content:'',loading:false,editing:false,editVal:'',expanded:false,actionLoading:null}),...upd}}));},[]);

  const runResearch=async()=>{
      console.log('runResearch called, status:', resStatus);
    if(resStatus==='running')return;
    setResStatus('running');setResProgress(0);setFindings([]);setResLabel('Initializing research cycle…');
    const nf=[];
setResLabel('Researching viral trends across all platforms…');
setResProgress(30);
try{
  const raw=await ciCallClaude(`Research 6 viral social media content trends for a leadership/integrity personal brand (Gopu Shrestha, Nepal origin story, Wells Fargo PM, author).\n\nReturn ONLY a raw JSON array of exactly 6 objects (no markdown, no backticks):\n[{"platform":"LinkedIn","trend":"trend name","hook":"viral hook example","theme":"core theme","whyItWorks":"2-3 sentences","emotional":"emotional trigger","format":"content format","alignment":"Strategic Honesty fit","score":8,"gopu_angle":"specific angle using Nepal origin or credentials"}]`,null,2000);
  const cleaned=raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
  const parsed=JSON.parse(cleaned);
  parsed.forEach((f,i)=>{f.id='f'+Date.now()+i;nf.push(f);});
  console.log('nf length:', nf.length);
  setFindings([...nf]);
  setResProgress(65);
}catch(e){console.error('Research error:',e.message);}

    setResLabel('Generating content ideas…');setResProgress(70);
    try{
    console.log('Starting ideas generation...');
      const summary=nf.slice(0,5).map(f=>`• ${f.trend}: ${f.gopu_angle}`).join('\n');
      const raw=await ciCallClaude(`Viral trend findings for Gopu Shrestha's Strategic Honesty brand:\n\n${summary}\n\nGenerate 8 content ideas. Return ONLY raw JSON array (no markdown):\n[{"title":"punchy title","core":"core insight 1-2 sentences rooted in Gopu's story","findingRef":"which trend","virality":"why viral potential","imageprompt":"detailed image prompt for thumbnail in dark navy and gold","pillars":"Integrity/Authenticity/Leadership/AI-Era/Nepal-Journey"}]`,null,2500);

const cleaned2=raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
const parsedIdeas=JSON.parse(cleaned2);

      const newIdeas=parsedIdeas.map((idea,i)=>({id:'idea'+Date.now()+i,title:idea.title,core:idea.core,findingRef:idea.findingRef||'',virality:idea.virality||'',imageprompt:idea.imageprompt||'',pillars:idea.pillars||'Integrity',status:'review'}));
      setIdeas(prev=>{const existIds=new Set(prev.map(i=>i.id));return[...newIdeas.filter(i=>!existIds.has(i.id)),...prev].slice(0,30);});
    }catch(e){console.error('Ideas error:',e.message);}
    setResProgress(100);setResLabel('Research complete');setResStatus('done');
    const lr=new Date().toISOString(),nr=new Date(Date.now()+7*24*60*60*1000).toISOString();
    setLastRun(lr);setNextRun(nr);persist(nf,ideas,queue,lr,nr,'done');
  };

  const generateContent=useCallback(async(ideaId,platId,actionId=null)=>{
    const idea=ideas.find(i=>i.id===ideaId);const plat=CI_PLATFORMS.find(p=>p.id===platId);
    if(!idea||!plat)return;const c=getCard(ideaId,platId);if(c.loading)return;
    if(actionId)setCard(ideaId,platId,{actionLoading:actionId});
    else setCard(ideaId,platId,{loading:true,content:'',expanded:true});
    let prompt=`Core idea: "${idea.core}"\n\nTitle: "${idea.title}"\n\nWrite a ${plat.label} post. Format: ${plat.fmt}.`;
    if(actionId&&c.content)prompt+=`\n\nExisting draft:\n"""\n${c.content}\n"""\n\nInstruction: ${ACTION_MODS[actionId]}`;
    try{await ciCallClaude(prompt,text=>setCard(ideaId,platId,{content:text,expanded:true}));}
    catch(e){setCard(ideaId,platId,{content:'Error: '+e.message});}
    setCard(ideaId,platId,{loading:false,actionLoading:null});
  },[ideas,getCard,setCard]);

  const approveToQueue=useCallback((ideaId,platId)=>{
    const c=getCard(ideaId,platId);const idea=ideas.find(i=>i.id===ideaId);const plat=CI_PLATFORMS.find(p=>p.id===platId);
    if(!c.content||!idea||!plat)return;
    const exists=queue.some(q=>q.ideaId===ideaId&&q.platId===platId);
    if(!exists){const nq=[...queue,{id:'q'+Date.now(),ideaId,platId,platform:plat.label,icon:plat.icon,color:plat.color,content:c.content,title:idea.title,imageprompt:idea.imageprompt||''}];setQueue(nq);persist(findings,ideas,nq,lastRun,nextRun,resStatus);}
  },[getCard,ideas,queue,findings,lastRun,nextRun,resStatus,persist]);

  const exportBufferCSV=()=>{const esc=v=>`"${(v||'').replace(/"/g,'""')}"`;const rows=['Platform,Title,Content,Status',...queue.map(i=>[esc(i.platform),esc(i.title),esc(i.content),esc('Approved')].join(','))];const blob=new Blob([rows.join('\n')],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`SH_ContentQueue_${new Date().toISOString().split('T')[0]}.csv`;a.click();URL.revokeObjectURL(url);};
  const exportPictoryScripts=()=>{const items=queue.filter(i=>['TikTok','YouTube Shorts','Facebook','Instagram'].includes(i.platform));if(!items.length){alert('No video platform posts in queue.');return;}const lines=['STRATEGIC HONESTY — PICTORY VIDEO SCRIPTS','Generated: '+new Date().toLocaleDateString(),'','═'.repeat(60),''];items.forEach((item,i)=>{lines.push(`PROJECT ${i+1}: ${item.platform.toUpperCase()} — ${item.title}`);lines.push('─'.repeat(50));lines.push(item.content);lines.push('');});const blob=new Blob([lines.join('\n')],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`SH_PictoryScripts_${new Date().toISOString().split('T')[0]}.txt`;a.click();URL.revokeObjectURL(url);};
  const exportImagePrompts=()=>{const items=queue.filter(i=>i.imageprompt);if(!items.length){alert('No image prompts available.');return;}const lines=['STRATEGIC HONESTY — IMAGE & THUMBNAIL PROMPTS','Generated: '+new Date().toLocaleDateString(),'Paste into Midjourney, DALL-E, Ideogram, or Canva AI','','═'.repeat(60),''];items.forEach((item,i)=>{lines.push(`PROMPT ${i+1}: ${item.title} (${item.platform})`);lines.push('─'.repeat(50));lines.push(item.imageprompt);lines.push('');});const blob=new Blob([lines.join('\n')],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`SH_ImagePrompts_${new Date().toISOString().split('T')[0]}.txt`;a.click();URL.revokeObjectURL(url);};
  const exportCreativeBrief=()=>{if(!queue.length)return;const lines=['STRATEGIC HONESTY — MASTER CREATIVE BRIEF','Generated: '+new Date().toLocaleDateString(),'Brand: StrategicHonesty.com | Author: Gopu Shrestha','Philosophy: Be Good. Do Good. Do Well.','','═'.repeat(60),''];queue.forEach((item,i)=>{lines.push(`${i+1}. ${item.platform.toUpperCase()} — ${item.title}`);lines.push('─'.repeat(50));lines.push('APPROVED COPY:');lines.push(item.content);lines.push('');if(item.imageprompt){lines.push('IMAGE/THUMBNAIL PROMPT:');lines.push(item.imageprompt);lines.push('');}lines.push('VISUAL DIRECTION: Dark navy background, gold accent typography, professional but human.');lines.push('BRAND SIGN-OFF: Be Good. Do Good. Do Well. — Gopu Shrestha');lines.push('');lines.push('═'.repeat(60));lines.push('');});const blob=new Blob([lines.join('\n')],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`SH_CreativeBrief_${new Date().toISOString().split('T')[0]}.txt`;a.click();URL.revokeObjectURL(url);};

  const pill=(label,color)=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,background:color+'22',color:color}}>{label}</span>;
  const reviewCount=ideas.filter(i=>i.status==='review').length;

  return (
    <div style={{fontFamily:F}}>
      <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:14,borderBottom:`1px solid ${C.border}`,background:C.card,borderRadius:'10px 10px 0 0',padding:'0 4px'}}>
        {[['research',`🔭 Intelligence${findings.length?` (${findings.length})`:''}` ],['adapter',`✦ Adapter${reviewCount?` (${reviewCount})`:''}` ],['queue',`📋 Queue${queue.length?` (${queue.length})`:''}` ]].map(([id,label])=>(
          <button key={id} onClick={()=>setCiTab(id)} style={{padding:'8px 14px',fontSize:12,cursor:'pointer',borderBottom:ciTab===id?`2px solid ${C.purple}`:'2px solid transparent',color:ciTab===id?C.purple:C.muted,fontWeight:ciTab===id?600:400,background:'transparent',border:'none',transition:'all .15s',whiteSpace:'nowrap'}}>{label}</button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={runResearch} disabled={resStatus==='running'} style={{padding:'5px 13px',fontSize:11,fontWeight:600,background:resStatus==='running'?'#f5f5f5':C.purple,color:resStatus==='running'?C.muted:'#fff',border:'none',borderRadius:7,cursor:resStatus==='running'?'not-allowed':'pointer',margin:'4px 0'}}>
          {resStatus==='running'?'⟳ Running…':'⟳ Run Research'}
        </button>
      </div>
      {resStatus==='running'&&<div style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.muted,marginBottom:4}}><span>{resLabel}</span><span>{resProgress}%</span></div><div style={{height:4,background:C.border,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:resProgress+'%',background:`linear-gradient(90deg,${C.purple},#a78bfa)`,borderRadius:2,transition:'width 0.4s'}}/></div></div>}

      {ciTab==='research'&&(
        <div>
          {!findings.length&&resStatus!=='running'&&(
            <div style={{textAlign:'center',padding:'48px 20px',background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:40,marginBottom:12}}>🔭</div>
              <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>No research data yet</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6,maxWidth:360,margin:'0 auto 20px'}}>Click Run Research to analyze viral trends and generate brand-aligned content ideas automatically.</div>
              <button onClick={runResearch} style={{padding:'9px 24px',fontSize:13,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>⟳ Run Research Now</button>
            </div>
          )}
          {findings.length>0&&(
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div><div style={{fontSize:14,fontWeight:700,color:C.text}}>Viral Intelligence — {findings.length} findings</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Last: {fmtDate(lastRun)} · Next auto-run: {fmtDate(nextRun)}</div></div>
                <button onClick={()=>setCiTab('adapter')} style={{padding:'6px 14px',fontSize:12,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Review Ideas →</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {findings.map(f=>(
                  <div key={f.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:7}}>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{pill(f.platform||'Multi','#7c3aed')}{pill(f.format||'','#888')}{pill(f.emotional||'','#BA7517')}</div>
                      <span style={{fontSize:14,fontWeight:700,color:f.score>=9?C.greenDark:f.score>=8?C.gold:C.muted}}>{f.score}<span style={{fontSize:10,color:'#aaa'}}>/10</span></span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4,lineHeight:1.4}}>{f.trend||f.theme||''}</div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:7,lineHeight:1.5,fontStyle:'italic'}}>"{f.hook||''}"</div>
                    <div style={{fontSize:11,color:C.label,lineHeight:1.5}}><b style={{color:C.purple}}>Why it works:</b> {f.whyItWorks||''}</div>
                    <div style={{fontSize:11,color:C.gold,marginTop:6,borderTop:`1px solid ${C.border}`,paddingTop:6,lineHeight:1.5}}><b>Your angle:</b> {f.gopu_angle||f.alignment||''}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {ciTab==='adapter'&&(
        !ideas.length?(
          <div style={{textAlign:'center',padding:'48px 20px',background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:36,marginBottom:12}}>📝</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>No ideas yet</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Run the research engine to generate platform-ready content ideas.</div>
            <button onClick={()=>{setCiTab('research');runResearch();}} style={{padding:'9px 22px',fontSize:13,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>⟳ Run Research</button>
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'210px 1fr',gap:14}}>
            <div style={{overflowY:'auto',maxHeight:'65vh'}}>
              {[['review','For Review'],['saved','Saved'],['approved','Approved'],['rejected','Rejected']].map(([status,label])=>{
                const si=ideas.filter(i=>i.status===status);if(!si.length)return null;
                const sc={review:C.gold,saved:C.purple,approved:C.greenDark,rejected:C.red};
                return <div key={status} style={{marginBottom:12}}><div style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5}}>{label} ({si.length})</div>{si.map(idea=>(
                  <div key={idea.id} onClick={()=>setActiveIdea(idea.id)} style={{padding:'8px 10px',background:activeIdea===idea.id?C.card:'transparent',border:`1px solid ${activeIdea===idea.id?C.purple:C.border}`,borderRadius:9,cursor:'pointer',marginBottom:4,transition:'all .12s'}}>
                    <div style={{display:'flex',gap:5,alignItems:'flex-start'}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:sc[idea.status]||C.muted,marginTop:4,flexShrink:0}}/>
                      <div><div style={{fontSize:11,fontWeight:600,color:C.text,lineHeight:1.4,marginBottom:1}}>{idea.title}</div><div style={{fontSize:10,color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{idea.core.slice(0,50)}…</div>{idea.pillars&&<span style={{display:'inline-block',padding:'1px 5px',borderRadius:7,fontSize:9,fontWeight:600,background:C.purpleLight,color:C.purple,marginTop:2}}>{idea.pillars}</span>}</div>
                    </div>
                  </div>
                ))}</div>;
              })}
            </div>
            <div style={{overflowY:'auto',maxHeight:'65vh'}}>
              {!activeIdea?(
                <div style={{textAlign:'center',padding:'60px 20px',background:C.card,border:`1px solid ${C.border}`,borderRadius:12}}><div style={{fontSize:14,color:C.muted}}>← Select an idea to adapt across all platforms</div></div>
              ):(()=>{
                const idea=ideas.find(i=>i.id===activeIdea);if(!idea)return null;
                const approvedCount=CI_PLATFORMS.filter(p=>queue.some(q=>q.ideaId===activeIdea&&q.platId===p.id)).length;
                return <div>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 15px',marginBottom:10}}>
                    <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>{idea.title}</div>
                    <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:6}}>{idea.core}</div>
                    {idea.virality&&<div style={{fontSize:11,color:C.gold,marginBottom:7}}>⚡ {idea.virality}</div>}
                    {idea.imageprompt&&<div style={{fontSize:11,color:C.purple,background:C.purpleLight,border:'1px solid #e9d5ff',borderRadius:7,padding:'6px 9px',marginBottom:9}}>🎨 <b>Image prompt:</b> {idea.imageprompt}</div>}
                    <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                      {['approved','saved','rejected'].map(s=>(
                        <button key={s} onClick={()=>setIdeas(prev=>prev.map(i=>i.id===activeIdea?{...i,status:s}:i))} style={{padding:'4px 11px',fontSize:11,fontWeight:600,border:`1px solid ${s==='approved'?C.greenDark:s==='saved'?C.purple:C.red}`,borderRadius:7,background:idea.status===s?(s==='approved'?C.greenLight:s==='saved'?C.purpleLight:C.redLight):'#fff',color:s==='approved'?C.greenDark:s==='saved'?C.purple:C.red,cursor:'pointer'}}>
                          {s==='approved'?'✓ Approve':s==='saved'?'🔖 Save':'✕ Reject'}
                        </button>
                      ))}
                      <span style={{fontSize:11,color:C.muted,marginLeft:'auto'}}>{approvedCount}/{CI_PLATFORMS.length} queued</span>
                    </div>
                  </div>
                  {CI_PLATFORMS.map(plat=>{
                    const c=getCard(activeIdea,plat.id);const inQueue=queue.some(q=>q.ideaId===activeIdea&&q.platId===plat.id);
                    return <div key={plat.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden',marginBottom:8}}>
                      <div onClick={()=>setCard(activeIdea,plat.id,{expanded:!c.expanded})} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 13px',cursor:'pointer',background:c.expanded?C.bg:C.card,borderBottom:c.expanded?`1px solid ${C.border}`:'none'}}>
                        <div style={{width:30,height:30,borderRadius:8,background:plat.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{plat.icon}</div>
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{plat.label}</div><div style={{fontSize:10,color:C.muted}}>{plat.fmt.slice(0,46)}…</div></div>
                        <div style={{display:'flex',gap:5,alignItems:'center'}}>
                          {inQueue&&<span style={{padding:'2px 7px',borderRadius:10,fontSize:10,fontWeight:600,background:C.greenLight,color:C.greenDark}}>✓ queued</span>}
                          {c.content&&!inQueue&&<span style={{padding:'2px 7px',borderRadius:10,fontSize:10,fontWeight:600,background:C.goldLight,color:C.gold}}>Ready</span>}
                          <button onClick={e=>{e.stopPropagation();generateContent(activeIdea,plat.id);}} disabled={c.loading&&!c.actionLoading} style={{padding:'4px 12px',fontSize:11,fontWeight:600,background:c.loading&&!c.actionLoading?'#f0f0f0':plat.color,color:c.loading&&!c.actionLoading?C.muted:'#fff',border:'none',borderRadius:7,cursor:c.loading&&!c.actionLoading?'not-allowed':'pointer'}}>
                            {c.loading&&!c.actionLoading?'…':c.content?'↺':'Generate'}
                          </button>
                        </div>
                      </div>
                      {c.expanded&&<div style={{padding:'12px 13px'}}>
                        {c.editing?<textarea value={c.editVal} onChange={e=>setCard(activeIdea,plat.id,{editVal:e.target.value})} rows={6} style={{width:'100%',fontSize:13,lineHeight:1.65,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 10px',background:'#fff',color:C.text,resize:'vertical',fontFamily:F}}/>:
                          <div style={{fontSize:13,lineHeight:1.65,whiteSpace:'pre-wrap',wordBreak:'break-word',color:C.text,minHeight:36}}>
                            {c.content||<span style={{color:'#ccc',fontStyle:'italic'}}>Click Generate</span>}
                            {c.loading&&!c.actionLoading&&<span style={{display:'inline-block',width:2,height:13,background:C.purple,marginLeft:2,animation:'blink .7s infinite',verticalAlign:'middle'}}/>}
                          </div>}
                        {c.content&&<div style={{marginTop:10}}>
                          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                            {CI_ACTIONS.map(a=><button key={a.id} onClick={()=>generateContent(activeIdea,plat.id,a.id)} disabled={!!c.actionLoading} style={{padding:'3px 8px',fontSize:11,fontWeight:500,border:`1px solid ${C.border}`,borderRadius:6,background:c.actionLoading===a.id?C.purple:'#f9f9f9',color:c.actionLoading===a.id?'#fff':C.label,cursor:c.actionLoading?'not-allowed':'pointer',transition:'all .12s'}}>{a.icon} {c.actionLoading===a.id?'…':a.label}</button>)}
                          </div>
                          <div style={{display:'flex',gap:7}}>
                            <button onClick={()=>{if(c.editing)setCard(activeIdea,plat.id,{content:c.editVal,editing:false});else setCard(activeIdea,plat.id,{editVal:c.content,editing:true});}} style={{flex:1,padding:'6px 0',fontSize:12,fontWeight:600,border:`1px solid ${C.border}`,borderRadius:8,background:c.editing?C.greenLight:'#f9f9f9',color:c.editing?C.greenDark:C.label,cursor:'pointer'}}>{c.editing?'✓ Save edit':'✎ Edit'}</button>
                            <button onClick={()=>approveToQueue(activeIdea,plat.id)} style={{flex:1,padding:'6px 0',fontSize:12,fontWeight:600,border:'none',borderRadius:8,background:inQueue?C.greenLight:C.greenDark,color:inQueue?C.greenDark:'#fff',cursor:inQueue?'default':'pointer'}}>{inQueue?'✓ In queue':'✓ Approve → Queue'}</button>
                          </div>
                        </div>}
                      </div>}
                    </div>;
                  })}
                </div>;
              })()}
            </div>
          </div>
        )
      )}

      {ciTab==='queue'&&(
        !queue.length?(
          <div style={{textAlign:'center',padding:'48px 20px',background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:36,marginBottom:10}}>📋</div>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>Queue is empty</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Approve platform posts in the Adapter to populate this queue.</div>
            <button onClick={()=>setCiTab('adapter')} style={{padding:'9px 22px',fontSize:13,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Open Adapter →</button>
          </div>
        ):(
          <>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 15px',marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:9}}>{queue.length} approved post{queue.length!==1?'s':''} — export to your tools</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                <button onClick={exportBufferCSV} style={{padding:'7px 13px',fontSize:12,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:7,cursor:'pointer'}}>📥 Buffer CSV</button>
                <button onClick={exportPictoryScripts} style={{padding:'7px 13px',fontSize:12,fontWeight:600,background:'#FF0000',color:'#fff',border:'none',borderRadius:7,cursor:'pointer'}}>🎬 Pictory Scripts</button>
                <button onClick={exportImagePrompts} style={{padding:'7px 13px',fontSize:12,fontWeight:600,background:'#E1306C',color:'#fff',border:'none',borderRadius:7,cursor:'pointer'}}>🎨 Image Prompts</button>
                <button onClick={exportCreativeBrief} style={{padding:'7px 13px',fontSize:12,fontWeight:600,background:C.gold,color:'#fff',border:'none',borderRadius:7,cursor:'pointer'}}>📄 Creative Brief</button>
              </div>
              <div style={{marginTop:7,fontSize:11,color:C.muted}}>Buffer CSV → Buffer bulk upload · Pictory Scripts → Pictory.ai · Image Prompts → Midjourney/DALL-E/Canva AI</div>
            </div>
            {CI_PLATFORMS.map(plat=>{
              const items=queue.filter(q=>q.platId===plat.id);if(!items.length)return null;
              return <div key={plat.id} style={{marginBottom:16}}><div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}><span style={{fontSize:16}}>{plat.icon}</span><span style={{fontSize:13,fontWeight:600,color:C.text}}>{plat.label}</span><span style={{padding:'2px 6px',borderRadius:10,fontSize:10,fontWeight:600,background:'#f0f0f0',color:C.muted}}>{items.length}</span></div>
                {items.map(item=><div key={item.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 13px',marginBottom:6,borderLeft:`3px solid ${item.color}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><div style={{fontSize:12,fontWeight:600,color:C.text}}>{item.title}</div><button onClick={()=>setQueue(prev=>prev.filter(q=>q.id!==item.id))} style={{padding:'2px 7px',fontSize:11,color:C.red,border:'1px solid #fca5a5',borderRadius:5,background:'#fff',cursor:'pointer'}}>✕</button></div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.55,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',whiteSpace:'pre-wrap'}}>{item.content}</div>
                  {item.imageprompt&&<div style={{marginTop:6,fontSize:11,color:C.purple,background:C.purpleLight,border:'1px solid #e9d5ff',borderRadius:6,padding:'4px 8px'}}>🎨 <b>Image prompt:</b> {item.imageprompt}</div>}
                </div>)}
              </div>;
            })}
          </>
        )
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function SocialHub() {
  const _ = BUILD_TIME;
  const [mainTab,setMainTab]=useState('calendar');
  const [userId]=useState(getUserId);
  const [connections,setConnections]=useState({});
  const [testSel,setTestSel]=useState(new Set(['ig','tt']));
  const [testContent,setTestContent]=useState('');
  const [testImage,setTestImage]=useState('');
  const [scheduleDate,setScheduleDate]=useState('');
  const [quickVideo,setQuickVideo]=useState('');
  const [logs,setLogs]=useState([{t:'info',m:'Select platforms and compose your post'}]);
  const [uploadLogs,setUploadLogs]=useState([{t:'info',m:'Select a channel and upload your CSV batch file'},{t:'info',m:'Tags column must be blank — hashtags go in text body'},{t:'info',m:'Free plan: max 10 posts per upload per channel'}]);
  const [selectedChannel,setSelectedChannel]=useState(null);
  const [scheduledPosts,setScheduledPosts]=useState([]);
  const [posting,setPosting]=useState(false);
  const [previewPlatform,setPreviewPlatform]=useState('li');
  const [approvedQueue,setApprovedQueue]=useState(()=>{try{return JSON.parse(localStorage.getItem('sh_ci_queue')||'[]');}catch{return[];}});
  const [coreIdea,setCoreIdea]=useState('');
  const [channelsOpen,setChannelsOpen]=useState(true);
  const [quickConnectOpen,setQuickConnectOpen]=useState(false);
  const [upcomingOpen,setUpcomingOpen]=useState(true);
  const [viralIdeasOpen,setViralIdeasOpen]=useState(true);
  const [approvedOpen,setApprovedOpen]=useState(true);
  const [activityLog,setActivityLog]=useState(()=>{try{return JSON.parse(localStorage.getItem('sh_activity_log')||'[]');}catch{return[];}});
  function saveToLog(entry){const log={id:Date.now(),ts:new Date().toISOString(),...entry};setActivityLog(prev=>{const next=[log,...prev].slice(0,100);localStorage.setItem('sh_activity_log',JSON.stringify(next));return next;});}
  const [postType,setPostType]=useState(null);
  const [wizardStep,setWizardStep]=useState(1);
  const [wizardContent,setWizardContent]=useState('');
  const [wizardImage,setWizardImage]=useState('');
  const [wizardSchedule,setWizardSchedule]=useState('now');
  const [wizardDate,setWizardDate]=useState('');
  const [wizardPostType,setWizardPostType]=useState(null);
  const [wizardSel,setWizardSel]=useState(new Set());
  const [wizardSendStatus,setWizardSendStatus]=useState({});
  const [wizardPosting,setWizardPosting]=useState(false);
  const [wizardDone,setWizardDone]=useState(false);
  const [schedTimes,setSchedTimes]=useState({fb:'13:00',tt:'19:00',ig:'11:00'});
  const [schedPattern,setSchedPattern]=useState('once');
  const [schedStart,setSchedStart]=useState(()=>new Date().toISOString().split('T')[0]);
  const [bskyConnected,setBskyConnected]=useState(()=>!!localStorage.getItem('sh_bsky_handle')&&!!localStorage.getItem('sh_bsky_apppw'));
  const [bskyHandle,setBskyHandle]=useState(()=>localStorage.getItem('sh_bsky_handle')||'');
  const [bskyConnecting,setBskyConnecting]=useState(false);
  const [bskyHandleInput,setBskyHandleInput]=useState('');
  const [bskyPwInput,setBskyPwInput]=useState('');
  const addLog=(setter,t,m)=>setter(prev=>[...prev,{t,m}]);

  function wizardReset(){setWizardStep(1);setWizardContent('');setWizardImage('');setWizardSchedule('now');setWizardDate('');setWizardPostType(null);setWizardSel(new Set());setWizardSendStatus({});setWizardPosting(false);setWizardDone(false);setSchedTimes({fb:'13:00',tt:'19:00',ig:'11:00'});setSchedPattern('once');setSchedStart(new Date().toISOString().split('T')[0]);}

  async function connectBluesky(){if(!bskyHandleInput.trim()||!bskyPwInput.trim()){addLog(setLogs,'err','Enter handle and app password.');return;}setBskyConnecting(true);try{const handle=bskyHandleInput.trim().replace(/^@/,'');const session=await bskyCreateSession(handle,bskyPwInput.trim());localStorage.setItem('sh_bsky_handle',handle);localStorage.setItem('sh_bsky_apppw',bskyPwInput.trim());localStorage.setItem('sh_bsky_did',session.did);setBskyHandle(handle);setBskyConnected(true);setBskyHandleInput('');setBskyPwInput('');addLog(setLogs,'ok',`✓ Bluesky connected as @${handle}`);}catch(e){addLog(setLogs,'err',`Bluesky: ${e.message}`);}setBskyConnecting(false);}
  function disconnectBluesky(){['sh_bsky_handle','sh_bsky_apppw','sh_bsky_did'].forEach(k=>localStorage.removeItem(k));setBskyHandle('');setBskyConnected(false);addLog(setLogs,'info','Bluesky disconnected');}

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get('auth')==='success'){const platform=params.get('platform'),name=params.get('name'),uid=params.get('userId');if(uid){localStorage.setItem(`sh_${platform}_userId`,uid);if(platform==='linkedin')localStorage.setItem('sh_linkedin_userId',uid);if(platform==='youtube')localStorage.setItem('sh_youtube_userId',uid);}addLog(setLogs,'ok',`✓ ${platform} connected as "${name}"`);window.history.replaceState({},'',window.location.pathname);setMainTab('connect');}
    else if(params.get('auth')==='error'){addLog(setLogs,'err',`✗ OAuth failed: ${params.get('reason')}`);window.history.replaceState({},'',window.location.pathname);}
  },[]);
  useEffect(()=>{fetchStatus();fetchScheduledPosts();},[userId]);

  async function fetchStatus(){try{const all={};const liUid=localStorage.getItem('sh_linkedin_userId')||userId;const liData=await(await fetch(`${BACKEND}/auth/status?userId=${liUid}&t=${Date.now()}`)).json();Object.assign(all,liData.connections||{});const ytUid=localStorage.getItem('sh_youtube_userId');if(ytUid&&ytUid!==liUid){const ytData=await(await fetch(`${BACKEND}/auth/status?userId=${ytUid}&t=${Date.now()}`)).json();Object.assign(all,ytData.connections||{});}setConnections(all);}catch{}}
  async function fetchScheduledPosts(){try{const data=await(await fetch(`${BACKEND}/posts?userId=${userId}`)).json();setScheduledPosts(data.posts||[]);}catch{}}
  function connectLinkedIn(){window.location.href=`${BACKEND}/auth/linkedin/connect?userId=${userId}`;}
  function connectYouTube(){window.location.href=`${BACKEND}/auth/youtube/connect?userId=${userId}`;}
  async function disconnect(platform){const puid=localStorage.getItem(`sh_${platform}_userId`)||userId;await fetch(`${BACKEND}/auth/disconnect`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:puid,platform})});setConnections(prev=>{const n={...prev};delete n[platform];return n;});addLog(setLogs,'info',`${platform} disconnected`);}

  const dynamicChannels=[];
  if(connections.linkedin)dynamicChannels.push({id:'li',name:'LinkedIn',handle:'LinkedIn Profile',platform:'LinkedIn',icon:'💼',color:'#0A66C2',avatar:'',initials:'LI',type:'LinkedIn Profile',posts:scheduledPosts.filter(p=>p.platform==='linkedin').length,status:'active'});
  if(connections.youtube)dynamicChannels.push({id:'yt',name:'YouTube Channel',handle:'YouTube Channel',platform:'YouTube',icon:'▶️',color:'#FF0000',avatar:'',initials:'YT',type:'YouTube Channel',posts:scheduledPosts.filter(p=>p.platform==='youtube').length,status:'active'});
  if(bskyConnected)dynamicChannels.push({id:'bs',name:bskyHandle||'Bluesky',handle:`@${bskyHandle}`,platform:'Bluesky',icon:'🦋',color:'#0085FF',avatar:'',initials:'BS',type:'Bluesky Profile',posts:0,status:'active'});
  const CONNECTED_CHANNELS=[...STATIC_CHANNELS,...dynamicChannels];
  const isLiConnected=!!connections.linkedin,isYtConnected=!!connections.youtube;

  function wizardSelectPostType(typeId){setWizardPostType(typeId);const r=ROUTER_MAP[typeId]||[];const av=new Set(CONNECTED_CHANNELS.map(c=>c.id));const nx=new Set(r.filter(id=>av.has(id)));if(r.includes('bs')&&bskyConnected)nx.add('bs');setWizardSel(nx.size>0?nx:new Set(r));}
  function wizardToggleSel(id){setWizardSel(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});}
  function wizardCanAdvance(step){if(step===1)return wizardContent.trim().length>0;if(step===2)return wizardSel.size>0;if(step===3){if(wizardSel.has('bs')&&wizardContent.length>300)return false;if(wizardSchedule==='scheduled'&&!wizardDate)return false;return true;}return true;}
  function wizardComputeScheduledAt(){if(wizardSchedule==='now')return new Date(Date.now()+10000).toISOString();if(wizardSchedule==='1week')return new Date(Date.now()+7*24*60*60*1000).toISOString();if(wizardSchedule==='2weeks')return new Date(Date.now()+14*24*60*60*1000).toISOString();if(wizardSchedule==='scheduled'&&wizardDate)return new Date(wizardDate).toISOString();return new Date(Date.now()+10000).toISOString();}

  async function wizardSend(){if(wizardPosting)return;setWizardPosting(true);setWizardDone(false);const init={};wizardSel.forEach(id=>{init[id]={state:'sending',msg:'Sending…'};});setWizardSendStatus(init);const scheduledAt=wizardComputeScheduledAt();const publishNow=wizardSchedule==='now';const update=(id,state,msg)=>setWizardSendStatus(prev=>({...prev,[id]:{state,msg}}));
    for(const platformId of wizardSel){
      if(platformId==='li'&&connections.linkedin){try{const data=await(await fetch(`${BACKEND}/posts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({platform:'linkedin',userId:localStorage.getItem('sh_linkedin_userId')||userId,content:wizardContent,mediaUrl:wizardImage||null,mediaType:wizardImage?'image':null,scheduledAt})})).json();if(data.success){if(publishNow){await fetch(`${BACKEND}/posts/${data.post.id}/publish`,{method:'POST'});update('li','ok',`✓ Published to LinkedIn`);saveToLog({platform:'LinkedIn',type:'real',status:'ok',msg:`Published`,preview:wizardContent.slice(0,80)});}else{update('li','ok',`✓ Scheduled for ${new Date(scheduledAt).toLocaleString()}`);fetchScheduledPosts();}}else{update('li','err',`Error: ${data.error}`);}}catch(e){update('li','err',`LinkedIn: ${e.message}`);}}
      else if(platformId==='bs'){if(!bskyConnected){update('bs','err','Not connected — go to Connect tab');continue;}if(wizardContent.length>300){update('bs','err',`Over 300 chars — skipped`);continue;}try{const session=await bskyCreateSession(localStorage.getItem('sh_bsky_handle'),localStorage.getItem('sh_bsky_apppw'));const r=await bskyPost(session.accessJwt,session.did,wizardContent);update('bs','ok',`✓ Published to Bluesky`);saveToLog({platform:'Bluesky',type:'real',status:'ok',msg:`Published`,preview:wizardContent.slice(0,80)});}catch(e){update('bs','err',`Bluesky: ${e.message}`);}}
      else if(platformId==='yt'){update('yt','warn','⚠ YouTube Community Posts deprecated');}
      else if(BUFFER_PLATFORMS[platformId]){update(platformId,'csv','📥 CSV ready — download and upload to Buffer');saveToLog({platform:BUFFER_PLATFORMS[platformId].name,type:'buffer',status:'csv',msg:'CSV generated',preview:wizardContent.slice(0,80),platformId});}
      else{update(platformId,'warn',`⚠ ${platformId.toUpperCase()} — not connected`);}
    }
    setWizardPosting(false);setWizardDone(true);
  }

  async function sendPost(publishNow=true){if(!testContent.trim()){addLog(setLogs,'err','Write a post first.');return;}if(testSel.size===0){addLog(setLogs,'err','Select at least one platform.');return;}if(testSel.has('bs')&&testContent.length>300){addLog(setLogs,'err',`🚫 Bluesky: ${testContent.length} chars — hard limit 300.`);return;}setPosting(true);
    for(const platformId of testSel){
      if(platformId==='li'&&connections.linkedin){if(publishNow){addLog(setLogs,'info','Sending to LinkedIn...');try{const scheduledAt=new Date(Date.now()+10000).toISOString();const data=await(await fetch(`${BACKEND}/posts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({platform:'linkedin',userId:localStorage.getItem('sh_linkedin_userId')||userId,content:testContent,mediaUrl:testImage||null,mediaType:testImage?'image':null,scheduledAt})})).json();if(data.success){await fetch(`${BACKEND}/posts/${data.post.id}/publish`,{method:'POST'});addLog(setLogs,'ok',`✓ Sent to LinkedIn`);saveToLog({platform:'LinkedIn',type:'real',status:'ok',msg:`Published`,preview:testContent.slice(0,80)});}else{addLog(setLogs,'err',`LinkedIn: ${data.error}`);}}catch(e){addLog(setLogs,'err',`LinkedIn: ${e.message}`);}}else if(scheduleDate){try{const data=await(await fetch(`${BACKEND}/posts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({platform:'linkedin',userId:localStorage.getItem('sh_linkedin_userId')||userId,content:testContent,mediaUrl:testImage||null,mediaType:testImage?'image':null,scheduledAt:new Date(scheduleDate).toISOString()})})).json();if(data.success){addLog(setLogs,'ok',`✓ LinkedIn scheduled`);fetchScheduledPosts();}else{addLog(setLogs,'err',`LinkedIn: ${data.error}`);}}catch(e){addLog(setLogs,'err',`LinkedIn: ${e.message}`);}}}
      else if(platformId==='bs'){if(!bskyConnected){addLog(setLogs,'err','Connect Bluesky first.');}else{addLog(setLogs,'info','Sending to Bluesky...');try{const session=await bskyCreateSession(localStorage.getItem('sh_bsky_handle'),localStorage.getItem('sh_bsky_apppw'));const r=await bskyPost(session.accessJwt,session.did,testContent);addLog(setLogs,'ok',`✓ Sent to Bluesky`);saveToLog({platform:'Bluesky',type:'real',status:'ok',msg:`Published`,preview:testContent.slice(0,80)});}catch(e){addLog(setLogs,'err',`Bluesky: ${e.message}`);}}}
      else if(platformId==='yt'){addLog(setLogs,'warn','⚠ YouTube Community Posts deprecated.');}
      else if(BUFFER_PLATFORMS[platformId]){const cfg=BUFFER_PLATFORMS[platformId];downloadCSV(platformId,testContent,testImage,scheduleDate);addLog(setLogs,'ok',`📥 ${cfg.name} CSV downloaded`);saveToLog({platform:cfg.name,type:'buffer',status:'csv',msg:'CSV downloaded',preview:testContent.slice(0,80),platformId});}
      else{addLog(setLogs,'warn',`⚠ ${platformId.toUpperCase()} — not connected`);}
    }
    setPosting(false);
  }

  const postMap={};SCHEDULE_POSTS.forEach(p=>{if(!postMap[p.day])postMap[p.day]=[];postMap[p.day].push(p);});
  const inputStyle={width:'100%',border:`1px solid ${C.border}`,borderRadius:7,padding:'8px 10px',fontSize:13,color:C.text,fontFamily:F,outline:'none',resize:'none',marginBottom:10,background:'#fff',boxSizing:'border-box'};
  const labelStyle={fontSize:12,color:C.muted,marginBottom:5,display:'block',fontWeight:500};
  const logColor=t=>t==='ok'?'#16a34a':t==='err'?'#dc2626':t==='warn'?'#d97706':'#185fa5';
  const statusDot=s=>({width:8,height:8,borderRadius:'50%',flexShrink:0,background:s==='active'?'#22c55e':s==='warning'?'#f59e0b':'#ef4444'});
  const brandScore=Math.min(100,40+approvedQueue.length*8);
  const viralIdeasSidebar=(()=>{try{return JSON.parse(localStorage.getItem('sh_ci_ideas')||'[]').filter(i=>i.status==='review').slice(0,6);}catch{return[];}})();
  const NAV=[{id:'calendar',icon:'📅',label:'Calendar'},{id:'ideas',icon:'💡',label:'Content Ideas'},{id:'wizard',icon:'🚀',label:'Review & Post'},{id:'compose',icon:'✉️',label:'Quick Compose'},{id:'connect',icon:'🔗',label:'Connect'},{id:'upload',icon:'⬆',label:'Upload CSV'},{id:'log',icon:'📋',label:'Activity Log'}];
  const previewContent=testContent||wizardContent||(approvedQueue[0]?.content||'');
  const previewPlatformMeta={li:{label:'LinkedIn',color:'#0A66C2',icon:'💼'},tt:{label:'TikTok',color:'#010101',icon:'🎵'},ig:{label:'Instagram',color:'#E1306C',icon:'📸'},fb:{label:'Facebook',color:'#1877F2',icon:'👥'},tw:{label:'X/Twitter',color:'#333',icon:'🐦'},th:{label:'Threads',color:'#444',icon:'🧵'},yt:{label:'YouTube',color:'#FF0000',icon:'▶️'}};

  return (
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr 280px',minHeight:'100vh',background:C.bg,fontFamily:F,fontSize:14}}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}.accordion-content{animation:fadeIn 0.15s ease}.nav-item:hover{background:#f1f5f9!important}`}</style>

      {/* LEFT SIDEBAR */}
      <div style={{background:C.sidebar,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,overflowY:'auto'}}>
        <div style={{padding:'16px 14px 14px',borderBottom:`1px solid ${C.border}`}}>
          <div onClick={()=>setMainTab('calendar')} title='Go to Dashboard' style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,cursor:'pointer',borderRadius:10,padding:'4px 6px',transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{width:38,height:38,background:GREEN,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:17,fontWeight:800,flexShrink:0,boxShadow:'0 2px 6px rgba(36,180,126,0.3)'}}>S</div>
            <div><div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1.2}}>Strategic Honesty</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>Content Platform v3</div></div>
          </div>
          <button onClick={()=>{wizardReset();setMainTab('wizard');}} style={{width:'100%',padding:'9px 0',background:GREEN,color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,boxShadow:'0 2px 6px rgba(36,180,126,0.25)'}}>✦ New Post</button>
        </div>
        <div style={{padding:'11px 13px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>🎯 Core Idea or Insight</div>
          <textarea value={coreIdea} onChange={e=>setCoreIdea(e.target.value)} rows={2} placeholder="e.g. Integrity compounds faster than hustle..." style={{...inputStyle,fontSize:12,marginBottom:6,resize:'none'}}/>
          <button onClick={()=>{if(coreIdea.trim()){wizardReset();setWizardContent(coreIdea);setMainTab('wizard');}}} disabled={!coreIdea.trim()} style={{width:'100%',padding:'6px 0',fontSize:11,fontWeight:600,background:coreIdea.trim()?C.navy:'#e5e7eb',color:coreIdea.trim()?'#fff':C.muted,border:'none',borderRadius:7,cursor:coreIdea.trim()?'pointer':'not-allowed'}}>Adapt to All Platforms →</button>
        </div>
        <div style={{padding:'11px 13px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:7}}>Brand Alignment</div>
          <div style={{height:6,background:'linear-gradient(to right,#ef4444,#f59e0b,#22c55e)',borderRadius:3,marginBottom:5,position:'relative'}}>
            <div style={{position:'absolute',top:-3,left:`${brandScore}%`,transform:'translateX(-50%)',width:12,height:12,background:'#fff',border:`2px solid ${C.navy}`,borderRadius:'50%'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.muted}}><span>Off-Brand</span><span>On-Brand</span><span>Strategic</span></div>
          <div style={{marginTop:5,fontSize:11,color:C.greenDark,fontWeight:600,textAlign:'center'}}>{approvedQueue.length} approved · {brandScore}% aligned</div>
        </div>
        <nav style={{padding:'8px',flex:1}}>
          {NAV.map(({id,icon,label})=>(
            <div key={id} onClick={()=>{if(id==='wizard')wizardReset();setMainTab(id);}} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 9px',borderRadius:8,cursor:'pointer',fontSize:13,color:mainTab===id?'#fff':C.muted,fontWeight:mainTab===id?600:400,background:mainTab===id?GREEN:'transparent',marginBottom:1,transition:'all .12s',borderRadius:mainTab===id?'8px':'8px'}} onMouseEnter={e=>{if(mainTab!==id)e.currentTarget.style.background='#f8fafc';}} onMouseLeave={e=>{if(mainTab!==id)e.currentTarget.style.background='transparent';}}>
              <span style={{fontSize:15}}>{icon}</span><span style={{flex:1}}>{label}</span>
              {id==='ideas'&&approvedQueue.length>0&&<span style={{fontSize:10,padding:'1px 6px',borderRadius:10,background:C.purpleLight,color:C.purple,fontWeight:600}}>{approvedQueue.length}</span>}
            </div>
          ))}
        </nav>
        <div style={{borderTop:`1px solid ${C.border}`}}>
          <div onClick={()=>setChannelsOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',cursor:'pointer',background:channelsOpen?GREEN:'transparent',borderRadius:channelsOpen?'8px':'0',transition:'background .12s'}} onMouseEnter={e=>{if(!channelsOpen)e.currentTarget.style.background='#f8fafc';}} onMouseLeave={e=>{if(!channelsOpen)e.currentTarget.style.background='transparent';}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:10,fontWeight:600,color:channelsOpen?'#fff':C.muted,textTransform:'uppercase',letterSpacing:'0.07em'}}>Channels</span><span style={{fontSize:10,padding:'1px 5px',borderRadius:7,background:'#f1f5f9',color:C.muted,fontWeight:500}}>{CONNECTED_CHANNELS.length}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:4}}><button onClick={e=>{e.stopPropagation();setMainTab('connect');}} style={{background:'none',border:'none',cursor:'pointer',color:GREEN,fontSize:16,fontWeight:'bold',padding:'0 2px',lineHeight:1}}>+</button><span style={{fontSize:9,color:C.muted,transform:channelsOpen?'rotate(180deg)':'rotate(0)',transition:'transform .2s',display:'inline-block'}}>▼</span></div>
          </div>
          {channelsOpen&&<div className='accordion-content' style={{padding:'0 8px 8px'}}>{CONNECTED_CHANNELS.map(ch=>(<div key={ch.id} onClick={()=>setSelectedChannel(selectedChannel===ch.id?null:ch.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:9,cursor:'pointer',background:selectedChannel===ch.id?'#f1f5f9':'transparent',marginBottom:2,transition:'background .12s'}} onMouseEnter={e=>{if(selectedChannel!==ch.id)e.currentTarget.style.background='#f8fafc';}} onMouseLeave={e=>{if(selectedChannel!==ch.id)e.currentTarget.style.background='transparent';}}><Avatar ch={ch} size={28}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:500,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.name}</div><div style={{fontSize:10,color:C.muted}}>{ch.type}</div></div><div style={{...statusDot(ch.status)}}/></div>))}</div>}
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingBottom:8}}>
          <div onClick={()=>setQuickConnectOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 13px',cursor:'pointer',background:quickConnectOpen?GREEN:'transparent',borderRadius:quickConnectOpen?'8px':'0',transition:'background .12s'}} onMouseEnter={e=>{if(!quickConnectOpen)e.currentTarget.style.background='#f8fafc';}} onMouseLeave={e=>{if(!quickConnectOpen)e.currentTarget.style.background='transparent';}}>
            <span style={{fontSize:10,fontWeight:600,color:quickConnectOpen?'#fff':C.muted,textTransform:'uppercase',letterSpacing:'0.07em'}}>Quick Connect</span>
            <span style={{fontSize:9,color:C.muted,transform:quickConnectOpen?'rotate(180deg)':'rotate(0)',transition:'transform .2s',display:'inline-block'}}>▼</span>
          </div>
          {quickConnectOpen&&<div className='accordion-content' style={{padding:'0 8px 4px'}}>{[{id:'li',name:'LinkedIn',icon:'💼',connected:isLiConnected,fn:connectLinkedIn},{id:'yt',name:'YouTube',icon:'▶️',connected:isYtConnected,fn:connectYouTube},{id:'bs',name:'Bluesky',icon:'🦋',connected:bskyConnected,fn:()=>setMainTab('connect')}].map(p=>(<div key={p.id} onClick={p.connected?null:p.fn} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:8,cursor:p.connected?'default':'pointer',marginBottom:2,opacity:p.connected?0.75:1,transition:'all .12s'}} onMouseEnter={e=>{if(!p.connected)e.currentTarget.style.background='#f8fafc';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}><div style={{width:27,height:27,borderRadius:8,background:'#f8fafc',border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,position:'relative',flexShrink:0}}>{p.icon}{p.connected&&<span style={{position:'absolute',bottom:-3,right:-3,width:11,height:11,borderRadius:'50%',background:'#22c55e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#fff',border:'1.5px solid #fff'}}>✓</span>}{!p.connected&&<span style={{position:'absolute',bottom:-3,right:-3,width:11,height:11,borderRadius:'50%',background:'#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:C.muted,border:'1.5px solid #fff',fontWeight:'bold'}}>+</span>}</div><span style={{fontSize:12,color:p.connected?'#16a34a':C.muted,fontWeight:p.connected?500:400}}>{p.connected?`${p.name} ✓`:p.name}</span></div>))}</div>}
        </div>
      </div>

      {/* CENTER PANEL */}
      <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',overflow:'hidden'}}>
        <div style={{background:C.sidebar,borderBottom:`1px solid ${C.border}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:12,flexShrink:0,boxShadow:'0 1px 0 #E2E8F0'}}>
          <div style={{fontSize:15,fontWeight:700,color:C.text,flex:1}}>{NAV.find(n=>n.id===mainTab)?.icon} {NAV.find(n=>n.id===mainTab)?.label||'Dashboard'}</div>
          <div style={{fontSize:11,color:C.muted}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
          <button onClick={()=>{wizardReset();setMainTab('wizard');}} style={{padding:'6px 14px',borderRadius:7,fontSize:12,cursor:'pointer',border:'none',background:GREEN,color:'#fff',fontWeight:600}}>✦ New post</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'18px',background:C.bg}}>

          {mainTab==='calendar'&&(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
                {[{n:scheduledPosts.filter(p=>p.status==='pending').length||393,l:'Posts scheduled'},{n:'5/week',l:'Posting frequency'},{n:CONNECTED_CHANNELS.length,l:'Channels active'},{n:approvedQueue.length,l:'In approved queue'}].map((item,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'13px 15px'}}><div style={{fontSize:20,fontWeight:700,color:C.text}}>{item.n}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{item.l}</div></div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <span style={{fontSize:15,fontWeight:700,color:C.text}}>May 2026</span>
                <div style={{flex:1}}/>
                <div style={{display:'flex',gap:8}}>{[['#0A66C2','LinkedIn'],['#E1306C','Instagram'],['#010101','TikTok'],['#BA7517','Quotes'],['#D85A30','Books']].map(([c,l])=><span key={l} style={{fontSize:11,color:C.muted,display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,background:c,borderRadius:2,display:'inline-block'}}/>{l}</span>)}</div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:`1px solid ${C.border}`}}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center',fontSize:11,color:C.muted,padding:'9px 0',fontWeight:600}}>{d}</div>)}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                  {Array(4).fill(0).map((_,i)=><div key={'e'+i} style={{minHeight:85,background:'#fafafa',borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}/>)}
                  {Array(31).fill(0).map((_,i)=>{const day=i+1,posts=postMap[day]||[],isToday=day===21;return(
                    <div key={day} style={{minHeight:85,background:isToday?'#f0fdf4':C.card,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:'5px 4px',cursor:'pointer',transition:'background .1s'}} onMouseEnter={e=>{if(!isToday)e.currentTarget.style.background='#f9fafb';}} onMouseLeave={e=>{if(!isToday)e.currentTarget.style.background=C.card;}}>
                      <div style={{fontSize:12,color:isToday?GREEN:C.label,marginBottom:3,fontWeight:isToday?700:400}}>{day}{isToday&&<span style={{fontSize:9,background:GREEN,color:'#fff',padding:'0 3px',borderRadius:3,marginLeft:3}}>Today</span>}</div>
                      {posts.slice(0,2).map((p,j)=><div key={j} style={{borderRadius:3,padding:'2px 4px',fontSize:10,marginBottom:2,background:p.color+'18',color:p.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.text}</div>)}
                      {posts.length>2&&<div style={{fontSize:9,color:C.muted}}>+{posts.length-2}</div>}
                    </div>
                  );})}
                </div>
              </div>
              {scheduledPosts.length>0&&<div style={{marginTop:18}}><div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:9}}>Scheduled via backend ({scheduledPosts.length})</div>{scheduledPosts.map(p=><div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'10px 13px',marginBottom:7,display:'flex',alignItems:'center',gap:11}}><div style={{fontSize:18}}>{p.platform==='linkedin'?'💼':'▶️'}</div><div style={{flex:1}}><div style={{fontSize:13,color:C.text,marginBottom:2}}>{p.content.slice(0,70)}...</div><div style={{fontSize:11,color:C.muted}}>{new Date(p.scheduled_at).toLocaleString()} · {p.status}</div></div><span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:p.status==='posted'?'#dcfce7':p.status==='failed'?'#fee2e2':'#fef9c3',color:p.status==='posted'?'#166534':p.status==='failed'?'#dc2626':'#854d0e',fontWeight:500}}>{p.status}</span></div>)}</div>}
            </div>
          )}

          {mainTab==='ideas'&&<ContentIdeasPanel setApprovedQueue={setApprovedQueue}/>}

          {mainTab==='compose'&&(
            <div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>🗺 Smart Content Router</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                  {CONTENT_TYPES.map(ct=>{const isActive=postType===ct.id;return(<button key={ct.id} onClick={()=>{setPostType(ct.id);const r=ROUTER_MAP[ct.id]||[];const av=new Set(CONNECTED_CHANNELS.map(c=>c.id));const nx=new Set(r.filter(id=>av.has(id)));if(r.includes('bs')&&bskyConnected)nx.add('bs');setTestSel(nx.size>0?nx:new Set(r));addLog(setLogs,'info',`📡 Auto-selected for ${ct.label}`);}} style={{display:'flex',flexDirection:'column',alignItems:'flex-start',padding:'7px 10px',borderRadius:8,cursor:'pointer',border:`1.5px solid ${isActive?GREEN:C.border}`,background:isActive?C.greenLight:'#fafafa',minWidth:96,transition:'all .12s'}}><span style={{fontSize:14,marginBottom:2}}>{ct.emoji}</span><span style={{fontSize:11,fontWeight:600,color:isActive?C.greenDark:C.text}}>{ct.label}</span><span style={{fontSize:9,color:C.muted}}>{ct.desc}</span></button>);})}
                </div>
                <label style={labelStyle}>Post content</label>
                <textarea value={testContent} onChange={e=>setTestContent(e.target.value)} rows={6} style={inputStyle} placeholder="Integrity isn't a soft skill..."/>
                <CharCounter content={testContent} selectedPlatforms={testSel}/>
                <label style={labelStyle}>Platforms</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
                  {CONNECTED_CHANNELS.map(ch=>{const limit=CHAR_LIMITS[ch.id];const isOver=limit&&testContent.length>limit.limit;return(<span key={ch.id} onClick={()=>setTestSel(prev=>{const n=new Set(prev);n.has(ch.id)?n.delete(ch.id):n.add(ch.id);return n;})} style={{padding:'4px 10px',borderRadius:20,fontSize:12,cursor:'pointer',border:`1px solid ${isOver&&testSel.has(ch.id)?'#fca5a5':testSel.has(ch.id)?GREEN+'66':C.border}`,background:isOver&&testSel.has(ch.id)?'#fef2f2':testSel.has(ch.id)?C.greenLight:'#fff',color:isOver&&testSel.has(ch.id)?'#dc2626':testSel.has(ch.id)?C.greenDark:C.muted,display:'inline-flex',alignItems:'center',gap:4}}><span style={{fontSize:12}}>{ch.icon}</span>{ch.name}</span>);})}
                </div>
                <label style={labelStyle}>Image URL</label>
                <input value={testImage} onChange={e=>setTestImage(e.target.value)} style={inputStyle} placeholder="https://..."/>
                <label style={labelStyle}>Schedule (LinkedIn)</label>
                <input type="datetime-local" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} style={{...inputStyle,marginBottom:12}}/>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>sendPost(true)} disabled={posting} style={{flex:1,padding:'8px 0',background:GREEN,color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:600,cursor:posting?'wait':'pointer',opacity:posting?0.7:1}}>{posting?'Sending...':'⚡ Send now'}</button>
                  <button onClick={()=>sendPost(false)} disabled={posting||!scheduleDate} style={{flex:1,padding:'8px 0',background:'#0A66C2',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:600,cursor:(posting||!scheduleDate)?'not-allowed':'pointer',opacity:(posting||!scheduleDate)?0.5:1}}>🗓 Schedule</button>
                </div>
                <div style={{background:'#f8f8f8',borderRadius:7,padding:8,fontSize:12,fontFamily:'monospace',maxHeight:100,overflowY:'auto',marginTop:9,lineHeight:1.8}}>{logs.map((l,i)=><div key={i} style={{color:logColor(l.t)}}>» {l.m}</div>)}</div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
                <label style={labelStyle}>Quick quote generator</label>
                <select value={quickVideo} onChange={e=>setQuickVideo(e.target.value)} style={{...inputStyle,marginBottom:9}}>
                  <option value="">Select a topic...</option>
                  <option value="integrity">Why Integrity-Centered Leadership Wins</option>
                  <option value="reputation">Your Reputation: The Only Asset</option>
                  <option value="shortcuts">Every Shortcut is a Loan</option>
                  <option value="nepal">From Dirt Floors to Success</option>
                  <option value="ai">Is AI Replacing Your Value?</option>
                  <option value="trust">The Silent Engine: Trust</option>
                </select>
                <button onClick={()=>{if(!quickVideo){addLog(setLogs,'err','Select a topic first.');return;}setTestContent(QUOTES[quickVideo]||'');setMainTab('compose');}} style={{padding:'7px 16px',background:GREEN,color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:500,cursor:'pointer',marginBottom:16}}>✨ Generate</button>
                <div style={{background:'#f8faff',border:'1px solid #e0eaff',borderRadius:9,padding:11,marginBottom:13}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:7}}>Connection status</div>
                  {[{label:'Railway API',ok:true,detail:'healthy'},{label:'LinkedIn OAuth',ok:isLiConnected,detail:isLiConnected?'connected':'not connected'},{label:'Bluesky',ok:bskyConnected,detail:bskyConnected?`@${bskyHandle}`:'not connected'},{label:'YouTube OAuth',ok:isYtConnected,detail:isYtConnected?'connected':'not connected'}].map((s,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}><span style={{color:C.muted}}>{s.label}</span><span style={{color:s.ok?'#16a34a':'#dc2626',fontWeight:500}}>{s.ok?'✓ ':''}{s.detail}</span></div>)}
                  <button onClick={()=>{fetchStatus();fetchScheduledPosts();}} style={{marginTop:7,padding:'4px 10px',fontSize:11,border:`1px solid ${C.border}`,borderRadius:5,background:'#fff',cursor:'pointer',color:C.muted}}>↻ Refresh</button>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:8}}>This week</div>
                {[{color:'#0A66C2',time:'Mon 8am',label:'LinkedIn post'},{color:GREEN,time:'Tue 11am',label:'Main post ✓'},{color:'#BA7517',time:'Wed 10am',label:'Viral quote'},{color:'#D85A30',time:'Thu 12pm',label:'Book CTA'},{color:GREEN,time:'Fri 11am',label:'Main post ✓'}].map((item,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 8px',background:item.color===GREEN?C.greenLight:'#f8f8f8',borderRadius:7,marginBottom:4}}><div style={{width:7,height:7,borderRadius:'50%',background:item.color,flexShrink:0}}/><span style={{fontSize:11,color:C.muted,width:65}}>{item.time}</span><span style={{fontSize:12,color:item.color===GREEN?C.greenDark:C.text}}>{item.label}</span></div>)}
              </div>
            </div></div>
          )}

          {mainTab==='upload'&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:13}}>Upload posts in bulk</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:13}}>
                <div><label style={labelStyle}>Channel</label><select style={inputStyle}>{CONNECTED_CHANNELS.map(ch=><option key={ch.id}>{ch.name} ({ch.platform})</option>)}</select></div>
                <div><label style={labelStyle}>CSV type</label><select style={inputStyle}><option>Main posts (Tue + Fri)</option><option>Monday LinkedIn gap-fill</option><option>Wednesday viral quotes</option><option>Thursday book quotes</option></select></div>
              </div>
              <label htmlFor="csv-file" style={{border:`1.5px dashed ${C.border}`,borderRadius:10,padding:'34px 28px',textAlign:'center',cursor:'pointer',background:'#fafafa',marginBottom:13,display:'block'}}>
                <div style={{fontSize:28,marginBottom:7,color:'#ccc'}}>⬆</div>
                <div style={{fontSize:14,fontWeight:500,color:C.text,marginBottom:4}}>Drop your Buffer CSV file here</div>
                <div style={{fontSize:12,color:C.muted}}>Text, Image URL, Tags, Posting Time · UTF-8 · Max 10 posts free plan</div>
                <input type="file" id="csv-file" accept=".csv" style={{display:'none'}} onChange={e=>{const file=e.target.files[0];if(!file)return;addLog(setUploadLogs,'info',`Reading ${file.name}...`);const r=new FileReader();r.onload=ev=>{const lines=ev.target.result.split('\n').filter(l=>l.trim()).length-1;addLog(setUploadLogs,'ok',`✓ ${file.name} — ${lines} posts loaded`);addLog(setUploadLogs,'info','Go to Buffer → Channel → ⚙️ → Bulk Upload → Add to Queue');};r.readAsText(file);}}/>
              </label>
              <div style={{background:'#f8f8f8',borderRadius:7,padding:8,fontSize:12,fontFamily:'monospace',maxHeight:90,overflowY:'auto',lineHeight:1.8}}>{uploadLogs.map((l,i)=><div key={i} style={{color:logColor(l.t)}}>» {l.m}</div>)}</div>
            </div>
          )}

          {mainTab==='connect'&&(
            <div>
              <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:3}}>Connect a channel</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:14}}>LinkedIn, Bluesky, YouTube — post directly from this platform.</div>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
                {[{id:'linkedin',name:'LinkedIn',icon:'💼',color:'#0A66C2',connected:isLiConnected,fn:connectLinkedIn,note:null},{id:'youtube',name:'YouTube',icon:'▶️',color:'#FF0000',connected:isYtConnected,fn:connectYouTube,note:'⚠ Community Posts deprecated by Google API'}].map(p=>(
                  <div key={p.id} style={{background:C.card,border:`1px solid ${p.connected?GREEN+'44':C.border}`,borderRadius:10,padding:'13px 15px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:42,height:42,borderRadius:10,background:p.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{p.icon}</div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{p.name}</div><div style={{fontSize:12,color:C.muted}}>{p.connected?'Connected — posts via API':'Not connected · OAuth'}</div>{p.note&&<div style={{fontSize:11,color:'#d97706',marginTop:2}}>{p.note}</div>}</div>
                    {p.connected?<><span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:'#dcfce7',color:'#166534',fontWeight:500}}>✓ Connected</span><button onClick={()=>disconnect(p.id)} style={{padding:'5px 11px',fontSize:12,border:'1px solid #fca5a5',borderRadius:7,background:'#fff',cursor:'pointer',color:'#dc2626',marginLeft:6}}>Disconnect</button></>:<button onClick={p.fn} style={{padding:'7px 17px',fontSize:13,border:'none',borderRadius:8,background:p.color,cursor:'pointer',color:'#fff',fontWeight:500}}>Connect</button>}
                  </div>
                ))}
                <div style={{background:C.card,border:`1px solid ${bskyConnected?GREEN+'44':C.border}`,borderRadius:10,padding:'13px 15px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:42,height:42,borderRadius:10,background:'#0085FF15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🦋</div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>Bluesky</div><div style={{fontSize:12,color:C.muted}}>{bskyConnected?`Connected as @${bskyHandle}`:'App Password — no OAuth needed'}</div><div style={{fontSize:11,color:'#16a34a',marginTop:2}}>✓ Real posting via AT Protocol</div></div>
                    {bskyConnected&&<><span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:'#dcfce7',color:'#166534',fontWeight:500}}>✓ Connected</span><button onClick={disconnectBluesky} style={{padding:'5px 11px',fontSize:12,border:'1px solid #fca5a5',borderRadius:7,background:'#fff',cursor:'pointer',color:'#dc2626',marginLeft:6}}>Disconnect</button></>}
                  </div>
                  {!bskyConnected&&<div style={{marginTop:11,display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:8,alignItems:'end'}}>
                    <div><label style={labelStyle}>Handle</label><input value={bskyHandleInput} onChange={e=>setBskyHandleInput(e.target.value)} placeholder="strategic-honesty.bsky.social" style={{...inputStyle,marginBottom:0}}/></div>
                    <div><label style={labelStyle}>App password</label><input type="password" value={bskyPwInput} onChange={e=>setBskyPwInput(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" style={{...inputStyle,marginBottom:0}}/></div>
                    <button onClick={connectBluesky} disabled={bskyConnecting} style={{padding:'8px 14px',fontSize:13,border:'none',borderRadius:8,background:BSKY_COLOR,cursor:bskyConnecting?'wait':'pointer',color:'#fff',fontWeight:500,height:36}}>{bskyConnecting?'…':'Connect'}</button>
                  </div>}
                </div>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:9}}>All platforms</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:9}}>
                {ALL_PLATFORMS.map(p=>{const isConn=CONNECTED_CHANNELS.some(c=>c.id===p.id);const fn=p.id==='li'?connectLinkedIn:p.id==='yt'?connectYouTube:()=>setMainTab('connect');return(<div key={p.id} style={{background:C.card,border:`1px solid ${isConn?GREEN+'44':C.border}`,borderRadius:10,padding:'13px 11px',textAlign:'center'}}><div style={{width:40,height:40,borderRadius:9,margin:'0 auto 6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,background:p.color+'15'}}>{p.icon}</div><div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:2}}>{p.name}</div><div style={{fontSize:10,color:C.muted,marginBottom:8}}>{p.sub}</div><button onClick={isConn?null:fn} style={{padding:'4px 12px',borderRadius:14,fontSize:11,fontWeight:500,cursor:isConn?'default':'pointer',border:`1px solid ${isConn?GREEN+'44':C.border}`,background:isConn?'#dcfce7':'#f9f9f9',color:isConn?'#166534':C.muted,width:'100%'}}>{isConn?'✓ Connected':p.id==='bs'?'App Password':'Connect'}</button></div>);})}
              </div>
            </div>
          )}

          {mainTab==='log'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:13}}>
                <div><div style={{fontSize:15,fontWeight:700,color:C.text}}>Activity Log</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>Real posts show proof ID · Buffer platforms show CSV</div></div>
                {activityLog.length>0&&<button onClick={()=>{setActivityLog([]);localStorage.removeItem('sh_activity_log');}} style={{padding:'5px 12px',fontSize:11,border:'1px solid #fca5a5',borderRadius:7,background:'#fff',cursor:'pointer',color:'#dc2626'}}>🗑 Clear</button>}
              </div>
              {activityLog.length===0?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:40,textAlign:'center'}}><div style={{fontSize:28,marginBottom:8}}>📭</div><div style={{fontSize:13,color:C.muted}}>No activity yet</div></div>:
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {activityLog.map(entry=>{const isReal=entry.type==='real',isFail=entry.status==='err',isBuffer=entry.type==='buffer';const bg=isFail?'#fef2f2':isReal?'#f0faf6':'#fffbeb';const border=isFail?'#fca5a5':isReal?'#b6e8d6':'#fcd34d';const icon=isFail?'❌':isReal?'✅':'⚠️';const badge=isFail?{bg:'#fee2e2',color:'#dc2626',text:'Failed'}:isReal?{bg:'#dcfce7',color:'#166534',text:'Real post'}:isBuffer?{bg:'#f5f3ff',color:C.purple,text:'Buffer CSV'}:{bg:'#fef9c3',color:'#854d0e',text:'Simulated'};return(
                  <div key={entry.id} style={{background:bg,border:`1px solid ${border}`,borderRadius:10,padding:'10px 13px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontSize:16}}>{icon}</span><div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{entry.platform}</span><span style={{fontSize:10,padding:'2px 6px',borderRadius:10,background:badge.bg,color:badge.color,fontWeight:600}}>{badge.text}</span><span style={{fontSize:11,color:C.muted,marginLeft:'auto'}}>{new Date(entry.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true})}</span></div><div style={{fontSize:12,color:isFail?'#dc2626':isReal?C.greenDark:'#854d0e',marginTop:2,fontWeight:500}}>{entry.msg}</div></div></div>
                    {entry.preview&&<div style={{fontSize:12,color:C.muted,background:'rgba(0,0,0,0.04)',borderRadius:5,padding:'4px 8px',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>"{entry.preview}{entry.preview.length>=80?'…':''}"</div>}
                    {isBuffer&&entry.platformId&&<div style={{marginTop:6,display:'flex',gap:7}}><button onClick={()=>downloadCSV(entry.platformId,entry.preview,null,null)} style={{padding:'3px 9px',fontSize:11,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:5,cursor:'pointer'}}>📥 Re-download CSV</button><a href="https://buffer.com" target="_blank" rel="noreferrer" style={{fontSize:11,color:C.purple,fontWeight:500}}>Open Buffer →</a></div>}
                  </div>
                );})}
              </div>}
            </div>
          )}

          {mainTab==='wizard'&&(()=>{
            const STEPS=[{n:1,label:'Write',icon:'✍️'},{n:2,label:'Route',icon:'🗺'},{n:3,label:'Review',icon:'👁'},{n:4,label:'Send',icon:'🚀'},{n:5,label:'Schedule',icon:'📅'}];
            const canAdvance=wizardCanAdvance(wizardStep);
            const StepBar=()=>(
              <div style={{display:'flex',alignItems:'center',marginBottom:18,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 16px'}}>
                {STEPS.map((s,i)=>{const done=wizardStep>s.n,active=wizardStep===s.n;return(<div key={s.n} style={{display:'flex',alignItems:'center',flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,cursor:done?'pointer':'default'}} onClick={()=>{if(done)setWizardStep(s.n);}}>
                    <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,transition:'all .2s',background:done?GREEN:active?C.navy:'#f0f0f0',color:done||active?'#fff':'#999',boxShadow:active?`0 0 0 3px ${GREEN}33`:'none'}}>{done?'✓':s.n}</div>
                    <div style={{display:'flex',flexDirection:'column'}}><span style={{fontSize:9,color:'#999',lineHeight:1}}>{s.icon}</span><span style={{fontSize:11,fontWeight:active?600:400,color:active?C.text:done?GREEN:'#999'}}>{s.label}</span></div>
                  </div>
                  {i<STEPS.length-1&&<div style={{flex:1,height:2,background:done?GREEN:C.border,margin:'0 6px',borderRadius:2,transition:'background .3s'}}/>}
                </div>);})}
              </div>
            );
            const Step1=()=>(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:3}}>✍️ Write your post</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:13}}>Paste AI-generated content or write from scratch.</div>
                <label style={labelStyle}>Post content</label>
                <textarea value={wizardContent} onChange={e=>setWizardContent(e.target.value)} rows={8} style={{...inputStyle,fontSize:14,lineHeight:1.6,marginBottom:4}} placeholder={`Share something that reflects your philosophy…\n\n"Be Good. Do Good. Do Well."`} autoFocus/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:2,marginBottom:13}}><span style={{fontSize:11,color:C.muted}}>{wizardContent.length} characters</span>{wizardContent.length>300&&<span style={{fontSize:11,color:'#d97706',fontWeight:500}}>⚠ Over Bluesky limit</span>}</div>
                <label style={labelStyle}>Image URL <span style={{color:'#bbb',fontWeight:400}}>(optional)</span></label>
                <input value={wizardImage} onChange={e=>setWizardImage(e.target.value)} style={{...inputStyle,marginBottom:13}} placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"/>
                {wizardImage&&<img src={wizardImage} alt="" style={{maxWidth:'100%',maxHeight:130,borderRadius:8,border:`1px solid ${C.border}`,objectFit:'cover',marginBottom:13}} onError={e=>{e.target.style.display='none';}}/>}
                <label style={labelStyle}>Quick fill from saved quotes</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {Object.entries({integrity:'Integrity edge',reputation:'Reputation',shortcuts:'Shortcuts',nepal:'Nepal roots',ai:'AI & you',trust:'Trust'}).map(([k,v])=><button key={k} onClick={()=>setWizardContent(QUOTES[k]||'')} style={{padding:'4px 10px',fontSize:11,borderRadius:14,border:`1px solid ${C.border}`,background:'#f9f9f9',cursor:'pointer',color:C.muted}}>{v}</button>)}
                </div>
              </div>
            );
            const Step2=()=>(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:3}}>🗺 Route your content</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Pick a content type to auto-select platforms, then fine-tune.</div>
                <label style={labelStyle}>Content type</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
                  {CONTENT_TYPES.map(ct=>{const isActive=wizardPostType===ct.id;return(<button key={ct.id} onClick={()=>wizardSelectPostType(ct.id)} style={{display:'flex',flexDirection:'column',alignItems:'flex-start',padding:'7px 10px',borderRadius:8,cursor:'pointer',border:`1.5px solid ${isActive?GREEN:C.border}`,background:isActive?C.greenLight:'#fafafa',minWidth:100,transition:'all .12s'}}><span style={{fontSize:14,marginBottom:2}}>{ct.emoji}</span><span style={{fontSize:11,fontWeight:600,color:isActive?C.greenDark:C.text}}>{ct.label}</span><span style={{fontSize:9,color:C.muted}}>{ct.desc}</span></button>);})}
                </div>
                <label style={labelStyle}>Platforms</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(138px,1fr))',gap:7}}>
                  {CONNECTED_CHANNELS.map(ch=>{const sel=wizardSel.has(ch.id);const limit=CHAR_LIMITS[ch.id];const isOver=limit&&wizardContent.length>limit.limit;return(<div key={ch.id} onClick={()=>wizardToggleSel(ch.id)} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 10px',borderRadius:8,cursor:'pointer',transition:'all .12s',border:`1.5px solid ${isOver&&limit?.hard?'#fca5a5':sel?ch.color+'66':C.border}`,background:isOver&&limit?.hard&&sel?'#fef2f2':sel?ch.color+'0d':'#fafafa'}}><span style={{fontSize:14}}>{ch.icon}</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:500,color:sel?ch.color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.name}</div>{limit&&<div style={{fontSize:10,color:isOver?'#dc2626':'#aaa'}}>{wizardContent.length}/{limit.limit}</div>}</div><div style={{width:14,height:14,borderRadius:4,border:`2px solid ${sel?ch.color:'#ccc'}`,background:sel?ch.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{sel&&<span style={{color:'#fff',fontSize:8,fontWeight:700}}>✓</span>}</div></div>);})}
                </div>
                {wizardSel.size===0&&<div style={{marginTop:9,fontSize:12,color:'#d97706',padding:'6px 10px',background:'#fffbeb',borderRadius:7,border:'1px solid #fcd34d'}}>⚠ Select at least one platform</div>}
                {wizardSel.has('bs')&&wizardContent.length>300&&<div style={{marginTop:9,fontSize:12,color:'#dc2626',padding:'6px 10px',background:'#fef2f2',borderRadius:7,border:'1px solid #fca5a5'}}>🚫 Bluesky selected but post is {wizardContent.length} chars — over 300 hard limit</div>}
              </div>
            );
            const Step3=()=>{
              const schedOpts=[{id:'now',label:'Post now',icon:'⚡',desc:'Publish immediately'},{id:'1week',label:'In 1 week',icon:'📅',desc:new Date(Date.now()+7*86400000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})},{id:'2weeks',label:'In 2 weeks',icon:'📅',desc:new Date(Date.now()+14*86400000).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})},{id:'scheduled',label:'Pick date & time',icon:'🗓',desc:'Choose exact moment'}];
              return(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:9}}>👁 Platform previews</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[...wizardSel].map(id=>{const ch=CONNECTED_CHANNELS.find(c=>c.id===id)||ALL_PLATFORMS.find(x=>x.id===id);if(!ch)return null;const cfg=CHAR_LIMITS[id];const len=wizardContent.length;const over=cfg&&len>cfg.limit;const warn=cfg&&len>cfg.warn&&!over;const preview=wizardContent.length>200?wizardContent.slice(0,200)+'…':wizardContent;return(<div key={id} style={{border:`1px solid ${over?'#fca5a5':ch.color+'33'}`,borderRadius:10,overflow:'hidden'}}><div style={{background:ch.color+'12',padding:'6px 10px',display:'flex',alignItems:'center',gap:6,borderBottom:`1px solid ${ch.color+'22'}`}}><span style={{fontSize:14}}>{ch.icon}</span><span style={{fontSize:12,fontWeight:600,color:ch.color}}>{ch.name}</span>{cfg&&<span style={{marginLeft:'auto',fontSize:11,color:over?'#dc2626':warn?'#d97706':'#888',fontWeight:over||warn?600:400}}>{len}/{cfg.limit}{over?' 🚫':warn?' ⚠':' ✓'}</span>}</div><div style={{padding:9}}><div style={{fontSize:12,color:C.text,lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{preview||<span style={{color:'#bbb',fontStyle:'italic'}}>No content</span>}</div>{over&&cfg.hard&&<div style={{marginTop:5,fontSize:11,color:'#dc2626',fontWeight:600}}>🚫 Must trim to {cfg.limit}</div>}</div></div>);})}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:9}}>⏱ When to publish</div>
                    <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:13}}>
                      {schedOpts.map(opt=><div key={opt.id} onClick={()=>setWizardSchedule(opt.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,cursor:'pointer',border:`1.5px solid ${wizardSchedule===opt.id?GREEN:C.border}`,background:wizardSchedule===opt.id?C.greenLight:'#fafafa',transition:'all .12s'}}><span style={{fontSize:15}}>{opt.icon}</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:wizardSchedule===opt.id?C.greenDark:C.text}}>{opt.label}</div><div style={{fontSize:11,color:C.muted}}>{opt.desc}</div></div><div style={{width:14,height:14,borderRadius:'50%',border:`2px solid ${wizardSchedule===opt.id?GREEN:'#ccc'}`,background:wizardSchedule===opt.id?GREEN:'transparent',flexShrink:0}}/></div>)}
                    </div>
                    {wizardSchedule==='scheduled'&&<div style={{marginBottom:13}}><label style={labelStyle}>Date & time (CST)</label><input type="datetime-local" value={wizardDate} onChange={e=>setWizardDate(e.target.value)} style={{...inputStyle,marginBottom:0,borderColor:!wizardDate?'#fca5a5':C.border}}/>{!wizardDate&&<div style={{fontSize:11,color:'#dc2626',marginTop:3}}>Required — pick a date</div>}</div>}
                    <div style={{background:'#f8faff',border:'1px solid #e0eaff',borderRadius:9,padding:10}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:7}}>Pre-flight checklist</div>
                      {[{ok:wizardContent.trim().length>0,label:'Content written'},{ok:wizardSel.size>0,label:`${wizardSel.size} platform${wizardSel.size!==1?'s':''} selected`},{ok:!(wizardSel.has('bs')&&wizardContent.length>300),label:'Bluesky within 300 chars'},{ok:wizardSchedule!=='scheduled'||!!wizardDate,label:'Schedule date set'},{ok:!wizardSel.has('li')||isLiConnected,label:'LinkedIn connected'},{ok:!wizardSel.has('bs')||bskyConnected,label:'Bluesky connected'}].map((item,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}><span style={{fontSize:12}}>{item.ok?'✅':'❌'}</span><span style={{fontSize:12,color:item.ok?C.text:'#dc2626'}}>{item.label}</span></div>)}
                    </div>
                  </div>
                </div>
              );
            };
            const Step4=()=>{
              const sColor=s=>s==='ok'?'#16a34a':s==='err'?'#dc2626':s==='warn'?'#d97706':s==='sending'?'#0A66C2':s==='csv'?C.purple:'#999';
              const sBg=s=>s==='ok'?'#dcfce7':s==='err'?'#fee2e2':s==='warn'?'#fef9c3':s==='sending'?'#eff6ff':s==='csv'?'#f5f3ff':'#f3f4f6';
              const sIcon=s=>s==='ok'?'✓':s==='err'?'✗':s==='warn'?'⚠':s==='sending'?'…':s==='csv'?'📥':'·';
              return(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                  {!wizardPosting&&!wizardDone&&<div style={{textAlign:'center',padding:'16px 0'}}><div style={{fontSize:36,marginBottom:9}}>🚀</div><div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Ready to publish</div><div style={{fontSize:13,color:C.muted,marginBottom:20}}>Posting to {wizardSel.size} platform{wizardSel.size!==1?'s':''} · {wizardSchedule==='now'?'immediately':wizardSchedule==='1week'?'in 1 week':wizardSchedule==='2weeks'?'in 2 weeks':`on ${new Date(wizardDate||Date.now()).toLocaleDateString()}`}</div><button onClick={wizardSend} style={{padding:'10px 28px',background:GREEN,color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:`0 2px 8px ${GREEN}44`}}>⚡ Publish now</button></div>}
                  {(wizardPosting||wizardDone)&&<div>
                    <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:13}}>{wizardPosting?'📡 Publishing…':'🎉 Done!'}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {[...wizardSel].map(id=>{const ch=CONNECTED_CHANNELS.find(c=>c.id===id)||ALL_PLATFORMS.find(x=>x.id===id);if(!ch)return null;const st=wizardSendStatus[id]||{state:'pending',msg:'Waiting…'};return(<div key={id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:sBg(st.state)}}><span style={{fontSize:18}}>{ch.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.text}}>{ch.name}</div><div style={{fontSize:12,color:sColor(st.state)}}>{st.msg}</div></div><div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>{st.state==='csv'&&<button onClick={()=>downloadCSV(id,wizardContent,wizardImage,wizardDate)} style={{padding:'4px 10px',fontSize:11,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:6,cursor:'pointer',whiteSpace:'nowrap'}}>📥 CSV</button>}<div style={{width:24,height:24,borderRadius:'50%',background:sColor(st.state),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,animation:st.state==='sending'?'spin 1s linear infinite':'none'}}>{sIcon(st.state)}</div></div></div>);})}
                    </div>
                    {wizardDone&&<div style={{marginTop:16}}>
                      {[...wizardSel].some(id=>BUFFER_PLATFORMS[id])&&<div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:9,padding:'10px 13px',marginBottom:9}}><div style={{fontSize:12,fontWeight:600,color:C.purple,marginBottom:6}}>📥 Buffer upload ready</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{[...wizardSel].filter(id=>BUFFER_PLATFORMS[id]).map(id=>{const cfg=BUFFER_PLATFORMS[id];return(<button key={id} onClick={()=>downloadCSV(id,wizardContent,wizardImage,wizardDate)} style={{padding:'5px 11px',fontSize:12,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:7,cursor:'pointer'}}>{cfg.icon} {cfg.name} CSV</button>);})}<a href="https://buffer.com" target="_blank" rel="noreferrer" style={{padding:'5px 11px',fontSize:12,fontWeight:600,background:'#fff',color:C.purple,border:'1px solid #ddd6fe',borderRadius:7,textDecoration:'none'}}>Open Buffer →</a></div></div>}
                      <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                        {[...wizardSel].some(id=>BUFFER_PLATFORMS[id])&&<button onClick={()=>setWizardStep(5)} style={{padding:'7px 16px',background:C.purple,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>📅 Schedule →</button>}
                        <button onClick={wizardReset} style={{padding:'7px 16px',background:GREEN,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>✦ New post</button>
                        <button onClick={()=>setMainTab('calendar')} style={{padding:'7px 16px',background:'#fff',color:C.text,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,cursor:'pointer'}}>📅 Calendar</button>
                      </div>
                    </div>}
                  </div>}
                </div>
              );
            };
            const Step5=()=>{
              const bufPl=[...wizardSel].filter(id=>BUFFER_PLATFORMS[id]);
              const PATTERNS=[{id:'once',label:'Post once',detail:'One post on start date'},{id:'weekly4',label:'Weekly × 4',detail:'Same day each week'},{id:'biweekly4',label:'Bi-weekly × 4',detail:'Every 2 weeks'},{id:'monthly3',label:'Monthly × 3',detail:'Same date each month'}];
              const previewDates=()=>{if(!schedStart)return[];try{return computeScheduleDates(schedPattern,schedStart);}catch{return[];}};
              return(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:3}}>📅 Schedule Posts</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Great content deserves the right timing. Be Good. Do Good. Do Well.</div>
                  <div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:600,color:C.label,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Posting time per platform (CST)</div>
                    {bufPl.length===0&&<div style={{fontSize:12,color:C.muted,fontStyle:'italic'}}>No Buffer platforms selected.</div>}
                    {bufPl.map(id=>{const cfg=BUFFER_PLATFORMS[id];return(<div key={id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:8,background:'#fafafa',marginBottom:6}}><span style={{fontSize:17}}>{cfg.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{cfg.name}</div><div style={{fontSize:11,color:C.muted}}>Default: {cfg.time} CST</div></div><input type="time" value={schedTimes[id]||cfg.time} onChange={e=>setSchedTimes(prev=>({...prev,[id]:e.target.value}))} style={{padding:'4px 8px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,fontWeight:600,color:cfg.color,cursor:'pointer'}}/></div>);})}
                  </div>
                  <div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:600,color:C.label,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Start date</div><input type="date" value={schedStart} min={new Date().toISOString().split('T')[0]} onChange={e=>setSchedStart(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:13,cursor:'pointer'}}/></div>
                  <div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:600,color:C.label,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.05em'}}>Schedule</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>{PATTERNS.map(p=><button key={p.id} onClick={()=>setSchedPattern(p.id)} style={{padding:'8px 12px',border:`2px solid ${schedPattern===p.id?C.purple:C.border}`,borderRadius:8,background:schedPattern===p.id?C.purpleLight:'#fff',cursor:'pointer',textAlign:'left'}}><div style={{fontSize:12,fontWeight:600,color:schedPattern===p.id?C.purple:C.text}}>{p.label}</div><div style={{fontSize:11,color:C.muted,marginTop:1}}>{p.detail}</div></button>)}</div></div>
                  {schedStart&&<div style={{background:C.purpleLight,border:'1px solid #ddd6fe',borderRadius:9,padding:'10px 13px',marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:C.purple,marginBottom:6}}>📋 Scheduled dates</div>{previewDates().map((d,i)=><div key={i} style={{fontSize:12,color:'#4c1d95',display:'flex',gap:6,alignItems:'center',marginBottom:3}}><span style={{background:C.purple,color:'#fff',borderRadius:3,padding:'0 5px',fontWeight:700,fontSize:11}}>#{i+1}</span>{d.toLocaleDateString('en-US',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</div>)}</div>}
                  {bufPl.length>0&&<div><div style={{fontSize:11,fontWeight:600,color:C.label,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.05em'}}>Download CSVs</div><div style={{display:'flex',flexWrap:'wrap',gap:7}}>{bufPl.map(id=>{const cfg=BUFFER_PLATFORMS[id];return(<button key={id} onClick={()=>downloadScheduledCSV(id,wizardContent,wizardImage,schedTimes,schedPattern,schedStart)} disabled={!schedStart} style={{padding:'6px 13px',fontSize:12,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:7,cursor:schedStart?'pointer':'not-allowed',opacity:schedStart?1:0.5}}>{cfg.icon} {cfg.name} ({previewDates().length} row{previewDates().length!==1?'s':''})</button>);})}
                  </div><div style={{fontSize:11,color:'#6d28d9',marginTop:7}}>Go to Buffer → Channel → Settings → Bulk Upload.</div></div>}
                </div>
              );
            };
            return(
              <div>
                <StepBar/>
                {wizardStep===1&&<Step1/>}
                {wizardStep===2&&<Step2/>}
                {wizardStep===3&&<Step3/>}
                {wizardStep===4&&<Step4/>}
                {wizardStep===5&&<Step5/>}
                {!(wizardStep===4&&(wizardPosting||wizardDone))&&(
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:13}}>
                    <button onClick={()=>setWizardStep(s=>Math.max(1,s-1))} disabled={wizardStep===1} style={{padding:'7px 16px',fontSize:13,border:`1px solid ${C.border}`,borderRadius:8,background:'#fff',cursor:wizardStep===1?'not-allowed':'pointer',color:wizardStep===1?'#ccc':C.label,opacity:wizardStep===1?0.5:1}}>← Back</button>
                    <div style={{fontSize:11,color:C.muted}}>Step {wizardStep} of 5</div>
                    {wizardStep<4?<button onClick={()=>{if(canAdvance)setWizardStep(s=>Math.min(5,s+1));}} disabled={!canAdvance} style={{padding:'7px 18px',fontSize:13,fontWeight:600,border:'none',borderRadius:8,background:canAdvance?C.navy:'#e0e0e0',color:canAdvance?'#fff':'#999',cursor:canAdvance?'pointer':'not-allowed',transition:'all .15s'}}>Next →</button>:wizardStep===4?(!wizardPosting&&!wizardDone&&<button onClick={wizardSend} style={{padding:'7px 18px',fontSize:13,fontWeight:600,border:'none',borderRadius:8,background:GREEN,color:'#fff',cursor:'pointer'}}>⚡ Publish</button>):null}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{background:C.sidebar,borderLeft:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,overflowY:'auto'}}>
        <div style={{padding:'13px 13px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:9}}>Platform Preview</div>
          <div style={{display:'flex',gap:2,overflowX:'auto',paddingBottom:0}}>
            {[{id:'li',label:'LinkedIn',color:'#0A66C2'},{id:'tt',label:'TikTok',color:'#010101'},{id:'ig',label:'Instagram',color:'#E1306C'},{id:'fb',label:'Facebook',color:'#1877F2'},{id:'tw',label:'X',color:'#333'},{id:'th',label:'Threads',color:'#444'}].map(p=>(
              <button key={p.id} onClick={()=>setPreviewPlatform(p.id)} style={{padding:'5px 9px',fontSize:11,background:previewPlatform===p.id?p.color+'15':'transparent',border:'none',borderBottom:`2px solid ${previewPlatform===p.id?p.color:'transparent'}`,color:previewPlatform===p.id?p.color:C.muted,cursor:'pointer',fontWeight:previewPlatform===p.id?600:400,whiteSpace:'nowrap',transition:'all .15s',borderRadius:'4px 4px 0 0'}}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:'11px 13px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{background:'#f8fafc',border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 13px',minHeight:120,boxShadow:'inset 0 1px 3px rgba(0,0,0,0.03)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:GREEN,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>G</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:C.text}}>Gopu Shrestha</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>{previewPlatformMeta[previewPlatform]?.label} · Just now</div></div>
              <div style={{fontSize:16}}>{previewPlatformMeta[previewPlatform]?.icon}</div>
            </div>
            <div style={{fontSize:12,color:'#334155',lineHeight:1.65,whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:165,overflow:'hidden'}}>
              {previewContent?(previewContent.length>280?previewContent.slice(0,280)+'…':previewContent):<span style={{color:'#cbd5e1',fontStyle:'italic',fontSize:11}}>Preview appears here as you write…</span>}
            </div>
            {previewContent&&<div style={{marginTop:10,display:'flex',gap:12,fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:8}}><span style={{cursor:'pointer'}}>👍 Like</span><span style={{cursor:'pointer'}}>💬 Comment</span><span style={{cursor:'pointer'}}>↗️ Share</span></div>}
          </div>
        </div>
        <div style={{borderBottom:`1px solid ${C.border}`}}>
          <div onClick={()=>setUpcomingOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',cursor:'pointer',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em'}}>Upcoming Posts</span><span style={{fontSize:10,padding:'1px 5px',borderRadius:7,background:'#f1f5f9',color:C.muted,fontWeight:500}}>{SCHEDULE_POSTS.length}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:6}}><button onClick={e=>{e.stopPropagation();setMainTab('calendar');}} style={{fontSize:10,color:C.blue,background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:0}}>View all</button><span style={{fontSize:9,color:C.muted,transform:upcomingOpen?'rotate(180deg)':'rotate(0)',transition:'transform .2s',display:'inline-block'}}>▼</span></div>
          </div>
          {upcomingOpen&&<div className='accordion-content' style={{padding:'0 12px 10px'}}>{SCHEDULE_POSTS.slice(0,5).map((p,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderRadius:9,marginBottom:4,background:'#f8fafc',border:`1px solid ${C.border}`,transition:'all .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='#f8fafc'}><div style={{width:3,height:32,borderRadius:2,background:p.color,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{p.text}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>May {p.day}</div></div></div>))}</div>}
        </div>
        <div style={{borderBottom:`1px solid ${C.border}`}}>
          <div onClick={()=>setViralIdeasOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',cursor:'pointer',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em'}}>💡 Viral Ideas</span>{viralIdeasSidebar.length>0&&<span style={{fontSize:10,padding:'1px 5px',borderRadius:7,background:C.purpleLight,color:C.purple,fontWeight:600}}>{viralIdeasSidebar.length}</span>}</div>
            <div style={{display:'flex',alignItems:'center',gap:6}}><button onClick={e=>{e.stopPropagation();setMainTab('ideas');}} style={{fontSize:10,color:C.purple,background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:0}}>View all</button><span style={{fontSize:9,color:C.muted,transform:viralIdeasOpen?'rotate(180deg)':'rotate(0)',transition:'transform .2s',display:'inline-block'}}>▼</span></div>
          </div>
          {viralIdeasOpen&&<div className='accordion-content' style={{padding:'0 12px 10px'}}>{viralIdeasSidebar.length?viralIdeasSidebar.map(idea=>(<div key={idea.id} onClick={()=>setMainTab('ideas')} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderRadius:9,cursor:'pointer',marginBottom:3,background:'#f8fafc',border:`1px solid ${C.border}`,transition:'all .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='#f8fafc'}><div style={{width:6,height:6,borderRadius:'50%',background:C.gold,flexShrink:0}}/><div style={{fontSize:12,color:C.text,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{idea.title}</div><span style={{fontSize:11,color:C.muted}}>›</span></div>)):<div style={{fontSize:11,color:C.muted,fontStyle:'italic',padding:'4px 2px'}}>Run research to generate ideas</div>}</div>}
        </div>
        <div style={{flex:1,display:'flex',flexDirection:'column'}}>
          <div onClick={()=>setApprovedOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',cursor:'pointer',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:'0.07em'}}>Approved Queue</span><span style={{fontSize:10,padding:'1px 5px',borderRadius:7,background:approvedQueue.length?C.purpleLight:'#f1f5f9',color:approvedQueue.length?C.purple:C.muted,fontWeight:600}}>{approvedQueue.length}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:6}}><button onClick={e=>{e.stopPropagation();setMainTab('ideas');}} style={{fontSize:10,color:C.purple,background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:0}}>Manage</button><span style={{fontSize:9,color:C.muted,transform:approvedOpen?'rotate(180deg)':'rotate(0)',transition:'transform .2s',display:'inline-block'}}>▼</span></div>
          </div>
          {approvedOpen&&<div className='accordion-content' style={{padding:'0 12px 14px',flex:1}}>
            {approvedQueue.length===0&&<div style={{fontSize:11,color:C.muted,fontStyle:'italic',padding:'4px 2px'}}>No approved posts yet</div>}
            {approvedQueue.slice(0,5).map((item,i)=>(<div key={item.id||i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',borderRadius:10,marginBottom:5,background:'#f8fafc',border:`1px solid ${C.border}`,borderLeft:`3px solid ${item.color||C.purple}`,transition:'all .12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.background='#f8fafc'}><span style={{fontSize:14,flexShrink:0,marginTop:1}}>{item.icon||'📝'}</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title||'Approved post'}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{item.platform} · Approved</div><div style={{fontSize:10,color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{(item.content||'').slice(0,48)}…</div></div></div>))}
            {approvedQueue.length>5&&<div style={{fontSize:11,color:C.muted,textAlign:'center',padding:'4px 0'}}>+{approvedQueue.length-5} more</div>}
            {approvedQueue.length>0&&<button onClick={()=>setMainTab('ideas')} style={{width:'100%',marginTop:8,padding:'8px 0',fontSize:12,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:9,cursor:'pointer',boxShadow:'0 2px 6px rgba(124,58,237,0.25)'}}>📥 Export & Publish</button>}
          </div>}
        </div>
      </div>
    </div>
  );
}
// Fri May 22 20:14:54 CDT 2026
