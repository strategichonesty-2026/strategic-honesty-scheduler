#!/usr/bin/env python3
"""
patch_helpmodal.py
Applies 5 surgical changes to src/SocialHub.jsx:
  1. Replace old tab-based HelpModal with new accordion v3
  2. Add [helpOpen, setHelpOpen] state declaration
  3. Add Help & Guide entry to NAV array
  4. Add <HelpModal> render at bottom of main return
  5. Remove duplicate SettingsPanel render
Run from repo root: python3 patch_helpmodal.py
"""

import sys, re

FILE = 'src/SocialHub.jsx'

try:
    src = open(FILE, encoding='utf-8').read()
except FileNotFoundError:
    print(f'ERROR: {FILE} not found. Run from repo root.')
    sys.exit(1)

original = src
changes = []

# ─────────────────────────────────────────────────────────────────────────────
# 1. REPLACE old HelpModal component with accordion v3
# ─────────────────────────────────────────────────────────────────────────────
OLD_MODAL_START = 'function HelpModal({onClose}) {'
OLD_MODAL_END   = '  return res.json();\n}'   # bskyCreateSession is right after

# Find the full old HelpModal block
start_idx = src.find(OLD_MODAL_START)
# Find getUserId which comes after HelpModal
end_marker = '\nfunction getUserId() {'
end_idx = src.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print('ERROR: Could not locate old HelpModal boundaries.')
    sys.exit(1)

NEW_MODAL = '''function HelpModal({onClose}) {
  const [open,setOpen]=React.useState(0);
  const F2='-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

  const SECS=[
    {id:'core',   icon:'🎯', label:'Core idea',        sub:'What this app does'},
    {id:'ideas',  icon:'💡', label:'Content ideas',    sub:'Capture & generate'},
    {id:'articles',icon:'📄',label:'Articles',         sub:'Perspectives content'},
    {id:'review', icon:'✅', label:'Review & post',    sub:'Approve before publishing'},
    {id:'schedule',icon:'⏱',label:'Scheduling',        sub:'Timing & frequency'},
    {id:'calendar',icon:'📅',label:'Calendar',         sub:'Visual command center'},
    {id:'settings',icon:'⚙️',label:'Settings',         sub:'Brand, platforms & prefs'},
  ];

  const CONTENT={
    core:{
      lead:"The Strategic Honesty Scheduler is your personal content intelligence engine — built around your voice, your books, and your brand. It turns ideas and articles into ready-to-post content across LinkedIn, X, Instagram, TikTok, and Facebook.",
      cards:[
        {title:'Powered by your brand system',icon:'🧠',body:'Every post is generated using the Strategic Honesty Content Intelligence Engine — an AI prompt trained on your writing voice, your "Be Good. Do Good. Do Well." philosophy, and your three core audiences: parents, early-career professionals, and Agile practitioners.'},
        {title:'Your workflow at a glance',icon:'🗺',body:'Capture an idea → Generate drafts → Review & edit → Schedule or post live'},
        {title:'Where it lives',icon:'🖥',body:'Deployed at scheduler.strategichonesty.com via Cloudflare Pages. Auto-deploys on every git push to the main branch.'},
      ],
      tip:{label:'Philosophy',body:'This scheduler is the operational hub of StrategicHonesty.com. Every book, article, speaking engagement, and consulting insight flows through this content engine.'},
    },
    ideas:{
      lead:"The Ideas tab is your scratch pad. Capture a raw thought, a quote, a question you keep getting asked — and let the engine turn it into platform-ready content in your voice.",
      steps:['Click + New Post to open the idea form in the left sidebar.','Type your raw thought in the Core Idea or Insight field — a phrase, a lesson, a story fragment.','Click Adapt to All Platforms → — the engine generates drafts for every connected channel.','Review the Brand Alignment score — aim for Strategic range on the slider.','Send drafts to Review & Post queue or discard and regenerate.'],
      tip:{label:'Tip',body:'Short, specific prompts produce the best output. "Integrity compounds faster than hustle" beats "something about integrity" every time.'},
    },
    articles:{
      lead:"Your Perspectives articles on StrategicHonesty.com are your richest content source. Turn any article into a full cross-platform social series with one click.",
      cards:[
        {title:'What gets generated per article',icon:'📲',body:'LinkedIn long-form · LinkedIn carousel · X thread · X single post · Instagram caption · TikTok script · Facebook post'},
        {title:'Adding a new article',icon:'🔗',body:'Paste the article URL or full text. The engine extracts the core insight, the hook, and the call-to-action — all aligned to your brand pillars automatically.'},
        {title:'Refreshing existing articles',icon:'🔄',body:'Already-imported articles can be regenerated at any time. Use this when your messaging evolves or when you want a fresh angle on an older piece.'},
      ],
      tip:{label:'Tip',body:'Schedule article content as a drip — one format per day over a week keeps your feed active without overlap across platforms.'},
    },
    review:{
      lead:"The Review & Post tab holds all AI-generated drafts waiting for your eyes. Nothing goes out until you approve it — you stay in full control of your voice.",
      steps:['Open Review & Post in the left nav to see all pending drafts grouped by platform.','Read each draft — click Edit to adjust tone, length, or add a personal story detail.','Click Approve to move to the Schedule queue, or Regenerate for a fresh draft.','To post immediately, click Post now — pushes directly to the connected platform.','Approved posts appear in the Approved Queue panel (right sidebar) ready for scheduling.'],
      tip:{label:'Quality check',body:"Read every post out loud before approving. If it doesn't sound like something you'd say in a Toastmasters speech, hit Regenerate."},
    },
    schedule:{
      lead:"Scheduling controls when approved posts go live. Your dashboard shows 5/week posting frequency — here's how to maintain that cadence across all channels.",
      cards:[
        {title:'Recommended posting times (Central Time)',icon:'⏰',body:'LinkedIn: Tue–Thu · 7–9am or 5–6pm\nX: Daily · 7–9am or 8–10pm\nFacebook: Wed & Fri · 9–11am\nInstagram: Tue & Fri · 11am or 6pm\nTikTok: Daily · 7–9pm'},
        {title:'Auto-distribute',icon:'🪄',body:'Click Fill week to automatically spread all approved drafts across the next 7 days using the recommended time slots per platform.'},
        {title:'Manual scheduling',icon:'🎛',body:'Pick any approved post from the right sidebar Approved Queue, set your preferred date and time, and confirm. Manual schedules override auto-distribute for that post only.'},
      ],
      tip:{label:'Tip',body:'Block 30 minutes every Sunday to review, approve, and schedule the full week. Walk into Monday with a loaded calendar.'},
    },
    calendar:{
      lead:"The Calendar is your visual command center — a full month view of every scheduled post across all platforms. See gaps, spot overlaps, and keep your posting cadence consistent.",
      cards:[
        {title:'Reading the calendar',icon:'👁',body:'Each day shows color-coded entries per platform: LinkedIn (blue) · Instagram (pink) · TikTok (black) · Quotes (gold) · Books (orange). Click any entry to see the full draft and scheduled time.'},
        {title:'Rescheduling from the calendar',icon:'✋',body:'Drag any post to a new date to reschedule it. Click a post and select Edit time to change the time without moving the date.'},
        {title:'Upcoming posts panel',icon:'📋',body:'The right sidebar shows your Upcoming Posts list — a chronological feed of the next scheduled posts across all platforms with one-click edit access.'},
        {title:'Adding directly from the calendar',icon:'➕',body:'Click + New post (top right) or click any empty calendar day to start a new post pre-filled with that date.'},
      ],
      tip:{label:'Healthy cadence rule',body:'No two posts on the same platform on the same day. No more than 3 total posts across all platforms on any single day.'},
    },
    settings:{
      lead:"Settings is where you configure the engine — your brand voice prompt, connected platforms, and content generation preferences.",
      cards:[
        {title:'Brand system prompt (BRAND_SYSTEM)',icon:'🧠',body:'The BRAND_SYSTEM prompt defines your writing voice, philosophy, core audiences, and tone. Edit it here when your messaging evolves — all future generations reflect the update immediately.'},
        {title:'Platform connections (Channels)',icon:'🔌',body:'Connect LinkedIn, X, Facebook, Instagram, and TikTok via OAuth. Tokens are stored securely and auto-refreshed — disconnect and reconnect any platform without losing scheduled posts.'},
        {title:'Content preferences',icon:'🎛',body:'Set default post length per platform, preferred hashtag count, tone adjustments, and which content pillars to prioritize: Strategic Honesty · The Human Edge · Frameworks for Real Work'},
        {title:'Upload CSV',icon:'⬆️',body:'Bulk-import post ideas or a pre-written content schedule via CSV. Use the Upload CSV nav item to access the template and uploader.'},
      ],
      tip:{label:'After updating BRAND_SYSTEM',body:'Always regenerate 2–3 test posts from the Content Ideas tab to confirm the voice feels right before scheduling live content.'},
    },
  };

  const HL='#7C3AED';
  const AMBER='#D97706';
  const BDR='#E2E8F0';
  const NAVY='#1A1F2E';

  const cardStyle={background:'#FFFFFF',border:`1px solid ${BDR}`,borderRadius:8,padding:'12px 15px',marginBottom:8};
  const ctitleStyle={fontSize:12.5,fontWeight:700,color:HL,marginBottom:5,display:'flex',alignItems:'center',gap:6};
  const cpStyle={fontSize:12.5,color:'#374151',lineHeight:1.7,whiteSpace:'pre-line'};
  const tipStyle={background:'#FFFBF0',borderLeft:`3px solid ${AMBER}`,borderRadius:'0 6px 6px 0',padding:'9px 13px',marginTop:12};

  const sec=CONTENT[SECS[open]?.id]||{};

  return(
    <div onClick={onClose} style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(26,31,46,0.55)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,fontFamily:F2}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#FFFFFF',borderRadius:12,width:'100%',maxWidth:680,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(26,31,46,0.18)',border:`1px solid ${BDR}`,overflow:'hidden'}}>

        {/* Header */}
        <div style={{background:NAVY,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <div style={{width:36,height:36,borderRadius:8,background:'#24b47e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>❓</div>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:'#FFFFFF'}}>Help & Guide</div>
              <div style={{fontSize:11,color:'#8892A4',marginTop:2}}>Strategic Honesty Content Intelligence Engine</div>
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'#8892A4',fontSize:18,padding:'5px 7px',borderRadius:6,lineHeight:1}}>✕</button>
        </div>

        {/* Strip */}
        <div style={{background:'#F8F9FA',borderBottom:`1px solid ${BDR}`,padding:'9px 20px',display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
          <span style={{fontSize:14,color:HL}}>ℹ️</span>
          <span style={{fontSize:12,color:'#718096'}}><strong style={{color:'#2D3748'}}>7 sections</strong> — click any section to expand. Your complete guide to the Strategic Honesty Scheduler.</span>
        </div>

        {/* Accordion */}
        <div style={{overflowY:'auto',flex:1,background:'#F8F9FA'}}>
          {SECS.map((s,i)=>{
            const isOpen=open===i;
            return(
              <div key={s.id} style={{borderBottom:`1px solid ${BDR}`,background:'#fff'}}>
                <button onClick={()=>setOpen(isOpen?-1:i)} style={{width:'100%',background:isOpen?'#F3F0FF':'#fff',border:'none',cursor:'pointer',padding:'13px 20px',display:'flex',alignItems:'center',gap:10,textAlign:'left',transition:'background 0.15s'}}>
                  <div style={{width:30,height:30,borderRadius:7,background:isOpen?HL:'#F3F0FF',border:`1px solid ${isOpen?HL:'#DDD6FE'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0,transition:'all 0.15s'}}>
                    <span style={{filter:isOpen?'brightness(10)':'none'}}>{s.icon}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13.5,fontWeight:600,color:isOpen?'#6B46C1':'#2D3748'}}>{s.label} <span style={{fontSize:11,fontWeight:400,color:'#A0AEC0'}}>{s.sub}</span></div>
                  </div>
                  <span style={{fontSize:14,color:isOpen?HL:'#A0AEC0',transform:isOpen?'rotate(180deg)':'none',transition:'transform 0.22s',display:'inline-block'}}>▼</span>
                </button>
                {isOpen&&(
                  <div style={{padding:'16px 20px 18px',background:'#FAFCFF',borderTop:`1px solid ${BDR}`}}>
                    <p style={{fontSize:13,color:'#374151',lineHeight:1.75,marginBottom:14}}>{sec.lead}</p>
                    {sec.steps&&(
                      <ul style={{listStyle:'none',margin:0,padding:0}}>
                        {sec.steps.map((step,n)=>(
                          <li key={n} style={{fontSize:12.5,color:'#4A5568',lineHeight:1.7,padding:'7px 0 7px 28px',borderBottom:n<sec.steps.length-1?`1px solid #F0F4F8`:'none',position:'relative'}}>
                            <span style={{position:'absolute',left:0,top:9,width:18,height:18,background:HL,color:'#fff',borderRadius:'50%',fontSize:9.5,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>{n+1}</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    )}
                    {sec.cards&&sec.cards.map((card,ci)=>(
                      <div key={ci} style={cardStyle}>
                        <div style={ctitleStyle}><span>{card.icon}</span>{card.title}</div>
                        <p style={cpStyle}>{card.body}</p>
                      </div>
                    ))}
                    {sec.tip&&(
                      <div style={tipStyle}>
                        <p style={{fontSize:12,color:'#374151',lineHeight:1.65,margin:0}}>
                          <strong style={{color:AMBER,fontWeight:700}}>{sec.tip.label}: </strong>{sec.tip.body}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{borderTop:`1px solid ${BDR}`,padding:'11px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff',flexShrink:0}}>
          <span style={{fontSize:11,color:'#A0AEC0'}}><strong style={{color:'#6B46C1'}}>scheduler.strategichonesty.com</strong> · Be Good. Do Good. Do Well.</span>
          <button onClick={onClose} style={{background:'#24b47e',border:'none',color:'#fff',fontSize:12,fontWeight:600,padding:'6px 16px',borderRadius:7,cursor:'pointer'}}>Got it ✓</button>
        </div>

      </div>
    </div>
  );
}

'''

src = src[:start_idx] + NEW_MODAL + src[end_idx:]
changes.append('✓ HelpModal replaced with accordion v3')

# ─────────────────────────────────────────────────────────────────────────────
# 2. ADD helpOpen state declaration
#    Insert after: const [approvedOpen,setApprovedOpen]=useState(true);
# ─────────────────────────────────────────────────────────────────────────────
HELP_STATE_ANCHOR = '  const [approvedOpen,setApprovedOpen]=useState(true);'
HELP_STATE_INSERT = '\n  const [helpOpen,setHelpOpen]=useState(false);'

if HELP_STATE_ANCHOR in src:
    src = src.replace(
        HELP_STATE_ANCHOR,
        HELP_STATE_ANCHOR + HELP_STATE_INSERT,
        1
    )
    changes.append('✓ helpOpen state added')
else:
    print('WARNING: Could not find approvedOpen state anchor — helpOpen not added')

# ─────────────────────────────────────────────────────────────────────────────
# 3. ADD Help & Guide to NAV array
#    Insert after Activity Log entry
# ─────────────────────────────────────────────────────────────────────────────
OLD_NAV = "  const NAV=[{id:'calendar',icon:'📅',label:'Calendar'},{id:'ideas',icon:'💡',label:'Content Ideas'},{id:'wizard',icon:'🚀',label:'Review & Post'},{id:'compose',icon:'✉️',label:'Quick Compose'},{id:'connect',icon:'🔗',label:'Connect'},{id:'upload',icon:'⬆',label:'Upload CSV'},{id:'log',icon:'📋',label:'Activity Log'}];"
NEW_NAV = "  const NAV=[{id:'calendar',icon:'📅',label:'Calendar'},{id:'ideas',icon:'💡',label:'Content Ideas'},{id:'wizard',icon:'🚀',label:'Review & Post'},{id:'compose',icon:'✉️',label:'Quick Compose'},{id:'connect',icon:'🔗',label:'Connect'},{id:'upload',icon:'⬆',label:'Upload CSV'},{id:'log',icon:'📋',label:'Activity Log'},{id:'help',icon:'❓',label:'Help & Guide',isModal:true}];"

if OLD_NAV in src:
    src = src.replace(OLD_NAV, NEW_NAV, 1)
    changes.append('✓ Help & Guide added to NAV array')
else:
    print('WARNING: Could not find NAV array — Help entry not added')

# ─────────────────────────────────────────────────────────────────────────────
# 4. FIX nav onClick — setHelpOpen is already referenced; confirm it works now
#    The nav item handler already has: if(id==='help'){setHelpOpen(true);return;}
#    This will now work since we added the state in step 2.
# ─────────────────────────────────────────────────────────────────────────────
if "if(id==='help'){setHelpOpen(true);return;}" in src:
    changes.append('✓ Nav onclick handler for help already present — works now that state is declared')
else:
    # Need to add it to the nav onclick
    OLD_NAV_CLICK = "className='nav-item'}} onClick={()=>{"
    # Fallback: patch the nav item onclick directly
    OLD_CLICK = "onClick={()=>{if(id==='wizard')wizardReset();setMainTab(id);}}"
    NEW_CLICK = "onClick={()=>{if(id==='help'){setHelpOpen(true);return;}if(id==='wizard')wizardReset();setMainTab(id);}}"
    if OLD_CLICK in src:
        src = src.replace(OLD_CLICK, NEW_CLICK, 1)
        changes.append('✓ Nav onclick handler patched to open HelpModal')
    else:
        print('WARNING: Could not find nav onclick — manual check needed')

# ─────────────────────────────────────────────────────────────────────────────
# 5. ADD <HelpModal> render — insert before closing </div> of main return
#    Anchor: the closing tag after the right panel
# ─────────────────────────────────────────────────────────────────────────────
HELP_RENDER_ANCHOR = "    </div>\n  );\n}"
HELP_RENDER_INSERT = "\n      {helpOpen&&<HelpModal onClose={()=>setHelpOpen(false)}/>}"

# Find last occurrence (end of main return)
last_idx = src.rfind(HELP_RENDER_ANCHOR)
if last_idx != -1:
    src = src[:last_idx] + "    </div>" + HELP_RENDER_INSERT + "\n  );\n}" + src[last_idx + len(HELP_RENDER_ANCHOR):]
    changes.append('✓ <HelpModal> render added to main return')
else:
    print('WARNING: Could not find main return closing tag — HelpModal render not added')

# ─────────────────────────────────────────────────────────────────────────────
# 6. REMOVE duplicate SettingsPanel render
# ─────────────────────────────────────────────────────────────────────────────
DUPE = "\n\n          {mainTab==='settings'&&(\n            <SettingsPanel/>\n          )}"
count = src.count(DUPE)
if count >= 2:
    # Remove only the first occurrence (keep the second/last one)
    idx = src.find(DUPE)
    src = src[:idx] + src[idx+len(DUPE):]
    changes.append('✓ Duplicate SettingsPanel render removed')
elif count == 1:
    changes.append('✓ SettingsPanel duplicate: only 1 found (already clean)')
else:
    print('WARNING: Could not find duplicate SettingsPanel pattern')

# ─────────────────────────────────────────────────────────────────────────────
# Write output
# ─────────────────────────────────────────────────────────────────────────────
if src == original:
    print('ERROR: No changes were made. Check warnings above.')
    sys.exit(1)

open(FILE, 'w', encoding='utf-8').write(src)

print('\nPatch complete:')
for c in changes:
    print(' ', c)
print(f'\nLines: {len(src.splitlines())}')
print('\nNext step: git add src/SocialHub.jsx && git commit -m "feat: HelpModal accordion v3 + Help nav entry" && git push')
