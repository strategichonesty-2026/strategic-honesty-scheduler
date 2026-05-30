// src/components/RightPanel.jsx
import { useState } from "react";

const C = {
  bg:'#F4F6F8', sidebar:'#FFFFFF', card:'#FFFFFF', border:'#E2E8F0',
  text:'#0f172a', muted:'#64748b', label:'#334155',
  green:'#24b47e', greenLight:'#E6F7F2', greenDark:'#0f6e56',
  gold:'#BA7517', goldLight:'#FEF3C7',
  purple:'#7c3aed', purpleLight:'#F5F3FF',
  blue:'#0A66C2',
};
const GREEN = "#24b47e";
const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const PREVIEW_PLATFORMS = [
  {id:'li',label:'LinkedIn',color:'#0A66C2'},
  {id:'tt',label:'TikTok',color:'#010101'},
  {id:'ig',label:'Instagram',color:'#E1306C'},
  {id:'fb',label:'Facebook',color:'#1877F2'},
  {id:'tw',label:'X',color:'#333'},
  {id:'th',label:'Threads',color:'#444'},
];

function PlatformIcon({id, size=16, color='currentColor'}) {
  const s = {width:size, height:size, display:'inline-block', flexShrink:0};
  if (id==='li') return <svg style={s} viewBox="0 0 24 24" fill={color}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  if (id==='tw') return <svg style={s} viewBox="0 0 24 24" fill={color}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  const icons = {tt:'🎵', ig:'📸', fb:'👥', th:'🧵'};
  return <span style={{fontSize:size, lineHeight:1}}>{icons[id] || id}</span>;
}

export default function RightPanel({
  previewContent,
  approvedQueue,
  viralIdeasSidebar,
  schedulePosts,
  setMainTab,
}) {
  const [previewPlatform, setPreviewPlatform] = useState('li');
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [viralIdeasOpen, setViralIdeasOpen] = useState(true);
  const [approvedOpen, setApprovedOpen] = useState(true);

  const previewMeta = {
    li:{label:'LinkedIn',icon:'💼'}, tt:{label:'TikTok',icon:'🎵'},
    ig:{label:'Instagram',icon:'📸'}, fb:{label:'Facebook',icon:'👥'},
    tw:{label:'X/Twitter',icon:'🐦'}, th:{label:'Threads',icon:'🧵'},
  };

  const acc = {
    header: (label, badge, onViewAll, viewAllLabel, open, setOpen) => (
      <div onClick={() => setOpen(o => !o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',cursor:'pointer',background:GREEN}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,fontWeight:600,color:'#fff',textTransform:'uppercase',letterSpacing:'0.07em'}}>{label}</span>
          {badge != null && <span style={{fontSize:10,padding:'1px 5px',borderRadius:7,background:'#f1f5f9',color:C.muted,fontWeight:500}}>{badge}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {onViewAll && <button onClick={e=>{e.stopPropagation();onViewAll();}} style={{fontSize:10,color:'#fff',background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:0}}>{viewAllLabel}</button>}
          <span style={{fontSize:9,color:'#fff',transform:open?'rotate(180deg)':'rotate(0)',transition:'transform .2s',display:'inline-block'}}>▼</span>
        </div>
      </div>
    )
  };

  return (
    <div style={{background:C.sidebar,borderLeft:`1px solid ${C.border}`,display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0,overflowY:'auto',fontFamily:F}}>

      {/* Platform Preview */}
      <div style={{borderBottom:`1px solid ${C.border}`}}>
        <div style={{background:GREEN,padding:'11px 14px 0'}}>
          <div style={{fontSize:11,fontWeight:600,color:'#fff',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:9}}>Platform Preview</div>
        </div>
        <div style={{display:'flex',gap:2,overflowX:'auto'}}>
          {PREVIEW_PLATFORMS.map(p => {
            const active = previewPlatform === p.id;
            return (
              <button key={p.id} onClick={() => setPreviewPlatform(p.id)} title={p.label} style={{padding:'6px 10px',fontSize:11,background:active?p.color+'18':'#e2e8f0',border:`1px solid ${active?p.color+'44':'#cbd5e1'}`,borderBottom:`2px solid ${active?p.color:'#94a3b8'}`,color:active?p.color:'#64748b',cursor:'pointer',fontWeight:active?600:400,whiteSpace:'nowrap',transition:'all .15s',borderRadius:'4px 4px 0 0',display:'flex',alignItems:'center',gap:5}}>
                <PlatformIcon id={p.id} size={14} color={active?p.color:'#64748b'}/>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Card */}
      <div style={{padding:'11px 13px',borderBottom:`1px solid ${C.border}`}}>
        <div style={{background:'#f8fafc',border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 13px',minHeight:120,boxShadow:'inset 0 1px 3px rgba(0,0,0,0.03)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:GREEN,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',flexShrink:0}}>G</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text}}>Gopu Shrestha</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>{previewMeta[previewPlatform]?.label} · Just now</div>
            </div>
            <div style={{fontSize:16}}>{previewMeta[previewPlatform]?.icon}</div>
          </div>
          <div style={{fontSize:12,color:'#334155',lineHeight:1.65,whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:165,overflow:'hidden'}}>
            {previewContent
              ? (previewContent.length > 280 ? previewContent.slice(0, 280) + '...' : previewContent)
              : <span style={{color:'#cbd5e1',fontStyle:'italic',fontSize:11}}>Preview appears here as you write...</span>
            }
          </div>
          {previewContent && (
            <div style={{marginTop:10,display:'flex',gap:12,fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
              <span style={{cursor:'pointer'}}>👍 Like</span>
              <span style={{cursor:'pointer'}}>💬 Comment</span>
              <span style={{cursor:'pointer'}}>↗ Share</span>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Posts */}
      <div style={{borderBottom:`1px solid ${C.border}`}}>
        {acc.header('Upcoming Posts', schedulePosts.length, () => setMainTab('calendar'), 'View all', upcomingOpen, setUpcomingOpen)}
        {upcomingOpen && (
          <div style={{padding:'0 12px 10px'}}>
            {schedulePosts.slice(0, 5).map((p, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderRadius:9,marginBottom:4,background:'#f8fafc',border:`1px solid ${C.border}`}}>
                <div style={{width:3,height:32,borderRadius:2,background:p.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{p.text}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>May {p.day}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Viral Ideas */}
      <div style={{borderBottom:`1px solid ${C.border}`}}>
        {acc.header('Viral Ideas', viralIdeasSidebar.length || null, () => setMainTab('ideas'), 'View all', viralIdeasOpen, setViralIdeasOpen)}
        {viralIdeasOpen && (
          <div style={{padding:'0 12px 10px'}}>
            {viralIdeasSidebar.length ? viralIdeasSidebar.map(idea => (
              <div key={idea.id} onClick={() => setMainTab('ideas')} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 9px',borderRadius:9,cursor:'pointer',marginBottom:3,background:'#f8fafc',border:`1px solid ${C.border}`}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:C.gold,flexShrink:0}}/>
                <div style={{fontSize:12,color:C.text,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{idea.title}</div>
                <span style={{fontSize:11,color:C.muted}}>›</span>
              </div>
            )) : <div style={{fontSize:11,color:C.muted,fontStyle:'italic',padding:'4px 2px'}}>Run research to generate ideas</div>}
          </div>
        )}
      </div>

      {/* Approved Queue */}
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        {acc.header('Approved Queue', approvedQueue.length, () => setMainTab('ideas'), 'Manage', approvedOpen, setApprovedOpen)}
        {approvedOpen && (
          <div style={{padding:'0 12px 14px',flex:1}}>
            {approvedQueue.length === 0 && <div style={{fontSize:11,color:C.muted,fontStyle:'italic',padding:'4px 2px'}}>No approved posts yet</div>}
            {approvedQueue.slice(0, 5).map((item, i) => (
              <div key={item.id || i} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',borderRadius:10,marginBottom:5,background:'#f8fafc',border:`1px solid ${C.border}`,borderLeft:`3px solid ${item.color || C.purple}`}}>
                <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{item.icon || '📝'}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title || 'Approved post'}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{item.platform} · Approved</div>
                  <div style={{fontSize:10,color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{(item.content || '').slice(0, 48)}...</div>
                </div>
              </div>
            ))}
            {approvedQueue.length > 5 && <div style={{fontSize:11,color:C.muted,textAlign:'center',padding:'4px 0'}}>+{approvedQueue.length - 5} more</div>}
            {approvedQueue.length > 0 && (
              <button onClick={() => setMainTab('ideas')} style={{width:'100%',marginTop:8,padding:'8px 0',fontSize:12,fontWeight:600,background:C.purple,color:'#fff',border:'none',borderRadius:9,cursor:'pointer',boxShadow:'0 2px 6px rgba(124,58,237,0.25)'}}>
                Export &amp; Publish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
