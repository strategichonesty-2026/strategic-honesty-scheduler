export const BUILD_TIME = process.env.REACT_APP_BUILD_TIME || 'dev';
export const GREEN = '#24b47e';
export const BSKY_COLOR = '#0085FF';
export const BACKEND = 'https://strategic-honesty-scheduler-production.up.railway.app';
export const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

export const C = {
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

export const CONTENT_TYPES = [
  { id:'video-long',  label:'Video Long',      emoji:'🎬', desc:'YouTube, Facebook' },
  { id:'video-short', label:'Video Short/Reel', emoji:'📱', desc:'TikTok, Reels, Shorts' },
  { id:'image',       label:'Image + Caption',  emoji:'📸', desc:'Instagram, Facebook…' },
  { id:'text-short',  label:'Text Short <280',  emoji:'✍️', desc:'X, Bluesky, Threads' },
  { id:'text-medium', label:'Text Medium <700', emoji:'📝', desc:'LinkedIn, Facebook…' },
  { id:'text-long',   label:'Text Long',        emoji:'📄', desc:'LinkedIn Articles…' },
  { id:'link',        label:'Link Share',       emoji:'🔗', desc:'LinkedIn, Bluesky…' },
];

export const ROUTER_MAP = {
  'video-long':['yt','fb'],'video-short':['tt','ig','yt','fb'],
  'image':['ig','fb','pi','li'],'text-short':['tw','bs','th'],
  'text-medium':['li','fb','bs'],'text-long':['li','ss'],'link':['li','fb','bs','tw'],
};

export const CHAR_LIMITS = {
  li:{label:'LinkedIn',limit:3000,warn:2800,color:'#0A66C2'},
  bs:{label:'Bluesky',limit:300,warn:260,color:'#0085FF',hard:true},
  tw:{label:'X/Twitter',limit:280,warn:250,color:'#000000'},
  fb:{label:'Facebook',limit:63206,warn:60000,color:'#1877F2'},
  ig:{label:'Instagram',limit:2200,warn:2000,color:'#E1306C'},
  tt:{label:'TikTok',limit:2200,warn:2000,color:'#010101'},
  yt:{label:'YouTube',limit:5000,warn:4500,color:'#FF0000'},
};

export const BUFFER_PLATFORMS = {
  fb:{name:'Facebook',icon:'👥',color:'#1877F2',time:'13:00'},
  tt:{name:'TikTok',icon:'🎵',color:'#010101',time:'19:00'},
  ig:{name:'Instagram',icon:'📸',color:'#E1306C',time:'11:00'},
};

export const PREVIEW_PLATFORMS = [
  {id:'li',label:'LinkedIn',color:'#0A66C2'},
  {id:'tt',label:'TikTok',color:'#010101'},
  {id:'ig',label:'Instagram',color:'#E1306C'},
  {id:'fb',label:'Facebook',color:'#1877F2'},
  {id:'tw',label:'X',color:'#333'},
  {id:'th',label:'Threads',color:'#444'},
];

export const STATIC_CHANNELS = [
  {id:'fb',name:'Strategic Honesty',handle:'Facebook Page',platform:'Facebook',icon:'👥',color:'#1877F2',avatar:'https://img.youtube.com/vi/pSRmFFI-eWs/default.jpg',initials:'SH',type:'Facebook Page',posts:10,status:'active'},
  {id:'tt',name:'strategichonesty1',handle:'TikTok Account',platform:'TikTok',icon:'🎵',color:'#010101',avatar:'',initials:'S1',type:'TikTok Account',posts:10,status:'active'},
  {id:'ig',name:'strategichonesty',handle:'Instagram Professional',platform:'Instagram',icon:'📸',color:'#E1306C',avatar:'',initials:'SH',type:'Instagram Professional',posts:10,status:'active'},
];

export const ALL_PLATFORMS = [
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

export const SCHEDULE_POSTS = [
  {day:18,color:'#0A66C2',text:'LinkedIn: Integrity edge...'},
  {day:19,color:'#E1306C',text:'Integrity wins...'},{day:19,color:'#010101',text:'Integrity TikTok...'},
  {day:20,color:'#BA7517',text:'Quote: Sand vs bedrock...'},{day:21,color:'#D85A30',text:'Book: True North...'},
  {day:22,color:'#E1306C',text:'Integrity: Strategic asset...'},{day:22,color:'#010101',text:'Strategic asset TT...'},
  {day:25,color:'#0A66C2',text:'LinkedIn: Reputation...'},{day:26,color:'#E1306C',text:'Reputation asset...'},
  {day:26,color:'#010101',text:'Reputation TT...'},{day:27,color:'#BA7517',text:'Quote: Shortcuts are loans...'},
  {day:28,color:'#D85A30',text:'Book: Strategic Honesty...'},{day:29,color:'#E1306C',text:'Integrity always wins...'},
  {day:29,color:'#010101',text:'Always wins TT...'},
];

export const QUOTES = {
  integrity:"Integrity isn't a soft skill. It's the hardest competitive edge in business.\n\nSand leaders optimize for today.\nBedrock leaders optimize for trust.\n\nAnd trust? It compounds like interest.\n\nI grew up in rural Nepal. The one thing I never gave up was my word. Turns out — that was everything.\n\n#StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell",
  reputation:"Your reputation is built in years. Destroyed in one shortcut.\n\nEvery honest call you made is still working for you right now.\n\n#StrategicHonesty #Reputation #Leadership",
  shortcuts:"Every shortcut is a loan — and the interest is your integrity.\n\nSave this for the next time you feel pressure to cut corners.\n\n#StrategicHonesty #Leadership #BeGoodDoGoodDoWell #Integrity",
  nepal:"I grew up on dirt floors in Nepal.\n\nNo shortcuts. No safety net. No plan B.\n\nYour word. Your integrity. Your True North.\n\nThat's what everything I've built is made of.\n\n#StrategicHonesty #Nepal #Leadership",
  ai:"The real battle is not human vs. machine.\nIt is integrity vs. exploitation.\n\nAI won't replace your craft — it exposes organizational lies.\n\n#StrategicHonesty #AI #HumanEdge #YouStillMatter",
  trust:"Trust compounds like interest.\n\nEvery honest call you make today is an investment.\nEvery shortcut is a withdrawal.\n\nThe math always catches up.\n\n#StrategicHonesty #Trust #Leadership #BeGoodDoGoodDoWell"
};

export const BRAND_SYSTEM = `You are the Strategic Honesty Content Engine — personal AI editorial board for Gopu Shrestha. Background: grew up in rural Nepal (no running water, no plan B), Senior Program Manager at one of the largest U.S. financial institutions, PMP/PgMP/PMI-ACP/PSM II certified, PhD candidate, Distinguished Toastmaster, District Director Toastmasters International District 106, author of 7 books including "Unlocking Integrity-Centered Leadership" "You Still Matter" "The Strategic Honesty Playbook". Two sons: US Army veteran and Environmental Engineer. Runs StrategicHonesty.com. Philosophy: "Be Good. Do Good. Do Well." Voice: warm mentor-toned conversational, mix short punchy and longer reflective sentences, anchor in Nepal/immigration journey, avoid jargon cold minimalism hype passive voice, 8th-10th grade reading level. Hashtags: #StrategicHonesty #Integrity #Leadership #BeGoodDoGoodDoWell. Write first-person as Gopu. Never generic motivation. Root everything in lived experience or concrete professional insight. Respond ONLY with requested content — no preamble, no labels.`;

export const CI_PLATFORMS = [
  {id:'li',label:'LinkedIn',icon:'💼',color:'#0A66C2',fmt:'Thought-leadership post 150–300 words, line breaks, strong opening hook, no external links in body'},
  {id:'tt',label:'TikTok',icon:'🎵',color:'#333',fmt:'45–60 sec script [0-3sec HOOK] [3-15sec PROBLEM] [15-40sec STORY] [40-55sec CTA], raw authentic tone'},
  {id:'yt',label:'YouTube Shorts',icon:'▶️',color:'#FF0000',fmt:'55-sec script Hook→Problem→Proof→CTA with timing, suggest search-optimized title at top'},
  {id:'ig',label:'Instagram',icon:'📸',color:'#E1306C',fmt:'Caption 150–220 words, strong first line, save-optimized, [visual suggestion] in brackets, hashtags at end'},
  {id:'tw',label:'X / Twitter',icon:'🐦',color:'#555',fmt:'Thread opener under 280 chars ending 🧵 then 5 numbered replies each under 280 chars'},
  {id:'fb',label:'Facebook',icon:'👥',color:'#1877F2',fmt:'Narrative 200–350 words, legacy/values framing, share-optimized CTA at end'},
  {id:'th',label:'Threads',icon:'🧵',color:'#444',fmt:'2 connected micro-posts separated by ---. First=hook 2–5 lines. Second=reframe. No hashtags.'},
];

export const CI_ACTIONS = [
  {id:'rewrite',label:'Rewrite',icon:'↩'},{id:'emotion',label:'+Emotion',icon:'❤'},
  {id:'contrarian',label:'Contrarian',icon:'⚡'},{id:'trust',label:'+Trust',icon:'🔒'},
  {id:'vulnerable',label:'+Vulnerable',icon:'🌱'},{id:'analytical',label:'+Data',icon:'📊'},
  {id:'video',label:'→ Pictory Script',icon:'🎬'},{id:'carousel',label:'→ Carousel',icon:'📲'},
  {id:'longform',label:'→ Long Form',icon:'📄'},{id:'variations',label:'3 Variations',icon:'◈'},
];

export const ACTION_MODS = {
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

export const RESEARCH_QUERIES = [
  'viral LinkedIn posts integrity leadership authenticity high engagement 2025 2026',
  'TikTok trending leadership personal development immigrant success story viral 2026',
  'viral Instagram leadership carousel saves self-improvement 2026',
  'YouTube Shorts leadership motivation retention hooks 2026 trending',
  'integrity AI era leadership content trends messaging resonance 2026',
  'immigrant success story leadership brand viral social media content 2026',
];

export const NAV = [
  {id:'calendar',icon:'📅',label:'Calendar'},
  {id:'ideas',icon:'💡',label:'Content Ideas'},
  {id:'wizard',icon:'🚀',label:'Review & Post'},
  {id:'compose',icon:'✉️',label:'Quick Compose'},
  {id:'connect',icon:'🔗',label:'Connect'},
  {id:'upload',icon:'⬆',label:'Upload CSV'},
  {id:'log',icon:'📋',label:'Activity Log'},
];
