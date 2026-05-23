import { useState, useEffect, useRef, useCallback } from "react";

const BACKEND = "https://strategic-honesty-scheduler-production.up.railway.app";
const C = {
  bg:"#F4F6F8", card:"#FFFFFF", border:"#E2E8F0",
  text:"#0f172a", muted:"#64748b", label:"#334155",
  green:"#24b47e", greenLight:"#E6F7F2",
  gold:"#BA7517", goldLight:"#FEF3C7",
  navy:"#1E293B", red:"#DC2626", redLight:"#FEE2E2",
  shadow:"0 1px 3px rgba(0,0,0,0.07)",
  shadowMd:"0 4px 12px rgba(0,0,0,0.08)",
};
const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const PRESETS = [
  { id:"editorial",    label:"Editorial",     suffix:"clean editorial style, professional, high contrast" },
  { id:"luxury",       label:"Luxury",        suffix:"luxury brand aesthetic, gold tones, premium feel" },
  { id:"motivational", label:"Motivational",  suffix:"bold motivational poster, dynamic composition" },
  { id:"minimal",      label:"Minimal",       suffix:"minimalist design, elegant typography, whitespace" },
  { id:"cinematic",    label:"Cinematic",     suffix:"cinematic lighting, dramatic shadows" },
  { id:"social",       label:"Social",        suffix:"vibrant social media graphic, eye-catching" },
];

const RATIOS = [
  { id:"1:1",  label:"1:1",  desc:"Feed" },
  { id:"9:16", label:"9:16", desc:"Stories" },
  { id:"16:9", label:"16:9", desc:"LinkedIn" },
  { id:"4:5",  label:"4:5",  desc:"Instagram" },
];

// ── polling hook ──────────────────────────────────────────────────────────────
function useGenerate() {
  const [jobId,   setJobId]   = useState(null);
  const [status,  setStatus]  = useState("idle"); // idle|submitting|polling|complete|failed
  const [imageUrl,setImageUrl]= useState(null);
  const [error,   setError]   = useState(null);
  const timer = useRef(null);

  const stop = useCallback(() => { if(timer.current){ clearInterval(timer.current); timer.current=null; } }, []);

  const poll = useCallback(async (id) => {
    try {
      const r = await fetch(`${BACKEND}/media/jobs/${id}`);
      if (!r.ok) throw new Error(`Poll ${r.status}`);
      const d = await r.json();
      if (d.status === "complete") {
        stop(); setStatus("complete"); setImageUrl(d.outputUrl);
      } else if (d.status === "failed") {
        stop(); setStatus("failed"); setError(d.error || "Generation failed");
      }
    } catch(e) { stop(); setStatus("failed"); setError(e.message); }
  }, [stop]);

  const generate = useCallback(async ({ prompt, aspectRatio, contentIdeaId }) => {
    stop(); setStatus("submitting"); setError(null); setImageUrl(null);
    try {
      const r = await fetch(`${BACKEND}/media/generate`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"image", prompt, aspectRatio, contentIdeaId }),
      });
      if (!r.ok) { const d=await r.json(); throw new Error(d.error||`Error ${r.status}`); }
      const { jobId: id } = await r.json();
      setJobId(id); setStatus("polling");
      poll(id);
      timer.current = setInterval(() => poll(id), 3000);
    } catch(e) { setStatus("failed"); setError(e.message); }
  }, [poll, stop]);

  useEffect(() => () => stop(), [stop]);
  return { jobId, status, imageUrl, error, generate };
}

// ── sub-components ────────────────────────────────────────────────────────────
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:"5px 11px", borderRadius:20, fontSize:12, fontWeight:600,
      cursor:"pointer", border:`1px solid ${active ? C.gold : C.border}`,
      background: active ? C.goldLight : C.card,
      color: active ? C.gold : C.muted,
      transition:"all .15s",
    }}>{children}</button>
  );
}

function Spinner() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"48px 0"}}>
      <div style={{
        width:48, height:48, borderRadius:"50%",
        border:"3px solid #E2E8F0", borderTopColor:C.green,
        animation:"ms-spin 0.9s linear infinite",
      }}/>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text}}>Generating image…</div>
        <div style={{fontSize:12,color:C.muted,marginTop:4}}>Flux Schnell · 10–30 seconds</div>
      </div>
      <style>{`@keyframes ms-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"48px 0"}}>
      <div style={{fontSize:40}}>🎨</div>
      <div style={{fontSize:14,color:C.muted,textAlign:"center"}}>
        Enter a prompt and click Generate
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function MediaStudio({ approvedQueue = [], onAttachToPost }) {
  const [prompt,      setPrompt]      = useState("");
  const [preset,      setPreset]      = useState(null);
  const [ratio,       setRatio]       = useState("1:1");
  const [selectedIdea,setSelectedIdea]= useState(null);
  const [savedImages, setSavedImages] = useState([]); // approved assets this session

  const { status, imageUrl, error, generate } = useGenerate();
  const isGenerating = status === "submitting" || status === "polling";

  // auto-fill prompt from idea
  const pickIdea = (idea) => {
    setSelectedIdea(idea);
    const text = idea.title || idea.content || idea.text || "";
    setPrompt(text.slice(0, 200));
  };

  const buildPrompt = () => {
    const p = PRESETS.find(p => p.id === preset);
    return p ? `${prompt}. ${p.suffix}` : prompt;
  };

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    generate({ prompt: buildPrompt(), aspectRatio: ratio, contentIdeaId: selectedIdea?.id });
  };

  const handleApprove = () => {
    if (!imageUrl) return;
    const asset = { url: imageUrl, prompt, ratio, createdAt: new Date().toISOString() };
    setSavedImages(prev => [asset, ...prev]);
    if (onAttachToPost) onAttachToPost(imageUrl);
  };

  const handleRegenerate = () => {
    if (!prompt.trim()) return;
    generate({ prompt: buildPrompt(), aspectRatio: ratio, contentIdeaId: selectedIdea?.id });
  };

  const card = { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18, marginBottom:14 };
  const label = { fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, display:"block" };
  const btn = (bg, color, disabled) => ({
    padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:600,
    border:"none", cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#e5e7eb" : bg, color: disabled ? C.muted : color,
    transition:"opacity .15s",
  });

  return (
    <div style={{display:"flex",gap:16,height:"100%",fontFamily:F,minHeight:0}}>

      {/* ── LEFT: Prompt & Controls ── */}
      <div style={{width:280,flexShrink:0,overflowY:"auto"}}>

        {/* Idea picker */}
        {approvedQueue.length > 0 && (
          <div style={card}>
            <span style={label}>From Approved Queue</span>
            <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:160,overflowY:"auto"}}>
              {approvedQueue.slice(0,6).map((idea,i) => (
                <button key={idea.id||i} onClick={() => pickIdea(idea)} style={{
                  background: selectedIdea===idea ? C.greenLight : "#f8fafc",
                  border:`1px solid ${selectedIdea===idea ? C.green : C.border}`,
                  borderRadius:8, padding:"7px 10px", textAlign:"left", cursor:"pointer",
                  color: selectedIdea===idea ? C.green : C.text,
                  fontSize:12, lineHeight:1.4, transition:"all .15s",
                }}>
                  {(idea.title||idea.content||"").slice(0,70)}…
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt input */}
        <div style={card}>
          <span style={label}>Image Prompt</span>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create…"
            rows={5}
            style={{
              width:"100%", boxSizing:"border-box",
              border:`1px solid ${C.border}`, borderRadius:8,
              padding:"10px 12px", fontSize:13, fontFamily:F,
              color:C.text, resize:"vertical", outline:"none",
              lineHeight:1.5, transition:"border-color .15s",
            }}
            onFocus={e => e.target.style.borderColor = C.green}
            onBlur={e  => e.target.style.borderColor = C.border}
          />
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>{prompt.length} chars</div>
        </div>

        {/* Style preset */}
        <div style={card}>
          <span style={label}>Style Preset</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {PRESETS.map(p => (
              <Pill key={p.id} active={preset===p.id} onClick={() => setPreset(preset===p.id ? null : p.id)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Aspect ratio */}
        <div style={card}>
          <span style={label}>Aspect Ratio</span>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {RATIOS.map(r => (
              <button key={r.id} onClick={() => setRatio(r.id)} style={{
                background: ratio===r.id ? C.greenLight : "#f8fafc",
                border:`1px solid ${ratio===r.id ? C.green : C.border}`,
                borderRadius:8, padding:"8px 0", cursor:"pointer",
                color: ratio===r.id ? C.green : C.muted,
                textAlign:"center", transition:"all .15s",
              }}>
                <div style={{fontSize:13,fontWeight:700}}>{r.label}</div>
                <div style={{fontSize:10,marginTop:2,opacity:.8}}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          style={{...btn(C.green,"#fff",!prompt.trim()||isGenerating), width:"100%", padding:"12px 0", fontSize:14}}
        >
          {isGenerating ? "⏳ Generating…" : "✨ Generate Image"}
        </button>

        <div style={{marginTop:10,fontSize:11,color:C.muted,textAlign:"center"}}>
          Powered by Flux Schnell · ~$0.003/image
        </div>
      </div>

      {/* ── CENTER: Preview ── */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{...card,flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:320,marginBottom:0}}>
          {error && (
            <div style={{background:C.redLight,border:`1px solid ${C.red}44`,borderRadius:8,padding:"12px 16px",marginBottom:16,color:C.red,fontSize:13,width:"100%",boxSizing:"border-box"}}>
              ❌ {error}
            </div>
          )}
          {isGenerating ? <Spinner /> :
           imageUrl    ? <img src={imageUrl} alt="Generated" style={{maxWidth:"100%",maxHeight:440,borderRadius:10,objectFit:"contain",boxShadow:C.shadowMd}}/> :
                         <EmptyPreview />}
        </div>

        {/* Action row — only when image ready */}
        {imageUrl && !isGenerating && (
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button onClick={handleApprove} style={btn(C.green,"#fff",false)}>
              ✓ Approve & Attach to Post
            </button>
            <button onClick={handleRegenerate} style={btn("#fff",C.text,false)} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              🔄 Regenerate
            </button>
            <a href={imageUrl} target="_blank" rel="noreferrer" style={{...btn("#fff",C.text,false),textDecoration:"none",display:"inline-block"}}>
              ↗ Full Size
            </a>
          </div>
        )}
      </div>

      {/* ── RIGHT: Saved Assets ── */}
      <div style={{width:220,flexShrink:0,overflowY:"auto"}}>
        <div style={card}>
          <span style={label}>Session Assets ({savedImages.length})</span>
          {savedImages.length === 0 ? (
            <div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>
              Approved images appear here
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {savedImages.map((a,i) => (
                <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden"}}>
                  <img src={a.url} alt="" style={{width:"100%",aspectRatio:"1/1",objectFit:"cover",display:"block"}}/>
                  <div style={{padding:"8px 10px"}}>
                    <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:6}}>
                      {a.prompt.slice(0,50)}…
                    </div>
                    <button onClick={() => onAttachToPost && onAttachToPost(a.url)} style={{
                      width:"100%", padding:"5px 0", fontSize:11, fontWeight:600,
                      background:C.goldLight, color:C.gold,
                      border:`1px solid ${C.gold}44`, borderRadius:6, cursor:"pointer",
                    }}>📎 Attach</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{...card,background:"#f8fafc"}}>
          <span style={label}>Provider</span>
          <div style={{fontSize:12,color:C.text,fontWeight:600}}>Flux Schnell</div>
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>via Replicate API</div>
          <div style={{fontSize:11,color:C.muted,marginTop:6,lineHeight:1.5}}>
            Architecture supports OpenAI, Stability AI, local models
          </div>
        </div>
      </div>

    </div>
  );
}
