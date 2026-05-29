/**
 * SendToStudio_v2.jsx — Send to Media Studio with auto scene generation.
 * Props: post { id, title, text|content, platform, contentType }, onSent
 */
import { useState } from "react";
import { generatePrompts, buildQueueItem } from "../services/promptGenerator";
import { generateScenes } from "../services/sceneParser";
import { sendToMediaStudio } from "../services/queueService";

const STEPS = { idle:"idle", generating:"generating", preview:"preview", sending:"sending", done:"done", error:"error" };

const isVideo = (platform, contentType) => {
  const p = (platform||"").toLowerCase();
  const c = (contentType||"").toLowerCase();
  return p.includes("tiktok")||p.includes("youtube")||c.includes("video")||c.includes("reel")||c.includes("short");
};

export default function SendToStudio({ post, onSent }) {
  const [step, setStep]         = useState(STEPS.idle);
  const [statusMsg, setMsg]     = useState("");
  const [sceneData, setScenes]  = useState(null);
  const [edited, setEdited]     = useState({ imagePrompt:"", videoPrompt:"" });
  const [errorMsg, setError]    = useState("");

  const videoMode = isVideo(post?.platform, post?.contentType);

  async function handleGenerate() {
    setStep(STEPS.generating); setError("");
    const text = post.text||post.content||post.prompt||"";
    const platform = post.platform||"tiktok";
    const contentType = post.contentType||"short_video";
    try {
      setMsg("Generating prompts…");
      const prompts = await generatePrompts(text, platform, contentType);
      setEdited(prompts);
      if (videoMode) {
        setMsg("Generating scenes…");
        const scenes = await generateScenes(text, platform, contentType);
        setScenes(scenes);
      }
      setMsg(""); setStep(STEPS.preview);
    } catch(e) { setError(e.message); setStep(STEPS.error); }
  }

  async function handleSend() {
    setStep(STEPS.sending);
    try {
      const item = buildQueueItem(post, edited);
      if (sceneData) item.sceneData = sceneData;
      item.sourceText = post.text||post.content||post.prompt||"";
      await sendToMediaStudio(item);
      setStep(STEPS.done);
      onSent?.(item);
    } catch(e) { setError(e.message); setStep(STEPS.error); }
  }

  function handleClose() { setStep(STEPS.idle); setScenes(null); setMsg(""); setError(""); }

  return (
    <>
      <button onClick={handleGenerate} disabled={step===STEPS.generating||step===STEPS.sending}
        style={{ padding:"6px 14px", fontSize:13, cursor:"pointer" }}>
        {step===STEPS.generating ? (statusMsg||"Generating…") : "🎬 Send to Media Studio"}
      </button>

      {(step===STEPS.preview||step===STEPS.sending||step===STEPS.done||step===STEPS.error) && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ marginTop:0, marginBottom:4 }}>Media Studio Queue</h3>
            <p style={{ fontSize:12, color:"#888", marginTop:0, marginBottom:14 }}>
              {videoMode ? "🎬 Video mode — scenes auto-generated" : "🖼️ Image mode — quote card will be generated"}
            </p>

            {step===STEPS.done ? (
              <>
                <p style={{ color:"green" }}>✅ Sent to Media Studio!</p>
                {sceneData && <p style={{ fontSize:12, color:"#555" }}>✓ {sceneData.scenes?.length} scenes · {sceneData.totalDuration}s</p>}
                <button onClick={handleClose} style={btnSec}>Close</button>
              </>
            ) : step===STEPS.error ? (
              <>
                <p style={{ color:"red", fontSize:13 }}>❌ {errorMsg}</p>
                <button onClick={handleClose} style={btnSec}>Close</button>
              </>
            ) : (
              <>
                <label style={lbl}>Image Prompt</label>
                <textarea value={edited.imagePrompt} rows={2} style={ta}
                  onChange={e=>setEdited(p=>({...p,imagePrompt:e.target.value}))} />
                <label style={lbl}>Video Prompt</label>
                <textarea value={edited.videoPrompt} rows={2} style={ta}
                  onChange={e=>setEdited(p=>({...p,videoPrompt:e.target.value}))} />
                {sceneData && (
                  <div style={{ marginTop:10, padding:"8px 12px", background:"#f0f7ff", borderRadius:6, fontSize:12, color:"#1e3a5f" }}>
                    ✓ {sceneData.scenes?.length} scenes ready · {sceneData.totalDuration}s · "{sceneData.hook}"
                  </div>
                )}
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={handleSend} disabled={step===STEPS.sending} style={btnPri}>
                    {step===STEPS.sending ? "Sending…" : "Send to Queue"}
                  </button>
                  <button onClick={handleClose} style={btnSec}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 };
const modal   = { background:"#fff", borderRadius:10, padding:24, width:"min(500px,92vw)", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" };
const lbl     = { display:"block", fontSize:12, fontWeight:600, marginBottom:4, marginTop:10, color:"#444" };
const ta      = { width:"100%", padding:8, fontSize:13, borderRadius:6, border:"1px solid #ddd", resize:"vertical", boxSizing:"border-box" };
const btnPri  = { padding:"8px 16px", background:"#1e3a5f", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:13 };
const btnSec  = { padding:"8px 16px", background:"#f0f0f0", color:"#333", border:"none", borderRadius:6, cursor:"pointer", fontSize:13 };
