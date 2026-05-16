import { useState } from "react";
import SocialHub from "./SocialHub";

const BOOKS = [
  { key:"integrity_leadership", title:"Unlocking Integrity-Centered Leadership (Revised)", amazon:"https://www.amazon.com/STRATEGIC-HONESTY-Integrity-Centered-Leadership-compromising-ebook/dp/B0GS425K28/", keywords:["integrity-centered","true north","bedrock","sand leadership","reputation","trust","character","ethical","cutthroat","allies","adversaries"], quote:"Be Good. Do Good. Do Well. — the framework that outlasts every shortcut." },
  { key:"strategic_honesty_2nd", title:"Strategic Honesty: How to Be Good & Rich (2nd Ed.)", amazon:"https://www.amazon.com/Strategic-Honesty-How-Good-Rich-ebook/dp/B093XS7XPV", keywords:["millionaire","rich","wealth","fortune","poverty","nice guys","shortcuts","hustle culture","reputation currency","house of cards"], quote:"You don't have to choose between being good and doing well." },
  { key:"strategic_honesty_1st", title:"Strategic Honesty: How to Be Good & Rich (1st Ed.)", amazon:"https://www.amazon.com/Strategic-Honesty-Good-Rich-First/dp/B096M1NDCF/", keywords:["inherited debt","dirt floors","nepal","luck","freedom","fastest path","disadvantage"], quote:"Your reputation is your most bankable asset." },
  { key:"you_still_matter", title:"You Still Matter", amazon:"https://www.amazon.com/You-Still-Matter-Relevant-Starting-ebook/dp/B0GS73941K/", keywords:["ai replacing","human edge","still matter","workplace anxiety","skills dying","ai era","future of work"], quote:"The real battle is not human vs. machine. It is integrity vs. exploitation." },
  { key:"playbook", title:"The Strategic Honesty Playbook", amazon:"https://www.amazon.com/Strategic-Honesty-Good-Rich-First/dp/B096M1NDCF/", keywords:["ai project","ai initiative","ai strategy","ai ethics","fake ai","agile","sprint","retrospective","incomplete work","transformation"], quote:"AI won't replace your craft — it exposes organizational lies." },
];

const TAGS = "#StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell #GopuShrestha #SuccessMindset #Motivation #LeadershipCoach #PersonalGrowth #IntegrityCenteredLeadership";
const COLORS = { navy:"#1B2A4A", gold:"#C8963E", teal:"#1D9E75", bg:"#0f1923", card:"#152035", dim:"#6B7FA8" };

function matchBook(title, desc) {
  const text = (title + " " + desc).toLowerCase();
  for (const book of BOOKS) {
    for (const kw of book.keywords) { if (text.includes(kw.toLowerCase())) return book; }
  }
  return BOOKS[0];
}

function getThumb(url) {
  url = String(url||"").trim();
  let id = null;
  if (url.includes("v=")) id = url.split("v=")[1].split("&")[0];
  else if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1].split("?")[0];
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "";
}

function getScheduleDates(n, start) {
  const dates = []; let tuesday = new Date(start);
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) dates.push(new Date(tuesday));
    else { dates.push(new Date(tuesday.getTime() + 3*86400000)); tuesday = new Date(tuesday.getTime() + 7*86400000); }
  }
  return dates;
}

function fmtDate(d, hour, min=0) {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), dy=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dy} ${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
}

function makeIG(title,desc,url,book){const hook=desc.split(".")[0].trim().slice(0,120);return `${title}. 🎯\n\n${hook}.\n\nSave this if it hits home. 💛\n\nWatch the full video — link in bio.\n${url}\n\n📖 Go deeper: "${book.title}" on Amazon\n${book.amazon}\n\n${book.quote}\n\n${TAGS}`;}
function makeFB(title,desc,url,book){const lines=desc.split("\n").filter(l=>l.trim().length>20);const story=lines[0]||desc.slice(0,200);return `I grew up on dirt floors in Nepal. No shortcuts. No safety net.\n\nWhat I learned shaped everything I've built since.\n\n${story}\n\nWatch here: ${url}\n\n📖 "${book.title}" — available on Amazon:\n${book.amazon}\n\n"${book.quote}"\n\nHave you ever faced this crossroads? Drop your story below 👇\n\n${TAGS}`;}
function makeTT(title,desc,url,book){const clean=title.split("(")[0].trim().replace(/\.$/,"");return `${clean}. 🎯\n\nMost people get this completely wrong.\n\nI learned this growing up in Nepal with nothing — and it changed everything.\n\nFull story on YouTube — link in bio. 🔗\n\n📖 "${book.title}" on Amazon: ${book.amazon}\n\n${TAGS}`;}
function makeLI(title,desc,url,book){return `Integrity isn't a soft skill. It's the hardest competitive edge in business.\n\n${title.split("(")[0].trim()}\n\nI've worked inside Fortune 100 organizations long enough to see both collapse and thrive. The difference is always the same thing.\n\nSand leaders optimize for today.\nBedrock leaders optimize for trust.\n\nAnd trust? It compounds like interest.\n\nI grew up in rural Nepal. The one thing I never gave up was my word. Turns out — that was everything.\n\n🎥 Watch: ${url}\n\n📖 "${book.title}" — Amazon: ${book.amazon}\n\n${TAGS}`;}

function toCSV(rows) {
  const headers = ["Text","Image URL","Tags","Posting Time"];
  const escape = v => `"${String(v||"").replace(/"/g,'""')}"`;
  return [headers.map(escape).join(","), ...rows.map(r=>headers.map(h=>escape(r[h])).join(","))].join("\n");
}

function downloadCSV(content, filename) {
  const blob = new Blob(["\uFEFF"+content], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function parseFile(text) {
  const lines = text.split("\n").filter(l=>l.trim());
  if (lines.length < 2) return [];
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delim).map(h=>h.trim().replace(/"/g,""));
  return lines.slice(1).map(line => {
    const vals = line.split(delim).map(v=>v.trim().replace(/^"|"$/g,""));
    const obj = {}; headers.forEach((h,i)=>(obj[h]=vals[i]||"")); return obj;
  }).filter(r=>r.Title||r.title||r.URL||r.Url);
}

function SchedulerTool() {
  const [step, setStep] = useState(0);
  const [videos, setVideos] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState("2026-05-19");
  const [platforms, setPlatforms] = useState(["Instagram","Facebook","TikTok","LinkedIn"]);
  const [fillGaps, setFillGaps] = useState(true);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return; setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseFile(ev.target.result);
      if (rows.length === 0) { setError("Could not read file. Ensure it has Title, description, Url columns."); return; }
      setVideos(rows.map(r=>({Title:r.Title||r.title||"",description:r.description||r.Description||"",Url:r.Url||r.URL||r.url||""})));
      setStep(1);
    };
    reader.readAsText(file,"utf-8");
  };

  const generate = async () => {
    setLoading(true); setProgress(0);
    const start = new Date(startDate);
    const dates = getScheduleDates(videos.length, start);
    const results = [];
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i]; const book = matchBook(v.Title,v.description); const thumb = getThumb(v.Url); const d = dates[i];
      const posts = {};
      if(platforms.includes("Instagram")) posts.instagram={text:makeIG(v.Title,v.description,v.Url,book),image:thumb,time:fmtDate(d,11)};
      if(platforms.includes("Facebook")) posts.facebook={text:makeFB(v.Title,v.description,v.Url,book),image:thumb,time:fmtDate(d,13)};
      if(platforms.includes("TikTok")) posts.tiktok={text:makeTT(v.Title,v.description,v.Url,book),image:thumb,time:fmtDate(d,19)};
      if(platforms.includes("LinkedIn")) posts.linkedin={text:makeLI(v.Title,v.description,v.Url,book),image:thumb,time:fmtDate(d,8)};
      const mon=new Date(d.getTime()-86400000), wed=new Date(d.getTime()+86400000), thu=new Date(d.getTime()+2*86400000);
      const gaps = fillGaps ? {
        monday:{text:makeLI(v.Title,v.description,v.Url,book),image:thumb,time:fmtDate(mon,8)},
        wednesday:{text:`"${book.quote}"\n\n— Gopu Shrestha\n\n${v.Title.split("(")[0].trim()}.\n\nWatch → link in bio.\n\n${TAGS}`,image:"",time:fmtDate(wed,10)},
        thursday:{text:`📖 From "${book.title}":\n\n"${book.quote}"\n\nRelated: ${v.Title.split("(")[0].trim()}.\n\n→ ${book.amazon}\n\n${TAGS}`,image:"",time:fmtDate(thu,12)},
      } : {};
      results.push({...v,book,thumb,mainDate:d,posts,gaps});
      setProgress(Math.round(((i+1)/videos.length)*100));
      await new Promise(r=>setTimeout(r,20));
    }
    setGenerated(results); setLoading(false); setStep(2);
  };

  const downloadAll = () => {
    const pmap = {instagram:11,facebook:13,tiktok:19,linkedin:8};
    ["instagram","facebook","tiktok","linkedin"].forEach(p => {
      if (!platforms.includes(p.charAt(0).toUpperCase()+p.slice(1))) return;
      const rows = generated.map(v=>v.posts[p]).filter(Boolean);
      for (let b=0;b<rows.length;b+=10) {
        const batch=rows.slice(b,b+10), num=Math.floor(b/10)+1;
        downloadCSV(toCSV(batch.map(r=>({"Text":r.text,"Image URL":r.image,"Tags":"","Posting Time":r.time}))),
          `Buffer_${p.charAt(0).toUpperCase()+p.slice(1)}_Batch${String(num).padStart(2,"0")}_Posts_${b+1}-${b+batch.length}.csv`);
      }
    });
    if (fillGaps) {
      ["monday","wednesday","thursday"].forEach((day,di) => {
        const label = ["LinkedIn_Monday","AllPlatforms_Wednesday_Quote","AllPlatforms_Thursday_BookQuote"][di];
        const rows = generated.map(v=>v.gaps[day]).filter(Boolean);
        for (let b=0;b<rows.length;b+=10) {
          const batch=rows.slice(b,b+10), num=Math.floor(b/10)+1;
          downloadCSV(toCSV(batch.map(r=>({"Text":r.text,"Image URL":r.image||"","Tags":"","Posting Time":r.time}))),
            `Buffer_${label}_Batch${String(num).padStart(2,"0")}.csv`);
        }
      });
    }
    setStep(3);
  };

  const togglePlatform = (p) => setPlatforms(prev=>prev.includes(p)?prev.filter(x=>x!==p):[...prev,p]);
  const totalFiles = Math.ceil(Math.max(videos.length,1)/10)*platforms.length + (fillGaps?Math.ceil(Math.max(videos.length,1)/10)*3:0);

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:COLORS.bg,borderRadius:16,overflow:"hidden",color:"#fff"}}>
      <div style={{background:`linear-gradient(135deg,${COLORS.navy},${COLORS.bg})`,borderBottom:`1px solid ${COLORS.gold}33`,padding:"20px 28px 16px"}}>
        <div style={{fontSize:11,color:COLORS.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:500,marginBottom:4}}>CSV Post Generator</div>
        <div style={{fontSize:16,fontFamily:"Georgia,serif"}}>Upload YouTube data → Generate posts → Download Buffer CSVs</div>
      </div>
      <div style={{display:"flex",background:"#0a1018",borderBottom:"1px solid #ffffff0d",padding:"0 28px"}}>
        {["⬆ Upload","⚙ Configure","👁 Review","✓ Done"].map((label,i)=>(
          <div key={i} style={{padding:"12px 20px",fontSize:13,fontWeight:500,color:step===i?COLORS.gold:"#6B7FA8",borderBottom:`2px solid ${step===i?COLORS.gold:"transparent"}`,opacity:step<i?0.4:1}}>{label}</div>
        ))}
      </div>
      <div style={{padding:"24px 28px"}}>

        {step===0 && (
          <div>
            <label htmlFor="video-file" style={{border:`2px dashed ${COLORS.gold}44`,borderRadius:12,padding:"48px 32px",textAlign:"center",cursor:"pointer",display:"block",background:"#0a1018",marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:12}}>📂</div>
              <div style={{fontSize:15,color:COLORS.gold,marginBottom:4}}>Click to upload your YouTube export file</div>
              <div style={{fontSize:12,color:COLORS.dim}}>CSV or TSV with Title, description, Url columns</div>
              <input type="file" id="video-file" accept=".csv,.tsv,.txt" style={{display:"none"}} onChange={handleFile}/>
            </label>
            {error && <div style={{padding:"12px 16px",background:"#3A1515",border:"1px solid #E24B4A44",borderRadius:8,fontSize:13,color:"#F09595"}}>{error}</div>}
          </div>
        )}

        {step===1 && (
          <div>
            <div style={{background:COLORS.card,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${COLORS.teal}44`,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>✅</span>
              <div><div style={{color:COLORS.teal,fontSize:14}}>{videos.length} videos loaded</div><div style={{fontSize:12,color:COLORS.dim}}>Configure settings and generate</div></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
              <div style={{background:COLORS.card,borderRadius:10,padding:16}}>
                <div style={{fontSize:12,color:COLORS.gold,marginBottom:10,fontWeight:500}}>📅 Start date</div>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:"#0a1018",border:"1px solid #334",borderRadius:8,color:"#fff",padding:"8px 12px",fontSize:13,fontFamily:"sans-serif"}}/>
              </div>
              <div style={{background:COLORS.card,borderRadius:10,padding:16}}>
                <div style={{fontSize:12,color:COLORS.gold,marginBottom:10,fontWeight:500}}>📱 Platforms</div>
                {["Instagram","Facebook","TikTok","LinkedIn"].map(p=>(
                  <label key={p} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,cursor:"pointer"}}>
                    <div onClick={()=>togglePlatform(p)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${platforms.includes(p)?COLORS.gold:"#445"}`,background:platforms.includes(p)?COLORS.gold:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,cursor:"pointer"}}>{platforms.includes(p)&&"✓"}</div>
                    <span style={{fontSize:13,color:platforms.includes(p)?"#fff":"#778"}}>{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{background:COLORS.card,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${fillGaps?COLORS.gold+"33":"#ffffff0d"}`}}>
              <label style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                <div onClick={()=>setFillGaps(f=>!f)} style={{width:44,height:24,borderRadius:12,background:fillGaps?COLORS.gold:"#334",position:"relative",cursor:"pointer",transition:"background .2s"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:fillGaps?23:3,transition:"left .2s"}}/>
                </div>
                <div>
                  <div style={{fontSize:13,color:fillGaps?COLORS.gold:"#778",fontWeight:500}}>Fill gap days (Mon, Wed, Thu)</div>
                  <div style={{fontSize:12,color:COLORS.dim,marginTop:2}}>+{videos.length*3} extra posts — LinkedIn, viral quotes, book CTAs</div>
                </div>
              </label>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[{l:"Videos",v:videos.length},{l:"Platforms",v:platforms.length},{l:"Total posts",v:videos.length*platforms.length+(fillGaps?videos.length*3:0)},{l:"CSV files",v:totalFiles}].map((s,i)=>(
                <div key={i} style={{background:"#0a1018",borderRadius:8,padding:"12px 16px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontFamily:"Georgia,serif",color:COLORS.gold}}>{s.v}</div>
                  <div style={{fontSize:11,color:COLORS.dim,marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            {loading ? (
              <div style={{background:COLORS.card,borderRadius:10,padding:20,textAlign:"center"}}>
                <div style={{fontSize:13,color:COLORS.gold,marginBottom:12}}>Generating posts for {videos.length} videos...</div>
                <div style={{background:"#0a1018",borderRadius:6,height:8,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",background:COLORS.gold,width:`${progress}%`,transition:"width .3s",borderRadius:6}}/></div>
                <div style={{fontSize:12,color:COLORS.dim}}>{progress}%</div>
              </div>
            ) : (
              <button onClick={generate} style={{width:"100%",padding:"14px 24px",background:COLORS.gold,border:"none",borderRadius:10,fontSize:15,fontWeight:"bold",color:COLORS.bg,cursor:"pointer",fontFamily:"sans-serif"}}>⚡ Generate All Posts</button>
            )}
          </div>
        )}

        {step===2 && (
          <div>
            <div style={{background:COLORS.card,borderRadius:10,padding:16,marginBottom:16,border:`1px solid ${COLORS.teal}44`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28}}>✅</span><div style={{color:COLORS.teal,fontSize:14}}>{generated.length} videos · {totalFiles} CSV files ready</div></div>
              <button onClick={downloadAll} style={{padding:"10px 20px",background:COLORS.gold,border:"none",borderRadius:8,fontSize:13,fontWeight:"bold",color:COLORS.bg,cursor:"pointer",fontFamily:"sans-serif"}}>⬇ Download All</button>
            </div>
            {generated.slice(0,3).map((v,i)=>(
              <div key={i} style={{background:COLORS.card,borderRadius:10,padding:16,marginBottom:10,border:"1px solid #ffffff0d"}}>
                <div style={{display:"flex",gap:10,marginBottom:10,alignItems:"center"}}>
                  {v.thumb&&<img src={v.thumb} alt="" style={{width:72,height:40,objectFit:"cover",borderRadius:6,flexShrink:0}}/>}
                  <div><div style={{fontSize:13,color:"#fff",marginBottom:2}}>{v.Title}</div><div style={{fontSize:11,color:COLORS.teal}}>📖 {v.book.title}</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {v.posts.instagram&&<div style={{background:"#0a1018",borderRadius:6,padding:10}}><div style={{fontSize:10,color:"#D85A30",marginBottom:4,fontWeight:500}}>📸 Instagram</div><div style={{fontSize:11,color:"#aaa",lineHeight:1.5,maxHeight:60,overflow:"hidden"}}>{v.posts.instagram.text.slice(0,150)}...</div></div>}
                  {v.posts.linkedin&&<div style={{background:"#0a1018",borderRadius:6,padding:10}}><div style={{fontSize:10,color:"#378ADD",marginBottom:4,fontWeight:500}}>💼 LinkedIn</div><div style={{fontSize:11,color:"#aaa",lineHeight:1.5,maxHeight:60,overflow:"hidden"}}>{v.posts.linkedin.text.slice(0,150)}...</div></div>}
                </div>
              </div>
            ))}
            <button onClick={downloadAll} style={{width:"100%",padding:"14px 24px",background:COLORS.gold,border:"none",borderRadius:10,fontSize:15,fontWeight:"bold",color:COLORS.bg,cursor:"pointer",fontFamily:"sans-serif",marginTop:8}}>⬇ Download All {totalFiles} CSV Files</button>
          </div>
        )}

        {step===3 && (
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:56,marginBottom:12}}>🎉</div>
            <div style={{fontSize:20,color:COLORS.gold,marginBottom:8}}>All files downloaded!</div>
            <div style={{fontSize:13,color:COLORS.dim,marginBottom:24,lineHeight:1.8}}>Upload each batch to Buffer:<br/>Publish → Channel → ⚙️ → General → Bulk Upload → Add to Queue</div>
            <button onClick={()=>{setStep(0);setVideos([]);setGenerated([]);}} style={{padding:"10px 28px",background:"transparent",border:`1px solid ${COLORS.gold}`,borderRadius:8,fontSize:13,color:COLORS.gold,cursor:"pointer",fontFamily:"sans-serif"}}>← Start over</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("hub");
  return (
    <div style={{minHeight:"100vh",background:"#0f1923",padding:"0"}}>
      <div style={{background:"#0a1018",borderBottom:"1px solid #C8963E22",padding:"12px 28px",display:"flex",gap:0,alignItems:"center"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:16,color:"#C8963E",marginRight:32}}>⚡ Strategic Honesty</div>
        {[["hub","🔗 Social Hub"],["scheduler","📂 CSV Generator"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{padding:"8px 20px",background:view===v?"#C8963E22":"transparent",border:`1px solid ${view===v?"#C8963E44":"transparent"}`,borderRadius:8,color:view===v?"#C8963E":"#6B7FA8",fontSize:13,cursor:"pointer",fontFamily:"sans-serif",marginRight:8,fontWeight:view===v?500:400}}>
            {l}
          </button>
        ))}
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:24}}>
        {view==="hub" ? <SocialHub/> : <SchedulerTool/>}
      </div>
    </div>
  );
}
