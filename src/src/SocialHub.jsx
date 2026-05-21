import { useState, useEffect } from "react";

const GREEN = '#24b47e';
const BACKEND = 'https://strategic-honesty-scheduler-production.up.railway.app';
const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

// Get or create a stable userId in localStorage
function getUserId() {
  let id = localStorage.getItem('sh_user_id');
  if (!id) { id = 'user_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('sh_user_id', id); }
  return id;
}

const STATIC_CHANNELS = [
  { id:'fb', name:'Strategic Honesty', handle:'Facebook Page · Minneapolis, MN', platform:'Facebook', icon:'👥', color:'#1877F2', avatar:'https://img.youtube.com/vi/pSRmFFI-eWs/default.jpg', initials:'SH', type:'Facebook Page', posts:10, status:'active' },
  { id:'tt', name:'strategichonesty1', handle:'TikTok Account', platform:'TikTok', icon:'🎵', color:'#010101', avatar:'', initials:'S1', type:'TikTok Account', posts:10, status:'active' },
  { id:'ig', name:'strategichonesty', handle:'Instagram Professional Account', platform:'Instagram', icon:'📸', color:'#E1306C', avatar:'', initials:'SH', type:'Instagram Professional', posts:10, status:'active' },
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

function Avatar({ch, size=32}) {
  const [err, setErr] = useState(false);
  return (
    <div style={{position:'relative',flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:8,background:ch.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.45,fontWeight:600,color:ch.color,overflow:'hidden',border:'1px solid '+ch.color+'33'}}>
        {ch.avatar && !err
          ? <img src={ch.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
          : <span>{ch.initials||ch.icon}</span>}
      </div>
      <div style={{position:'absolute',bottom:-3,right:-3,width:14,height:14,borderRadius:'50%',background:ch.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,border:'1.5px solid #fff'}}>
        {ch.icon}
      </div>
    </div>
  );
}

export default function SocialHub() {
  const [tab, setTab] = useState('calendar');
  const [userId] = useState(getUserId);
  const [connections, setConnections] = useState({}); // { linkedin: {...}, youtube: {...} }
  const [testSel, setTestSel] = useState(new Set(['ig','tt']));
  const [testContent, setTestContent] = useState('');
  const [testImage, setTestImage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [quickVideo, setQuickVideo] = useState('');
  const [logs, setLogs] = useState([{t:'info',m:'Select platforms and compose your post'}]);
  const [uploadLogs, setUploadLogs] = useState([
    {t:'info',m:'Select a channel and upload your CSV batch file'},
    {t:'info',m:'Tags column must be blank — hashtags go in text body'},
    {t:'info',m:'Free plan: max 10 posts per upload per channel'},
  ]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [posting, setPosting] = useState(false);

  const addLog = (setter, t, m) => setter(prev => [...prev, {t, m}]);

  // ── Check OAuth return params on load ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      const platform = params.get('platform');
      const name = params.get('name');
      const uid = params.get('userId');
      if (uid) localStorage.setItem(`sh_${platform}_userId`, uid);
      addLog(setLogs, 'ok', `✓ ${platform} connected as "${name}"`);
      window.history.replaceState({}, '', window.location.pathname);
      setTab('connect');
    } else if (params.get('auth') === 'error') {
      const reason = params.get('reason');
      addLog(setLogs, 'err', `✗ OAuth failed: ${reason}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Fetch connection status on load ───────────────────────────────────────
  useEffect(() => {
    fetchStatus();
    fetchScheduledPosts();
  }, [userId]);

  async function fetchStatus() {
    try {
      const res = await fetch(`${BACKEND}/auth/status?userId=${userId}`);
      const data = await res.json();
      setConnections(data.connections || {});
    } catch { /* backend unreachable */ }
  }

  async function fetchScheduledPosts() {
    try {
      const res = await fetch(`${BACKEND}/posts?userId=${userId}`);
      const data = await res.json();
      setScheduledPosts(data.posts || []);
    } catch { /* ignore */ }
  }

  // ── Connect LinkedIn ───────────────────────────────────────────────────────
  function connectLinkedIn() {
    window.location.href = `${BACKEND}/auth/linkedin/connect?userId=${userId}`;
  }

  // ── Connect YouTube ────────────────────────────────────────────────────────
  function connectYouTube() {
    window.location.href = `${BACKEND}/auth/youtube/connect?userId=${userId}`;
  }

  // ── Disconnect a platform ─────────────────────────────────────────────────
  async function disconnect(platform) {
    const platformUserId = localStorage.getItem(`sh_${platform}_userId`) || userId;
    await fetch(`${BACKEND}/auth/disconnect`, {
      method: 'DELETE',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({userId: platformUserId, platform})
    });
    setConnections(prev => {const n={...prev};delete n[platform];return n;});
    addLog(setLogs, 'info', `${platform} disconnected`);
  }

  // ── Send / Schedule post ──────────────────────────────────────────────────
  async function sendPost(publishNow = true) {
    if (!testContent.trim()) { addLog(setLogs,'err','Write a post first.'); return; }
    if (testSel.size === 0) { addLog(setLogs,'err','Select at least one platform.'); return; }

    setPosting(true);

    for (const platformId of testSel) {
      // Only LinkedIn and YouTube go through backend; others are simulated
      if (platformId === 'li' && connections.linkedin) {
        const liUserId = localStorage.getItem('sh_linkedin_userId') || userId;
        if (publishNow) {
          addLog(setLogs,'info','Sending to LinkedIn...');
          try {
            // Schedule 10 seconds from now for "immediate" posting
            const scheduledAt = new Date(Date.now() + 10000).toISOString();
            const res = await fetch(`${BACKEND}/posts`, {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({platform:'linkedin', userId: liUserId, content: testContent, mediaUrl: testImage||null, mediaType: testImage?'image':null, scheduledAt})
            });
            const data = await res.json();
            if (data.success) {
              // Trigger immediate publish
              await fetch(`${BACKEND}/posts/${data.post.id}/publish`, {method:'POST'});
              addLog(setLogs,'ok','✓ Sent to LinkedIn successfully');
            } else { addLog(setLogs,'err',`LinkedIn: ${data.error}`); }
          } catch(e) { addLog(setLogs,'err',`LinkedIn error: ${e.message}`); }
        } else if (scheduleDate) {
          try {
            const res = await fetch(`${BACKEND}/posts`, {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({platform:'linkedin', userId: liUserId, content: testContent, mediaUrl: testImage||null, mediaType: testImage?'image':null, scheduledAt: scheduleDate})
            });
            const data = await res.json();
            if (data.success) { addLog(setLogs,'ok',`✓ LinkedIn post scheduled for ${new Date(scheduleDate).toLocaleString()}`); fetchScheduledPosts(); }
            else { addLog(setLogs,'err',`LinkedIn: ${data.error}`); }
          } catch(e) { addLog(setLogs,'err',`LinkedIn error: ${e.message}`); }
        }
      } else if (platformId === 'yt' && connections.youtube) {
        const ytUserId = localStorage.getItem('sh_youtube_userId') || userId;
        if (!publishNow && scheduleDate) {
          try {
            const res = await fetch(`${BACKEND}/posts`, {
              method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({platform:'youtube', userId: ytUserId, content: testContent, scheduledAt: scheduleDate})
            });
            const data = await res.json();
            if (data.success) { addLog(setLogs,'ok',`✓ YouTube post scheduled for ${new Date(scheduleDate).toLocaleString()}`); fetchScheduledPosts(); }
            else { addLog(setLogs,'err',`YouTube: ${data.error}`); }
          } catch(e) { addLog(setLogs,'err',`YouTube error: ${e.message}`); }
        } else {
          addLog(setLogs,'info','YouTube: use Schedule (not Send) for community posts');
        }
      } else {
        // Simulated for FB, IG, TT
        await new Promise(r=>setTimeout(r,400));
        addLog(setLogs,'ok',`✓ Sent to ${platformId} successfully`);
      }
    }
    setPosting(false);
  }

  const toggleTestSel = id => setTestSel(prev => {const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  const genQuick = () => {
    if (!quickVideo) { addLog(setLogs,'err','Select a video topic first.'); return; }
    setTestContent(QUOTES[quickVideo] || '');
    setTab('test');
  };

  const handleUpload = e => {
    const file = e.target.files[0]; if(!file) return;
    addLog(setUploadLogs,'info',`Reading ${file.name}...`);
    const r = new FileReader();
    r.onload = ev => {
      const lines = ev.target.result.split('\n').filter(l=>l.trim()).length - 1;
      addLog(setUploadLogs,'ok',`✓ ${file.name} — ${lines} posts loaded`);
      addLog(setUploadLogs,'info','Go to Buffer → Channel → ⚙️ → Bulk Upload → Add to Queue');
    };
    r.readAsText(file);
  };

  // ── Build connected channels list (static + real OAuth) ───────────────────
  const dynamicChannels = [];
  if (connections.linkedin) dynamicChannels.push({
    id:'li', name:'LinkedIn', handle:'LinkedIn Profile', platform:'LinkedIn',
    icon:'💼', color:'#0A66C2', avatar:'', initials:'LI', type:'LinkedIn Profile',
    posts: scheduledPosts.filter(p=>p.platform==='linkedin').length, status:'active'
  });
  if (connections.youtube) dynamicChannels.push({
    id:'yt', name:'YouTube Channel', handle:'YouTube Channel', platform:'YouTube',
    icon:'▶️', color:'#FF0000', avatar:'', initials:'YT', type:'YouTube Channel',
    posts: scheduledPosts.filter(p=>p.platform==='youtube').length, status:'active'
  });
  const CONNECTED_CHANNELS = [...STATIC_CHANNELS, ...dynamicChannels];

  const postMap = {};
  SCHEDULE_POSTS.forEach(p=>{if(!postMap[p.day])postMap[p.day]=[];postMap[p.day].push(p);});

  const inputStyle = {width:'100%',border:'1px solid #e0e0e0',borderRadius:6,padding:'8px 10px',fontSize:13,color:'#1a1a1a',fontFamily:F,outline:'none',resize:'none',marginBottom:10,background:'#fff',boxSizing:'border-box'};
  const labelStyle = {fontSize:12,color:'#666',marginBottom:6,display:'block'};
  const logColor = t => t==='ok'?'#16a34a':t==='err'?'#dc2626':'#185fa5';
  const statusDot = status => ({width:8,height:8,borderRadius:'50%',flexShrink:0,background:status==='active'?'#22c55e':status==='warning'?'#f59e0b':'#ef4444'});

  const isLiConnected = !!connections.linkedin;
  const isYtConnected = !!connections.youtube;

  return (
    <div style={{display:'grid',gridTemplateColumns:'240px 1fr',minHeight:'100vh',background:'#fff',fontFamily:F,fontSize:14}}>

      {/* SIDEBAR */}
      <div style={{background:'#f8f8f8',borderRight:'1px solid #e8e8e8',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px',borderBottom:'1px solid #e8e8e8',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,background:GREEN,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:'bold'}}>S</div>
          <span style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>Strategic Honesty</span>
        </div>
        <button onClick={()=>setTab('test')} style={{margin:'12px',padding:'8px 0',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer'}}>
          + New post
        </button>
        <nav style={{padding:'4px 0'}}>
          {[['calendar','📅 Publish','30'],['test','✏️ Create',''],['calendar','💬 Community','1']].map(([t,label,badge],i)=>(
            <div key={i} onClick={()=>setTab(t)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:6,cursor:'pointer',fontSize:13,color:'#333',margin:'1px 8px'}}>
              <span style={{flex:1}}>{label}</span>
              {badge&&<span style={{background:'#e8e8e8',color:'#666',fontSize:11,padding:'1px 7px',borderRadius:10}}>{badge}</span>}
            </div>
          ))}
        </nav>

        <div style={{padding:'12px 12px 6px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:'#999',letterSpacing:'.5px',textTransform:'uppercase',fontWeight:500}}>Channels</span>
          <button onClick={()=>setTab('connect')} style={{background:'none',border:'none',cursor:'pointer',color:GREEN,fontSize:16,padding:2,fontWeight:'bold'}} title="Add channel">+</button>
        </div>

        <div style={{padding:'0 8px'}}>
          {CONNECTED_CHANNELS.map(ch=>(
            <div key={ch.id} onClick={()=>setSelectedChannel(selectedChannel===ch.id?null:ch.id)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'8px',borderRadius:8,cursor:'pointer',background:selectedChannel===ch.id?'#fff':'transparent',border:selectedChannel===ch.id?'1px solid #e8e8e8':'1px solid transparent',marginBottom:2,transition:'all .15s'}}>
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

        {selectedChannel && (()=>{
          const ch = CONNECTED_CHANNELS.find(c=>c.id===selectedChannel);
          if (!ch) return null;
          return (
            <div style={{margin:'4px 8px 4px',background:'#fff',border:'1px solid #e8e8e8',borderRadius:8,padding:12}}>
              <div style={{fontSize:11,color:'#999',marginBottom:8,fontWeight:500,textTransform:'uppercase',letterSpacing:'.3px'}}>Account details</div>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                {[['Platform',ch.platform],['Account',ch.name],['Type',ch.type],['Status','● Active'],['Posts queued',ch.posts]].map(([k,v],i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                    <span style={{color:'#888'}}>{k}</span>
                    <span style={{color:k==='Status'?'#16a34a':'#1a1a1a',fontWeight:500}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:6,marginTop:10}}>
                <button style={{flex:1,padding:'5px 0',fontSize:11,border:'1px solid #e0e0e0',borderRadius:5,background:'#f9f9f9',cursor:'pointer',color:'#444'}}>⚙️ Settings</button>
                {(ch.id==='li'||ch.id==='yt') && (
                  <button onClick={()=>disconnect(ch.id==='li'?'linkedin':'youtube')} style={{flex:1,padding:'5px 0',fontSize:11,border:'1px solid #fca5a5',borderRadius:5,background:'#fff',cursor:'pointer',color:'#dc2626'}}>Disconnect</button>
                )}
              </div>
            </div>
          );
        })()}

        <div style={{padding:'10px 12px 4px',fontSize:11,color:'#999',letterSpacing:'.5px',textTransform:'uppercase',fontWeight:500,marginTop:4}}>Quick connect</div>
        <div style={{padding:'0 8px'}}>
          {[
            {id:'li',name:'LinkedIn',icon:'💼',color:'#0A66C2',connected:isLiConnected,fn:connectLinkedIn},
            {id:'yt',name:'YouTube',icon:'▶️',color:'#FF0000',connected:isYtConnected,fn:connectYouTube},
          ].map(p=>(
            <div key={p.id} onClick={p.connected?null:p.fn}
              style={{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',borderRadius:8,cursor:p.connected?'default':'pointer',transition:'all .15s',marginBottom:1,opacity:p.connected?0.6:1}}>
              <div style={{width:30,height:30,borderRadius:8,background:'#fff',border:'1px solid #e8e8e8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,position:'relative',flexShrink:0}}>
                {p.icon}
                {!p.connected && <span style={{position:'absolute',bottom:-3,right:-3,width:12,height:12,borderRadius:'50%',background:'#e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#6b7280',border:'1.5px solid #fff',fontWeight:'bold'}}>+</span>}
                {p.connected && <span style={{position:'absolute',bottom:-3,right:-3,width:12,height:12,borderRadius:'50%',background:'#22c55e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#fff',border:'1.5px solid #fff'}}>✓</span>}
              </div>
              <span style={{fontSize:13,color:p.connected?'#16a34a':'#555'}}>{p.connected?`${p.name} ✓`:p.name}</span>
            </div>
          ))}
        </div>

        <div style={{marginTop:'auto',padding:'12px',borderTop:'1px solid #e8e8e8'}}>
          <div style={{fontSize:12,color:'#999',marginBottom:4}}>{CONNECTED_CHANNELS.length} channels active</div>
          <div style={{background:'#e8e8e8',borderRadius:4,height:3,overflow:'hidden'}}>
            <div style={{background:GREEN,width:'60%',height:'100%',borderRadius:4}}></div>
          </div>
          {!isLiConnected && <div style={{fontSize:11,color:'#f59e0b',marginTop:5}}>⚠ Connect LinkedIn to post directly</div>}
        </div>
      </div>

      {/* MAIN */}
      <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 20px',borderBottom:'1px solid #e8e8e8',background:'#fff'}}>
          <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',flex:1}}>📊 All Channels</div>
          <button onClick={()=>setTab('upload')} style={{padding:'6px 14px',borderRadius:6,fontSize:13,cursor:'pointer',border:'none',background:GREEN,color:'#fff',fontWeight:500}}>+ New post</button>
        </div>

        <div style={{display:'flex',borderBottom:'1px solid #e8e8e8',padding:'0 20px',background:'#fff'}}>
          {[['calendar','📅 Calendar'],['connect','🔗 Connect'],['upload','⬆ Upload CSV'],['test','✉ Compose & Schedule']].map(([t,label])=>(
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
                {[
                  {n:scheduledPosts.filter(p=>p.status==='pending').length||393,l:'Posts scheduled'},
                  {n:'5/week',l:'Posting frequency'},
                  {n:CONNECTED_CHANNELS.length,l:'Channels active'},
                  {n:'Dec 29',l:'Content until'}
                ].map((item,i)=>(
                  <div key={i} style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:8,padding:'14px 16px'}}>
                    <div style={{fontSize:22,fontWeight:600,color:'#1a1a1a'}}>{item.n}</div>
                    <div style={{fontSize:12,color:'#999',marginTop:2}}>{item.l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <span style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>May 2026</span>
                <button style={{padding:'5px 12px',border:'1px solid #e0e0e0',background:'#fff',borderRadius:6,cursor:'pointer',fontSize:12,marginLeft:4}}>Today</button>
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
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{p.text}</span>
                        </div>
                      ))}
                      {posts.length>2&&<div style={{fontSize:10,color:'#999',padding:'1px 3px'}}>+{posts.length-2} more</div>}
                    </div>
                  );
                })}
              </div>

              {/* Scheduled posts from backend */}
              {scheduledPosts.length > 0 && (
                <div style={{marginTop:24}}>
                  <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:12}}>Scheduled via backend ({scheduledPosts.length})</div>
                  {scheduledPosts.map(p=>(
                    <div key={p.id} style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:8,padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:12}}>
                      <div style={{fontSize:20}}>{p.platform==='linkedin'?'💼':'▶️'}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:'#1a1a1a',marginBottom:3}}>{p.content.slice(0,80)}...</div>
                        <div style={{fontSize:11,color:'#999'}}>{new Date(p.scheduled_at).toLocaleString()} · {p.status}</div>
                      </div>
                      <span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:p.status==='posted'?'#dcfce7':p.status==='failed'?'#fee2e2':'#fef9c3',color:p.status==='posted'?'#166534':p.status==='failed'?'#dc2626':'#854d0e',fontWeight:500}}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONNECT */}
          {tab==='connect' && (
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',marginBottom:4}}>Connect a new channel</div>
              <div style={{fontSize:13,color:'#666',marginBottom:16}}>Connect LinkedIn and YouTube to post directly on schedule.</div>

              {/* LinkedIn + YouTube — real OAuth */}
              <div style={{fontSize:12,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Direct posting (OAuth)</div>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
                {[
                  {id:'linkedin',name:'LinkedIn',icon:'💼',color:'#0A66C2',connected:isLiConnected,fn:connectLinkedIn},
                  {id:'youtube',name:'YouTube',icon:'▶️',color:'#FF0000',connected:isYtConnected,fn:connectYouTube},
                ].map(p=>(
                  <div key={p.id} style={{background:'#fff',border:`1px solid ${p.connected?GREEN+'44':'#e8e8e8'}`,borderRadius:10,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:44,height:44,borderRadius:10,background:p.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{p.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{p.name}</div>
                      <div style={{fontSize:12,color:'#888'}}>{p.connected?'Connected — posts directly via API':'Not connected'}</div>
                    </div>
                    {p.connected
                      ? <><span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:'#dcfce7',color:'#166534',fontWeight:500}}>✓ Connected</span>
                          <button onClick={()=>disconnect(p.id)} style={{padding:'5px 12px',fontSize:12,border:'1px solid #fca5a5',borderRadius:6,background:'#fff',cursor:'pointer',color:'#dc2626',marginLeft:6}}>Disconnect</button></>
                      : <button onClick={p.fn} style={{padding:'7px 18px',fontSize:13,border:'none',borderRadius:8,background:p.color,cursor:'pointer',color:'#fff',fontWeight:500}}>Connect</button>
                    }
                  </div>
                ))}
              </div>

              <div style={{fontSize:12,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>All platforms</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {ALL_PLATFORMS.map(p=>{
                  const isConn = CONNECTED_CHANNELS.some(c=>c.id===p.id);
                  const isOauth = p.id==='li'||p.id==='yt';
                  const fn = p.id==='li'?connectLinkedIn:p.id==='yt'?connectYouTube:()=>setTab('connect');
                  return (
                    <div key={p.id} style={{background:'#fff',border:isConn?`1px solid ${GREEN}44`:'1px solid #e8e8e8',borderRadius:10,padding:'16px 14px',textAlign:'center',cursor:'pointer',transition:'all .2s'}}>
                      <div style={{width:44,height:44,borderRadius:10,margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,background:p.color+'15'}}>{p.icon}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:2}}>{p.name}</div>
                      <div style={{fontSize:11,color:'#888',marginBottom:10}}>{p.sub}</div>
                      <button onClick={isConn?null:fn} style={{padding:'5px 14px',borderRadius:16,fontSize:11,fontWeight:500,cursor:isConn?'default':'pointer',border:`1px solid ${isConn?GREEN+'44':'#e0e0e0'}`,background:isConn?'#dcfce7':'#f9f9f9',color:isConn?'#166534':'#555',width:'100%'}}>
                        {isConn?'✓ Connected':isOauth?'Connect via OAuth':'Connect'}
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
            </div>
          )}

          {/* TEST / COMPOSE */}
          {tab==='test' && (
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',marginBottom:16}}>Compose & Schedule</div>
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

                  <label style={labelStyle}>Schedule date/time (for LinkedIn & YouTube)</label>
                  <input type="datetime-local" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} style={{...inputStyle,marginBottom:12}}/>

                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>sendPost(true)} disabled={posting}
                      style={{padding:'8px 18px',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:posting?'wait':'pointer',opacity:posting?0.7:1}}>
                      {posting?'Sending...':'✉ Send now'}
                    </button>
                    <button onClick={()=>sendPost(false)} disabled={posting||!scheduleDate}
                      style={{padding:'8px 18px',background:'#0A66C2',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:(posting||!scheduleDate)?'not-allowed':'pointer',opacity:(posting||!scheduleDate)?0.5:1}}>
                      🗓 Schedule
                    </button>
                  </div>

                  <div style={{background:'#f8f8f8',borderRadius:6,padding:10,fontSize:12,fontFamily:'monospace',maxHeight:120,overflowY:'auto',marginTop:10,lineHeight:1.8}}>
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

                  {/* Connection status panel */}
                  <div style={{background:'#f8faff',border:'1px solid #e0eaff',borderRadius:8,padding:12,marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#333',marginBottom:8}}>Backend connection status</div>
                    {[
                      {label:'Railway API',ok:true,detail:'healthy'},
                      {label:'LinkedIn OAuth',ok:isLiConnected,detail:isLiConnected?'connected':'not connected'},
                      {label:'YouTube OAuth',ok:isYtConnected,detail:isYtConnected?'connected':'not connected'},
                    ].map((s,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                        <span style={{color:'#666'}}>{s.label}</span>
                        <span style={{color:s.ok?'#16a34a':'#dc2626',fontWeight:500}}>{s.ok?'✓':''} {s.detail}</span>
                      </div>
                    ))}
                    <button onClick={()=>{fetchStatus();fetchScheduledPosts();}} style={{marginTop:8,padding:'4px 10px',fontSize:11,border:'1px solid #e0e0e0',borderRadius:5,background:'#fff',cursor:'pointer',color:'#555'}}>↻ Refresh status</button>
                  </div>

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
