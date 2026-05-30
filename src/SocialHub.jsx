import { useState, useEffect, useRef, useCallback } from 'react';
import { saveContent, loadContent, runCleanup } from './services/contentStorage';
import { ExportBufferCSV, ExportPictoryScripts, ExportImagePrompts, ExportCreativeBrief } from './components/ExportModal';
import WizardPanel from './components/WizardPanel';
import {
  BUILD_TIME, GREEN, BSKY_COLOR, BACKEND, F, C,
  CONTENT_TYPES, ROUTER_MAP, CHAR_LIMITS, BUFFER_PLATFORMS,
  PREVIEW_PLATFORMS, STATIC_CHANNELS, ALL_PLATFORMS,
  SCHEDULE_POSTS, QUOTES, BRAND_SYSTEM,
  CI_PLATFORMS, CI_ACTIONS, ACTION_MODS, NAV,
} from './constants';
import {
  getUserId, bskyCreateSession, bskyPost,
  computeScheduleDates, downloadCSV, downloadScheduledCSV,
  ciCallClaude, logColor, statusDot,
} from './utils';

// ─── Shared style helpers ─────────────────────────────────────────────────────
const inputStyle = { width: '100%', border: `1px solid ${C.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: C.text, fontFamily: F, outline: 'none', resize: 'none', marginBottom: 10, background: '#fff', boxSizing: 'border-box' };
const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: 'block', fontWeight: 500 };

// ─── PlatformIcon ─────────────────────────────────────────────────────────────
function PlatformIcon({ id, size = 16, color = 'currentColor' }) {
  const s = { width: size, height: size, display: 'inline-block', flexShrink: 0 };
  if (id === 'li') return <svg style={s} viewBox="0 0 24 24" fill={color}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
  if (id === 'tt') return <svg style={s} viewBox="0 0 24 24" fill={color}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" /></svg>;
  if (id === 'ig') return <svg style={s} viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>;
  if (id === 'fb') return <svg style={s} viewBox="0 0 24 24" fill={color}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
  if (id === 'tw') return <svg style={s} viewBox="0 0 24 24" fill={color}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
  if (id === 'th') return <svg style={s} viewBox="0 0 192 192" fill={color}><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.23c8.249.053 14.474 2.452 18.502 7.13 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376C123.553 163.2 108.228 168.915 88 169.02c-22.22-.12-39.015-7.285-49.892-21.305C28.615 134.27 23.536 116.38 23.333 94c.203-22.379 5.282-40.269 15.076-53.715C49.185 26.715 65.98 19.55 88.2 19.43c22.389.12 39.353 7.295 50.408 21.325 5.486 6.944 9.579 15.64 12.208 25.755l16.17-4.322c-3.164-12.003-8.312-22.597-15.498-31.58C136.642 13.586 115.612 3.634 88.363 3.5h-.37C61.12 3.634 40.257 13.636 26.5 30.573 14.343 45.446 8.08 66.25 7.9 93.934L7.9 94l.002.066c.18 27.684 6.443 48.488 18.6 63.361C40.256 174.364 61.12 184.366 88 184.5h.37c23.863-.12 40.697-6.42 54.488-20.2 18.421-18.414 17.843-41.485 11.802-55.649-4.413-10.289-12.809-18.593-23.123-23.663zm-40.24 40.498c-10.45.588-21.286-4.098-21.82-14.135-.397-7.442 5.296-15.746 22.461-16.735 1.966-.114 3.895-.169 5.79-.169 6.235 0 12.068.606 17.371 1.765-1.978 24.702-13.574 28.674-23.802 29.274z" /></svg>;
  return <span style={{ fontSize: size, lineHeight: 1 }}>{id === 'li' ? '💼' : id === 'tt' ? '🎵' : id === 'ig' ? '📸' : id === 'fb' ? '👥' : id === 'tw' ? '𝕏' : '🧵'}</span>;
}

// ─── LogoMenu ─────────────────────────────────────────────────────────────────
function LogoMenu({ onHome }) {
  const [hover, setHover] = useState(false);
  const logoSrc = localStorage.getItem('sh_logo') || '';
  return (
    <div style={{ marginBottom: 14 }}>
      <div onClick={onHome} title="Go to Dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 10, padding: '4px 6px', background: hover ? '#f1f5f9' : 'transparent', transition: 'background .15s' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div style={{ width: 38, height: 38, background: logoSrc ? 'transparent' : '#24b47e', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17, fontWeight: 800, flexShrink: 0, boxShadow: '0 2px 6px rgba(36,180,126,0.3)', overflow: 'hidden' }}>
          {logoSrc ? <img src={logoSrc} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'S'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Strategic Honesty</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Content Platform v3</div>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ ch, size = 32 }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: 8, background: ch.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45, fontWeight: 600, color: ch.color, overflow: 'hidden', border: '1px solid ' + ch.color + '33' }}>
        {ch.avatar && !err ? <img src={ch.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} /> : <span>{ch.initials || ch.icon}</span>}
      </div>
      <div style={{ position: 'absolute', bottom: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: ch.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, border: '1.5px solid #fff' }}>{ch.icon}</div>
    </div>
  );
}

// ─── CharCounter ──────────────────────────────────────────────────────────────
function CharCounter({ content, selectedPlatforms }) {
  const relevant = Object.entries(CHAR_LIMITS).filter(([id]) => selectedPlatforms.has(id));
  if (!relevant.length || !content) return null;
  const len = content.length;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      {relevant.map(([id, cfg]) => {
        const over = len > cfg.limit, warn = len > cfg.warn && !over, pct = Math.min(len / cfg.limit, 1);
        return (
          <div key={id} style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, border: `1px solid ${over ? '#fca5a5' : warn ? '#fcd34d' : C.border}`, background: over ? '#fef2f2' : warn ? '#fffbeb' : '#f8f8f8', minWidth: 110 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span><span style={{ color: over ? '#dc2626' : warn ? '#d97706' : C.muted, fontWeight: over || warn ? 600 : 400 }}>{len}/{cfg.limit}</span></div>
            <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}><div style={{ width: `${pct * 100}%`, height: '100%', background: over ? '#dc2626' : warn ? '#d97706' : cfg.color, borderRadius: 2, transition: 'width .2s' }} /></div>
            {over && cfg.hard && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3, fontWeight: 600 }}>🚫 Must trim to {cfg.limit}</div>}
            {over && !cfg.hard && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3 }}>Over by {len - cfg.limit}</div>}
            {warn && <div style={{ fontSize: 10, color: '#d97706', marginTop: 3 }}>⚠ {cfg.limit - len} left</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── SettingsPanel ────────────────────────────────────────────────────────────
function SettingsPanel() {

  const fileRef = useRef(null);
  const importRef = useRef(null);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('sh_display_name') || 'Gopu Shrestha');
  const [tagline, setTagline] = useState(() => localStorage.getItem('sh_tagline') || 'Be Good. Do Good. Do Well.');
  const [logoSrc, setLogoSrc] = useState(() => localStorage.getItem('sh_logo') || '');
  const [defLiTime, setDefLiTime] = useState(() => localStorage.getItem('sh_def_li_time') || '08:00');
  const [defIgTime, setDefIgTime] = useState(() => localStorage.getItem('sh_def_ig_time') || '11:00');
  const [defTtTime, setDefTtTime] = useState(() => localStorage.getItem('sh_def_tt_time') || '19:00');
  const [defFbTime, setDefFbTime] = useState(() => localStorage.getItem('sh_def_fb_time') || '13:00');
  const [defPattern, setDefPattern] = useState(() => localStorage.getItem('sh_def_pattern') || 'weekly4');
  const [defImageUrl, setDefImageUrl] = useState(() => localStorage.getItem('sh_def_image_url') || '');
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const handleLogoUpload = e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { const src = ev.target.result; setLogoSrc(src); localStorage.setItem('sh_logo', src); }; reader.readAsDataURL(file); };
  const saveProfile = () => { localStorage.setItem('sh_display_name', displayName); localStorage.setItem('sh_tagline', tagline); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const saveDefaults = () => { localStorage.setItem('sh_def_li_time', defLiTime); localStorage.setItem('sh_def_ig_time', defIgTime); localStorage.setItem('sh_def_tt_time', defTtTime); localStorage.setItem('sh_def_fb_time', defFbTime); localStorage.setItem('sh_def_pattern', defPattern); localStorage.setItem('sh_def_image_url', defImageUrl); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const exportData = () => { const data = { version: '1.0', exportDate: new Date().toISOString(), profile: { displayName, tagline }, research: JSON.parse(localStorage.getItem('sh_ci_findings') || '[]'), ideas: JSON.parse(localStorage.getItem('sh_ci_ideas') || '[]'), queue: JSON.parse(localStorage.getItem('sh_ci_queue') || '[]'), activityLog: JSON.parse(localStorage.getItem('sh_activity_log') || '[]') }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `strategic-honesty-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); };
  const importData = e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { try { const data = JSON.parse(ev.target.result); if (data.research?.length) localStorage.setItem('sh_ci_findings', JSON.stringify(data.research)); if (data.ideas?.length) localStorage.setItem('sh_ci_ideas', JSON.stringify(data.ideas)); if (data.queue?.length) localStorage.setItem('sh_ci_queue', JSON.stringify(data.queue)); if (data.activityLog?.length) localStorage.setItem('sh_activity_log', JSON.stringify(data.activityLog)); setImportMsg(`Imported ${data.ideas?.length || 0} ideas`); setTimeout(() => window.location.reload(), 1500); } catch { setImportMsg('Error: Could not read file.'); } }; reader.readAsText(file); };
  const clearCache = () => { if (!window.confirm('Clear all cached content ideas and research?')) return; ['sh_ci_findings', 'sh_ci_ideas', 'sh_ci_queue', 'sh_ci_lastrun', 'sh_ci_nextrun', 'sh_ci_resstatus'].forEach(k => localStorage.removeItem(k)); window.location.reload(); };
  const resetQueue = () => { if (!window.confirm('Reset the approved queue?')) return; localStorage.removeItem('sh_ci_queue'); window.location.reload(); };

  const sectionStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 14 };
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>⚙️ Settings</div>
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 13, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>👤 Profile & Brand</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: logoSrc ? 'transparent' : GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800, overflow: 'hidden', border: `2px solid ${C.border}`, flexShrink: 0 }}>
            {logoSrc ? <img src={logoSrc} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'S'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Brand Logo</div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button onClick={() => fileRef.current?.click()} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: GREEN, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Upload Logo</button>
              {logoSrc && <button onClick={() => { setLogoSrc(''); localStorage.removeItem('sh_logo'); }} style={{ padding: '5px 12px', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#dc2626' }}>Remove</button>}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>
        <label style={labelStyle}>Display Name</label>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} placeholder="Gopu Shrestha" />
        <label style={labelStyle}>Tagline</label>
        <input value={tagline} onChange={e => setTagline(e.target.value)} style={inputStyle} placeholder="Be Good. Do Good. Do Well." />
        <button onClick={saveProfile} style={{ padding: '7px 18px', fontSize: 13, fontWeight: 600, background: GREEN, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saved ? '✓ Saved' : 'Save Profile'}</button>
      </div>
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 13, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>⏰ Posting Defaults</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {[{ label: 'LinkedIn time', val: defLiTime, set: setDefLiTime }, { label: 'Instagram time', val: defIgTime, set: setDefIgTime }, { label: 'TikTok time', val: defTtTime, set: setDefTtTime }, { label: 'Facebook time', val: defFbTime, set: setDefFbTime }].map(({ label, val, set }) => (
            <div key={label}><label style={labelStyle}>{label} (CST)</label><input type="time" value={val} onChange={e => set(e.target.value)} style={{ ...inputStyle, marginBottom: 0, cursor: 'pointer' }} /></div>
          ))}
        </div>
        <label style={labelStyle}>Default schedule pattern</label>
        <select value={defPattern} onChange={e => setDefPattern(e.target.value)} style={{ ...inputStyle }}>
          <option value="once">Post once</option><option value="weekly4">Weekly × 4</option><option value="biweekly4">Bi-weekly × 4</option><option value="monthly3">Monthly × 3</option>
        </select>
        <label style={labelStyle}>Default image URL</label>
        <input value={defImageUrl} onChange={e => setDefImageUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
        <button onClick={saveDefaults} style={{ padding: '7px 18px', fontSize: 13, fontWeight: 600, background: GREEN, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saved ? '✓ Saved' : 'Save Defaults'}</button>
      </div>
      <div style={sectionStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 13, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>💾 Data</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            { label: 'Export Content Library', sub: 'Saves research, ideas, queue, activity log', bg: '#f8fafc', border: C.border, btnBg: C.navy, btnLabel: '📥 Export', fn: exportData },
            { label: 'Import Content Library', sub: 'Restore a previous export', bg: '#f0fdf4', border: '#bbf7d0', btnBg: '#16a34a', btnLabel: '📂 Import', fn: () => importRef.current?.click() },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: item.bg, borderRadius: 9, border: `1px solid ${item.border}` }}>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.sub}</div></div>
              <button onClick={item.fn} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: item.btnBg, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}>{item.btnLabel}</button>
            </div>
          ))}
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
          {importMsg && <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, fontSize: 12, color: '#166534' }}>{importMsg}</div>}
          {[
            { label: 'Clear Research Cache', sub: 'Removes all cached research and ideas', fn: clearCache },
            { label: 'Reset Approved Queue', sub: 'Removes all approved posts', fn: resetQueue },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: '#fff9f9', borderRadius: 9, border: '1px solid #fca5a5' }}>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.label}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.sub}</div></div>
              <button onClick={item.fn} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', flexShrink: 0 }}>🗑 Clear</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ContentIdeasPanel (kept as single component — already well-isolated) ────
function ContentIdeasPanel({ setApprovedQueue }) {

  const [ciTab, setCiTab] = useState('research');
  const [resStatus, setResStatus] = useState('idle');
  const [resProgress, setResProgress] = useState(0);
  const [resLabel, setResLabel] = useState('');
  const [findings, setFindings] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [queue, setQueue] = useState(() => { try { return JSON.parse(localStorage.getItem('sh_ci_queue') || '[]'); } catch { return []; } });
  const [lastRun, setLastRun] = useState(() => localStorage.getItem('sh_ci_lastrun') || '');
  const [nextRun, setNextRun] = useState(() => localStorage.getItem('sh_ci_nextrun') || '');
  const [activeIdea, setActiveIdea] = useState(null);
  const [cards, setCards] = useState({});
  const [isSendingToStudio, setIsSendingToStudio] = useState(false);
  const [exportModal, setExportModal] = useState(null);

  const MEDIA_STUDIO_API = 'https://strategic-honesty-media-studio-production.up.railway.app';

  useEffect(() => {
    loadContent('findings').then(items => { if (items.length) setFindings(items); });
    loadContent('ideas').then(items => { if (items.length) setIdeas(items); });
    runCleanup();
  }, []);

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never';

  const persist = useCallback((f, id, q, lr, nr, rs) => {
    try { localStorage.setItem('sh_ci_findings', JSON.stringify(f)); localStorage.setItem('sh_ci_ideas', JSON.stringify(id)); localStorage.setItem('sh_ci_queue', JSON.stringify(q)); localStorage.setItem('sh_ci_lastrun', lr); localStorage.setItem('sh_ci_nextrun', nr); localStorage.setItem('sh_ci_resstatus', JSON.stringify(rs)); } catch { }
  }, []);

  useEffect(() => { if (setApprovedQueue) setApprovedQueue(queue); }, [queue]);

  const getCard = useCallback((iid, pid) => { const key = `${iid}_${pid}`; return cards[key] || { content: '', loading: false, editing: false, editVal: '', expanded: false, actionLoading: null }; }, [cards]);
  const setCard = useCallback((iid, pid, upd) => { const key = `${iid}_${pid}`; setCards(prev => ({ ...prev, [key]: { ...(prev[key] || { content: '', loading: false, editing: false, editVal: '', expanded: false, actionLoading: null }), ...upd } })); }, []);

  const runResearch = async () => {
    if (resStatus === 'running') return;
    setResStatus('running'); setResProgress(0); setFindings([]); setResLabel('Initializing research cycle…');
    const nf = [];
    setResLabel('Researching viral trends across all platforms…'); setResProgress(30);
    try {
      const raw = await ciCallClaude(`Research 6 viral social media content trends for a leadership/integrity personal brand (Gopu Shrestha, Nepal origin story, big-four bank PM, author).\n\nReturn ONLY a raw JSON array of exactly 6 objects (no markdown, no backticks):\n[{"platform":"LinkedIn","trend":"trend name","hook":"viral hook example","theme":"core theme","whyItWorks":"2-3 sentences","emotional":"emotional trigger","format":"content format","alignment":"Strategic Honesty fit","score":8,"gopu_angle":"specific angle using Nepal origin or credentials"}]`, null, 2000);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      parsed.forEach((f, i) => { f.id = 'f' + Date.now() + i; nf.push(f); });
      setFindings([...nf]); saveContent('findings', [...nf]); setResProgress(65);
    } catch (e) { console.error('Research error:', e.message); }
    setResLabel('Generating content ideas…'); setResProgress(70);
    try {
      const summary = nf.slice(0, 5).map(f => `• ${f.trend}: ${f.gopu_angle}`).join('\n');
      const raw = await ciCallClaude(`Viral trend findings:\n\n${summary}\n\nGenerate 8 content ideas. Return ONLY raw JSON array (no markdown):\n[{"title":"punchy title","core":"core insight 1-2 sentences rooted in Gopu's story","findingRef":"which trend","virality":"why viral potential","imageprompt":"detailed image prompt for thumbnail in dark navy and gold","pillars":"Integrity/Authenticity/Leadership/AI-Era/Nepal-Journey"}]`, null, 2500);
      const cleaned2 = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedIdeas = JSON.parse(cleaned2);
      const newIdeas = parsedIdeas.map((idea, i) => ({ id: 'idea' + Date.now() + i, title: idea.title, core: idea.core, findingRef: idea.findingRef || '', virality: idea.virality || '', imageprompt: idea.imageprompt || '', pillars: idea.pillars || 'Integrity', status: 'review' }));
      setIdeas(prev => { const merged = [...newIdeas.filter(i => !new Set(prev.map(p => p.id)).has(i.id)), ...prev].slice(0, 30); saveContent('ideas', merged); return merged; });
    } catch (e) { console.error('Ideas error:', e.message); }
    setResProgress(100); setResLabel('Research complete'); setResStatus('done');
    const lr = new Date().toISOString(), nr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setLastRun(lr); setNextRun(nr); persist(nf, ideas, queue, lr, nr, 'done');
  };

  const generateContent = useCallback(async (ideaId, platId, actionId = null) => {
    const idea = ideas.find(i => i.id === ideaId); const plat = CI_PLATFORMS.find(p => p.id === platId);
    if (!idea || !plat) return; const c = getCard(ideaId, platId); if (c.loading) return;
    if (actionId) setCard(ideaId, platId, { actionLoading: actionId });
    else setCard(ideaId, platId, { loading: true, content: '', expanded: true });
    let prompt = `Core idea: "${idea.core}"\n\nTitle: "${idea.title}"\n\nWrite a ${plat.label} post. Format: ${plat.fmt}.`;
    if (actionId && c.content) prompt += `\n\nExisting draft:\n"""\n${c.content}\n"""\n\nInstruction: ${ACTION_MODS[actionId]}`;
    let generatedText = '';
    try { await ciCallClaude(prompt, text => { generatedText = text; setCard(ideaId, platId, { content: text, expanded: true }); }); }
    catch (e) { setCard(ideaId, platId, { content: 'Error: ' + e.message }); }
    setCard(ideaId, platId, { loading: false, actionLoading: null });
    if (generatedText) saveContent('cards', [{ id: `${ideaId}_${platId}`, ideaId, platId, content: generatedText, savedAt: new Date().toISOString() }]);
  }, [ideas, getCard, setCard]);

  const approveToQueue = useCallback((ideaId, platId) => {
    const c = getCard(ideaId, platId); const idea = ideas.find(i => i.id === ideaId); const plat = CI_PLATFORMS.find(p => p.id === platId);
    if (!c.content || !idea || !plat) return;
    const exists = queue.some(q => q.ideaId === ideaId && q.platId === platId);
    if (!exists) { const nq = [...queue, { id: 'q' + Date.now(), ideaId, platId, platform: plat.label, icon: plat.icon, color: plat.color, content: c.content, title: idea.title, imageprompt: idea.imageprompt || '' }]; setQueue(nq); persist(findings, ideas, nq, lastRun, nextRun, resStatus); }
  }, [getCard, ideas, queue, findings, lastRun, nextRun, resStatus, persist]);

  const pill = (label, color) => <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: color + '22', color }}>{label}</span>;
  const reviewCount = ideas.filter(i => i.status === 'review').length;

  return (
    <div style={{ fontFamily: F }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14, borderBottom: `1px solid ${C.border}`, background: C.card, borderRadius: '10px 10px 0 0', padding: '0 4px' }}>
        {[['research', `🔭 Intelligence${findings.length ? ` (${findings.length})` : ''}`], ['adapter', `✦ Adapter${reviewCount ? ` (${reviewCount})` : ''}`], ['queue', `📋 Queue${queue.length ? ` (${queue.length})` : ''}`]].map(([id, label]) => (
          <button key={id} onClick={() => setCiTab(id)} style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', borderBottom: ciTab === id ? `2px solid ${C.purple}` : '2px solid transparent', color: ciTab === id ? C.purple : C.muted, fontWeight: ciTab === id ? 600 : 400, background: 'transparent', border: 'none', transition: 'all .15s', whiteSpace: 'nowrap' }}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={runResearch} disabled={resStatus === 'running'} style={{ padding: '5px 13px', fontSize: 11, fontWeight: 600, background: resStatus === 'running' ? '#f5f5f5' : C.purple, color: resStatus === 'running' ? C.muted : '#fff', border: 'none', borderRadius: 7, cursor: resStatus === 'running' ? 'not-allowed' : 'pointer', margin: '4px 0' }}>
          {resStatus === 'running' ? '⟳ Running…' : '⟳ Run Research'}
        </button>
      </div>
      {resStatus === 'running' && <div style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 4 }}><span>{resLabel}</span><span>{resProgress}%</span></div><div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: resProgress + '%', background: `linear-gradient(90deg,${C.purple},#a78bfa)`, borderRadius: 2, transition: 'width 0.4s' }} /></div></div>}

      {ciTab === 'research' && (
        <div>
          {!findings.length && resStatus !== 'running' && (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No research data yet</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 20px' }}>Click Run Research to analyze viral trends and generate brand-aligned content ideas automatically.</div>
              <button onClick={runResearch} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>⟳ Run Research Now</button>
            </div>
          )}
          {findings.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Viral Intelligence — {findings.length} findings</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Last: {fmtDate(lastRun)} · Next: {fmtDate(nextRun)}</div></div>
                <button onClick={() => setCiTab('adapter')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Review Ideas →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {findings.map(f => (
                  <div key={f.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{pill(f.platform || 'Multi', '#7c3aed')}{pill(f.format || '', '#888')}{pill(f.emotional || '', '#BA7517')}</div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: f.score >= 9 ? C.greenDark : f.score >= 8 ? C.gold : C.muted }}>{f.score}<span style={{ fontSize: 10, color: '#aaa' }}>/10</span></span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>{f.trend || f.theme || ''}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 7, lineHeight: 1.5, fontStyle: 'italic' }}>"{f.hook || ''}"</div>
                    <div style={{ fontSize: 11, color: C.label, lineHeight: 1.5 }}><b style={{ color: C.purple }}>Why it works:</b> {f.whyItWorks || ''}</div>
                    <div style={{ fontSize: 11, color: C.gold, marginTop: 6, borderTop: `1px solid ${C.border}`, paddingTop: 6, lineHeight: 1.5 }}><b>Your angle:</b> {f.gopu_angle || f.alignment || ''}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {ciTab === 'adapter' && (
        !ideas.length ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>No ideas yet</div>
            <button onClick={() => { setCiTab('research'); runResearch(); }} style={{ padding: '9px 22px', fontSize: 13, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>⟳ Run Research</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 14 }}>
            <div style={{ overflowY: 'auto', maxHeight: '65vh' }}>
              {[['review', 'For Review'], ['saved', 'Saved'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([status, label]) => {
                const si = ideas.filter(i => i.status === status); if (!si.length) return null;
                const sc = { review: C.gold, saved: C.purple, approved: C.greenDark, rejected: C.red };
                return <div key={status} style={{ marginBottom: 12 }}><div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label} ({si.length})</div>{si.map(idea => (
                  <div key={idea.id} onClick={() => setActiveIdea(idea.id)} style={{ padding: '8px 10px', background: activeIdea === idea.id ? C.card : 'transparent', border: `1px solid ${activeIdea === idea.id ? C.purple : C.border}`, borderRadius: 9, cursor: 'pointer', marginBottom: 4, transition: 'all .12s' }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc[idea.status] || C.muted, marginTop: 4, flexShrink: 0 }} />
                      <div><div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 1 }}>{idea.title}</div><div style={{ fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{idea.core.slice(0, 50)}…</div></div>
                    </div>
                  </div>
                ))}</div>;
              })}
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '65vh' }}>
              {!activeIdea ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}><div style={{ fontSize: 14, color: C.muted }}>← Select an idea to adapt across all platforms</div></div>
              ) : (() => {
                const idea = ideas.find(i => i.id === activeIdea); if (!idea) return null;
                const approvedCount = CI_PLATFORMS.filter(p => queue.some(q => q.ideaId === activeIdea && q.platId === p.id)).length;
                return <div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 15px', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{idea.title}</div>
                    <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 6 }}>{idea.core}</div>
                    {idea.virality && <div style={{ fontSize: 11, color: C.gold, marginBottom: 7 }}>⚡ {idea.virality}</div>}
                    {idea.imageprompt && <div style={{ fontSize: 11, color: C.purple, background: C.purpleLight, border: '1px solid #e9d5ff', borderRadius: 7, padding: '6px 9px', marginBottom: 9 }}>🎨 <b>Image prompt:</b> {idea.imageprompt}</div>}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {['approved', 'saved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setIdeas(prev => prev.map(i => i.id === activeIdea ? { ...i, status: s } : i))} style={{ padding: '4px 11px', fontSize: 11, fontWeight: 600, border: `1px solid ${s === 'approved' ? C.greenDark : s === 'saved' ? C.purple : C.red}`, borderRadius: 7, background: idea.status === s ? (s === 'approved' ? C.greenLight : s === 'saved' ? C.purpleLight : C.redLight) : '#fff', color: s === 'approved' ? C.greenDark : s === 'saved' ? C.purple : C.red, cursor: 'pointer' }}>
                          {s === 'approved' ? '✓ Approve' : s === 'saved' ? '🔖 Save' : '✕ Reject'}
                        </button>
                      ))}
                      <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>{approvedCount}/{CI_PLATFORMS.length} queued</span>
                    </div>
                  </div>
                  {CI_PLATFORMS.map(plat => {
                    const c = getCard(activeIdea, plat.id); const inQueue = queue.some(q => q.ideaId === activeIdea && q.platId === plat.id);
                    return <div key={plat.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                      <div onClick={() => setCard(activeIdea, plat.id, { expanded: !c.expanded })} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', cursor: 'pointer', background: c.expanded ? C.bg : C.card, borderBottom: c.expanded ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: plat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{plat.icon}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{plat.label}</div><div style={{ fontSize: 10, color: C.muted }}>{plat.fmt.slice(0, 46)}…</div></div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {inQueue && <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: C.greenLight, color: C.greenDark }}>✓ queued</span>}
                          {c.content && !inQueue && <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: C.goldLight, color: C.gold }}>Ready</span>}
                          <button onClick={e => { e.stopPropagation(); generateContent(activeIdea, plat.id); }} disabled={c.loading && !c.actionLoading} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, background: c.loading && !c.actionLoading ? '#f0f0f0' : plat.color, color: c.loading && !c.actionLoading ? C.muted : '#fff', border: 'none', borderRadius: 7, cursor: c.loading && !c.actionLoading ? 'not-allowed' : 'pointer' }}>
                            {c.loading && !c.actionLoading ? '…' : c.content ? '↺' : 'Generate'}
                          </button>
                        </div>
                      </div>
                      {c.expanded && <div style={{ padding: '12px 13px' }}>
                        {c.editing
                          ? <textarea value={c.editVal} onChange={e => setCard(activeIdea, plat.id, { editVal: e.target.value })} rows={6} style={{ width: '100%', fontSize: 13, lineHeight: 1.65, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', background: '#fff', color: C.text, resize: 'vertical', fontFamily: F }} />
                          : <div style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: C.text, minHeight: 36 }}>
                            {c.content || <span style={{ color: '#ccc', fontStyle: 'italic' }}>Click Generate</span>}
                            {c.loading && !c.actionLoading && <span style={{ display: 'inline-block', width: 2, height: 13, background: C.purple, marginLeft: 2, animation: 'blink .7s infinite', verticalAlign: 'middle' }} />}
                          </div>}
                        {c.content && <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            {CI_ACTIONS.map(a => <button key={a.id} onClick={() => generateContent(activeIdea, plat.id, a.id)} disabled={!!c.actionLoading} style={{ padding: '3px 8px', fontSize: 11, fontWeight: 500, border: `1px solid ${C.border}`, borderRadius: 6, background: c.actionLoading === a.id ? C.purple : '#f9f9f9', color: c.actionLoading === a.id ? '#fff' : C.label, cursor: c.actionLoading ? 'not-allowed' : 'pointer' }}>{a.icon} {c.actionLoading === a.id ? '…' : a.label}</button>)}
                          </div>
                          <div style={{ display: 'flex', gap: 7 }}>
                            <button onClick={() => { if (c.editing) setCard(activeIdea, plat.id, { content: c.editVal, editing: false }); else setCard(activeIdea, plat.id, { editVal: c.content, editing: true }); }} style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 8, background: c.editing ? C.greenLight : '#f9f9f9', color: c.editing ? C.greenDark : C.label, cursor: 'pointer' }}>{c.editing ? '✓ Save edit' : '✎ Edit'}</button>
                            <button onClick={() => approveToQueue(activeIdea, plat.id)} style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 8, background: inQueue ? C.greenLight : C.greenDark, color: inQueue ? C.greenDark : '#fff', cursor: inQueue ? 'default' : 'pointer' }}>{inQueue ? '✓ In queue' : '✓ Approve → Queue'}</button>
                          </div>
                        </div>}
                      </div>}
                    </div>;
                  })}
                </div>;
              })()}
            </div>
          </div>
        )
      )}

      {ciTab === 'queue' && (
        !queue.length ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Queue is empty</div>
            <button onClick={() => setCiTab('adapter')} style={{ padding: '9px 22px', fontSize: 13, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Open Adapter →</button>
          </div>
        ) : (
          <>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 15px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 9 }}>{queue.length} approved post{queue.length !== 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <ExportBufferCSV queue={queue} />
                <ExportPictoryScripts queue={queue} />
                <ExportImagePrompts queue={queue} />
                <ExportCreativeBrief queue={queue} />
              </div>
            </div>
            {CI_PLATFORMS.map(plat => {
              const items = queue.filter(q => q.platId === plat.id); if (!items.length) return null;
              return <div key={plat.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}><span style={{ fontSize: 16 }}>{plat.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{plat.label}</span></div>
                {items.map(item => <div key={item.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', marginBottom: 6, borderLeft: `3px solid ${item.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.title}</div><button onClick={() => setQueue(prev => prev.filter(q => q.id !== item.id))} style={{ padding: '2px 7px', fontSize: 11, color: C.red, border: '1px solid #fca5a5', borderRadius: 5, background: '#fff', cursor: 'pointer' }}>✕</button></div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', whiteSpace: 'pre-wrap' }}>{item.content}</div>
                </div>)}
              </div>;
            })}
          </>
        )
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function SocialHub() {
  const _ = BUILD_TIME;
  const [mainTab, setMainTab] = useState('calendar');
  const [userId] = useState(getUserId);
  const [connections, setConnections] = useState({});
  const [testSel, setTestSel] = useState(new Set(['ig', 'tt']));
  const [testContent, setTestContent] = useState('');
  const [testImage, setTestImage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [quickVideo, setQuickVideo] = useState('');
  const [logs, setLogs] = useState([{ t: 'info', m: 'Select platforms and compose your post' }]);
  const [uploadLogs, setUploadLogs] = useState([{ t: 'info', m: 'Select a channel and upload your CSV batch file' }, { t: 'info', m: 'Tags column must be blank — hashtags go in text body' }, { t: 'info', m: 'Free plan: max 10 posts per upload per channel' }]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [posting, setPosting] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState('li');
  const [approvedQueue, setApprovedQueue] = useState(() => { try { return JSON.parse(localStorage.getItem('sh_ci_queue') || '[]'); } catch { return []; } });
  const [coreIdea, setCoreIdea] = useState('');
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [quickConnectOpen, setQuickConnectOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(true);
  const [viralIdeasOpen, setViralIdeasOpen] = useState(true);
  const [approvedOpen, setApprovedOpen] = useState(true);
  const [activityLog, setActivityLog] = useState(() => { try { return JSON.parse(localStorage.getItem('sh_activity_log') || '[]'); } catch { return []; } });
  const [postType, setPostType] = useState(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardContent, setWizardContent] = useState('');
  const [wizardImage, setWizardImage] = useState('');
  const [wizardSchedule, setWizardSchedule] = useState('now');
  const [wizardDate, setWizardDate] = useState('');
  const [wizardPostType, setWizardPostType] = useState(null);
  const [wizardSel, setWizardSel] = useState(new Set());
  const [wizardSendStatus, setWizardSendStatus] = useState({});
  const [wizardPosting, setWizardPosting] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);
  const [schedTimes, setSchedTimes] = useState({ fb: '13:00', tt: '19:00', ig: '11:00' });
  const [schedPattern, setSchedPattern] = useState('once');
  const [schedStart, setSchedStart] = useState(() => new Date().toISOString().split('T')[0]);

  // Bluesky state
  const [bskyConnected, setBskyConnected] = useState(() => !!localStorage.getItem('sh_bsky_handle') && !!localStorage.getItem('sh_bsky_apppw'));
  const [bskyHandle, setBskyHandle] = useState(() => localStorage.getItem('sh_bsky_handle') || '');
  const [bskyConnecting, setBskyConnecting] = useState(false);
  const [bskyHandleInput, setBskyHandleInput] = useState('');
  const [bskyPwInput, setBskyPwInput] = useState('');

  const addLog = (setter, t, m) => setter(prev => [...prev, { t, m }]);

  function saveToLog(entry) {
    const log = { id: Date.now(), ts: new Date().toISOString(), ...entry };
    setActivityLog(prev => { const next = [log, ...prev].slice(0, 100); localStorage.setItem('sh_activity_log', JSON.stringify(next)); return next; });
  }

  function wizardReset() {
    setWizardStep(1); setWizardContent(''); setWizardImage(''); setWizardSchedule('now'); setWizardDate('');
    setWizardPostType(null); setWizardSel(new Set()); setWizardSendStatus({}); setWizardPosting(false); setWizardDone(false);
    setSchedTimes({ fb: '13:00', tt: '19:00', ig: '11:00' }); setSchedPattern('once'); setSchedStart(new Date().toISOString().split('T')[0]);
  }

  async function connectBluesky() {
    if (!bskyHandleInput.trim() || !bskyPwInput.trim()) { addLog(setLogs, 'err', 'Enter handle and app password.'); return; }
    setBskyConnecting(true);
    try {
      const handle = bskyHandleInput.trim().replace(/^@/, '');
      const session = await bskyCreateSession(handle, bskyPwInput.trim());
      localStorage.setItem('sh_bsky_handle', handle); localStorage.setItem('sh_bsky_apppw', bskyPwInput.trim()); localStorage.setItem('sh_bsky_did', session.did);
      setBskyHandle(handle); setBskyConnected(true); setBskyHandleInput(''); setBskyPwInput('');
      addLog(setLogs, 'ok', `✓ Bluesky connected as @${handle}`);
    } catch (e) { addLog(setLogs, 'err', `Bluesky: ${e.message}`); }
    setBskyConnecting(false);
  }

  function disconnectBluesky() { ['sh_bsky_handle', 'sh_bsky_apppw', 'sh_bsky_did'].forEach(k => localStorage.removeItem(k)); setBskyHandle(''); setBskyConnected(false); }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      const platform = params.get('platform'), name = params.get('name'), uid = params.get('userId');
      if (uid) { localStorage.setItem(`sh_${platform}_userId`, uid); if (platform === 'linkedin') localStorage.setItem('sh_linkedin_userId', uid); }
      addLog(setLogs, 'ok', `✓ ${platform} connected as "${name}"`);
      window.history.replaceState({}, '', window.location.pathname); setMainTab('connect');
    } else if (params.get('auth') === 'error') {
      addLog(setLogs, 'err', `✗ OAuth failed: ${params.get('reason')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => { fetchStatus(); fetchScheduledPosts(); }, [userId]);

  async function fetchStatus() {
    try {
      const all = {}; const liUid = localStorage.getItem('sh_linkedin_userId') || userId;
      const liData = await (await fetch(`${BACKEND}/auth/status?userId=${liUid}&t=${Date.now()}`)).json();
      Object.assign(all, liData.connections || {});
      const ytUid = localStorage.getItem('sh_youtube_userId');
      if (ytUid && ytUid !== liUid) { const ytData = await (await fetch(`${BACKEND}/auth/status?userId=${ytUid}&t=${Date.now()}`)).json(); Object.assign(all, ytData.connections || {}); }
      setConnections(all);
    } catch { }
  }

  async function fetchScheduledPosts() { try { const data = await (await fetch(`${BACKEND}/posts?userId=${userId}`)).json(); setScheduledPosts(data.posts || []); } catch { } }
  function connectLinkedIn() { window.location.href = `${BACKEND}/auth/linkedin/connect?userId=${userId}`; }
  function connectYouTube() { window.location.href = `${BACKEND}/auth/youtube/connect?userId=${userId}`; }
  async function disconnect(platform) { const puid = localStorage.getItem(`sh_${platform}_userId`) || userId; await fetch(`${BACKEND}/auth/disconnect`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: puid, platform }) }); setConnections(prev => { const n = { ...prev }; delete n[platform]; return n; }); }

  const dynamicChannels = [];
  if (connections.linkedin) dynamicChannels.push({ id: 'li', name: 'LinkedIn', handle: 'LinkedIn Profile', platform: 'LinkedIn', icon: '💼', color: '#0A66C2', avatar: '', initials: 'LI', type: 'LinkedIn Profile', posts: scheduledPosts.filter(p => p.platform === 'linkedin').length, status: 'active' });
  if (connections.youtube) dynamicChannels.push({ id: 'yt', name: 'YouTube Channel', handle: 'YouTube Channel', platform: 'YouTube', icon: '▶️', color: '#FF0000', avatar: '', initials: 'YT', type: 'YouTube Channel', posts: 0, status: 'active' });
  if (bskyConnected) dynamicChannels.push({ id: 'bs', name: bskyHandle || 'Bluesky', handle: `@${bskyHandle}`, platform: 'Bluesky', icon: '🦋', color: '#0085FF', avatar: '', initials: 'BS', type: 'Bluesky Profile', posts: 0, status: 'active' });
  const CONNECTED_CHANNELS = [...STATIC_CHANNELS, ...dynamicChannels];
  const isLiConnected = !!connections.linkedin, isYtConnected = !!connections.youtube;

  function wizardComputeScheduledAt() {
    if (wizardSchedule === 'now') return new Date(Date.now() + 10000).toISOString();
    if (wizardSchedule === '1week') return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (wizardSchedule === '2weeks') return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    if (wizardSchedule === 'scheduled' && wizardDate) return new Date(wizardDate).toISOString();
    return new Date(Date.now() + 10000).toISOString();
  }

  async function wizardSend() {
    if (wizardPosting) return; setWizardPosting(true); setWizardDone(false);
    const init = {}; wizardSel.forEach(id => { init[id] = { state: 'sending', msg: 'Sending…' }; }); setWizardSendStatus(init);
    const scheduledAt = wizardComputeScheduledAt(); const publishNow = wizardSchedule === 'now';
    const update = (id, state, msg) => setWizardSendStatus(prev => ({ ...prev, [id]: { state, msg } }));
    for (const platformId of wizardSel) {
      if (platformId === 'li' && connections.linkedin) {
        try { const data = await (await fetch(`${BACKEND}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'linkedin', userId: localStorage.getItem('sh_linkedin_userId') || userId, content: wizardContent, mediaUrl: wizardImage || null, mediaType: wizardImage ? 'image' : null, scheduledAt }) })).json(); if (data.success) { if (publishNow) { await fetch(`${BACKEND}/posts/${data.post.id}/publish`, { method: 'POST' }); update('li', 'ok', `✓ Published to LinkedIn`); saveToLog({ platform: 'LinkedIn', type: 'real', status: 'ok', msg: `Published`, preview: wizardContent.slice(0, 80) }); } else { update('li', 'ok', `✓ Scheduled`); fetchScheduledPosts(); } } else { update('li', 'err', `Error: ${data.error}`); } } catch (e) { update('li', 'err', `LinkedIn: ${e.message}`); }
      } else if (platformId === 'bs') {
        if (!bskyConnected) { update('bs', 'err', 'Not connected'); continue; }
        if (wizardContent.length > 300) { update('bs', 'err', `Over 300 chars`); continue; }
        try { const session = await bskyCreateSession(localStorage.getItem('sh_bsky_handle'), localStorage.getItem('sh_bsky_apppw')); await bskyPost(session.accessJwt, session.did, wizardContent); update('bs', 'ok', `✓ Published to Bluesky`); saveToLog({ platform: 'Bluesky', type: 'real', status: 'ok', msg: `Published`, preview: wizardContent.slice(0, 80) }); } catch (e) { update('bs', 'err', `Bluesky: ${e.message}`); }
      } else if (platformId === 'yt') { update('yt', 'warn', '⚠ YouTube Community Posts deprecated'); }
      else if (BUFFER_PLATFORMS[platformId]) { update(platformId, 'csv', '📥 CSV ready'); saveToLog({ platform: BUFFER_PLATFORMS[platformId].name, type: 'buffer', status: 'csv', msg: 'CSV generated', preview: wizardContent.slice(0, 80), platformId }); }
      else { update(platformId, 'warn', `⚠ Not connected`); }
    }
    setWizardPosting(false); setWizardDone(true);
  }

  async function sendPost(publishNow = true) {
    if (!testContent.trim()) { addLog(setLogs, 'err', 'Write a post first.'); return; }
    if (testSel.size === 0) { addLog(setLogs, 'err', 'Select at least one platform.'); return; }
    if (testSel.has('bs') && testContent.length > 300) { addLog(setLogs, 'err', `🚫 Bluesky: ${testContent.length} chars — hard limit 300.`); return; }
    setPosting(true);
    for (const platformId of testSel) {
      if (platformId === 'li' && connections.linkedin) {
        if (publishNow) { try { const scheduledAt = new Date(Date.now() + 10000).toISOString(); const data = await (await fetch(`${BACKEND}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'linkedin', userId: localStorage.getItem('sh_linkedin_userId') || userId, content: testContent, mediaUrl: testImage || null, mediaType: testImage ? 'image' : null, scheduledAt }) })).json(); if (data.success) { await fetch(`${BACKEND}/posts/${data.post.id}/publish`, { method: 'POST' }); addLog(setLogs, 'ok', `✓ Sent to LinkedIn`); saveToLog({ platform: 'LinkedIn', type: 'real', status: 'ok', msg: `Published`, preview: testContent.slice(0, 80) }); } else { addLog(setLogs, 'err', `LinkedIn: ${data.error}`); } } catch (e) { addLog(setLogs, 'err', `LinkedIn: ${e.message}`); } }
      } else if (platformId === 'bs') {
        if (!bskyConnected) { addLog(setLogs, 'err', 'Connect Bluesky first.'); }
        else { try { const session = await bskyCreateSession(localStorage.getItem('sh_bsky_handle'), localStorage.getItem('sh_bsky_apppw')); await bskyPost(session.accessJwt, session.did, testContent); addLog(setLogs, 'ok', `✓ Sent to Bluesky`); saveToLog({ platform: 'Bluesky', type: 'real', status: 'ok', msg: `Published`, preview: testContent.slice(0, 80) }); } catch (e) { addLog(setLogs, 'err', `Bluesky: ${e.message}`); } }
      } else if (BUFFER_PLATFORMS[platformId]) { downloadCSV(platformId, testContent, testImage, scheduleDate); addLog(setLogs, 'ok', `📥 ${BUFFER_PLATFORMS[platformId].name} CSV downloaded`); }
      else { addLog(setLogs, 'warn', `⚠ ${platformId.toUpperCase()} — not connected`); }
    }
    setPosting(false);
  }

  const postMap = {}; SCHEDULE_POSTS.forEach(p => { if (!postMap[p.day]) postMap[p.day] = []; postMap[p.day].push(p); });
  const brandScore = Math.min(100, 40 + approvedQueue.length * 8);
  const viralIdeasSidebar = (() => { try { return JSON.parse(localStorage.getItem('sh_ci_ideas') || '[]').filter(i => i.status === 'review').slice(0, 6); } catch { return []; } })();
  const previewContent = testContent || wizardContent || (approvedQueue[0]?.content || '');
  const previewPlatformMeta = { li: { label: 'LinkedIn', color: '#0A66C2', icon: '💼' }, tt: { label: 'TikTok', color: '#010101', icon: '🎵' }, ig: { label: 'Instagram', color: '#E1306C', icon: '📸' }, fb: { label: 'Facebook', color: '#1877F2', icon: '👥' }, tw: { label: 'X/Twitter', color: '#333', icon: '🐦' }, th: { label: 'Threads', color: '#444', icon: '🧵' } };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', minHeight: '100vh', background: C.bg, fontFamily: F, fontSize: 14 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}.accordion-content{animation:fadeIn 0.15s ease}.nav-item:hover{background:#f1f5f9!important}`}</style>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ background: C.sidebar, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        <div style={{ padding: '16px 14px 14px', borderBottom: `1px solid ${C.border}` }}>
          <LogoMenu onHome={() => setMainTab('calendar')} />
          <button onClick={() => { wizardReset(); setMainTab('wizard'); }} style={{ width: '100%', padding: '9px 0', background: GREEN, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 6px rgba(36,180,126,0.25)' }}>✦ New Post</button>
          <button onClick={() => window.open('/help.html', '_blank')} style={{ width: '100%', padding: '7px 0', marginTop: 6, background: '#fff', color: C.navy, border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>❓ Help & Guide</button>
        </div>

        {/* Core Idea Box */}
        <div style={{ padding: '11px 13px', borderBottom: `1px solid ${C.border}`, background: '#fffdf5', borderLeft: '3px solid #BA7517' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>🎯 Core Idea or Insight</div>
          <textarea value={coreIdea} onChange={e => setCoreIdea(e.target.value)} rows={2} placeholder="e.g. Integrity compounds faster than hustle..." style={{ ...inputStyle, fontSize: 12, marginBottom: 6, resize: 'none', border: '1.5px solid #BA7517', borderRadius: 9, background: '#fff' }} />
          <button onClick={() => { if (coreIdea.trim()) { wizardReset(); setWizardContent(coreIdea); setMainTab('wizard'); } }} disabled={!coreIdea.trim()} style={{ width: '100%', padding: '6px 0', fontSize: 11, fontWeight: 600, background: coreIdea.trim() ? '#BA7517' : '#e5e7eb', color: coreIdea.trim() ? '#fff' : C.muted, border: 'none', borderRadius: 7, cursor: coreIdea.trim() ? 'pointer' : 'not-allowed', transition: 'all .15s' }}>Adapt to All Platforms →</button>
        </div>

        {/* Brand Score */}
        <div style={{ padding: '11px 13px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Brand Alignment</div>
          <div style={{ height: 6, background: 'linear-gradient(to right,#ef4444,#f59e0b,#22c55e)', borderRadius: 3, marginBottom: 5, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -3, left: `${brandScore}%`, transform: 'translateX(-50%)', width: 12, height: 12, background: '#fff', border: `2px solid ${C.navy}`, borderRadius: '50%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted }}><span>Off-Brand</span><span>On-Brand</span><span>Strategic</span></div>
          <div style={{ marginTop: 5, fontSize: 11, color: C.greenDark, fontWeight: 600, textAlign: 'center' }}>{approvedQueue.length} approved · {brandScore}% aligned</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px' }}>
          {NAV.map(({ id, icon, label }) => (
            <div key={id} onClick={() => { if (id === 'wizard') wizardReset(); setMainTab(id); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: mainTab === id ? '#fff' : C.muted, fontWeight: mainTab === id ? 600 : 400, background: mainTab === id ? GREEN : 'transparent', marginBottom: 1, transition: 'all .12s' }} onMouseEnter={e => { if (mainTab !== id) e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={e => { if (mainTab !== id) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 15 }}>{icon}</span><span style={{ flex: 1 }}>{label}</span>
              {id === 'ideas' && approvedQueue.length > 0 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: C.purpleLight, color: C.purple, fontWeight: 600 }}>{approvedQueue.length}</span>}
            </div>
          ))}
        </nav>

        {/* Channels accordion */}
        <div style={{ borderTop: 'none' }}>
          <div onClick={() => setChannelsOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', cursor: 'pointer', background: GREEN }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 10, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Channels</span><span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 7, background: '#f1f5f9', color: C.muted, fontWeight: 500 }}>{CONNECTED_CHANNELS.length}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><button onClick={e => { e.stopPropagation(); setMainTab('connect'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 16, fontWeight: 'bold', padding: '0 2px', lineHeight: 1 }}>+</button><span style={{ fontSize: 9, color: '#fff', transform: channelsOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', display: 'inline-block' }}>▼</span></div>
          </div>
          {channelsOpen && <div className="accordion-content" style={{ padding: '0 8px 8px' }}>{CONNECTED_CHANNELS.map(ch => (<div key={ch.id} onClick={() => setSelectedChannel(selectedChannel === ch.id ? null : ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 9, cursor: 'pointer', background: selectedChannel === ch.id ? '#f1f5f9' : 'transparent', marginBottom: 2 }} onMouseEnter={e => { if (selectedChannel !== ch.id) e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={e => { if (selectedChannel !== ch.id) e.currentTarget.style.background = 'transparent'; }}><Avatar ch={ch} size={28} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div><div style={{ fontSize: 10, color: C.muted }}>{ch.type}</div></div><div style={{ ...statusDot(ch.status) }} /></div>))}</div>}
        </div>

        {/* Quick Connect */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingBottom: 8 }}>
          <div onClick={() => setQuickConnectOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', cursor: 'pointer', background: GREEN }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Connect</span>
            <span style={{ fontSize: 9, color: '#fff', transform: quickConnectOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
          </div>
          {quickConnectOpen && <div className="accordion-content" style={{ padding: '0 8px 4px' }}>{[{ id: 'li', name: 'LinkedIn', icon: '💼', connected: isLiConnected, fn: connectLinkedIn }, { id: 'yt', name: 'YouTube', icon: '▶️', connected: isYtConnected, fn: connectYouTube }, { id: 'bs', name: 'Bluesky', icon: '🦋', connected: bskyConnected, fn: () => setMainTab('connect') }].map(p => (<div key={p.id} onClick={p.connected ? null : p.fn} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: p.connected ? 'default' : 'pointer', marginBottom: 2 }} onMouseEnter={e => { if (!p.connected) e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}><div style={{ width: 27, height: 27, borderRadius: 8, background: '#f8fafc', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, position: 'relative', flexShrink: 0 }}>{p.icon}{p.connected && <span style={{ position: 'absolute', bottom: -3, right: -3, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', border: '1.5px solid #fff' }}>✓</span>}</div><span style={{ fontSize: 12, color: p.connected ? '#16a34a' : C.muted, fontWeight: p.connected ? 500 : 400 }}>{p.connected ? `${p.name} ✓` : p.name}</span></div>))}</div>}
        </div>

        {/* Settings + Footer */}
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${C.border}` }}>
          <div onClick={() => setMainTab('settings')} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', cursor: 'pointer', fontSize: 13, color: mainTab === 'settings' ? '#fff' : C.muted, fontWeight: mainTab === 'settings' ? 600 : 400, background: mainTab === 'settings' ? GREEN : 'transparent', transition: 'all .12s' }} onMouseEnter={e => { if (mainTab !== 'settings') e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={e => { if (mainTab !== 'settings') e.currentTarget.style.background = 'transparent'; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            <span style={{ flex: 1 }}>Settings</span>
          </div>
          <div style={{ padding: '8px 13px 12px', fontSize: 10, color: '#94a3b8', textAlign: 'center', letterSpacing: '0.03em' }}>© 2026 Strategic Honesty</div>
        </div>
      </div>

      {/* ── CENTER PANEL ── */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        <div style={{ background: C.sidebar, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, flex: 1 }}>{NAV.find(n => n.id === mainTab)?.icon} {NAV.find(n => n.id === mainTab)?.label || (mainTab === 'settings' ? '⚙️ Settings' : 'Dashboard')}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <button onClick={() => { wizardReset(); setMainTab('wizard'); }} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: 'none', background: GREEN, color: '#fff', fontWeight: 600 }}>✦ New post</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px', background: C.bg }}>

          {/* Calendar */}
          {mainTab === 'calendar' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
                {[{ n: scheduledPosts.filter(p => p.status === 'pending').length || 393, l: 'Posts scheduled', sub: 'View all →', tab: 'calendar' }, { n: '5/week', l: 'Posting frequency', sub: 'View schedule →', tab: 'calendar' }, { n: CONNECTED_CHANNELS.length, l: 'Channels active', sub: 'Manage →', tab: 'connect' }, { n: approvedQueue.length, l: 'In approved queue', sub: 'Go to queue →', tab: 'ideas' }].map((item, i) => (
                  <div key={i} onClick={() => setMainTab(item.tab)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '13px 15px', cursor: 'pointer', transition: 'border-color .15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = C.green} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{item.n}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.l}</div><div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>{item.sub}</div></div>
                ))}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${C.border}` }}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: C.muted, padding: '9px 0', fontWeight: 600 }}>{d}</div>)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                  {Array(4).fill(0).map((_, i) => <div key={'e' + i} style={{ minHeight: 85, background: '#fafafa', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} />)}
                  {Array(31).fill(0).map((_, i) => { const day = i + 1, posts = postMap[day] || [], isToday = day === 21; return (<div key={day} style={{ minHeight: 85, background: isToday ? '#f0fdf4' : C.card, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '5px 4px', cursor: 'pointer' }} onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = '#f9fafb'; }} onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = C.card; }}><div style={{ fontSize: 12, color: isToday ? GREEN : C.label, marginBottom: 3, fontWeight: isToday ? 700 : 400 }}>{day}{isToday && <span style={{ fontSize: 9, background: GREEN, color: '#fff', padding: '0 3px', borderRadius: 3, marginLeft: 3 }}>Today</span>}</div>{posts.slice(0, 2).map((p, j) => <div key={j} style={{ borderRadius: 3, padding: '2px 4px', fontSize: 10, marginBottom: 2, background: p.color + '18', color: p.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</div>)}{posts.length > 2 && <div style={{ fontSize: 9, color: C.muted }}>+{posts.length - 2}</div>}</div>); })}
                </div>
              </div>
            </div>
          )}

          {mainTab === 'ideas' && <ContentIdeasPanel setApprovedQueue={setApprovedQueue} />}

          {/* Wizard — now uses WizardPanel component */}
          {mainTab === 'wizard' && (
            <WizardPanel
              wizardStep={wizardStep} setWizardStep={setWizardStep}
              wizardContent={wizardContent} setWizardContent={setWizardContent}
              wizardImage={wizardImage} setWizardImage={setWizardImage}
              wizardSchedule={wizardSchedule} setWizardSchedule={setWizardSchedule}
              wizardDate={wizardDate} setWizardDate={setWizardDate}
              wizardPostType={wizardPostType} setWizardPostType={setWizardPostType}
              wizardSel={wizardSel} setWizardSel={setWizardSel}
              wizardSendStatus={wizardSendStatus}
              wizardPosting={wizardPosting} wizardDone={wizardDone}
              schedTimes={schedTimes} setSchedTimes={setSchedTimes}
              schedPattern={schedPattern} setSchedPattern={setSchedPattern}
              schedStart={schedStart} setSchedStart={setSchedStart}
              wizardReset={wizardReset} wizardSend={wizardSend}
              setMainTab={setMainTab}
              CONNECTED_CHANNELS={CONNECTED_CHANNELS}
              ALL_PLATFORMS={ALL_PLATFORMS}
              isLiConnected={isLiConnected}
              bskyConnected={bskyConnected}
            />
          )}

          {/* Quick Compose */}
          {mainTab === 'compose' && (
            <div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>🗺 Smart Content Router</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {CONTENT_TYPES.map(ct => { const isActive = postType === ct.id; return (<button key={ct.id} onClick={() => { setPostType(ct.id); const r = ROUTER_MAP[ct.id] || []; const av = new Set(CONNECTED_CHANNELS.map(c => c.id)); const nx = new Set(r.filter(id => av.has(id))); if (r.includes('bs') && bskyConnected) nx.add('bs'); setTestSel(nx.size > 0 ? nx : new Set(r)); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${isActive ? GREEN : C.border}`, background: isActive ? C.greenLight : '#fafafa', minWidth: 96 }}><span style={{ fontSize: 14, marginBottom: 2 }}>{ct.emoji}</span><span style={{ fontSize: 11, fontWeight: 600, color: isActive ? C.greenDark : C.text }}>{ct.label}</span><span style={{ fontSize: 9, color: C.muted }}>{ct.desc}</span></button>); })}
                </div>
                <label style={labelStyle}>Post content</label>
                <textarea value={testContent} onChange={e => setTestContent(e.target.value)} rows={6} style={inputStyle} placeholder="Integrity isn't a soft skill..." />
                <CharCounter content={testContent} selectedPlatforms={testSel} />
                <label style={labelStyle}>Platforms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {CONNECTED_CHANNELS.map(ch => { const limit = CHAR_LIMITS[ch.id]; const isOver = limit && testContent.length > limit.limit; return (<span key={ch.id} onClick={() => setTestSel(prev => { const n = new Set(prev); n.has(ch.id) ? n.delete(ch.id) : n.add(ch.id); return n; })} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${isOver && testSel.has(ch.id) ? '#fca5a5' : testSel.has(ch.id) ? GREEN + '66' : C.border}`, background: testSel.has(ch.id) ? C.greenLight : '#fff', color: testSel.has(ch.id) ? C.greenDark : C.muted, display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 12 }}>{ch.icon}</span>{ch.name}</span>); })}
                </div>
                <label style={labelStyle}>Image URL</label>
                <input value={testImage} onChange={e => setTestImage(e.target.value)} style={inputStyle} placeholder="https://..." />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => sendPost(true)} disabled={posting} style={{ flex: 1, padding: '8px 0', background: GREEN, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: posting ? 'wait' : 'pointer' }}>{posting ? 'Sending...' : '⚡ Send now'}</button>
                </div>
                <div style={{ background: '#f8f8f8', borderRadius: 7, padding: 8, fontSize: 12, fontFamily: 'monospace', maxHeight: 100, overflowY: 'auto', marginTop: 9, lineHeight: 1.8 }}>{logs.map((l, i) => <div key={i} style={{ color: logColor(l.t) }}>» {l.m}</div>)}</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ background: '#f8faff', border: '1px solid #e0eaff', borderRadius: 9, padding: 11, marginBottom: 13 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 7 }}>Connection status</div>
                  {[{ label: 'Railway API', ok: true, detail: 'healthy' }, { label: 'LinkedIn OAuth', ok: isLiConnected, detail: isLiConnected ? 'connected' : 'not connected' }, { label: 'Bluesky', ok: bskyConnected, detail: bskyConnected ? `@${bskyHandle}` : 'not connected' }, { label: 'YouTube OAuth', ok: isYtConnected, detail: isYtConnected ? 'connected' : 'not connected' }].map((s, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span style={{ color: C.muted }}>{s.label}</span><span style={{ color: s.ok ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{s.ok ? '✓ ' : ''}{s.detail}</span></div>)}
                  <button onClick={() => { fetchStatus(); fetchScheduledPosts(); }} style={{ marginTop: 7, padding: '4px 10px', fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 5, background: '#fff', cursor: 'pointer', color: C.muted }}>↻ Refresh</button>
                </div>
              </div>
            </div></div>
          )}

          {/* Upload CSV */}
          {mainTab === 'upload' && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 13 }}>Upload posts in bulk</div>
              <label htmlFor="csv-file" style={{ border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: '34px 28px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', marginBottom: 13, display: 'block' }}>
                <div style={{ fontSize: 28, marginBottom: 7, color: '#ccc' }}>⬆</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 }}>Drop your Buffer CSV file here</div>
                <div style={{ fontSize: 12, color: C.muted }}>Text, Image URL, Tags, Posting Time · UTF-8 · Max 10 posts free plan</div>
                <input type="file" id="csv-file" accept=".csv" style={{ display: 'none' }} onChange={e => { const file = e.target.files[0]; if (!file) return; addLog(setUploadLogs, 'info', `Reading ${file.name}...`); const r = new FileReader(); r.onload = ev => { const lines = ev.target.result.split('\n').filter(l => l.trim()).length - 1; addLog(setUploadLogs, 'ok', `✓ ${file.name} — ${lines} posts loaded`); }; r.readAsText(file); }} />
              </label>
              <div style={{ background: '#f8f8f8', borderRadius: 7, padding: 8, fontSize: 12, fontFamily: 'monospace', maxHeight: 90, overflowY: 'auto', lineHeight: 1.8 }}>{uploadLogs.map((l, i) => <div key={i} style={{ color: logColor(l.t) }}>» {l.m}</div>)}</div>
            </div>
          )}

          {/* Connect */}
          {mainTab === 'connect' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>Connect a channel</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>LinkedIn, Bluesky, YouTube — post directly from this platform.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                {[{ id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2', connected: isLiConnected, fn: connectLinkedIn }, { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', connected: isYtConnected, fn: connectYouTube }].map(p => (
                  <div key={p.id} style={{ background: C.card, border: `1px solid ${p.connected ? GREEN + '44' : C.border}`, borderRadius: 10, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: p.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</div><div style={{ fontSize: 12, color: C.muted }}>{p.connected ? 'Connected' : 'Not connected · OAuth'}</div></div>
                    {p.connected ? <><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontWeight: 500 }}>✓ Connected</span><button onClick={() => disconnect(p.id)} style={{ padding: '5px 11px', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#dc2626', marginLeft: 6 }}>Disconnect</button></> : <button onClick={p.fn} style={{ padding: '7px 17px', fontSize: 13, border: 'none', borderRadius: 8, background: p.color, cursor: 'pointer', color: '#fff', fontWeight: 500 }}>Connect</button>}
                  </div>
                ))}
                <div style={{ background: C.card, border: `1px solid ${bskyConnected ? GREEN + '44' : C.border}`, borderRadius: 10, padding: '13px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: '#0085FF15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🦋</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Bluesky</div><div style={{ fontSize: 12, color: C.muted }}>{bskyConnected ? `Connected as @${bskyHandle}` : 'App Password — no OAuth needed'}</div></div>
                    {bskyConnected && <><span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontWeight: 500 }}>✓ Connected</span><button onClick={disconnectBluesky} style={{ padding: '5px 11px', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#dc2626', marginLeft: 6 }}>Disconnect</button></>}
                  </div>
                  {!bskyConnected && <div style={{ marginTop: 11, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                    <div><label style={labelStyle}>Handle</label><input value={bskyHandleInput} onChange={e => setBskyHandleInput(e.target.value)} placeholder="strategic-honesty.bsky.social" style={{ ...inputStyle, marginBottom: 0 }} /></div>
                    <div><label style={labelStyle}>App password</label><input type="password" value={bskyPwInput} onChange={e => setBskyPwInput(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" style={{ ...inputStyle, marginBottom: 0 }} /></div>
                    <button onClick={connectBluesky} disabled={bskyConnecting} style={{ padding: '8px 14px', fontSize: 13, border: 'none', borderRadius: 8, background: BSKY_COLOR, cursor: bskyConnecting ? 'wait' : 'pointer', color: '#fff', fontWeight: 500, height: 36 }}>{bskyConnecting ? '…' : 'Connect'}</button>
                  </div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
                {ALL_PLATFORMS.map(p => { const isConn = CONNECTED_CHANNELS.some(c => c.id === p.id); const fn = p.id === 'li' ? connectLinkedIn : p.id === 'yt' ? connectYouTube : () => setMainTab('connect'); return (<div key={p.id} style={{ background: C.card, border: `1px solid ${isConn ? GREEN + '44' : C.border}`, borderRadius: 10, padding: '13px 11px', textAlign: 'center' }}><div style={{ width: 40, height: 40, borderRadius: 9, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, background: p.color + '15' }}>{p.icon}</div><div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>{p.name}</div><div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{p.sub}</div><button onClick={isConn ? null : fn} style={{ padding: '4px 12px', borderRadius: 14, fontSize: 11, fontWeight: 500, cursor: isConn ? 'default' : 'pointer', border: `1px solid ${isConn ? GREEN + '44' : C.border}`, background: isConn ? '#dcfce7' : '#f9f9f9', color: isConn ? '#166534' : C.muted, width: '100%' }}>{isConn ? '✓ Connected' : p.id === 'bs' ? 'App Password' : 'Connect'}</button></div>); })}
              </div>
            </div>
          )}

          {/* Activity Log */}
          {mainTab === 'log' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
                <div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Activity Log</div></div>
                {activityLog.length > 0 && <button onClick={() => { setActivityLog([]); localStorage.removeItem('sh_activity_log'); }} style={{ padding: '5px 12px', fontSize: 11, border: '1px solid #fca5a5', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#dc2626' }}>🗑 Clear</button>}
              </div>
              {activityLog.length === 0 ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}><div style={{ fontSize: 28, marginBottom: 8 }}>📭</div><div style={{ fontSize: 13, color: C.muted }}>No activity yet</div></div> :
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {activityLog.map(entry => { const isReal = entry.type === 'real', isFail = entry.status === 'err', isBuffer = entry.type === 'buffer'; const bg = isFail ? '#fef2f2' : isReal ? '#f0faf6' : '#fffbeb'; const border = isFail ? '#fca5a5' : isReal ? '#b6e8d6' : '#fcd34d'; return (<div key={entry.id} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 13px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>{isFail ? '❌' : isReal ? '✅' : '⚠️'}</span><div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{entry.platform}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>{new Date(entry.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span></div><div style={{ fontSize: 12, color: isFail ? '#dc2626' : isReal ? C.greenDark : '#854d0e', marginTop: 2 }}>{entry.msg}</div></div></div>{entry.preview && <div style={{ fontSize: 12, color: C.muted, background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '4px 8px', fontStyle: 'italic', marginTop: 6 }}>"{entry.preview}"</div>}</div>); })}
                </div>}
            </div>
          )}

          {mainTab === 'settings' && <SettingsPanel />}

        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ background: C.sidebar, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
          <div style={{ background: GREEN, padding: '11px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>Platform Preview</div>
          </div>
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
            {PREVIEW_PLATFORMS.map(p => { const active = previewPlatform === p.id; return (<button key={p.id} onClick={() => setPreviewPlatform(p.id)} title={p.label} style={{ padding: '6px 10px', fontSize: 11, background: active ? p.color + '18' : '#e2e8f0', border: `1px solid ${active ? p.color + '44' : '#cbd5e1'}`, borderBottom: `2px solid ${active ? p.color : '#94a3b8'}`, color: active ? p.color : '#64748b', cursor: 'pointer', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', transition: 'all .15s', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}><PlatformIcon id={p.id} size={14} color={active ? p.color : '#64748b'} /></button>); })}
          </div>
        </div>
        <div style={{ padding: '11px 13px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 13px', minHeight: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>G</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Gopu Shrestha</div><div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{previewPlatformMeta[previewPlatform]?.label} · Just now</div></div>
              <div style={{ fontSize: 16 }}>{previewPlatformMeta[previewPlatform]?.icon}</div>
            </div>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 165, overflow: 'hidden' }}>
              {previewContent ? (previewContent.length > 280 ? previewContent.slice(0, 280) + '…' : previewContent) : <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: 11 }}>Preview appears here as you write…</span>}
            </div>
            {previewContent && <div style={{ marginTop: 10, display: 'flex', gap: 12, fontSize: 11, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}><span style={{ cursor: 'pointer' }}>👍 Like</span><span style={{ cursor: 'pointer' }}>💬 Comment</span><span style={{ cursor: 'pointer' }}>↗️ Share</span></div>}
          </div>
        </div>

        {/* Upcoming Posts */}
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
          <div onClick={() => setUpcomingOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', cursor: 'pointer', background: GREEN }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Upcoming Posts</span><span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 7, background: '#f1f5f9', color: C.muted, fontWeight: 500 }}>{SCHEDULE_POSTS.length}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><button onClick={e => { e.stopPropagation(); setMainTab('calendar'); }} style={{ fontSize: 10, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all</button><span style={{ fontSize: 9, color: '#fff', transform: upcomingOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', display: 'inline-block' }}>▼</span></div>
          </div>
          {upcomingOpen && <div className="accordion-content" style={{ padding: '0 12px 10px' }}>{SCHEDULE_POSTS.slice(0, 5).map((p, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, marginBottom: 4, background: '#f8fafc', border: `1px solid ${C.border}` }}><div style={{ width: 3, height: 32, borderRadius: 2, background: p.color, flexShrink: 0 }} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{p.text}</div><div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>May {p.day}</div></div></div>))}</div>}
        </div>

        {/* Viral Ideas */}
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
          <div onClick={() => setViralIdeasOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', cursor: 'pointer', background: GREEN }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>💡 Viral Ideas</span>{viralIdeasSidebar.length > 0 && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 7, background: C.purpleLight, color: C.purple, fontWeight: 600 }}>{viralIdeasSidebar.length}</span>}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><button onClick={e => { e.stopPropagation(); setMainTab('ideas'); }} style={{ fontSize: 10, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all</button><span style={{ fontSize: 9, color: '#fff', transform: viralIdeasOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', display: 'inline-block' }}>▼</span></div>
          </div>
          {viralIdeasOpen && <div className="accordion-content" style={{ padding: '0 12px 10px' }}>{viralIdeasSidebar.length ? viralIdeasSidebar.map(idea => (<div key={idea.id} onClick={() => setMainTab('ideas')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, cursor: 'pointer', marginBottom: 3, background: '#f8fafc', border: `1px solid ${C.border}` }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, flexShrink: 0 }} /><div style={{ fontSize: 12, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idea.title}</div><span style={{ fontSize: 11, color: C.muted }}>›</span></div>)) : <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '4px 2px' }}>Run research to generate ideas</div>}</div>}
        </div>

        {/* Approved Queue */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div onClick={() => setApprovedOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', cursor: 'pointer', background: GREEN }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Approved Queue</span><span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 7, background: approvedQueue.length ? C.purpleLight : '#f1f5f9', color: approvedQueue.length ? C.purple : C.muted, fontWeight: 600 }}>{approvedQueue.length}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><button onClick={e => { e.stopPropagation(); setMainTab('ideas'); }} style={{ fontSize: 10, color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Manage</button><span style={{ fontSize: 9, color: '#fff', transform: approvedOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', display: 'inline-block' }}>▼</span></div>
          </div>
          {approvedOpen && <div className="accordion-content" style={{ padding: '0 12px 14px', flex: 1 }}>
            {approvedQueue.length === 0 && <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '4px 2px' }}>No approved posts yet</div>}
            {approvedQueue.slice(0, 5).map((item, i) => (<div key={item.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 10, marginBottom: 5, background: '#f8fafc', border: `1px solid ${C.border}`, borderLeft: `3px solid ${item.color || C.purple}` }}><span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon || '📝'}</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Approved post'}</div><div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.platform} · Approved</div></div></div>))}
            {approvedQueue.length > 5 && <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '4px 0' }}>+{approvedQueue.length - 5} more</div>}
            {approvedQueue.length > 0 && <button onClick={() => setMainTab('ideas')} style={{ width: '100%', marginTop: 8, padding: '8px 0', fontSize: 12, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer' }}>📥 Export & Publish</button>}
          </div>}
        </div>
      </div>
    </div>
  );
}
