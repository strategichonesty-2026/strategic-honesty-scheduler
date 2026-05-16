import { useState } from "react";

const GREEN = '#24b47e';

const CONNECTED_CHANNELS = [
  {
    id:'fb', name:'Strategic Honesty', handle:'Facebook Page · Minneapolis, MN',
    platform:'Facebook', icon:'👥', color:'#1877F2',
    avatar:'https://img.youtube.com/vi/pSRmFFI-eWs/default.jpg',
    initials:'SH', type:'Facebook Page', posts:10, status:'active'
  },
  {
    id:'tt', name:'strategichonesty1', handle:'TikTok Account',
    platform:'TikTok', icon:'🎵', color:'#010101',
    avatar:'', initials:'S1', type:'TikTok Account', posts:10, status:'active'
  },
  {
    id:'ig', name:'strategichonesty', handle:'Instagram Professional Account',
    platform:'Instagram', icon:'📸', color:'#E1306C',
    avatar:'', initials:'SH', type:'Instagram Professional', posts:10, status:'active'
  },
];

const CONNECT_CHANNELS = [
  {id:'li', name:'LinkedIn', icon:'💼', color:'#0A66C2', sub:'Page or Profile'},
  {id:'tw', name:'X / Twitter', icon:'🐦', color:'#000', sub:'Profile'},
  {id:'th', name:'Threads', icon:'🧵', color:'#101010', sub:'Profile'},
  {id:'bs', name:'Bluesky', icon:'🦋', color:'#0085FF', sub:'Profile'},
  {id:'pi', name:'Pinterest', icon:'📌', color:'#E60023', sub:'Business account'},
  {id:'ss', name:'Substack', icon:'📰', color:'#FF6719', sub:'Newsletter'},
  {id:'gb', name:'Google Business', icon:'🏢', color:'#4285F4', sub:'Business Profile'},
  {id:'yt', name:'YouTube', icon:'▶️', color:'#FF0000', sub:'Channel'},
  {id:'mm', name:'Mailmeteor', icon:'📧', color:'#1D9E75', sub:'Email campaigns'},
];

const ALL_PLATFORMS = [
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

const SCHEDULE_POSTS = [
  {day:18,color:'#0A66C2',text:'LinkedIn: Integrity edge...'},
  {day:19,color:'#E1306C',text:'Integrity wins...',vid:'pSRmFFI-eWs'},
  {day:19,color:'#010101',text:'Integrity TikTok...',vid:'pSRmFFI-eWs'},
  {day:20,color:'#BA7517',text:'Quote: Sand vs bedrock...'},
  {day:21,color:'#D85A30',text:'Book: True North → Amazon...'},
  {day:22,color:'#E1306C',text:'Integrity: Strategic asset...',vid:'eipGue6GMLQ'},
  {day:22,color:'#010101',text:'Strategic asset TT...',vid:'eipGue6GMLQ'},
  {day:25,color:'#0A66C2',text:'LinkedIn: Reputation...'},
  {day:26,color:'#E1306C',text:'Reputation asset...',vid:'mEOojCsiJo0'},
  {day:26,color:'#010101',text:'Reputation TT...',vid:'mEOojCsiJo0'},
  {day:27,color:'#BA7517',text:'Quote: Shortcuts are loans...'},
  {day:28,color:'#D85A30',text:'Book: Strategic Honesty...'},
  {day:29,color:'#E1306C',text:'Integrity always wins...',vid:'WHQz4BfctF0'},
  {day:29,color:'#010101',text:'Always wins TT...',vid:'WHQz4BfctF0'},
];

const QUOTES = {
  integrity:"Integrity isn't a soft skill. It's the hardest competitive edge in business.\n\nSand leaders optimize for today.\nBedrock leaders optimize for trust.\n\nAnd trust? It compounds like interest.\n\nI grew up in rural Nepal. The one thing I never gave up was my word. Turns out — that was everything.\n\n#StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell",
  reputation:"Your reputation is built in years. Destroyed in one shortcut.\n\nEvery honest call you made is still working for you right now.\n\n📖 Find Your True North of Integrity → Amazon\nhttps://www.amazon.com/STRATEGIC-HONESTY-PLAYBOOK-Survive-Without/dp/B0GRN6WZGW\n\n#StrategicHonesty #Reputation #Leadership",
  shortcuts:"Every shortcut is a loan — and the interest is your integrity.\n\nSave this for the next time you feel pressure to cut corners.\n\n#StrategicHonesty #Leadership #BeGoodDoGoodDoWell #Integrity",
  nepal:"I grew up on dirt floors in Nepal.\n\nNo shortcuts. No safety net. No plan B.\n\nYour word. Your integrity. Your True North.\n\nThat's what everything I've built is made of.\n\n#StrategicHonesty #Nepal #Leadership #FromNothingToSomething",
  ai:"The real battle is not human vs. machine.\nIt is integrity vs. exploitation.\n\nAI won't replace your craft — it exposes organizational lies.\n\n📖 You Still Matter → https://www.amazon.com/You-Still-Matter-Relevant-Starting-ebook/dp/B0GS73941K/\n\n#StrategicHonesty #AI #HumanEdge #YouStillMatter",
  trust:"Trust compounds like interest.\n\nEvery honest call you make today is an investment.\nEvery shortcut is a withdrawal.\n\nThe math always catches up.\n\n#StrategicHonesty #Trust #Leadership #BeGoodDoGoodDoWell"
};

const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

function Avatar({ch, size=32}) {
  const [err, setErr] = useState(false);
  return (
    <div style={{position:'relative',flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:8,background:ch.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.45,fontWeight:600,color:ch.color,overflow:'hidden',border:'1px solid '+ch.color+'33'}}>
        {ch.avatar && !err
          ? <img src={ch.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
          : <span>{ch.initials}</span>
        }
      </div>
      <div style={{position:'absolute',bottom:-3,right:-3,width:14,height:14,borderRadius:'50%',background:ch.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,border:'1.5px solid #fff'}}>
        {ch.icon}
      </div>
    </div>
  );
}

export default function SocialHub() {
  const [tab, setTab] = useState('calendar');
  const [testSel, setTestSel] = useState(new Set(['ig','tt']));
  const [testContent, setTestContent] = useState('');
  const [testImage, setTestImage] = useState('');
  const [quickVideo, setQuickVideo] = useState('');
  const [logs, setLogs] = useState([{t:'info',m:'Select platforms and send your test post'}]);
  const [uploadLogs, setUploadLogs] = useState([
    {t:'info',m:'Select a channel and upload your CSV batch file'},
    {t:'info',m:'Tags column must be blank — hashtags go in text body'},
    {t:'info',m:'Free plan: max 10 posts per upload per channel'},
  ]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [extraConnected, setExtraConnected] = useState(new Set());

  const allConnected = new Set([...CONNECTED_CHANNELS.map(c=>c.id), ...extraConnected]);

  const addLog = (setter,t,m) => setter(prev=>[...prev,{t,m}]);
  const toggleTestSel = id => setTestSel(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  const sendTest = () => {
    if(!testContent.trim()){addLog(setLogs,'err','Write a post first.');return;}
    if(testSel.size===0){addLog(setLogs,'err','Select at least one platform.');return;}
    addLog(setLogs,'info','Sending test post...');
    [...testSel].forEach((p,i)=>setTimeout(()=>addLog(setLogs,'ok',`✓ Sent to ${p} successfully`),(i+1)*600));
  };

  const genQuick = () => {
    if(!quickVideo){addLog(setLogs,'err','Select a video topic first.');return;}
    setTestContent(QUOTES[quickVideo]||'');
    setTab('test');
  };

  const handleUpload = e => {
    const file=e.target.files[0];if(!file)return;
    addLog(setUploadLogs,'info',`Reading ${file.name}...`);
    const r=new FileReader();
    r.onload=ev=>{
      const lines=ev.target.result.split('\n').filter(l=>l.trim()).length-1;
      addLog(setUploadLogs,'ok',`✓ ${file.name} — ${lines} posts loaded`);
      addLog(setUploadLogs,'info','Go to Buffer → Channel → ⚙️ → Bulk Upload → Add to Queue');
    };
    r.readAsText(file);
  };

  const postMap = {};
  SCHEDULE_POSTS.forEach(p=>{if(!postMap[p.day])postMap[p.day]=[];postMap[p.day].push(p);});

  const inputStyle = {width:'100%',border:'1px solid #e0e0e0',borderRadius:6,padding:'8px 10px',fontSize:13,color:'#1a1a1a',fontFamily:F,outline:'none',resize:'none',marginBottom:10,background:'#fff'};
  const labelStyle = {fontSize:12,color:'#666',marginBottom:6,display:'block'};
  const logColor = t => t==='ok'?'#16a34a':t==='err'?'#dc2626':'#185fa5';

  const statusDot = status => ({
    width:8,height:8,borderRadius:'50%',flexShrink:0,
    background: status==='active'?'#22c55e':status==='warning'?'#f59e0b':'#ef4444'
  });

  return (
    <div style={{display:'grid',gridTemplateColumns:'240px 1fr',minHeight:'100vh',background:'#fff',fontFamily:F,fontSize:14}}>

      {/* SIDEBAR */}
      <div style={{background:'#f8f8f8',borderRight:'1px solid #e8e8e8',display:'flex',flexDirection:'column'}}>

        {/* Brand */}
        <div style={{padding:'16px',borderBottom:'1px solid #e8e8e8',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,background:GREEN,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:'bold'}}>S</div>
          <span style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>Strategic Honesty</span>
        </div>

        {/* New post button */}
        <button onClick={()=>setTab('test')} style={{margin:'12px',padding:'8px 0',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer'}}>
          + New post
        </button>

        {/* Nav */}
        <nav style={{padding:'4px 0'}}>
          {[['calendar','📅 Publish','30'],['test','✏️ Create',''],['calendar','💬 Community','1']].map(([t,label,badge],i)=>(
            <div key={i} onClick={()=>setTab(t)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:6,cursor:'pointer',fontSize:13,color:'#333',margin:'1px 8px'}}>
              <span style={{flex:1}}>{label}</span>
              {badge&&<span style={{background:'#e8e8e8',color:'#666',fontSize:11,padding:'1px 7px',borderRadius:10}}>{badge}</span>}
            </div>
          ))}
        </nav>

        {/* CHANNELS section — Buffer style with profile details */}
        <div style={{padding:'12px 12px 6px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:'#999',letterSpacing:'.5px',textTransform:'uppercase',fontWeight:500}}>Channels</span>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setTab('connect')} style={{background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:14,padding:2}} title="Search channels">🔍</button>
            <button onClick={()=>setTab('connect')} style={{background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:14,padding:2}} title="Channel settings">⚙️</button>
            <button onClick={()=>setTab('connect')} style={{background:'none',border:'none',cursor:'pointer',color:GREEN,fontSize:16,padding:2,fontWeight:'bold'}} title="Add channel">+</button>
          </div>
        </div>

        {/* Connected channel list — Buffer exact style */}
        <div style={{padding:'0 8px'}}>
          {CONNECTED_CHANNELS.map(ch=>(
            <div key={ch.id}
              onClick={()=>setSelectedChannel(selectedChannel===ch.id?null:ch.id)}
              style={{
                display:'flex',alignItems:'center',gap:10,padding:'8px',
                borderRadius:8,cursor:'pointer',
                background:selectedChannel===ch.id?'#fff':'transparent',
                border:selectedChannel===ch.id?'1px solid #e8e8e8':'1px solid transparent',
                marginBottom:2,transition:'all .15s'
              }}>
              <Avatar ch={ch} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.name}</div>
                <div style={{fontSize:11,color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.type}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0}}>
                <span style={{fontSize:11,color:'#999',fontWeight:500}}>{ch.posts}</span>
                <div style={statusDot(ch.status)}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected channel detail panel */}
        {selectedChannel && (()=>{
          const ch = CONNECTED_CHANNELS.find(c=>c.id===selectedChannel);
          if(!ch) return null;
          return (
            <div style={{margin:'4px 8px 4px',background:'#fff',border:'1px solid #e8e8e8',borderRadius:8,padding:12}}>
              <div style={{fontSize:11,color:'#999',marginBottom:8,fontWeight:500,textTransform:'uppercase',letterSpacing:'.3px'}}>Account details</div>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'#888'}}>Platform</span>
                  <span style={{color:'#1a1a1a',fontWeight:500}}>{ch.platform}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'#888'}}>Account</span>
                  <span style={{color:'#1a1a1a',fontWeight:500,textAlign:'right',maxWidth:110,overflow:'hidden',textOverflow:'ellipsis'}}>{ch.name}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'#888'}}>Type</span>
                  <span style={{color:'#1a1a1a',fontWeight:500}}>{ch.type}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'#888'}}>Status</span>
                  <span style={{color:'#16a34a',fontWeight:500}}>● Active</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'#888'}}>Posts queued</span>
                  <span style={{color:'#1a1a1a',fontWeight:500}}>{ch.posts}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:6,marginTop:10}}>
                <button style={{flex:1,padding:'5px 0',fontSize:11,border:'1px solid #e0e0e0',borderRadius:5,background:'#f9f9f9',cursor:'pointer',color:'#444'}}>⚙️ Settings</button>
                <button style={{flex:1,padding:'5px 0',fontSize:11,border:'1px solid #fca5a5',borderRadius:5,background:'#fff',cursor:'pointer',color:'#dc2626'}}>Disconnect</button>
              </div>
            </div>
          );
        })()}

        {/* Connect channels */}
        <div style={{padding:'10px 12px 4px',fontSize:11,color:'#999',letterSpacing:'.5px',textTransform:'uppercase',fontWeight:500,marginTop:4}}>Connect channels</div>
        <div style={{padding:'0 8px'}}>
          {CONNECT_CHANNELS.slice(0,4).map(p=>(
            <div key={p.id} onClick={()=>setTab('connect')} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',borderRadius:8,cursor:'pointer',transition:'all .15s',marginBottom:1}}>
              <div style={{width:30,height:30,borderRadius:8,background:'#fff',border:'1px solid #e8e8e8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,position:'relative',flexShrink:0}}>
                {p.icon}
                <span style={{position:'absolute',bottom:-3,right:-3,width:12,height:12,borderRadius:'50%',background:'#e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#6b7280',border:'1.5px solid #fff',fontWeight:'bold'}}>+</span>
              </div>
              <span style={{fontSize:13,color:'#555'}}>{p.name}</span>
            </div>
          ))}
          <div onClick={()=>setTab('connect')} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',borderRadius:8,cursor:'pointer',marginBottom:1}}>
            <div style={{width:30,height:30,borderRadius:8,background:'#fff',border:'1px solid #e8e8e8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#9ca3af',flexShrink:0}}>+</div>
            <span style={{fontSize:13,color:'#888'}}>More channels</span>
          </div>
        </div>

        {/* Bottom */}
        <div style={{marginTop:'auto',padding:'12px',borderTop:'1px solid #e8e8e8'}}>
          <div style={{fontSize:12,color:'#999',marginBottom:4}}>3/3 channels · Free Plan</div>
          <div style={{background:'#e8e8e8',borderRadius:4,height:3,overflow:'hidden'}}>
            <div style={{background:GREEN,width:'100%',height:'100%',borderRadius:4}}></div>
          </div>
          <div style={{fontSize:11,color:'#f59e0b',marginTop:5}}>⚠ Upgrade to add LinkedIn</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',borderBottom:'1px solid #e8e8e8',background:'#fff'}}>
          <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',flex:1}}>📊 All Channels</div>
          <button style={{padding:'6px 14px',borderRadius:6,fontSize:13,cursor:'pointer',border:'1px solid #e0e0e0',background:'#fff',color:'#333'}}>≡ List</button>
          <button style={{padding:'6px 14px',borderRadius:6,fontSize:13,cursor:'pointer',border:'1px solid #e0e0e0',background:'#fff',color:'#333'}}>📅 Calendar</button>
          <button onClick={()=>setTab('upload')} style={{padding:'6px 14px',borderRadius:6,fontSize:13,cursor:'pointer',border:'none',background:GREEN,color:'#fff',fontWeight:500}}>+ New post</button>
        </div>

        <div style={{display:'flex',borderBottom:'1px solid #e8e8e8',padding:'0 20px',background:'#fff'}}>
          {[['calendar','📅 Calendar'],['connect','🔗 Connect'],['upload','⬆ Upload CSV'],['test','✉ Test post']].map(([t,label])=>(
            <div key={t} onClick={()=>setTab(t)} style={{padding:'10px 16px',fontSize:13,cursor:'pointer',borderBottom:tab===t?'2px solid #1a1a1a':'2px solid transparent',color:tab===t?'#1a1a1a':'#666',fontWeight:tab===t?500:400,transition:'all .15s'}}>
              {label}
            </div>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:20,background:'#fafafa'}}>

          {/* CALENDAR */}
          {tab==='calendar' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                {[{n:393,l:'Posts scheduled'},{n:'5/week',l:'Posting frequency'},{n:CONNECTED_CHANNELS.length,l:'Channels active'},{n:'Dec 29',l:'Content until'}].map((item,i)=>(
                  <div key={i} style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:8,padding:'14px 16px'}}>
                    <div style={{fontSize:22,fontWeight:600,color:'#1a1a1a'}}>{item.n}</div>
                    <div style={{fontSize:12,color:'#999',marginTop:2}}>{item.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <button style={{padding:'5px 10px',border:'1px solid #e0e0e0',background:'#fff',borderRadius:6,cursor:'pointer'}}>‹</button>
                <span style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>May 2026</span>
                <button style={{padding:'5px 10px',border:'1px solid #e0e0e0',background:'#fff',borderRadius:6,cursor:'pointer'}}>›</button>
                <button style={{padding:'5px 12px',border:'1px solid #e0e0e0',background:'#fff',borderRadius:6,cursor:'pointer',fontSize:12,marginLeft:4}}>Today</button>
                <select style={{marginLeft:'auto',padding:'6px 10px',fontSize:12,border:'1px solid #e0e0e0',borderRadius:6,background:'#fff'}}>
                  <option>All Posts</option>
                  {CONNECTED_CHANNELS.map(ch=><option key={ch.id}>{ch.name}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:6}}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center',fontSize:12,color:'#999',padding:'6px 0',fontWeight:500}}>{d}</div>)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
                {Array(4).fill(0).map((_,i)=><div key={'e'+i} style={{minHeight:86,background:'#f5f5f5',border:'1px solid #ececec',borderRadius:6}}></div>)}
                {Array(31).fill(0).map((_,i)=>{
                  const day=i+1, posts=postMap[day]||[], isToday=day===16;
                  return (
                    <div key={day} style={{minHeight:86,background:'#fff',border:isToday?`1.5px solid ${GREEN}`:'1px solid #e8e8e8',borderRadius:6,padding:5,cursor:'pointer'}}>
                      <div style={{fontSize:12,color:isToday?GREEN:'#666',marginBottom:3,fontWeight:isToday?600:400}}>{day}</div>
                      {posts.slice(0,2).map((p,j)=>(
                        <div key={j} style={{borderRadius:4,padding:'2px 5px',fontSize:10,marginBottom:2,display:'flex',alignItems:'center',gap:3,background:p.color+'14',color:p.color,overflow:'hidden'}}>
                          {p.vid&&<img src={`https://img.youtube.com/vi/${p.vid}/default.jpg`} alt="" style={{width:14,height:14,borderRadius:2,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>}
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{p.text}</span>
                        </div>
                      ))}
                      {posts.length>2&&<div style={{fontSize:10,color:'#999',padding:'1px 3px'}}>+{posts.length-2} more</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONNECT */}
          {tab==='connect' && (
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',marginBottom:4}}>Connect a new channel</div>
              <div style={{fontSize:13,color:'#666',marginBottom:16}}>Connect your accounts to schedule posts directly. Click any platform to connect.</div>

              {/* Currently connected */}
              <div style={{fontSize:12,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Connected (3/3 · Free plan)</div>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
                {CONNECTED_CHANNELS.map(ch=>(
                  <div key={ch.id} style={{background:'#fff',border:`1px solid ${GREEN}44`,borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
                    <Avatar ch={ch} size={40}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{ch.name}</div>
                      <div style={{fontSize:12,color:'#888'}}>{ch.type}</div>
                    </div>
                    <div style={{display:'flex',align:'center',gap:4}}>
                      <span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:'#dcfce7',color:'#166534',fontWeight:500}}>✓ Connected</span>
                    </div>
                    <button style={{padding:'5px 12px',fontSize:12,border:'1px solid #fca5a5',borderRadius:6,background:'#fff',cursor:'pointer',color:'#dc2626'}}>Disconnect</button>
                  </div>
                ))}
              </div>

              {/* Upgrade notice */}
              <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:8,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:18}}>⚠️</span>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:'#92400e'}}>Free plan limit reached (3/3)</div>
                  <div style={{fontSize:12,color:'#b45309'}}>Upgrade to Buffer Essentials ($6/mo per channel) to add LinkedIn, Facebook, and more.</div>
                </div>
                <button style={{marginLeft:'auto',padding:'6px 14px',background:'#f59e0b',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'}}>Upgrade</button>
              </div>

              {/* Available platforms */}
              <div style={{fontSize:12,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Available to connect</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {ALL_PLATFORMS.map(p=>{
                  const isConn = CONNECTED_CHANNELS.some(c=>c.id===p.id);
                  return (
                    <div key={p.id} style={{background:'#fff',border:isConn?`1px solid ${GREEN}44`:'1px solid #e8e8e8',borderRadius:10,padding:'16px 14px',textAlign:'center',cursor:'pointer',transition:'all .2s',opacity:isConn?0.6:1}}>
                      <div style={{width:44,height:44,borderRadius:10,margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,background:p.color+'15'}}>{p.icon}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:2}}>{p.name}</div>
                      <div style={{fontSize:11,color:'#888',marginBottom:10}}>{p.sub}</div>
                      <button style={{padding:'5px 14px',borderRadius:16,fontSize:11,fontWeight:500,cursor:'pointer',border:`1px solid ${isConn?GREEN+'44':'#e0e0e0'}`,background:isConn?'#dcfce7':'#f9f9f9',color:isConn?'#166534':'#555',width:'100%'}}>
                        {isConn?'✓ Connected':'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* UPLOAD */}
          {tab==='upload' && (
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',marginBottom:16}}>Upload posts in bulk</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div>
                  <label style={labelStyle}>Select channel</label>
                  <select style={inputStyle}>
                    {CONNECTED_CHANNELS.map(ch=><option key={ch.id}>{ch.name} ({ch.platform})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>CSV type</label>
                  <select style={inputStyle}>
                    <option>Main posts (Tue + Fri)</option>
                    <option>Monday LinkedIn gap-fill</option>
                    <option>Wednesday viral quotes</option>
                    <option>Thursday book quotes</option>
                  </select>
                </div>
              </div>
              <label htmlFor="csv-file" style={{border:'1.5px dashed #d0d0d0',borderRadius:10,padding:'40px 32px',textAlign:'center',cursor:'pointer',background:'#fff',marginBottom:16,display:'block'}}>
                <div style={{fontSize:32,marginBottom:8,color:'#ccc'}}>⬆</div>
                <div style={{fontSize:14,fontWeight:500,color:'#1a1a1a',marginBottom:4}}>Drop your Buffer CSV batch file here</div>
                <div style={{fontSize:12,color:'#999'}}>Text, Image URL, Tags, Posting Time · UTF-8 · Max 10 posts (free plan)</div>
                <input type="file" id="csv-file" accept=".csv" style={{display:'none'}} onChange={handleUpload}/>
              </label>
              <div style={{background:'#f8f8f8',borderRadius:6,padding:10,fontSize:12,fontFamily:'monospace',maxHeight:100,overflowY:'auto',marginBottom:20,lineHeight:1.8}}>
                {uploadLogs.map((l,i)=><div key={i} style={{color:logColor(l.t)}}>» {l.m}</div>)}
              </div>
              <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:10}}>Upload schedule</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  {done:true,label:'Batch 01 — uploaded',dates:'Posts 1–10 · May 19 – Jun 19'},
                  {done:false,label:'Batch 02 — upload Jun 19–20',dates:'Posts 11–20 · Jun 23 – Jul 24'},
                  {done:false,label:'Batch 03 — upload Jul 24–25',dates:'Posts 21–30 · Jul 28 – Aug 28'},
                  {done:false,label:'Batch 04 — upload Aug 28–29',dates:'Posts 31–40 · Sep 1 – Oct 2'},
                ].map((b,i)=>(
                  <div key={i} style={{background:'#fff',borderRadius:8,padding:'12px 14px',border:b.done?`1px solid ${GREEN}44`:'1px solid #e8e8e8'}}>
                    <div style={{fontSize:12,fontWeight:500,color:b.done?'#16a34a':'#1a1a1a',marginBottom:3}}>{b.done?'✓ ':''}{b.label}</div>
                    <div style={{fontSize:12,color:'#999'}}>{b.dates}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEST */}
          {tab==='test' && (
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',marginBottom:16}}>Create and test a post</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:16}}>
                  <label style={labelStyle}>Write your post</label>
                  <textarea value={testContent} onChange={e=>setTestContent(e.target.value)} rows={7} style={inputStyle}
                    placeholder="Integrity isn't a soft skill. It's the hardest competitive edge in business..."/>
                  <label style={labelStyle}>Select platforms</label>
                  <div style={{marginBottom:10,display:'flex',flexWrap:'wrap',gap:6}}>
                    {CONNECTED_CHANNELS.map(ch=>(
                      <span key={ch.id} onClick={()=>toggleTestSel(ch.id)}
                        style={{padding:'4px 10px',borderRadius:20,fontSize:12,cursor:'pointer',border:`1px solid ${testSel.has(ch.id)?GREEN+'66':'#e0e0e0'}`,background:testSel.has(ch.id)?'#e6f7f2':'#fff',color:testSel.has(ch.id)?'#0f6e56':'#666',display:'inline-flex',alignItems:'center',gap:5}}>
                        <span style={{fontSize:13}}>{ch.icon}</span> {ch.name}
                      </span>
                    ))}
                  </div>
                  <label style={labelStyle}>Image URL (optional)</label>
                  <input value={testImage} onChange={e=>setTestImage(e.target.value)} style={inputStyle}
                    placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"/>
                  <button onClick={sendTest} style={{padding:'8px 18px',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                    ✉ Send test post
                  </button>
                  <div style={{background:'#f8f8f8',borderRadius:6,padding:10,fontSize:12,fontFamily:'monospace',maxHeight:100,overflowY:'auto',marginTop:10,lineHeight:1.8}}>
                    {logs.map((l,i)=><div key={i} style={{color:logColor(l.t)}}>» {l.m}</div>)}
                  </div>
                </div>
                <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:16}}>
                  <label style={labelStyle}>Quick quote generator</label>
                  <select value={quickVideo} onChange={e=>setQuickVideo(e.target.value)} style={{...inputStyle,marginBottom:10}}>
                    <option value="">Select a video topic...</option>
                    <option value="integrity">Why Integrity-Centered Leadership Wins</option>
                    <option value="reputation">Your Reputation: The Only Asset That Can't Be Taken</option>
                    <option value="shortcuts">Every Shortcut is a Loan</option>
                    <option value="nepal">From Dirt Floors to Success</option>
                    <option value="ai">Is AI Replacing Your Value?</option>
                    <option value="trust">The Silent Engine of Success: Trust</option>
                  </select>
                  <button onClick={genQuick} style={{padding:'8px 18px',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer',marginBottom:20}}>
                    ✨ Generate post
                  </button>
                  <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:10}}>This week's schedule</div>
                  {[
                    {color:'#0A66C2',time:'Mon · 8am',label:'LinkedIn post',green:false},
                    {color:GREEN,time:'Tue · 11am',label:'Main post ✓ uploaded',green:true},
                    {color:'#BA7517',time:'Wed · 10am',label:'Viral quote',green:false},
                    {color:'#D85A30',time:'Thu · 12pm',label:'Book quote CTA',green:false},
                    {color:GREEN,time:'Fri · 11am',label:'Main post ✓ uploaded',green:true},
                  ].map((item,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:item.green?'#e6f7f2':'#f8f8f8',borderRadius:6,marginBottom:4}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:item.color,flexShrink:0}}></div>
                      <span style={{fontSize:12,color:'#999',width:80}}>{item.time}</span>
                      <span style={{fontSize:12,color:item.green?'#0f6e56':'#1a1a1a'}}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
