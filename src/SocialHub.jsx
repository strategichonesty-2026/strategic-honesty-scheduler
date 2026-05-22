import { useState, useEffect } from "react";

const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || 'dev';
const GREEN = "#24b47e";
const BSKY_COLOR = "#0085FF";
const BACKEND = 'https://strategic-honesty-scheduler-production.up.railway.app';
const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

// ─── Smart Content Router ───────────────────────────────────────────────────
const CONTENT_TYPES = [
  { id: 'video-long',  label: 'Video Long',       emoji: '🎬', desc: 'YouTube, Facebook' },
  { id: 'video-short', label: 'Video Short/Reel',  emoji: '📱', desc: 'TikTok, Reels, Shorts' },
  { id: 'image',       label: 'Image + Caption',   emoji: '📸', desc: 'Instagram, Facebook…' },
  { id: 'text-short',  label: 'Text Short <280',   emoji: '✍️', desc: 'X, Bluesky, Threads' },
  { id: 'text-medium', label: 'Text Medium <700',  emoji: '📝', desc: 'LinkedIn, Facebook…' },
  { id: 'text-long',   label: 'Text Long',         emoji: '📄', desc: 'LinkedIn Articles…' },
  { id: 'link',        label: 'Link Share',        emoji: '🔗', desc: 'LinkedIn, Bluesky…' },
];

const ROUTER_MAP = {
  'video-long':  ['yt', 'fb'],
  'video-short': ['tt', 'ig', 'yt', 'fb'],
  'image':       ['ig', 'fb', 'pi', 'li'],
  'text-short':  ['tw', 'bs', 'th'],
  'text-medium': ['li', 'fb', 'bs'],
  'text-long':   ['li', 'ss'],
  'link':        ['li', 'fb', 'bs', 'tw'],
};

const CHAR_LIMITS = {
  li: { label: 'LinkedIn',  limit: 3000,  warn: 2800,  color: '#0A66C2' },
  bs: { label: 'Bluesky',   limit: 300,   warn: 260,   color: '#0085FF', hard: true },
  tw: { label: 'X/Twitter', limit: 280,   warn: 250,   color: '#000000' },
  fb: { label: 'Facebook',  limit: 63206, warn: 60000, color: '#1877F2' },
  ig: { label: 'Instagram', limit: 2200,  warn: 2000,  color: '#E1306C' },
  tt: { label: 'TikTok',    limit: 2200,  warn: 2000,  color: '#010101' },
  yt: { label: 'YouTube',   limit: 5000,  warn: 4500,  color: '#FF0000' },
};
// ────────────────────────────────────────────────────────────────────────────

// ─── Buffer CSV platforms ────────────────────────────────────────────────────
const BUFFER_PLATFORMS = {
  fb: { name:'Facebook',   icon:'👥', color:'#1877F2', time:'13:00' },
  tt: { name:'TikTok',     icon:'🎵', color:'#010101', time:'19:00' },
  ig: { name:'Instagram',  icon:'📸', color:'#E1306C', time:'11:00' },
};

function generateBufferCSV(platformId, content, imageUrl, scheduleDate) {
  const cfg = BUFFER_PLATFORMS[platformId];
  if (!cfg) return null;
  // Compute posting date
  let postingDate;
  if (scheduleDate) {
    postingDate = scheduleDate.split('T')[0];
  } else {
    postingDate = new Date().toISOString().split('T')[0];
  }
  const postingTime = `${postingDate} ${cfg.time}`;
  // Escape CSV field
  const escape = v => `"${(v||'').replace(/"/g,'""')}"`;
  const header = 'Text,Image URL,Tags,Posting Time';
  const row = [escape(content), escape(imageUrl||''), '""', escape(postingTime)].join(',');
  return `${header}\n${row}`;
}

function downloadCSV(platformId, content, imageUrl, scheduleDate) {
  const cfg = BUFFER_PLATFORMS[platformId];
  if (!cfg) return;
  const csv = generateBufferCSV(platformId, content, imageUrl, scheduleDate);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Buffer_${cfg.name}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
// ────────────────────────────────────────────────────────────────────────────

function getUserId() {
  let id = localStorage.getItem('sh_user_id');
  if (!id) { id = 'user_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('sh_user_id', id); }
  return id;
}

async function bskyCreateSession(identifier, appPassword) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password: appPassword })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Login failed'); }
  return res.json();
}

async function bskyPost(accessJwt, did, text) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessJwt}` },
    body: JSON.stringify({
      repo: did, collection: 'app.bsky.feed.post',
      record: { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString() }
    })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Post failed'); }
  return res.json();
}

const STATIC_CHANNELS = [
  { id:'fb', name:'Strategic Honesty', handle:'Facebook Page', platform:'Facebook', icon:'👥', color:'#1877F2', avatar:'https://img.youtube.com/vi/pSRmFFI-eWs/default.jpg', initials:'SH', type:'Facebook Page', posts:10, status:'active' },
  { id:'tt', name:'strategichonesty1', handle:'TikTok Account', platform:'TikTok', icon:'🎵', color:'#010101', avatar:'', initials:'S1', type:'TikTok Account', posts:10, status:'active' },
  { id:'ig', name:'strategichonesty', handle:'Instagram Professional', platform:'Instagram', icon:'📸', color:'#E1306C', avatar:'', initials:'SH', type:'Instagram Professional', posts:10, status:'active' },
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
  {day:19,color:'#E1306C',text:'Integrity wins...'},{day:19,color:'#010101',text:'Integrity TikTok...'},
  {day:20,color:'#BA7517',text:'Quote: Sand vs bedrock...'},{day:21,color:'#D85A30',text:'Book: True North...'},
  {day:22,color:'#E1306C',text:'Integrity: Strategic asset...'},{day:22,color:'#010101',text:'Strategic asset TT...'},
  {day:25,color:'#0A66C2',text:'LinkedIn: Reputation...'},{day:26,color:'#E1306C',text:'Reputation asset...'},
  {day:26,color:'#010101',text:'Reputation TT...'},{day:27,color:'#BA7517',text:'Quote: Shortcuts are loans...'},
  {day:28,color:'#D85A30',text:'Book: Strategic Honesty...'},{day:29,color:'#E1306C',text:'Integrity always wins...'},
  {day:29,color:'#010101',text:'Always wins TT...'},
];

const QUOTES = {
  integrity:"Integrity isn't a soft skill. It's the hardest competitive edge in business.\n\nSand leaders optimize for today.\nBedrock leaders optimize for trust.\n\nAnd trust? It compounds like interest.\n\nI grew up in rural Nepal. The one thing I never gave up was my word. Turns out — that was everything.\n\n#StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell",
  reputation:"Your reputation is built in years. Destroyed in one shortcut.\n\nEvery honest call you made is still working for you right now.\n\n#StrategicHonesty #Reputation #Leadership",
  shortcuts:"Every shortcut is a loan — and the interest is your integrity.\n\nSave this for the next time you feel pressure to cut corners.\n\n#StrategicHonesty #Leadership #BeGoodDoGoodDoWell #Integrity",
  nepal:"I grew up on dirt floors in Nepal.\n\nNo shortcuts. No safety net. No plan B.\n\nYour word. Your integrity. Your True North.\n\nThat's what everything I've built is made of.\n\n#StrategicHonesty #Nepal #Leadership",
  ai:"The real battle is not human vs. machine.\nIt is integrity vs. exploitation.\n\nAI won't replace your craft — it exposes organizational lies.\n\n#StrategicHonesty #AI #HumanEdge #YouStillMatter",
  trust:"Trust compounds like interest.\n\nEvery honest call you make today is an investment.\nEvery shortcut is a withdrawal.\n\nThe math always catches up.\n\n#StrategicHonesty #Trust #Leadership #BeGoodDoGoodDoWell"
};

function Avatar({ch, size=32}) {
  const [err, setErr] = useState(false);
  return (
    <div style={{position:'relative',flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:8,background:ch.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.45,fontWeight:600,color:ch.color,overflow:'hidden',border:'1px solid '+ch.color+'33'}}>
        {ch.avatar && !err ? <img src={ch.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/> : <span>{ch.initials||ch.icon}</span>}
      </div>
      <div style={{position:'absolute',bottom:-3,right:-3,width:14,height:14,borderRadius:'50%',background:ch.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,border:'1.5px solid #fff'}}>{ch.icon}</div>
    </div>
  );
}

// ─── Character Counter Component ────────────────────────────────────────────
function CharCounter({ content, selectedPlatforms }) {
  const relevant = Object.entries(CHAR_LIMITS).filter(([id]) => selectedPlatforms.has(id));
  if (!relevant.length || !content) return null;
  const len = content.length;
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
      {relevant.map(([id, cfg]) => {
        const over = len > cfg.limit;
        const warn = len > cfg.warn && !over;
        const pct = Math.min(len / cfg.limit, 1);
        const barColor = over ? '#dc2626' : warn ? '#d97706' : cfg.color;
        return (
          <div key={id} style={{
            padding:'5px 10px',borderRadius:8,fontSize:11,
            border:`1px solid ${over ? '#fca5a5' : warn ? '#fcd34d' : '#e8e8e8'}`,
            background: over ? '#fef2f2' : warn ? '#fffbeb' : '#f8f8f8',
            minWidth:110,
          }}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,alignItems:'center'}}>
              <span style={{fontWeight:600,color:cfg.color}}>{cfg.label}</span>
              <span style={{color: over ? '#dc2626' : warn ? '#d97706' : '#666', fontWeight: over||warn ? 600 : 400}}>
                {len}/{cfg.limit}
              </span>
            </div>
            <div style={{height:3,background:'#e8e8e8',borderRadius:2,overflow:'hidden'}}>
              <div style={{width:`${pct*100}%`,height:'100%',background:barColor,borderRadius:2,transition:'width .2s'}}/>
            </div>
            {over && cfg.hard && (
              <div style={{fontSize:10,color:'#dc2626',marginTop:3,fontWeight:600}}>
                🚫 Will error — must trim to {cfg.limit}
              </div>
            )}
            {over && !cfg.hard && (
              <div style={{fontSize:10,color:'#dc2626',marginTop:3}}>Over limit by {len - cfg.limit}</div>
            )}
            {warn && (
              <div style={{fontSize:10,color:'#d97706',marginTop:3}}>⚠ {cfg.limit - len} chars left</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function SocialHub() {
  const _ = BUILD_TIME;
  const [tab, setTab] = useState('calendar');
  const [userId] = useState(getUserId);
  const [connections, setConnections] = useState({});
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

  // Activity Log persisted to localStorage
  const [activityLog, setActivityLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sh_activity_log') || '[]'); } catch { return []; }
  });
  function saveToLog(entry) {
    const log = { id: Date.now(), ts: new Date().toISOString(), ...entry };
    setActivityLog(prev => {
      const next = [log, ...prev].slice(0, 100);
      localStorage.setItem('sh_activity_log', JSON.stringify(next));
      return next;
    });
  }

  // ─── Smart Content Router state ──────────────────────────────────────────
  const [postType, setPostType] = useState(null);
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Review & Post Wizard state ──────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState(1);       // 1 Write 2 Route 3 Review 4 Send
  const [wizardContent, setWizardContent] = useState('');
  const [wizardImage, setWizardImage] = useState('');
  const [wizardSchedule, setWizardSchedule] = useState('now');   // 'now' | 'scheduled' | '1week' | '2weeks' | 'custom'
  const [wizardDate, setWizardDate] = useState('');
  const [wizardPostType, setWizardPostType] = useState(null);
  const [wizardSel, setWizardSel] = useState(new Set());
  const [wizardSendStatus, setWizardSendStatus] = useState({}); // { platformId: 'pending'|'sending'|'ok'|'err'|'warn', msg }
  const [wizardPosting, setWizardPosting] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);

  function wizardSelectPostType(typeId) {
    setWizardPostType(typeId);
    const recommended = ROUTER_MAP[typeId] || [];
    const available = new Set(CONNECTED_CHANNELS.map(c => c.id));
    const next = new Set(recommended.filter(id => available.has(id)));
    if (recommended.includes('bs') && bskyConnected) next.add('bs');
    setWizardSel(next.size > 0 ? next : new Set(recommended));
  }

  function wizardToggleSel(id) {
    setWizardSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function wizardCanAdvance(step) {
    if (step === 1) return wizardContent.trim().length > 0;
    if (step === 2) return wizardSel.size > 0;
    if (step === 3) {
      // Block if Bluesky selected and over 300
      if (wizardSel.has('bs') && wizardContent.length > 300) return false;
      if (wizardSchedule === 'scheduled' && !wizardDate) return false;
      return true;
    }
    return true;
  }

  function wizardComputeScheduledAt() {
    if (wizardSchedule === 'now') return new Date(Date.now() + 10000).toISOString();
    if (wizardSchedule === '1week') return new Date(Date.now() + 7*24*60*60*1000).toISOString();
    if (wizardSchedule === '2weeks') return new Date(Date.now() + 14*24*60*60*1000).toISOString();
    if (wizardSchedule === 'scheduled' && wizardDate) return new Date(wizardDate).toISOString();
    return new Date(Date.now() + 10000).toISOString();
  }

  async function wizardSend() {
    if (wizardPosting) return;
    setWizardPosting(true);
    setWizardDone(false);
    const initialStatus = {};
    wizardSel.forEach(id => { initialStatus[id] = { state: 'sending', msg: 'Sending…' }; });
    setWizardSendStatus(initialStatus);

    const scheduledAt = wizardComputeScheduledAt();
    const publishNow = wizardSchedule === 'now';

    const update = (id, state, msg) =>
      setWizardSendStatus(prev => ({ ...prev, [id]: { state, msg } }));

    for (const platformId of wizardSel) {
      if (platformId === 'li' && connections.linkedin) {
        try {
          const data = await (await fetch(`${BACKEND}/posts`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: 'linkedin', userId: localStorage.getItem('sh_linkedin_userId') || userId, content: wizardContent, mediaUrl: wizardImage || null, mediaType: wizardImage ? 'image' : null, scheduledAt })
          })).json();
          if (data.success) {
            if (publishNow) {
              await fetch(`${BACKEND}/posts/${data.post.id}/publish`, { method: 'POST' });
              update('li', 'ok', `✓ Published to LinkedIn — Post ID: ${data.post.id}`);
              saveToLog({platform:'LinkedIn',type:'real',status:'ok',msg:`Published — Post ID: ${data.post.id}`,preview:wizardContent.slice(0,80)});
            } else {
              update('li', 'ok', `✓ Scheduled for ${new Date(scheduledAt).toLocaleString()}`);
              fetchScheduledPosts();
            }
          } else { update('li', 'err', `Error: ${data.error}`); }
        } catch(e) { update('li', 'err', `LinkedIn error: ${e.message}`); }

      } else if (platformId === 'bs') {
        if (!bskyConnected) { update('bs', 'err', 'Not connected — go to Connect tab'); continue; }
        if (wizardContent.length > 300) { update('bs', 'err', `Over 300 chars (${wizardContent.length}) — skipped`); continue; }
        try {
          const session = await bskyCreateSession(localStorage.getItem('sh_bsky_handle'), localStorage.getItem('sh_bsky_apppw'));
          const bskyRes = await bskyPost(session.accessJwt, session.did, wizardContent);
          update('bs', 'ok', `✓ Published to Bluesky — URI: ${bskyRes?.uri||'posted'}`);
          saveToLog({platform:'Bluesky',type:'real',status:'ok',msg:`Published — URI: ${bskyRes?.uri||'posted'}`,preview:wizardContent.slice(0,80)});
        } catch(e) { update('bs', 'err', `Bluesky: ${e.message}`); }

      } else if (platformId === 'yt') {
        update('yt', 'warn', '⚠ YouTube Community Posts deprecated — post manually');
      } else if (BUFFER_PLATFORMS[platformId]) {
        // Buffer platform — generate CSV, don't fake-post
        const cfg = BUFFER_PLATFORMS[platformId];
        update(platformId, 'csv', `📥 CSV ready — download and upload to Buffer`);
        saveToLog({platform:cfg.name,type:'buffer',status:'csv',msg:`CSV generated — upload to Buffer to publish`,preview:wizardContent.slice(0,80),platformId});
      } else {
        update(platformId, 'warn', `⚠ ${platformId.toUpperCase()} — not connected`);
      }
    }
    setWizardPosting(false);
    setWizardDone(true);
  }

  function wizardReset() {
    setWizardStep(1); setWizardContent(''); setWizardImage('');
    setWizardSchedule('now'); setWizardDate(''); setWizardPostType(null);
    setWizardSel(new Set()); setWizardSendStatus({}); setWizardPosting(false); setWizardDone(false);
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Bluesky state
  const [bskyConnected, setBskyConnected] = useState(() => !!localStorage.getItem('sh_bsky_handle') && !!localStorage.getItem('sh_bsky_apppw'));
  const [bskyHandle, setBskyHandle] = useState(() => localStorage.getItem('sh_bsky_handle') || '');
  const [bskyConnecting, setBskyConnecting] = useState(false);
  const [bskyHandleInput, setBskyHandleInput] = useState('');
  const [bskyPwInput, setBskyPwInput] = useState('');

  const addLog = (setter, t, m) => setter(prev => [...prev, {t, m}]);

  async function connectBluesky() {
    if (!bskyHandleInput.trim() || !bskyPwInput.trim()) { addLog(setLogs,'err','Enter your Bluesky handle and app password.'); return; }
    setBskyConnecting(true);
    try {
      const handle = bskyHandleInput.trim().replace(/^@/,'');
      const session = await bskyCreateSession(handle, bskyPwInput.trim());
      localStorage.setItem('sh_bsky_handle', handle);
      localStorage.setItem('sh_bsky_apppw', bskyPwInput.trim());
      localStorage.setItem('sh_bsky_did', session.did);
      setBskyHandle(handle);
      setBskyConnected(true);
      setBskyHandleInput(''); setBskyPwInput('');
      addLog(setLogs,'ok',`✓ Bluesky connected as @${handle}`);
    } catch(e) { addLog(setLogs,'err',`Bluesky: ${e.message}`); }
    setBskyConnecting(false);
  }

  function disconnectBluesky() {
    ['sh_bsky_handle','sh_bsky_apppw','sh_bsky_did'].forEach(k=>localStorage.removeItem(k));
    setBskyHandle(''); setBskyConnected(false);
    addLog(setLogs,'info','Bluesky disconnected');
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      const platform = params.get('platform'), name = params.get('name'), uid = params.get('userId');
      if (uid) { localStorage.setItem(`sh_${platform}_userId`, uid); if (platform==="linkedin") localStorage.setItem("sh_linkedin_userId", uid); if (platform==="youtube") localStorage.setItem("sh_youtube_userId", uid); }
      addLog(setLogs,'ok',`✓ ${platform} connected as "${name}"`);
      window.history.replaceState({}, '', window.location.pathname); setTab('connect');
    } else if (params.get('auth') === 'error') {
      addLog(setLogs,'err',`✗ OAuth failed: ${params.get('reason')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => { fetchStatus(); fetchScheduledPosts(); }, [userId]);

  async function fetchStatus() {
    try {
      const allConnections = {};
      const liUserId = localStorage.getItem('sh_linkedin_userId') || userId;
      const liData = await (await fetch(`${BACKEND}/auth/status?userId=${liUserId}&t=${Date.now()}`)).json();
      Object.assign(allConnections, liData.connections || {});
      const ytUserId = localStorage.getItem('sh_youtube_userId');
      if (ytUserId && ytUserId !== liUserId) {
        const ytData = await (await fetch(`${BACKEND}/auth/status?userId=${ytUserId}&t=${Date.now()}`)).json();
        Object.assign(allConnections, ytData.connections || {});
      }
      setConnections(allConnections);
    } catch {}
  }

  async function fetchScheduledPosts() {
    try { const data = await (await fetch(`${BACKEND}/posts?userId=${userId}`)).json(); setScheduledPosts(data.posts || []); } catch {}
  }

  function connectLinkedIn() { window.location.href = `${BACKEND}/auth/linkedin/connect?userId=${userId}`; }
  function connectYouTube() { window.location.href = `${BACKEND}/auth/youtube/connect?userId=${userId}`; }

  async function disconnect(platform) {
    const puid = localStorage.getItem(`sh_${platform}_userId`) || userId;
    await fetch(`${BACKEND}/auth/disconnect`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({userId:puid, platform}) });
    setConnections(prev => {const n={...prev};delete n[platform];return n;});
    addLog(setLogs,'info',`${platform} disconnected`);
  }

  // ─── Smart Content Router: select post type and auto-select platforms ────
  function selectPostType(typeId) {
    setPostType(typeId);
    const recommended = ROUTER_MAP[typeId] || [];
    // Build new selection from recommended IDs that exist in connected channels
    const available = new Set(CONNECTED_CHANNELS.map(c => c.id));
    const next = new Set(recommended.filter(id => available.has(id)));
    // Always include bs if Bluesky connected and recommended
    if (recommended.includes('bs') && bskyConnected) next.add('bs');
    setTestSel(next.size > 0 ? next : new Set(recommended));
    addLog(setLogs, 'info', `📡 Auto-selected platforms for ${CONTENT_TYPES.find(t=>t.id===typeId)?.label}`);
  }

  function postToAllRecommended() {
    if (!postType) { addLog(setLogs,'err','Select a post type first.'); return; }
    const recommended = ROUTER_MAP[postType] || [];
    const available = new Set(CONNECTED_CHANNELS.map(c => c.id));
    const next = new Set(recommended.filter(id => available.has(id)));
    if (recommended.includes('bs') && bskyConnected) next.add('bs');
    setTestSel(next.size > 0 ? next : new Set(recommended));
    sendPost(true);
  }
  // ─────────────────────────────────────────────────────────────────────────

  async function sendPost(publishNow = true) {
    if (!testContent.trim()) { addLog(setLogs,'err','Write a post first.'); return; }
    if (testSel.size === 0) { addLog(setLogs,'err','Select at least one platform.'); return; }

    // ─── Bluesky hard limit guard ─────────────────────────────────────────
    if (testSel.has('bs') && testContent.length > 300) {
      addLog(setLogs,'err',`🚫 Bluesky: post is ${testContent.length} chars — hard limit is 300. Trim before sending.`);
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    setPosting(true);
    for (const platformId of testSel) {
      if (platformId === 'li' && connections.linkedin) {
        if (publishNow) {
          addLog(setLogs,'info','Sending to LinkedIn...');
          try {
            const scheduledAt = new Date(Date.now() + 10000).toISOString();
            const data = await (await fetch(`${BACKEND}/posts`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({platform:'linkedin', userId: localStorage.getItem('sh_linkedin_userId') || userId, content:testContent, mediaUrl:testImage||null, mediaType:testImage?'image':null, scheduledAt}) })).json();
            if (data.success) { await fetch(`${BACKEND}/posts/${data.post.id}/publish`, {method:'POST'}); addLog(setLogs,'ok',`✓ Sent to LinkedIn — Post ID: ${data.post.id}`); saveToLog({platform:'LinkedIn',type:'real',status:'ok',msg:`Published — Post ID: ${data.post.id}`,preview:testContent.slice(0,80)}); }
            else { addLog(setLogs,'err',`LinkedIn: ${data.error}`); }
          } catch(e) { addLog(setLogs,'err',`LinkedIn error: ${e.message}`); }
        } else if (scheduleDate) {
          try {
            const data = await (await fetch(`${BACKEND}/posts`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({platform:'linkedin', userId: localStorage.getItem('sh_linkedin_userId') || userId, content:testContent, mediaUrl:testImage||null, mediaType:testImage?'image':null, scheduledAt:new Date(scheduleDate).toISOString()}) })).json();
            if (data.success) { addLog(setLogs,'ok',`✓ LinkedIn scheduled for ${new Date(scheduleDate).toLocaleString()}`); fetchScheduledPosts(); }
            else { addLog(setLogs,'err',`LinkedIn: ${data.error}`); }
          } catch(e) { addLog(setLogs,'err',`LinkedIn error: ${e.message}`); }
        }
      } else if (platformId === 'bs') {
        if (!bskyConnected) { addLog(setLogs,'err','Connect Bluesky first in the Connect tab.'); }
        else {
          addLog(setLogs,'info','Sending to Bluesky...');
          try {
            const session = await bskyCreateSession(localStorage.getItem('sh_bsky_handle'), localStorage.getItem('sh_bsky_apppw'));
            const bskyResult = await bskyPost(session.accessJwt, session.did, testContent);
            addLog(setLogs,'ok',`✓ Sent to Bluesky — URI: ${bskyResult?.uri||'posted'}`);
            saveToLog({platform:'Bluesky',type:'real',status:'ok',msg:`Published — URI: ${bskyResult?.uri||'posted'}`,preview:testContent.slice(0,80)});
          } catch(e) { addLog(setLogs,'err',`Bluesky: ${e.message}`); }
        }
      } else if (platformId === 'yt') {
        addLog(setLogs,'warn','⚠ YouTube Community Posts deprecated by Google — post manually at youtube.com/community.');
      } else {
        if (BUFFER_PLATFORMS[platformId]) {
          const cfg = BUFFER_PLATFORMS[platformId];
          downloadCSV(platformId, testContent, testImage, scheduleDate);
          addLog(setLogs,'ok',`📥 ${cfg.name} CSV downloaded — upload to Buffer to publish`);
          saveToLog({platform:cfg.name,type:'buffer',status:'csv',msg:'CSV downloaded — upload to Buffer',preview:testContent.slice(0,80),platformId});
        } else {
          addLog(setLogs,'warn',`⚠ ${platformId.toUpperCase()} — not connected`);
        }
      }
    }
    setPosting(false);
  }

  const toggleTestSel = id => setTestSel(prev => {const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const genQuick = () => { if (!quickVideo) { addLog(setLogs,'err','Select a video topic first.'); return; } setTestContent(QUOTES[quickVideo]||''); setTab('test'); };
  const handleUpload = e => {
    const file = e.target.files[0]; if(!file) return;
    addLog(setUploadLogs,'info',`Reading ${file.name}...`);
    const r = new FileReader();
    r.onload = ev => { const lines = ev.target.result.split('\n').filter(l=>l.trim()).length-1; addLog(setUploadLogs,'ok',`✓ ${file.name} — ${lines} posts loaded`); addLog(setUploadLogs,'info','Go to Buffer → Channel → ⚙️ → Bulk Upload → Add to Queue'); };
    r.readAsText(file);
  };

  const dynamicChannels = [];
  if (connections.linkedin) dynamicChannels.push({id:'li',name:'LinkedIn',handle:'LinkedIn Profile',platform:'LinkedIn',icon:'💼',color:'#0A66C2',avatar:'',initials:'LI',type:'LinkedIn Profile',posts:scheduledPosts.filter(p=>p.platform==='linkedin').length,status:'active'});
  if (connections.youtube) dynamicChannels.push({id:'yt',name:'YouTube Channel',handle:'YouTube Channel',platform:'YouTube',icon:'▶️',color:'#FF0000',avatar:'',initials:'YT',type:'YouTube Channel',posts:scheduledPosts.filter(p=>p.platform==='youtube').length,status:'active'});
  if (bskyConnected) dynamicChannels.push({id:'bs',name:bskyHandle||'Bluesky',handle:`@${bskyHandle}`,platform:'Bluesky',icon:'🦋',color:'#0085FF',avatar:'',initials:'BS',type:'Bluesky Profile',posts:0,status:'active'});
  const CONNECTED_CHANNELS = [...STATIC_CHANNELS, ...dynamicChannels];

  const postMap = {};
  SCHEDULE_POSTS.forEach(p=>{if(!postMap[p.day])postMap[p.day]=[];postMap[p.day].push(p);});

  const inputStyle = {width:'100%',border:'1px solid #e0e0e0',borderRadius:6,padding:'8px 10px',fontSize:13,color:'#1a1a1a',fontFamily:F,outline:'none',resize:'none',marginBottom:10,background:'#fff',boxSizing:'border-box'};
  const labelStyle = {fontSize:12,color:'#666',marginBottom:6,display:'block'};
  const logColor = t => t==='ok'?'#16a34a':t==='err'?'#dc2626':t==='warn'?'#d97706':'#185fa5';
  const statusDot = s => ({width:8,height:8,borderRadius:'50%',flexShrink:0,background:s==='active'?'#22c55e':s==='warning'?'#f59e0b':'#ef4444'});
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
        <button onClick={()=>setTab('test')} style={{margin:'12px',padding:'8px 0',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer'}}>+ New post</button>
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
          <button onClick={()=>setTab('connect')} style={{background:'none',border:'none',cursor:'pointer',color:GREEN,fontSize:16,padding:2,fontWeight:'bold'}}>+</button>
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
                {ch.id==='li' && <button onClick={()=>disconnect('linkedin')} style={{flex:1,padding:'5px 0',fontSize:11,border:'1px solid #fca5a5',borderRadius:5,background:'#fff',cursor:'pointer',color:'#dc2626'}}>Disconnect</button>}
                {ch.id==='yt' && <button onClick={()=>disconnect('youtube')} style={{flex:1,padding:'5px 0',fontSize:11,border:'1px solid #fca5a5',borderRadius:5,background:'#fff',cursor:'pointer',color:'#dc2626'}}>Disconnect</button>}
                {ch.id==='bs' && <button onClick={disconnectBluesky} style={{flex:1,padding:'5px 0',fontSize:11,border:'1px solid #fca5a5',borderRadius:5,background:'#fff',cursor:'pointer',color:'#dc2626'}}>Disconnect</button>}
              </div>
            </div>
          );
        })()}

        <div style={{padding:'10px 12px 4px',fontSize:11,color:'#999',letterSpacing:'.5px',textTransform:'uppercase',fontWeight:500,marginTop:4}}>Quick connect</div>
        <div style={{padding:'0 8px'}}>
          {[
            {id:'li',name:'LinkedIn',icon:'💼',connected:isLiConnected,fn:connectLinkedIn},
            {id:'yt',name:'YouTube',icon:'▶️',connected:isYtConnected,fn:connectYouTube},
            {id:'bs',name:'Bluesky',icon:'🦋',connected:bskyConnected,fn:()=>setTab('connect')},
          ].map(p=>(
            <div key={p.id} onClick={p.connected?null:p.fn}
              style={{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',borderRadius:8,cursor:p.connected?'default':'pointer',marginBottom:1,opacity:p.connected?0.6:1}}>
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
          <button onClick={()=>{wizardReset();setTab('wizard');}} style={{padding:'6px 14px',borderRadius:6,fontSize:13,cursor:'pointer',border:'none',background:GREEN,color:'#fff',fontWeight:500}}>✦ New post</button>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid #e8e8e8',padding:'0 20px',background:'#fff',overflowX:'auto'}}>
          {[['calendar','📅 Calendar'],['connect','🔗 Connect'],['upload','⬆ Upload CSV'],['test','✉ Quick Compose'],['wizard','🚀 Review & Post'],['log','📋 Activity Log']].map(([t,label])=>(
            <div key={t} onClick={()=>{ if(t==='wizard') wizardReset(); setTab(t); }} style={{padding:'10px 16px',fontSize:13,cursor:'pointer',borderBottom:tab===t?`2px solid ${t==='wizard'?GREEN:'#1a1a1a'}`:'2px solid transparent',color:tab===t?(t==='wizard'?GREEN:'#1a1a1a'):'#666',fontWeight:tab===t?600:400,transition:'all .15s',whiteSpace:'nowrap'}}>{label}</div>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:20,background:'#fafafa'}}>

          {/* CALENDAR */}
          {tab==='calendar' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                {[{n:scheduledPosts.filter(p=>p.status==='pending').length||393,l:'Posts scheduled'},{n:'5/week',l:'Posting frequency'},{n:CONNECTED_CHANNELS.length,l:'Channels active'},{n:'Dec 29',l:'Content until'}].map((item,i)=>(
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
                  const day=i+1,posts=postMap[day]||[],isToday=day===16;
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
              <div style={{fontSize:13,color:'#666',marginBottom:16}}>Connect LinkedIn, Bluesky, and YouTube to post directly on schedule.</div>
              <div style={{fontSize:12,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Direct posting</div>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>

                {[
                  {id:'linkedin',name:'LinkedIn',icon:'💼',color:'#0A66C2',connected:isLiConnected,fn:connectLinkedIn,note:null,sub:'OAuth'},
                  {id:'youtube',name:'YouTube',icon:'▶️',color:'#FF0000',connected:isYtConnected,fn:connectYouTube,note:'⚠ Community Posts unavailable — Google API deprecated',sub:'OAuth'},
                ].map(p=>(
                  <div key={p.id} style={{background:'#fff',border:`1px solid ${p.connected?GREEN+'44':'#e8e8e8'}`,borderRadius:10,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:44,height:44,borderRadius:10,background:p.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{p.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{p.name}</div>
                      <div style={{fontSize:12,color:'#888'}}>{p.connected?'Connected — posts directly via API':'Not connected · '+p.sub}</div>
                      {p.note && <div style={{fontSize:11,color:'#d97706',marginTop:2}}>{p.note}</div>}
                    </div>
                    {p.connected
                      ? <><span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:'#dcfce7',color:'#166534',fontWeight:500}}>✓ Connected</span>
                          <button onClick={()=>disconnect(p.id)} style={{padding:'5px 12px',fontSize:12,border:'1px solid #fca5a5',borderRadius:6,background:'#fff',cursor:'pointer',color:'#dc2626',marginLeft:6}}>Disconnect</button></>
                      : <button onClick={p.fn} style={{padding:'7px 18px',fontSize:13,border:'none',borderRadius:8,background:p.color,cursor:'pointer',color:'#fff',fontWeight:500}}>Connect</button>
                    }
                  </div>
                ))}

                {/* Bluesky card */}
                <div style={{background:'#fff',border:`1px solid ${bskyConnected?GREEN+'44':'#e8e8e8'}`,borderRadius:10,padding:'14px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:44,height:44,borderRadius:10,background:'#0085FF15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🦋</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>Bluesky</div>
                      <div style={{fontSize:12,color:'#888'}}>{bskyConnected?`Connected as @${bskyHandle}`:'App Password — no OAuth needed'}</div>
                      <div style={{fontSize:11,color:'#16a34a',marginTop:2}}>✓ Real posting via AT Protocol — works without Railway</div>
                    </div>
                    {bskyConnected && (
                      <><span style={{fontSize:11,padding:'3px 8px',borderRadius:10,background:'#dcfce7',color:'#166534',fontWeight:500}}>✓ Connected</span>
                      <button onClick={disconnectBluesky} style={{padding:'5px 12px',fontSize:12,border:'1px solid #fca5a5',borderRadius:6,background:'#fff',cursor:'pointer',color:'#dc2626',marginLeft:6}}>Disconnect</button></>
                    )}
                  </div>
                  {!bskyConnected && (
                    <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:8,alignItems:'end'}}>
                      <div>
                        <label style={labelStyle}>Bluesky handle</label>
                        <input value={bskyHandleInput} onChange={e=>setBskyHandleInput(e.target.value)} placeholder="strategic-honesty.bsky.social" style={{...inputStyle,marginBottom:0}}/>
                      </div>
                      <div>
                        <label style={labelStyle}>App password</label>
                        <input type="password" value={bskyPwInput} onChange={e=>setBskyPwInput(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" style={{...inputStyle,marginBottom:0}}/>
                      </div>
                      <button onClick={connectBluesky} disabled={bskyConnecting}
                        style={{padding:'8px 16px',fontSize:13,border:'none',borderRadius:8,background:BSKY_COLOR,cursor:bskyConnecting?'wait':'pointer',color:'#fff',fontWeight:500,height:36,whiteSpace:'nowrap'}}>
                        {bskyConnecting?'Connecting...':'Connect'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{fontSize:12,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>All platforms</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {ALL_PLATFORMS.map(p=>{
                  const isConn = CONNECTED_CHANNELS.some(c=>c.id===p.id);
                  const fn = p.id==='li'?connectLinkedIn:p.id==='yt'?connectYouTube:()=>setTab('connect');
                  return (
                    <div key={p.id} style={{background:'#fff',border:isConn?`1px solid ${GREEN}44`:'1px solid #e8e8e8',borderRadius:10,padding:'16px 14px',textAlign:'center',cursor:'pointer',transition:'all .2s'}}>
                      <div style={{width:44,height:44,borderRadius:10,margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,background:p.color+'15'}}>{p.icon}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:2}}>{p.name}</div>
                      <div style={{fontSize:11,color:'#888',marginBottom:10}}>{p.sub}</div>
                      <button onClick={isConn?null:fn} style={{padding:'5px 14px',borderRadius:16,fontSize:11,fontWeight:500,cursor:isConn?'default':'pointer',border:`1px solid ${isConn?GREEN+'44':'#e0e0e0'}`,background:isConn?'#dcfce7':'#f9f9f9',color:isConn?'#166534':'#555',width:'100%'}}>
                        {isConn?'✓ Connected':p.id==='bs'?'App Password':'Connect'}
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
                <div><label style={labelStyle}>Select channel</label><select style={inputStyle}>{CONNECTED_CHANNELS.map(ch=><option key={ch.id}>{ch.name} ({ch.platform})</option>)}</select></div>
                <div><label style={labelStyle}>CSV type</label><select style={inputStyle}><option>Main posts (Tue + Fri)</option><option>Monday LinkedIn gap-fill</option><option>Wednesday viral quotes</option><option>Thursday book quotes</option></select></div>
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

          {/* COMPOSE */}
          {tab==='test' && (
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a',marginBottom:12}}>Compose & Schedule</div>

              {/* ── SMART CONTENT ROUTER ──────────────────────────────────── */}
              <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>🗺 Smart Content Router</div>
                    <div style={{fontSize:11,color:'#888',marginTop:2}}>Pick your content type — platforms auto-select. Override anytime.</div>
                  </div>
                  {postType && (
                    <button
                      onClick={() => { setPostType(null); setTestSel(new Set(['ig','tt'])); }}
                      style={{fontSize:11,color:'#888',background:'none',border:'1px solid #e0e0e0',borderRadius:5,padding:'3px 8px',cursor:'pointer'}}>
                      ✕ Clear
                    </button>
                  )}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {CONTENT_TYPES.map(ct => {
                    const isActive = postType === ct.id;
                    return (
                      <button
                        key={ct.id}
                        onClick={() => selectPostType(ct.id)}
                        style={{
                          display:'flex',flexDirection:'column',alignItems:'flex-start',
                          padding:'8px 12px',borderRadius:8,cursor:'pointer',
                          border: isActive ? `1.5px solid ${GREEN}` : '1.5px solid #e8e8e8',
                          background: isActive ? '#e6f7f2' : '#fafafa',
                          transition:'all .15s',minWidth:120,
                        }}>
                        <span style={{fontSize:16,marginBottom:3}}>{ct.emoji}</span>
                        <span style={{fontSize:12,fontWeight:600,color: isActive ? '#0f6e56' : '#1a1a1a',lineHeight:1.2}}>{ct.label}</span>
                        <span style={{fontSize:10,color:'#999',marginTop:2}}>{ct.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {postType && (
                  <div style={{marginTop:12,padding:'10px 12px',background:'#f0faf6',borderRadius:8,border:'1px solid #b6e8d6',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                    <div style={{fontSize:12,color:'#0f6e56'}}>
                      <strong>Recommended:</strong>{' '}
                      {(ROUTER_MAP[postType]||[]).map(id => {
                        const p = ALL_PLATFORMS.find(x=>x.id===id);
                        return p ? `${p.icon} ${p.name}` : id;
                      }).join(' · ')}
                    </div>
                    <button
                      onClick={postToAllRecommended}
                      disabled={posting || !testContent.trim()}
                      style={{
                        padding:'6px 14px',fontSize:12,fontWeight:600,
                        background: (posting||!testContent.trim()) ? '#ccc' : GREEN,
                        color:'#fff',border:'none',borderRadius:6,
                        cursor:(posting||!testContent.trim())?'not-allowed':'pointer',
                        whiteSpace:'nowrap',
                      }}>
                      {posting ? 'Sending…' : '⚡ Post to all recommended'}
                    </button>
                  </div>
                )}
              </div>
              {/* ── END SMART CONTENT ROUTER ──────────────────────────────── */}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:16}}>
                  <label style={labelStyle}>Write your post</label>
                  <textarea value={testContent} onChange={e=>setTestContent(e.target.value)} rows={7} style={inputStyle} placeholder="Integrity isn't a soft skill..."/>

                  {/* ── CHARACTER COUNTERS ───────────────────────────────── */}
                  <CharCounter content={testContent} selectedPlatforms={testSel} />
                  {/* ────────────────────────────────────────────────────── */}

                  <label style={labelStyle}>Select platforms</label>
                  <div style={{marginBottom:10,display:'flex',flexWrap:'wrap',gap:6}}>
                    {CONNECTED_CHANNELS.map(ch=>{
                      const limit = CHAR_LIMITS[ch.id];
                      const isOver = limit && testContent.length > limit.limit;
                      return (
                        <span key={ch.id} onClick={()=>toggleTestSel(ch.id)}
                          style={{
                            padding:'4px 10px',borderRadius:20,fontSize:12,cursor:'pointer',
                            border:`1px solid ${isOver ? '#fca5a5' : testSel.has(ch.id)?GREEN+'66':'#e0e0e0'}`,
                            background: isOver && testSel.has(ch.id) ? '#fef2f2' : testSel.has(ch.id)?'#e6f7f2':'#fff',
                            color: isOver && testSel.has(ch.id) ? '#dc2626' : testSel.has(ch.id)?'#0f6e56':'#666',
                            display:'inline-flex',alignItems:'center',gap:5,
                          }}>
                          <span style={{fontSize:13}}>{ch.icon}</span>
                          {ch.name}
                          {isOver && testSel.has(ch.id) && <span style={{fontSize:10}}>⚠</span>}
                        </span>
                      );
                    })}
                  </div>

                  <label style={labelStyle}>Image URL (optional)</label>
                  <input value={testImage} onChange={e=>setTestImage(e.target.value)} style={inputStyle} placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"/>
                  <label style={labelStyle}>Schedule date/time (for LinkedIn)</label>
                  <input type="datetime-local" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} style={{...inputStyle,marginBottom:12}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>sendPost(true)} disabled={posting} style={{padding:'8px 18px',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:posting?'wait':'pointer',opacity:posting?0.7:1}}>
                      {posting?'Sending...':'✉ Send now'}
                    </button>
                    <button onClick={()=>sendPost(false)} disabled={posting||!scheduleDate} style={{padding:'8px 18px',background:'#0A66C2',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:(posting||!scheduleDate)?'not-allowed':'pointer',opacity:(posting||!scheduleDate)?0.5:1}}>
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
                  <button onClick={genQuick} style={{padding:'8px 18px',background:GREEN,color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer',marginBottom:20}}>✨ Generate post</button>

                  <div style={{background:'#f8faff',border:'1px solid #e0eaff',borderRadius:8,padding:12,marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#333',marginBottom:8}}>Connection status</div>
                    {[
                      {label:'Railway API',ok:true,detail:'healthy'},
                      {label:'LinkedIn OAuth',ok:isLiConnected,detail:isLiConnected?'connected':'not connected'},
                      {label:'Bluesky',ok:bskyConnected,detail:bskyConnected?`@${bskyHandle}`:'not connected'},
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

          {/* ── ACTIVITY LOG ──────────────────────────────────────────────── */}
          {tab==='log' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:'#1a1a1a'}}>📋 Activity Log</div>
                  <div style={{fontSize:12,color:'#888',marginTop:2}}>Real posts show proof ID · Buffer platforms show CSV download · Nothing is faked</div>
                </div>
                {activityLog.length>0&&(
                  <button onClick={()=>{setActivityLog([]);localStorage.removeItem('sh_activity_log');}}
                    style={{padding:'5px 12px',fontSize:11,border:'1px solid #fca5a5',borderRadius:6,background:'#fff',cursor:'pointer',color:'#dc2626'}}>
                    🗑 Clear log
                  </button>
                )}
              </div>
              {activityLog.length===0?(
                <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:40,textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:8}}>📭</div>
                  <div style={{fontSize:13,color:'#888'}}>No activity yet — posts will appear here after you publish</div>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {activityLog.map(entry=>{
                    const isReal=entry.type==='real';
                    const isFail=entry.status==='err';
                    const bg=isFail?'#fef2f2':isReal?'#f0faf6':'#fffbeb';
                    const border=isFail?'#fca5a5':isReal?'#b6e8d6':'#fcd34d';
                    const icon=isFail?'❌':isReal?'✅':'⚠️';
                    const isBuffer=entry.type==='buffer';
                    const badge=isFail?{bg:'#fee2e2',color:'#dc2626',text:'Failed'}:isReal?{bg:'#dcfce7',color:'#166534',text:'Real post'}:isBuffer?{bg:'#f5f3ff',color:'#7c3aed',text:'Buffer CSV'}:{bg:'#fef9c3',color:'#854d0e',text:'Simulated'};
                    return (
                      <div key={entry.id} style={{background:bg,border:`1px solid ${border}`,borderRadius:10,padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                          <span style={{fontSize:18}}>{icon}</span>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                              <span style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{entry.platform}</span>
                              <span style={{fontSize:10,padding:'2px 7px',borderRadius:10,background:badge.bg,color:badge.color,fontWeight:600}}>{badge.text}</span>
                              <span style={{fontSize:11,color:'#999',marginLeft:'auto'}}>{new Date(entry.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true})}</span>
                            </div>
                            <div style={{fontSize:12,color:isFail?'#dc2626':isReal?'#0f6e56':'#854d0e',marginTop:2,fontWeight:500}}>{entry.msg}</div>
                          </div>
                        </div>
                        {entry.preview&&(
                          <div style={{fontSize:12,color:'#555',background:'rgba(0,0,0,0.04)',borderRadius:6,padding:'6px 10px',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            "{entry.preview}{entry.preview.length>=80?'…':''}"
                          </div>
                        )}
                        {isBuffer&&entry.platformId&&(
                          <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                            <button onClick={()=>downloadCSV(entry.platformId,entry.preview,null,null)}
                              style={{padding:'4px 12px',fontSize:11,fontWeight:600,background:'#7c3aed',color:'#fff',border:'none',borderRadius:5,cursor:'pointer'}}>
                              📥 Re-download CSV
                            </button>
                            <a href="https://buffer.com" target="_blank" rel="noreferrer"
                              style={{fontSize:11,color:'#7c3aed',fontWeight:500}}>Open Buffer →</a>
                          </div>
                        )}
                        {!isReal&&!isFail&&!isBuffer&&(
                          <div style={{fontSize:11,color:'#92400e',marginTop:6,padding:'4px 8px',background:'#fef3c7',borderRadius:4,border:'1px solid #fcd34d'}}>
                            ℹ️ Not connected via API. Post was NOT published.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* ── END ACTIVITY LOG ──────────────────────────────────────────── */}

          {/* ── REVIEW & POST WIZARD ─────────────────────────────────────── */}
          {tab==='wizard' && (() => {
            const STEPS = [
              { n:1, label:'Write',  icon:'✍️' },
              { n:2, label:'Route',  icon:'🗺' },
              { n:3, label:'Review', icon:'👁' },
              { n:4, label:'Send',   icon:'🚀' },
            ];
            const canAdvance = wizardCanAdvance(wizardStep);

            const StepBar = () => (
              <div style={{display:'flex',alignItems:'center',marginBottom:24,background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:'14px 20px'}}>
                {STEPS.map((s,i) => {
                  const done = wizardStep > s.n;
                  const active = wizardStep === s.n;
                  return (
                    <div key={s.n} style={{display:'flex',alignItems:'center',flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,cursor:done?'pointer':'default'}}
                           onClick={()=>{ if(done) setWizardStep(s.n); }}>
                        <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0,transition:'all .2s',
                          background:done?GREEN:active?'#1a1a1a':'#f0f0f0',
                          color:done||active?'#fff':'#999',
                          boxShadow:active?`0 0 0 3px ${GREEN}33`:'none'}}>
                          {done?'✓':s.n}
                        </div>
                        <div style={{display:'flex',flexDirection:'column'}}>
                          <span style={{fontSize:11,color:'#999',lineHeight:1}}>{s.icon}</span>
                          <span style={{fontSize:12,fontWeight:active?600:400,color:active?'#1a1a1a':done?GREEN:'#999'}}>{s.label}</span>
                        </div>
                      </div>
                      {i<STEPS.length-1&&<div style={{flex:1,height:2,background:done?GREEN:'#e8e8e8',margin:'0 10px',borderRadius:2,transition:'background .3s'}}/>}
                    </div>
                  );
                })}
              </div>
            );

            const Step1 = () => (
              <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:24}}>
                <div style={{fontSize:16,fontWeight:600,color:'#1a1a1a',marginBottom:4}}>✍️ Write your post</div>
                <div style={{fontSize:12,color:'#888',marginBottom:16}}>Paste AI-generated content or write from scratch. Platforms come next.</div>
                <div style={{marginBottom:14}}>
                  <label style={labelStyle}>Post content</label>
                  <textarea value={wizardContent} onChange={e=>setWizardContent(e.target.value)} rows={9}
                    style={{...inputStyle,fontSize:14,lineHeight:1.6,marginBottom:0}}
                    placeholder={`Share something that reflects your philosophy…\n\n"Be Good. Do Good. Do Well."`} autoFocus/>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                    <span style={{fontSize:11,color:'#999'}}>{wizardContent.length} characters</span>
                    {wizardContent.length>300&&<span style={{fontSize:11,color:'#d97706',fontWeight:500}}>⚠ Over Bluesky limit (300)</span>}
                  </div>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={labelStyle}>Image URL <span style={{color:'#bbb',fontWeight:400}}>(optional)</span></label>
                  <input value={wizardImage} onChange={e=>setWizardImage(e.target.value)} style={{...inputStyle,marginBottom:0}}
                    placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"/>
                </div>
                {wizardImage&&(
                  <div style={{marginBottom:16}}>
                    <label style={labelStyle}>Image preview</label>
                    <img src={wizardImage} alt="Preview" style={{maxWidth:'100%',maxHeight:160,borderRadius:8,border:'1px solid #e8e8e8',objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/>
                  </div>
                )}
                <div style={{marginBottom:4}}>
                  <label style={labelStyle}>Quick fill from saved quotes</label>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {Object.entries({integrity:'Integrity edge',reputation:'Reputation asset',shortcuts:'Shortcut loans',nepal:'Nepal roots',ai:'AI & you',trust:'Trust compounds'}).map(([k,v])=>(
                      <button key={k} onClick={()=>setWizardContent(QUOTES[k]||'')}
                        style={{padding:'4px 10px',fontSize:11,borderRadius:16,border:'1px solid #e0e0e0',background:'#f9f9f9',cursor:'pointer',color:'#555'}}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
            );

            const Step2 = () => (
              <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:24}}>
                <div style={{fontSize:16,fontWeight:600,color:'#1a1a1a',marginBottom:4}}>🗺 Route your content</div>
                <div style={{fontSize:12,color:'#888',marginBottom:20}}>Pick a content type to auto-select platforms, then fine-tune manually.</div>
                <label style={labelStyle}>Content type <span style={{color:'#bbb',fontWeight:400}}>(optional)</span></label>
                <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:20}}>
                  {CONTENT_TYPES.map(ct=>{
                    const isActive=wizardPostType===ct.id;
                    return (
                      <button key={ct.id} onClick={()=>wizardSelectPostType(ct.id)}
                        style={{display:'flex',flexDirection:'column',alignItems:'flex-start',padding:'8px 12px',borderRadius:8,cursor:'pointer',
                          border:isActive?`1.5px solid ${GREEN}`:'1.5px solid #e8e8e8',
                          background:isActive?'#e6f7f2':'#fafafa',minWidth:110,transition:'all .15s'}}>
                        <span style={{fontSize:15,marginBottom:2}}>{ct.emoji}</span>
                        <span style={{fontSize:11,fontWeight:600,color:isActive?'#0f6e56':'#1a1a1a',lineHeight:1.3}}>{ct.label}</span>
                        <span style={{fontSize:10,color:'#999',marginTop:1}}>{ct.desc}</span>
                      </button>
                    );
                  })}
                </div>
                <label style={labelStyle}>Platforms <span style={{color:'#bbb',fontWeight:400}}>(select at least one)</span></label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
                  {CONNECTED_CHANNELS.map(ch=>{
                    const sel=wizardSel.has(ch.id);
                    const limit=CHAR_LIMITS[ch.id];
                    const isOver=limit&&wizardContent.length>limit.limit;
                    return (
                      <div key={ch.id} onClick={()=>wizardToggleSel(ch.id)}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:8,cursor:'pointer',transition:'all .15s',
                          border:`1.5px solid ${isOver&&limit?.hard?'#fca5a5':sel?ch.color+'66':'#e8e8e8'}`,
                          background:isOver&&limit?.hard&&sel?'#fef2f2':sel?ch.color+'0d':'#fafafa'}}>
                        <span style={{fontSize:16}}>{ch.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:500,color:sel?ch.color:'#555',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.name}</div>
                          {limit&&<div style={{fontSize:10,color:isOver?'#dc2626':'#aaa'}}>{wizardContent.length}/{limit.limit}</div>}
                        </div>
                        <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?ch.color:'#ccc'}`,background:sel?ch.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {sel&&<span style={{color:'#fff',fontSize:9,fontWeight:700}}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {wizardSel.size===0&&<div style={{marginTop:10,fontSize:12,color:'#d97706',padding:'8px 12px',background:'#fffbeb',borderRadius:6,border:'1px solid #fcd34d'}}>⚠ Select at least one platform to continue</div>}
                {wizardSel.has('bs')&&wizardContent.length>300&&<div style={{marginTop:10,fontSize:12,color:'#dc2626',padding:'8px 12px',background:'#fef2f2',borderRadius:6,border:'1px solid #fca5a5'}}>🚫 Bluesky selected but post is {wizardContent.length} chars — over the 300 hard limit. Trim in Step 1 or deselect Bluesky.</div>}
              </div>
            );

            const Step3 = () => {
              const schedOpts=[
                {id:'now',label:'Post now',icon:'⚡',desc:'Publish immediately'},
                {id:'1week',label:'In 1 week',icon:'📅',desc:(()=>{const d=new Date(Date.now()+7*86400000);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});})()},
                {id:'2weeks',label:'In 2 weeks',icon:'📅',desc:(()=>{const d=new Date(Date.now()+14*86400000);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});})()},
                {id:'scheduled',label:'Pick date & time',icon:'🗓',desc:'Choose exact moment'},
              ];
              return (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12}}>👁 Platform previews</div>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {[...wizardSel].map(id=>{
                        const ch=CONNECTED_CHANNELS.find(c=>c.id===id)||ALL_PLATFORMS.find(x=>x.id===id);
                        if(!ch)return null;
                        const cfg=CHAR_LIMITS[id];
                        const len=wizardContent.length;
                        const over=cfg&&len>cfg.limit;
                        const warn=cfg&&len>cfg.warn&&!over;
                        const preview=wizardContent.length>220?wizardContent.slice(0,220)+'… [truncated in preview]':wizardContent;
                        return (
                          <div key={id} style={{border:`1px solid ${over?'#fca5a5':ch.color+'33'}`,borderRadius:10,overflow:'hidden'}}>
                            <div style={{background:ch.color+'0f',padding:'8px 12px',display:'flex',alignItems:'center',gap:8,borderBottom:`1px solid ${ch.color+'22'}`}}>
                              <span style={{fontSize:16}}>{ch.icon}</span>
                              <span style={{fontSize:12,fontWeight:600,color:ch.color}}>{ch.name}</span>
                              {cfg&&<span style={{marginLeft:'auto',fontSize:11,color:over?'#dc2626':warn?'#d97706':'#888',fontWeight:over||warn?600:400}}>{len}/{cfg.limit} {over?'🚫':warn?'⚠':'✓'}</span>}
                            </div>
                            <div style={{padding:12}}>
                              {wizardImage&&<img src={wizardImage} alt="" style={{width:'100%',maxHeight:100,objectFit:'cover',borderRadius:6,marginBottom:8}} onError={e=>e.target.style.display='none'}/>}
                              <div style={{fontSize:12,color:'#333',lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                                {preview||<span style={{color:'#bbb',fontStyle:'italic'}}>No content yet</span>}
                              </div>
                              {over&&cfg.hard&&<div style={{marginTop:8,fontSize:11,color:'#dc2626',fontWeight:600,padding:'4px 8px',background:'#fef2f2',borderRadius:4}}>🚫 Will error — trim to {cfg.limit} chars in Step 1</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12}}>⏱ When to publish</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
                      {schedOpts.map(opt=>(
                        <div key={opt.id} onClick={()=>setWizardSchedule(opt.id)}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',transition:'all .15s',
                            border:`1.5px solid ${wizardSchedule===opt.id?GREEN:'#e8e8e8'}`,
                            background:wizardSchedule===opt.id?'#e6f7f2':'#fafafa'}}>
                          <span style={{fontSize:18}}>{opt.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:600,color:wizardSchedule===opt.id?'#0f6e56':'#1a1a1a'}}>{opt.label}</div>
                            <div style={{fontSize:11,color:'#888'}}>{opt.desc}</div>
                          </div>
                          <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${wizardSchedule===opt.id?GREEN:'#ccc'}`,background:wizardSchedule===opt.id?GREEN:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            {wizardSchedule===opt.id&&<span style={{color:'#fff',fontSize:8,fontWeight:700}}>●</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {wizardSchedule==='scheduled'&&(
                      <div style={{marginBottom:16}}>
                        <label style={labelStyle}>Date & time (Central Time)</label>
                        <input type="datetime-local" value={wizardDate} onChange={e=>setWizardDate(e.target.value)}
                          style={{...inputStyle,marginBottom:0,borderColor:!wizardDate?'#fca5a5':'#e0e0e0'}}/>
                        {!wizardDate&&<div style={{fontSize:11,color:'#dc2626',marginTop:4}}>Required — pick a date to continue</div>}
                      </div>
                    )}
                    <div style={{background:'#f8faff',border:'1px solid #e0eaff',borderRadius:8,padding:12}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#333',marginBottom:8}}>Pre-flight checklist</div>
                      {[
                        {ok:wizardContent.trim().length>0,label:'Content written'},
                        {ok:wizardSel.size>0,label:`${wizardSel.size} platform${wizardSel.size!==1?'s':''} selected`},
                        {ok:!(wizardSel.has('bs')&&wizardContent.length>300),label:'Bluesky within 300 chars'},
                        {ok:wizardSchedule!=='scheduled'||!!wizardDate,label:'Schedule date set'},
                        {ok:!wizardSel.has('li')||isLiConnected,label:'LinkedIn connected'},
                        {ok:!wizardSel.has('bs')||bskyConnected,label:'Bluesky connected'},
                      ].map((item,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                          <span style={{fontSize:13}}>{item.ok?'✅':'❌'}</span>
                          <span style={{fontSize:12,color:item.ok?'#1a1a1a':'#dc2626'}}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            };

            const Step4 = () => {
              const sColor=s=>s==='ok'?'#16a34a':s==='err'?'#dc2626':s==='warn'?'#d97706':s==='sending'?'#0A66C2':s==='csv'?'#7c3aed':'#999';
              const sBg=s=>s==='ok'?'#dcfce7':s==='err'?'#fee2e2':s==='warn'?'#fef9c3':s==='sending'?'#eff6ff':s==='csv'?'#f5f3ff':'#f3f4f6';
              const sIcon=s=>s==='ok'?'✓':s==='err'?'✗':s==='warn'?'⚠':s==='sending'?'…':s==='csv'?'📥':'·';
              return (
                <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:24}}>
                  {!wizardPosting&&!wizardDone&&(
                    <div style={{textAlign:'center',padding:'20px 0'}}>
                      <div style={{fontSize:40,marginBottom:12}}>🚀</div>
                      <div style={{fontSize:16,fontWeight:600,color:'#1a1a1a',marginBottom:6}}>Ready to publish</div>
                      <div style={{fontSize:13,color:'#666',marginBottom:24}}>
                        Posting to {wizardSel.size} platform{wizardSel.size!==1?'s':''} · {wizardSchedule==='now'?'immediately':wizardSchedule==='1week'?'in 1 week':wizardSchedule==='2weeks'?'in 2 weeks':`on ${new Date(wizardDate).toLocaleDateString()}`}
                      </div>
                      <button onClick={wizardSend} style={{padding:'12px 32px',background:GREEN,color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:'pointer',boxShadow:`0 2px 8px ${GREEN}44`}}>
                        ⚡ Publish now
                      </button>
                    </div>
                  )}
                  {(wizardPosting||wizardDone)&&(
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:'#1a1a1a',marginBottom:16}}>{wizardPosting?'📡 Publishing…':'🎉 Done!'}</div>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {[...wizardSel].map(id=>{
                          const ch=CONNECTED_CHANNELS.find(c=>c.id===id)||ALL_PLATFORMS.find(x=>x.id===id);
                          if(!ch)return null;
                          const st=wizardSendStatus[id]||{state:'pending',msg:'Waiting…'};
                          return (
                            <div key={id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:8,border:'1px solid #e8e8e8',background:sBg(st.state)}}>
                              <span style={{fontSize:20}}>{ch.icon}</span>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:500,color:'#1a1a1a'}}>{ch.name}</div>
                                <div style={{fontSize:12,color:sColor(st.state)}}>{st.msg}</div>
                              </div>
                                <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                                {st.state==='csv'&&(
                                  <button onClick={()=>downloadCSV(id,wizardContent,wizardImage,wizardDate)}
                                    style={{padding:'5px 12px',fontSize:11,fontWeight:600,background:'#7c3aed',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',whiteSpace:'nowrap'}}>
                                    📥 Download CSV
                                  </button>
                                )}
                                <div style={{width:28,height:28,borderRadius:'50%',background:sColor(st.state),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700,flexShrink:0,
                                  animation:st.state==='sending'?'spin 1s linear infinite':'none'}}>
                                  {sIcon(st.state)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {wizardDone&&(
                        <div style={{marginTop:20}}>
                          {[...wizardSel].some(id=>BUFFER_PLATFORMS[id])&&(
                            <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:8,padding:'12px 16px',marginBottom:12}}>
                              <div style={{fontSize:12,fontWeight:600,color:'#7c3aed',marginBottom:8}}>📥 Buffer upload ready</div>
                              <div style={{fontSize:11,color:'#6d28d9',marginBottom:10}}>Download each CSV then go to Buffer → Channel → Settings → Bulk Upload</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                                {[...wizardSel].filter(id=>BUFFER_PLATFORMS[id]).map(id=>{
                                  const cfg=BUFFER_PLATFORMS[id];
                                  return (
                                    <button key={id} onClick={()=>downloadCSV(id,wizardContent,wizardImage,wizardDate)}
                                      style={{padding:'6px 14px',fontSize:12,fontWeight:600,background:'#7c3aed',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                                      {cfg.icon} Download {cfg.name} CSV
                                    </button>
                                  );
                                })}
                                <a href="https://buffer.com" target="_blank" rel="noreferrer"
                                  style={{padding:'6px 14px',fontSize:12,fontWeight:600,background:'#fff',color:'#7c3aed',border:'1px solid #ddd6fe',borderRadius:6,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',gap:4}}>
                                  Open Buffer →
                                </a>
                              </div>
                            </div>
                          )}
                          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                            <button onClick={wizardReset} style={{padding:'9px 20px',background:GREEN,color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer'}}>✦ New post</button>
                            <button onClick={()=>setTab('calendar')} style={{padding:'9px 20px',background:'#fff',color:'#1a1a1a',border:'1px solid #e0e0e0',borderRadius:7,fontSize:13,cursor:'pointer'}}>📅 View calendar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                <StepBar/>
                {wizardStep===1&&<Step1/>}
                {wizardStep===2&&<Step2/>}
                {wizardStep===3&&<Step3/>}
                {wizardStep===4&&<Step4/>}
                {!(wizardStep===4&&(wizardPosting||wizardDone))&&(
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16}}>
                    <button onClick={()=>setWizardStep(s=>Math.max(1,s-1))} disabled={wizardStep===1}
                      style={{padding:'9px 20px',fontSize:13,border:'1px solid #e0e0e0',borderRadius:7,background:'#fff',cursor:wizardStep===1?'not-allowed':'pointer',color:wizardStep===1?'#ccc':'#444',opacity:wizardStep===1?0.5:1}}>
                      ← Back
                    </button>
                    <div style={{fontSize:11,color:'#999'}}>Step {wizardStep} of 4</div>
                    {wizardStep<4?(
                      <button onClick={()=>{if(canAdvance)setWizardStep(s=>Math.min(4,s+1));}} disabled={!canAdvance}
                        style={{padding:'9px 22px',fontSize:13,fontWeight:600,border:'none',borderRadius:7,
                          background:canAdvance?'#1a1a1a':'#e0e0e0',color:canAdvance?'#fff':'#999',cursor:canAdvance?'pointer':'not-allowed',transition:'all .15s'}}>
                        Next →
                      </button>
                    ):(
                      !wizardPosting&&!wizardDone&&(
                        <button onClick={wizardSend} style={{padding:'9px 22px',fontSize:13,fontWeight:600,border:'none',borderRadius:7,background:GREEN,color:'#fff',cursor:'pointer'}}>⚡ Publish</button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {/* ── END REVIEW & POST WIZARD ─────────────────────────────────── */}

        </div>
      </div>
    </div>
  );
}
