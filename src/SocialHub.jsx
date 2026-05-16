import { useState } from "react";

const PLATFORMS = [
  {id:'instagram',name:'Instagram',icon:'📸',sub:'Business or Creator',color:'#E1306C',connected:true,group:'social'},
  {id:'facebook',name:'Facebook',icon:'👥',sub:'Page or Group',color:'#1877F2',connected:false,group:'social'},
  {id:'tiktok',name:'TikTok',icon:'🎵',sub:'Creator account',color:'#010101',connected:true,group:'social'},
  {id:'linkedin',name:'LinkedIn',icon:'💼',sub:'Page or Profile',color:'#0A66C2',connected:false,group:'social'},
  {id:'twitter',name:'X / Twitter',icon:'🐦',sub:'Profile',color:'#000000',connected:false,group:'social'},
  {id:'threads',name:'Threads',icon:'🧵',sub:'Profile',color:'#101010',connected:false,group:'social'},
  {id:'bluesky',name:'Bluesky',icon:'🦋',sub:'Profile',color:'#0085FF',connected:false,group:'social'},
  {id:'pinterest',name:'Pinterest',icon:'📌',sub:'Business account',color:'#E60023',connected:false,group:'social'},
  {id:'youtube',name:'YouTube',icon:'▶️',sub:'Channel',color:'#FF0000',connected:true,group:'social'},
  {id:'mastodon',name:'Mastodon',icon:'🐘',sub:'Profile',color:'#6364FF',connected:false,group:'social'},
  {id:'reddit',name:'Reddit',icon:'🔴',sub:'Profile or Subreddit',color:'#FF4500',connected:false,group:'social'},
  {id:'snapchat',name:'Snapchat',icon:'👻',sub:'Creator account',color:'#FFFC00',connected:false,group:'social'},
  {id:'substack',name:'Substack',icon:'📰',sub:'Newsletter',color:'#FF6719',connected:false,group:'publish'},
  {id:'medium',name:'Medium',icon:'✍️',sub:'Publication',color:'#000000',connected:false,group:'publish'},
  {id:'googlebiz',name:'Google Business',icon:'🏢',sub:'Business Profile',color:'#4285F4',connected:false,group:'publish'},
  {id:'mailmeteor',name:'Mailmeteor',icon:'📧',sub:'Email campaigns',color:'#1D9E75',connected:false,group:'publish'},
  {id:'wordpress',name:'WordPress',icon:'🌐',sub:'Blog or site',color:'#21759B',connected:false,group:'publish'},
  {id:'amazon',name:'Amazon Author',icon:'📚',sub:'Author Central',color:'#FF9900',connected:false,group:'publish'},
];

const QUOTES = {
  integrity:"Integrity isn't a soft skill. It's the hardest competitive edge in business.\n\nSand leaders optimize for today.\nBedrock leaders optimize for trust.\n\nAnd trust? It compounds like interest.\n\nI grew up in rural Nepal. The one thing I never gave up was my word. Turns out — that was everything.\n\n🎥 Watch: https://youtube.com/@StrategicHonesty\n\n#StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell",
  reputation:"Your reputation is built in years. Destroyed in one shortcut.\n\nEvery honest call you made is still working for you right now.\n\n📖 Find Your True North of Integrity: https://www.amazon.com/STRATEGIC-HONESTY-PLAYBOOK-Survive-Without/dp/B0GRN6WZGW\n\n#StrategicHonesty #Reputation #Leadership",
  shortcuts:"Every shortcut is a loan — and the interest is your integrity.\n\nI've seen leaders collapse who couldn't explain why.\n\nSave this for the next time you feel pressure to cut corners.\n\n#StrategicHonesty #Leadership #BeGoodDoGoodDoWell",
  nepal:"I grew up on dirt floors in Nepal.\n\nNo shortcuts. No safety net. No plan B.\n\nWhat I learned is the one thing no one can take from you:\nYour word. Your integrity. Your True North.\n\n#StrategicHonesty #Nepal #Leadership",
  ai:"The real battle is not human vs. machine.\nIt is integrity vs. exploitation.\n\nAI won't replace your craft — it exposes organizational lies.\n\n📖 You Still Matter: https://www.amazon.com/You-Still-Matter-Relevant-Starting-ebook/dp/B0GS73941K/\n\n#StrategicHonesty #AI #HumanEdge",
  trust:"Trust compounds like interest.\n\nEvery honest call you make today is an investment.\nEvery shortcut is a withdrawal.\n\nThe math always catches up.\n\n#StrategicHonesty #Trust #Leadership #BeGoodDoGoodDoWell"
};

const C = { navy:"#1B2A4A", gold:"#C8963E", teal:"#1D9E75", bg:"#0f1923", card:"#152035", dim:"#6B7FA8" };

export default function SocialHub() {
  const [tab, setTab] = useState("connect");
  const [connected, setConnected] = useState(new Set(PLATFORMS.filter(p=>p.connected).map(p=>p.id)));
  const [testSel, setTestSel] = useState(new Set(["instagram","tiktok"]));
  const [testContent, setTestContent] = useState("");
  const [testImage, setTestImage] = useState("");
  const [quickVideo, setQuickVideo] = useState("");
  const [logs, setLogs] = useState([{type:"info",msg:"Ready to send test posts to connected channels..."}]);
  const [uploadLogs, setUploadLogs] = useState([
    {type:"info",msg:"Upload guide: Gear ⚙️ → General → Bulk Upload → Upload File → Add to Queue"},
    {type:"info",msg:"Remember: Tags column must be blank. Hashtags go in the Text body."},
    {type:"info",msg:"Free plan: max 10 posts per upload per channel."},
  ]);

  const addLog = (logs, setLogs, type, msg) => setLogs(prev => [...prev, {type, msg}]);

  const toggleConnect = (id) => {
    setConnected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    addLog(logs, setLogs, "info", `${id} ${connected.has(id) ? "disconnected" : "connected"}`);
  };

  const toggleTestSel = (id) => setTestSel(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const sendTest = () => {
    if (!testContent.trim()) { addLog(logs, setLogs, "err", "Please write a test post first."); return; }
    if (testSel.size === 0) { addLog(logs, setLogs, "err", "Select at least one platform."); return; }
    addLog(logs, setLogs, "info", "Sending test post...");
    [...testSel].forEach((p, i) => setTimeout(() => addLog(logs, setLogs, "ok", `✓ Test post sent to ${p}`), (i+1)*700));
    setTimeout(() => addLog(logs, setLogs, "info", "Connect Buffer API key to enable live posting"), testSel.size*700+300);
  };

  const generateQuick = () => {
    if (!quickVideo) { addLog(logs, setLogs, "err", "Select a video topic first."); return; }
    setTestContent(QUOTES[quickVideo] || "");
    setTab("test");
    addLog(logs, setLogs, "ok", "Post generated — review and send!");
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    addLog(uploadLogs, setUploadLogs, "info", `Reading ${file.name}...`);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").filter(l=>l.trim()).length - 1;
      addLog(uploadLogs, setUploadLogs, "ok", `✓ ${file.name} — ${lines} posts loaded`);
      addLog(uploadLogs, setUploadLogs, "info", "Go to Buffer → Channel → ⚙️ → General → Bulk Upload to import");
    };
    reader.readAsText(file);
  };

  const platformGrid = (group) => PLATFORMS.filter(p=>p.group===group).map(p => (
    <div key={p.id} onClick={() => toggleConnect(p.id)} style={{
      background: connected.has(p.id) ? "#0f2a1e" : C.card,
      border: `1px solid ${connected.has(p.id) ? C.teal+"66" : "#ffffff0d"}`,
      borderRadius: 12, padding: "16px 12px", textAlign: "center", cursor: "pointer",
      transition: "all .25s", position: "relative"
    }}>
      {connected.has(p.id) && <div style={{position:"absolute",top:8,right:8,width:18,height:18,background:C.teal,borderRadius:"50%",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>✓</div>}
      <div style={{width:44,height:44,borderRadius:12,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:p.color+"22"}}>{p.icon}</div>
      <div style={{fontSize:13,fontWeight:500,color:"#fff",marginBottom:2}}>{p.name}</div>
      <div style={{fontSize:11,color:C.dim,marginBottom:10}}>{p.sub}</div>
      <div style={{padding:"4px 14px",borderRadius:20,fontSize:11,fontWeight:500,display:"inline-block",background:connected.has(p.id)?C.teal+"22":C.gold+"22",color:connected.has(p.id)?C.teal:C.gold,border:`1px solid ${connected.has(p.id)?C.teal+"44":C.gold+"44"}`}}>
        {connected.has(p.id)?"Connected":"Connect"}
      </div>
    </div>
  ));

  const TABS = ["connect","test","upload","schedule"];
  const TLABELS = ["🔗 Connect","🧪 Test Post","⬆ Upload CSV","📅 Schedule"];

  return (
    <div style={{background:C.bg,borderRadius:16,overflow:"hidden",fontFamily:"'DM Sans',sans-serif",color:"#fff",minHeight:600}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,${C.bg} 100%)`,borderBottom:`1px solid ${C.gold}33`,padding:"20px 28px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{width:32,height:32,background:C.gold,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <div>
            <div style={{fontFamily:"Georgia,serif",fontSize:17,letterSpacing:.3}}>Strategic Honesty</div>
            <div style={{fontSize:11,color:C.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:500}}>Social Media Hub</div>
          </div>
        </div>
        <div style={{fontSize:12,color:C.dim}}>Connect · Create · Schedule · Publish — Be Good. Do Good. Do Well.</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"#0a1018",borderBottom:"1px solid #ffffff0d",padding:"0 28px",overflowX:"auto"}}>
        {TABS.map((t,i) => (
          <div key={t} onClick={()=>setTab(t)} style={{padding:"12px 20px",fontSize:13,fontWeight:500,cursor:"pointer",borderBottom:`2px solid ${tab===t?C.gold:"transparent"}`,color:tab===t?C.gold:"#6B7FA8",transition:"all .2s",whiteSpace:"nowrap"}}>
            {TLABELS[i]}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{padding:"24px 28px"}}>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
          {[
            {num:connected.size,label:"Connected",color:C.gold},
            {num:18,label:"Available",color:"#fff"},
            {num:393,label:"Posts Scheduled",color:C.teal},
            {num:"Dec 29",label:"Content Until",color:"#fff"},
          ].map((s,i) => (
            <div key={i} style={{background:C.card,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:22,color:s.color}}>{s.num}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TAB: CONNECT */}
        {tab==="connect" && (
          <div>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.gold,fontWeight:500,marginBottom:14}}>Social platforms</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>{platformGrid("social")}</div>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.gold,fontWeight:500,marginBottom:14}}>Publishing platforms</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{platformGrid("publish")}</div>
          </div>
        )}

        {/* TAB: TEST */}
        {tab==="test" && (
          <div>
            <div style={{background:C.card,borderRadius:12,border:"1px solid #ffffff0d",padding:20,marginBottom:16}}>
              <div style={{fontSize:12,color:C.dim,marginBottom:8}}>Write your test post</div>
              <textarea value={testContent} onChange={e=>setTestContent(e.target.value)} rows={6}
                placeholder="Integrity isn't a soft skill. It's the hardest competitive edge in business..."
                style={{width:"100%",background:"#0a1018",border:"1px solid #334",borderRadius:8,color:"#fff",padding:"12px",fontSize:13,fontFamily:"'DM Sans',sans-serif",resize:"none",lineHeight:1.6,outline:"none",boxSizing:"border-box"}} />
              <div style={{fontSize:12,color:C.dim,margin:"12px 0 8px"}}>Select platforms</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                {PLATFORMS.filter(p=>connected.has(p.id)).map(p => (
                  <button key={p.id} onClick={()=>toggleTestSel(p.id)} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${testSel.has(p.id)?"#C8963E66":"#334"}`,color:testSel.has(p.id)?C.gold:"#6B7FA8",background:testSel.has(p.id)?"#C8963E22":"transparent",fontFamily:"'DM Sans',sans-serif"}}>
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
              <div style={{fontSize:12,color:C.dim,marginBottom:6}}>Image URL (optional)</div>
              <input value={testImage} onChange={e=>setTestImage(e.target.value)} placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                style={{width:"100%",background:"#0a1018",border:"1px solid #334",borderRadius:8,color:"#fff",padding:"10px 12px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:14}} />
              <div style={{display:"flex",gap:10}}>
                <button onClick={sendTest} style={{padding:"9px 20px",background:C.gold,border:"none",borderRadius:8,fontSize:13,fontWeight:500,color:C.bg,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>⚡ Send Test</button>
                <button onClick={()=>{setTestContent("");setTestImage("");}} style={{padding:"9px 20px",background:"#1e2f4a",border:"1px solid #334",borderRadius:8,fontSize:13,color:"#aaa",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✕ Clear</button>
              </div>
              <div style={{background:"#0a1018",borderRadius:8,padding:12,fontFamily:"monospace",fontSize:12,maxHeight:120,overflowY:"auto",marginTop:12,lineHeight:1.8}}>
                {logs.map((l,i) => <div key={i} style={{color:l.type==="ok"?C.teal:l.type==="err"?"#E24B4A":C.gold}}>» {l.msg}</div>)}
              </div>
            </div>
            <div style={{background:C.card,borderRadius:12,border:"1px solid #ffffff0d",padding:20}}>
              <div style={{fontSize:12,color:C.dim,marginBottom:10}}>Quick quote generator</div>
              <select value={quickVideo} onChange={e=>setQuickVideo(e.target.value)}
                style={{width:"100%",background:"#0a1018",border:"1px solid #334",borderRadius:8,color:"#fff",padding:"10px 12px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:12}}>
                <option value="">Select a video topic...</option>
                <option value="integrity">Why Integrity-Centered Leadership Wins</option>
                <option value="reputation">Your Reputation: The Only Asset That Can't Be Taken Away</option>
                <option value="shortcuts">Every Shortcut is a Loan</option>
                <option value="nepal">From Dirt Floors to Success</option>
                <option value="ai">Is AI Replacing Your Value?</option>
                <option value="trust">The Silent Engine of Success: Trust</option>
              </select>
              <button onClick={generateQuick} style={{padding:"9px 20px",background:C.gold,border:"none",borderRadius:8,fontSize:13,fontWeight:500,color:C.bg,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✨ Generate Post</button>
            </div>
          </div>
        )}

        {/* TAB: UPLOAD */}
        {tab==="upload" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <div>
                <div style={{fontSize:12,color:C.dim,marginBottom:8}}>Target channel</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {PLATFORMS.filter(p=>connected.has(p.id)).map(p => (
                    <button key={p.id} style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${C.gold}44`,color:C.gold,background:`${C.gold}11`,fontFamily:"'DM Sans',sans-serif"}}>{p.icon} {p.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:12,color:C.dim,marginBottom:8}}>CSV type</div>
                <select style={{width:"100%",background:"#0a1018",border:"1px solid #334",borderRadius:8,color:"#fff",padding:"10px 12px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                  <option>Main posts (Tue + Fri)</option>
                  <option>Monday LinkedIn gap-fill</option>
                  <option>Wednesday viral quotes</option>
                  <option>Thursday book quotes</option>
                </select>
              </div>
            </div>
            <label htmlFor="csv-file" style={{border:`2px dashed ${C.gold}44`,borderRadius:12,padding:"32px",textAlign:"center",cursor:"pointer",display:"block",background:"#0a1018"}}>
              <div style={{fontSize:32,marginBottom:8}}>📂</div>
              <div style={{fontSize:14,color:C.gold,marginBottom:4}}>Click to upload your Buffer CSV batch file</div>
              <div style={{fontSize:12,color:C.dim}}>Text, Image URL, Tags, Posting Time · UTF-8 BOM · Max 10 posts (free plan)</div>
              <input type="file" id="csv-file" accept=".csv" style={{display:"none"}} onChange={handleUpload} />
            </label>
            <div style={{background:"#0a1018",borderRadius:8,padding:12,fontFamily:"monospace",fontSize:12,maxHeight:120,overflowY:"auto",marginTop:12,lineHeight:1.8}}>
              {uploadLogs.map((l,i) => <div key={i} style={{color:l.type==="ok"?C.teal:l.type==="err"?"#E24B4A":C.gold}}>» {l.msg}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:20}}>
              {[
                {status:"✅",label:"Batch 01 — Uploaded",dates:"Posts 1–10 · May 19 – Jun 19",gold:true},
                {status:"⏳",label:"Batch 02 — Upload Jun 19–20",dates:"Posts 11–20 · Jun 23 – Jul 24",gold:false},
                {status:"⏳",label:"Batch 03 — Upload Jul 24–25",dates:"Posts 21–30 · Jul 28 – Aug 28",gold:false},
                {status:"⏳",label:"Batch 04 — Upload Aug 28–29",dates:"Posts 31–40 · Sep 1 – Oct 2",gold:false},
              ].map((b,i) => (
                <div key={i} style={{background:C.card,borderRadius:10,padding:"14px 16px",border:`1px solid ${b.gold?C.gold+"33":"#ffffff0d"}`}}>
                  <div style={{fontSize:12,color:b.gold?C.gold:"#fff",fontWeight:500,marginBottom:4}}>{b.status} {b.label}</div>
                  <div style={{fontSize:12,color:C.dim}}>{b.dates}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SCHEDULE */}
        {tab==="schedule" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
              {[{n:66,l:"Videos",c:C.gold},{n:65,l:"Tue+Fri",c:C.teal},{n:66,l:"Mon LinkedIn",c:"#378ADD"},{n:66,l:"Wed Quotes",c:"#EF9F27"},{n:66,l:"Thu Book CTAs",c:"#D85A30"}].map((s,i) => (
                <div key={i} style={{background:C.card,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
                  <div style={{fontFamily:"Georgia,serif",fontSize:22,color:s.c}}>{s.n}</div>
                  <div style={{fontSize:11,color:C.dim,marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.gold,fontWeight:500,marginBottom:14}}>This week's posts</div>
            {[
              {dot:"#378ADD",date:"Mon May 18 · 8am",title:"LinkedIn: Integrity as competitive edge",tags:["LinkedIn"],posted:false},
              {dot:C.teal,date:"Tue May 19 · 11am",title:"Why Integrity-Centered Leadership Wins ✅",tags:["IG","FB","TT"],posted:true},
              {dot:"#EF9F27",date:"Wed May 20 · 10am",title:'"Sand leaders win rounds. Bedrock leaders win decades."',tags:["All"],posted:false},
              {dot:"#D85A30",date:"Thu May 21 · 12pm",title:"Book: Find Your True North → Amazon CTA",tags:["All"],posted:false},
              {dot:C.teal,date:"Fri May 22 · 11am",title:"Integrity: Your Most Powerful Strategic Asset",tags:["IG","FB","TT"],posted:false},
              {dot:"#334",date:"Sat–Sun · Rest",title:"No posts — recharge",tags:[],posted:false},
            ].map((item,i) => (
              <div key={i} style={{background:C.card,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,border:"1px solid #ffffff0d",marginBottom:8,opacity:item.title.includes("Rest")?0.5:1}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:item.dot,flexShrink:0}}></div>
                <div style={{fontSize:12,color:C.dim,width:130,flexShrink:0}}>{item.date}</div>
                <div style={{fontSize:13,color:"#fff",flex:1}}>{item.title}</div>
                <div style={{display:"flex",gap:4}}>
                  {item.tags.map((t,j) => <span key={j} style={{fontSize:10,padding:"2px 6px",borderRadius:10,background:`${C.gold}22`,color:C.gold}}>{t}</span>)}
                </div>
              </div>
            ))}
            <div style={{marginTop:16,padding:"14px 16px",background:C.card,borderRadius:10,border:`1px solid ${C.gold}22`}}>
              <div style={{fontSize:12,color:C.gold,fontWeight:500,marginBottom:4}}>📊 Total content runway</div>
              <div style={{fontSize:12,color:C.dim,lineHeight:1.8}}>393 posts total · 5 posts/week · May 19 – Dec 29, 2026 · 32 weeks<br/>Next batch upload: <span style={{color:"#fff"}}>June 19–20, 2026</span></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

