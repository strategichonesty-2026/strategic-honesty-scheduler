import { useState } from "react";

// Shared modal used by all export components
export function ExportModal({ title, filename, content, onClose }) {
  const [text, setText] = useState(content);

  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
      <div style={{ background:"#fff", borderRadius:12, padding:24, width:"min(680px,95vw)", maxHeight:"85vh", display:"flex", flexDirection:"column", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#0F172A", margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#64748b" }}>✕</button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ flex:1, minHeight:320, padding:12, fontSize:12, fontFamily:"monospace", border:"1px solid #E2E8F0", borderRadius:8, resize:"vertical", lineHeight:1.6 }}
        />
        <div style={{ display:"flex", gap:8, marginTop:14, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", background:"#f1f5f9", color:"#334155", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={download} style={{ padding:"8px 16px", background:"#1E3A5F", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>⬇ Download .txt</button>
        </div>
      </div>
    </div>
  );
}

// ── Buffer CSV ────────────────────────────────────────────────────────────────
export function ExportBufferCSV({ queue }) {
  const [open, setOpen] = useState(false);

  const getContent = () => {
    const esc = v => `"${(v||"").replace(/"/g,'""')}"`;
    const rows = ["Platform,Title,Content,Status", ...queue.map(i =>
      [esc(i.platform), esc(i.title), esc(i.content), esc("Approved")].join(",")
    )];
    return rows.join("\n");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ padding:"7px 13px", fontSize:12, fontWeight:600, background:"#7C3AED", color:"#fff", border:"none", borderRadius:7, cursor:"pointer" }}
      >
        📥 Buffer CSV
      </button>
      {open && (
        <ExportModal
          title="Buffer CSV"
          filename={`SH_ContentQueue_${new Date().toISOString().split("T")[0]}.txt`}
          content={getContent()}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Pictory Scripts ───────────────────────────────────────────────────────────
export function ExportPictoryScripts({ queue }) {
  const [open, setOpen] = useState(false);

  const getContent = () => {
    const items = queue.filter(i => ["TikTok","YouTube Shorts","Facebook","Instagram"].includes(i.platform));
    if (!items.length) return "No video platform posts in queue.";
    const lines = ["STRATEGIC HONESTY — PICTORY VIDEO SCRIPTS", "Generated: " + new Date().toLocaleDateString(), "", "═".repeat(60), ""];
    items.forEach((item, i) => {
      lines.push(`PROJECT ${i+1}: ${item.platform.toUpperCase()} — ${item.title}`);
      lines.push("─".repeat(50));
      lines.push(item.content);
      lines.push("");
    });
    return lines.join("\n");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ padding:"7px 13px", fontSize:12, fontWeight:600, background:"#FF0000", color:"#fff", border:"none", borderRadius:7, cursor:"pointer" }}
      >
        🎬 Pictory Scripts
      </button>
      {open && (
        <ExportModal
          title="Pictory Scripts"
          filename={`SH_PictoryScripts_${new Date().toISOString().split("T")[0]}.txt`}
          content={getContent()}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Image Prompts ─────────────────────────────────────────────────────────────
export function ExportImagePrompts({ queue }) {
  const [open, setOpen] = useState(false);

  const getContent = () => {
    const items = queue.filter(i => i.imageprompt);
    if (!items.length) return "No image prompts available.";
    const lines = ["STRATEGIC HONESTY — IMAGE & THUMBNAIL PROMPTS", "Generated: " + new Date().toLocaleDateString(), "Paste into Midjourney, DALL-E, Ideogram, or Canva AI", "", "═".repeat(60), ""];
    items.forEach((item, i) => {
      lines.push(`PROMPT ${i+1}: ${item.title} (${item.platform})`);
      lines.push("─".repeat(50));
      lines.push(item.imageprompt);
      lines.push("");
    });
    return lines.join("\n");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ padding:"7px 13px", fontSize:12, fontWeight:600, background:"#E1306C", color:"#fff", border:"none", borderRadius:7, cursor:"pointer" }}
      >
        🎨 Image Prompts
      </button>
      {open && (
        <ExportModal
          title="Image Prompts"
          filename={`SH_ImagePrompts_${new Date().toISOString().split("T")[0]}.txt`}
          content={getContent()}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Creative Brief ────────────────────────────────────────────────────────────
export function ExportCreativeBrief({ queue }) {
  const [open, setOpen] = useState(false);

  const getContent = () => {
    if (!queue.length) return "No approved posts in queue.";
    const lines = ["STRATEGIC HONESTY — MASTER CREATIVE BRIEF", "Generated: " + new Date().toLocaleDateString(), "Brand: StrategicHonesty.com | Author: Gopu Shrestha", "Philosophy: Be Good. Do Good. Do Well.", "", "═".repeat(60), ""];
    queue.forEach((item, i) => {
      lines.push(`${i+1}. ${item.platform.toUpperCase()} — ${item.title}`);
      lines.push("─".repeat(50));
      lines.push("APPROVED COPY:");
      lines.push(item.content);
      lines.push("");
      if (item.imageprompt) {
        lines.push("IMAGE/THUMBNAIL PROMPT:");
        lines.push(item.imageprompt);
        lines.push("");
      }
      lines.push("VISUAL DIRECTION: Dark navy background, gold accent typography, professional but human.");
      lines.push("BRAND SIGN-OFF: Be Good. Do Good. Do Well. — Gopu Shrestha");
      lines.push("");
      lines.push("═".repeat(60));
      lines.push("");
    });
    return lines.join("\n");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ padding:"7px 13px", fontSize:12, fontWeight:600, background:"#C9A84C", color:"#0F172A", border:"none", borderRadius:7, cursor:"pointer" }}
      >
        📄 Creative Brief
      </button>
      {open && (
        <ExportModal
          title="Creative Brief"
          filename={`SH_CreativeBrief_${new Date().toISOString().split("T")[0]}.txt`}
          content={getContent()}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
