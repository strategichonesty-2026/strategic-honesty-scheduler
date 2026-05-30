import { useState } from 'react';
import { C, GREEN, F, CONTENT_TYPES, CHAR_LIMITS, BUFFER_PLATFORMS, QUOTES, ROUTER_MAP } from '../constants';
import { downloadCSV, downloadScheduledCSV, computeScheduleDates } from '../utils';

// ─── Step components defined OUTSIDE render — no remounting on keystroke ─────

function StepBar({ wizardStep, setWizardStep }) {
  const STEPS = [{ n: 1, label: 'Write', icon: '✍️' }, { n: 2, label: 'Route', icon: '🗺' }, { n: 3, label: 'Review', icon: '👁' }, { n: 4, label: 'Send', icon: '🚀' }, { n: 5, label: 'Schedule', icon: '📅' }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px' }}>
      {STEPS.map((s, i) => {
        const done = wizardStep > s.n, active = wizardStep === s.n;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: done ? 'pointer' : 'default' }} onClick={() => { if (done) setWizardStep(s.n); }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, transition: 'all .2s', background: done ? GREEN : active ? C.navy : '#f0f0f0', color: done || active ? '#fff' : '#999', boxShadow: active ? `0 0 0 3px ${GREEN}33` : 'none' }}>{done ? '✓' : s.n}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 9, color: '#999', lineHeight: 1 }}>{s.icon}</span><span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? C.text : done ? GREEN : '#999' }}>{s.label}</span></div>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? GREEN : C.border, margin: '0 6px', borderRadius: 2, transition: 'background .3s' }} />}
          </div>
        );
      })}
    </div>
  );
}

function Step1({ wizardContent, setWizardContent, wizardImage, setWizardImage }) {
  const inputStyle = { width: '100%', border: `1px solid ${C.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: C.text, fontFamily: F, outline: 'none', resize: 'none', marginBottom: 10, background: '#fff', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: 'block', fontWeight: 500 };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>✍️ Write your post</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 13 }}>Paste AI-generated content or write from scratch.</div>
      <label style={labelStyle}>Post content</label>
      <textarea
        value={wizardContent}
        onChange={e => setWizardContent(e.target.value)}
        rows={8}
        style={{ ...inputStyle, fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}
        placeholder={'Share something that reflects your philosophy…\n\n"Be Good. Do Good. Do Well."'}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, marginBottom: 13 }}>
        <span style={{ fontSize: 11, color: C.muted }}>{wizardContent.length} characters</span>
        {wizardContent.length > 300 && <span style={{ fontSize: 11, color: '#d97706', fontWeight: 500 }}>⚠ Over Bluesky limit</span>}
      </div>
      <label style={labelStyle}>Image URL <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span></label>
      <input value={wizardImage} onChange={e => setWizardImage(e.target.value)} style={{ ...inputStyle, marginBottom: 13, resize: 'none' }} placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg" />
      {wizardImage && <img src={wizardImage} alt="" style={{ maxWidth: '100%', maxHeight: 130, borderRadius: 8, border: `1px solid ${C.border}`, objectFit: 'cover', marginBottom: 13 }} onError={e => { e.target.style.display = 'none'; }} />}
      <label style={labelStyle}>Quick fill from saved quotes</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Object.entries({ integrity: 'Integrity edge', reputation: 'Reputation', shortcuts: 'Shortcuts', nepal: 'Nepal roots', ai: 'AI & you', trust: 'Trust' }).map(([k, v]) =>
          <button key={k} onClick={() => setWizardContent(QUOTES[k] || '')} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 14, border: `1px solid ${C.border}`, background: '#f9f9f9', cursor: 'pointer', color: C.muted }}>{v}</button>
        )}
      </div>
    </div>
  );
}

function Step2({ wizardContent, wizardPostType, wizardSel, wizardSelectPostType, wizardToggleSel, CONNECTED_CHANNELS }) {
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: 'block', fontWeight: 500 };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>🗺 Route your content</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Pick a content type to auto-select platforms, then fine-tune.</div>
      <label style={labelStyle}>Content type</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {CONTENT_TYPES.map(ct => {
          const isActive = wizardPostType === ct.id;
          return (
            <button key={ct.id} onClick={() => wizardSelectPostType(ct.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${isActive ? GREEN : C.border}`, background: isActive ? C.greenLight : '#fafafa', minWidth: 100, transition: 'all .12s' }}>
              <span style={{ fontSize: 14, marginBottom: 2 }}>{ct.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? C.greenDark : C.text }}>{ct.label}</span>
              <span style={{ fontSize: 9, color: C.muted }}>{ct.desc}</span>
            </button>
          );
        })}
      </div>
      <label style={labelStyle}>Platforms</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(138px,1fr))', gap: 7 }}>
        {CONNECTED_CHANNELS.map(ch => {
          const sel = wizardSel.has(ch.id); const limit = CHAR_LIMITS[ch.id]; const isOver = limit && wizardContent.length > limit.limit;
          return (
            <div key={ch.id} onClick={() => wizardToggleSel(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all .12s', border: `1.5px solid ${isOver && limit?.hard ? '#fca5a5' : sel ? ch.color + '66' : C.border}`, background: isOver && limit?.hard && sel ? '#fef2f2' : sel ? ch.color + '0d' : '#fafafa' }}>
              <span style={{ fontSize: 14 }}>{ch.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: sel ? ch.color : C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                {limit && <div style={{ fontSize: 10, color: isOver ? '#dc2626' : '#aaa' }}>{wizardContent.length}/{limit.limit}</div>}
              </div>
              <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${sel ? ch.color : '#ccc'}`, background: sel ? ch.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {sel && <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
      {wizardSel.size === 0 && <div style={{ marginTop: 9, fontSize: 12, color: '#d97706', padding: '6px 10px', background: '#fffbeb', borderRadius: 7, border: '1px solid #fcd34d' }}>⚠ Select at least one platform</div>}
      {wizardSel.has('bs') && wizardContent.length > 300 && <div style={{ marginTop: 9, fontSize: 12, color: '#dc2626', padding: '6px 10px', background: '#fef2f2', borderRadius: 7, border: '1px solid #fca5a5' }}>🚫 Bluesky selected but post is {wizardContent.length} chars — over 300 hard limit</div>}
    </div>
  );
}

function Step3({ wizardContent, wizardSel, wizardSchedule, setWizardSchedule, wizardDate, setWizardDate, CONNECTED_CHANNELS, ALL_PLATFORMS, isLiConnected, bskyConnected }) {
  const inputStyle = { width: '100%', border: `1px solid ${C.border}`, borderRadius: 7, padding: '8px 10px', fontSize: 13, color: C.text, fontFamily: F, outline: 'none', resize: 'none', marginBottom: 10, background: '#fff', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 5, display: 'block', fontWeight: 500 };
  const schedOpts = [
    { id: 'now', label: 'Post now', icon: '⚡', desc: 'Publish immediately' },
    { id: '1week', label: 'In 1 week', icon: '📅', desc: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { id: '2weeks', label: 'In 2 weeks', icon: '📅', desc: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { id: 'scheduled', label: 'Pick date & time', icon: '🗓', desc: 'Choose exact moment' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 9 }}>👁 Platform previews</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...wizardSel].map(id => {
            const ch = CONNECTED_CHANNELS.find(c => c.id === id) || ALL_PLATFORMS.find(x => x.id === id); if (!ch) return null;
            const cfg = CHAR_LIMITS[id]; const len = wizardContent.length; const over = cfg && len > cfg.limit; const warn = cfg && len > cfg.warn && !over;
            const preview = wizardContent.length > 200 ? wizardContent.slice(0, 200) + '…' : wizardContent;
            return (
              <div key={id} style={{ border: `1px solid ${over ? '#fca5a5' : ch.color + '33'}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: ch.color + '12', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: `1px solid ${ch.color + '22'}` }}>
                  <span style={{ fontSize: 14 }}>{ch.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: ch.color }}>{ch.name}</span>
                  {cfg && <span style={{ marginLeft: 'auto', fontSize: 11, color: over ? '#dc2626' : warn ? '#d97706' : '#888', fontWeight: over || warn ? 600 : 400 }}>{len}/{cfg.limit}{over ? ' 🚫' : warn ? ' ⚠' : ' ✓'}</span>}
                </div>
                <div style={{ padding: 9 }}>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{preview || <span style={{ color: '#bbb', fontStyle: 'italic' }}>No content</span>}</div>
                  {over && cfg.hard && <div style={{ marginTop: 5, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>🚫 Must trim to {cfg.limit}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 9 }}>⏱ When to publish</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 13 }}>
          {schedOpts.map(opt => (
            <div key={opt.id} onClick={() => setWizardSchedule(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${wizardSchedule === opt.id ? GREEN : C.border}`, background: wizardSchedule === opt.id ? C.greenLight : '#fafafa', transition: 'all .12s' }}>
              <span style={{ fontSize: 15 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: wizardSchedule === opt.id ? C.greenDark : C.text }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{opt.desc}</div>
              </div>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${wizardSchedule === opt.id ? GREEN : '#ccc'}`, background: wizardSchedule === opt.id ? GREEN : 'transparent', flexShrink: 0 }} />
            </div>
          ))}
        </div>
        {wizardSchedule === 'scheduled' && (
          <div style={{ marginBottom: 13 }}>
            <label style={labelStyle}>Date & time (CST)</label>
            <input type="datetime-local" value={wizardDate} onChange={e => setWizardDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0, borderColor: !wizardDate ? '#fca5a5' : C.border }} />
            {!wizardDate && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>Required — pick a date</div>}
          </div>
        )}
        <div style={{ background: '#f8faff', border: '1px solid #e0eaff', borderRadius: 9, padding: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 7 }}>Pre-flight checklist</div>
          {[
            { ok: wizardContent.trim().length > 0, label: 'Content written' },
            { ok: wizardSel.size > 0, label: `${wizardSel.size} platform${wizardSel.size !== 1 ? 's' : ''} selected` },
            { ok: !(wizardSel.has('bs') && wizardContent.length > 300), label: 'Bluesky within 300 chars' },
            { ok: wizardSchedule !== 'scheduled' || !!wizardDate, label: 'Schedule date set' },
            { ok: !wizardSel.has('li') || isLiConnected, label: 'LinkedIn connected' },
            { ok: !wizardSel.has('bs') || bskyConnected, label: 'Bluesky connected' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}>{item.ok ? '✅' : '❌'}</span>
              <span style={{ fontSize: 12, color: item.ok ? C.text : '#dc2626' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ wizardPosting, wizardDone, wizardSel, wizardSendStatus, wizardSchedule, wizardDate, wizardContent, wizardImage, wizardSend, wizardReset, setWizardStep, setMainTab, CONNECTED_CHANNELS, ALL_PLATFORMS }) {
  const sColor = s => s === 'ok' ? '#16a34a' : s === 'err' ? '#dc2626' : s === 'warn' ? '#d97706' : s === 'sending' ? '#0A66C2' : s === 'csv' ? C.purple : '#999';
  const sBg = s => s === 'ok' ? '#dcfce7' : s === 'err' ? '#fee2e2' : s === 'warn' ? '#fef9c3' : s === 'sending' ? '#eff6ff' : s === 'csv' ? '#f5f3ff' : '#f3f4f6';
  const sIcon = s => s === 'ok' ? '✓' : s === 'err' ? '✗' : s === 'warn' ? '⚠' : s === 'sending' ? '…' : s === 'csv' ? '📥' : '·';
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      {!wizardPosting && !wizardDone && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 9 }}>🚀</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Ready to publish</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Posting to {wizardSel.size} platform{wizardSel.size !== 1 ? 's' : ''} · {wizardSchedule === 'now' ? 'immediately' : wizardSchedule === '1week' ? 'in 1 week' : wizardSchedule === '2weeks' ? 'in 2 weeks' : `on ${new Date(wizardDate || Date.now()).toLocaleDateString()}`}</div>
          <button onClick={wizardSend} style={{ padding: '10px 28px', background: GREEN, color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 8px ${GREEN}44` }}>⚡ Publish now</button>
        </div>
      )}
      {(wizardPosting || wizardDone) && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 13 }}>{wizardPosting ? '📡 Publishing…' : '🎉 Done!'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...wizardSel].map(id => {
              const ch = CONNECTED_CHANNELS.find(c => c.id === id) || ALL_PLATFORMS.find(x => x.id === id); if (!ch) return null;
              const st = wizardSendStatus[id] || { state: 'pending', msg: 'Waiting…' };
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: sBg(st.state) }}>
                  <span style={{ fontSize: 18 }}>{ch.icon}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{ch.name}</div><div style={{ fontSize: 12, color: sColor(st.state) }}>{st.msg}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {st.state === 'csv' && <button onClick={() => downloadCSV(id, wizardContent, wizardImage, wizardDate)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>📥 CSV</button>}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: sColor(st.state), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, animation: st.state === 'sending' ? 'spin 1s linear infinite' : 'none' }}>{sIcon(st.state)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {wizardDone && (
            <div style={{ marginTop: 16 }}>
              {[...wizardSel].some(id => BUFFER_PLATFORMS[id]) && (
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 9, padding: '10px 13px', marginBottom: 9 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 6 }}>📥 Buffer upload ready</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[...wizardSel].filter(id => BUFFER_PLATFORMS[id]).map(id => { const cfg = BUFFER_PLATFORMS[id]; return (<button key={id} onClick={() => downloadCSV(id, wizardContent, wizardImage, wizardDate)} style={{ padding: '5px 11px', fontSize: 12, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>{cfg.icon} {cfg.name} CSV</button>); })}
                    <a href="https://buffer.com" target="_blank" rel="noreferrer" style={{ padding: '5px 11px', fontSize: 12, fontWeight: 600, background: '#fff', color: C.purple, border: '1px solid #ddd6fe', borderRadius: 7, textDecoration: 'none' }}>Open Buffer →</a>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[...wizardSel].some(id => BUFFER_PLATFORMS[id]) && <button onClick={() => setWizardStep(5)} style={{ padding: '7px 16px', background: C.purple, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📅 Schedule →</button>}
                <button onClick={wizardReset} style={{ padding: '7px 16px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✦ New post</button>
                <button onClick={() => setMainTab('calendar')} style={{ padding: '7px 16px', background: '#fff', color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>📅 Calendar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Step5({ wizardSel, wizardContent, wizardImage, schedTimes, setSchedTimes, schedPattern, setSchedPattern, schedStart, setSchedStart }) {
  const bufPl = [...wizardSel].filter(id => BUFFER_PLATFORMS[id]);
  const PATTERNS = [{ id: 'once', label: 'Post once', detail: 'One post on start date' }, { id: 'weekly4', label: 'Weekly × 4', detail: 'Same day each week' }, { id: 'biweekly4', label: 'Bi-weekly × 4', detail: 'Every 2 weeks' }, { id: 'monthly3', label: 'Monthly × 3', detail: 'Same date each month' }];
  const previewDates = () => { if (!schedStart) return []; try { return computeScheduleDates(schedPattern, schedStart); } catch { return []; } };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>📅 Schedule Posts</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Great content deserves the right timing. Be Good. Do Good. Do Well.</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posting time per platform (CST)</div>
        {bufPl.length === 0 && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>No Buffer platforms selected.</div>}
        {bufPl.map(id => { const cfg = BUFFER_PLATFORMS[id]; return (<div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: '#fafafa', marginBottom: 6 }}><span style={{ fontSize: 17 }}>{cfg.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cfg.name}</div><div style={{ fontSize: 11, color: C.muted }}>Default: {cfg.time} CST</div></div><input type="time" value={schedTimes[id] || cfg.time} onChange={e => setSchedTimes(prev => ({ ...prev, [id]: e.target.value }))} style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, fontWeight: 600, color: cfg.color, cursor: 'pointer' }} /></div>); })}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start date</div>
        <input type="date" value={schedStart} min={new Date().toISOString().split('T')[0]} onChange={e => setSchedStart(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, cursor: 'pointer' }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PATTERNS.map(p => <button key={p.id} onClick={() => setSchedPattern(p.id)} style={{ padding: '8px 12px', border: `2px solid ${schedPattern === p.id ? C.purple : C.border}`, borderRadius: 8, background: schedPattern === p.id ? C.purpleLight : '#fff', cursor: 'pointer', textAlign: 'left' }}><div style={{ fontSize: 12, fontWeight: 600, color: schedPattern === p.id ? C.purple : C.text }}>{p.label}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{p.detail}</div></button>)}
        </div>
      </div>
      {schedStart && (
        <div style={{ background: C.purpleLight, border: '1px solid #ddd6fe', borderRadius: 9, padding: '10px 13px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 6 }}>📋 Scheduled dates</div>
          {previewDates().map((d, i) => <div key={i} style={{ fontSize: 12, color: '#4c1d95', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}><span style={{ background: C.purple, color: '#fff', borderRadius: 3, padding: '0 5px', fontWeight: 700, fontSize: 11 }}>#{i + 1}</span>{d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>)}
        </div>
      )}
      {bufPl.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.label, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Download CSVs</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {bufPl.map(id => { const cfg = BUFFER_PLATFORMS[id]; return (<button key={id} onClick={() => downloadScheduledCSV(id, wizardContent, wizardImage, schedTimes, schedPattern, schedStart)} disabled={!schedStart} style={{ padding: '6px 13px', fontSize: 12, fontWeight: 600, background: C.purple, color: '#fff', border: 'none', borderRadius: 7, cursor: schedStart ? 'pointer' : 'not-allowed', opacity: schedStart ? 1 : 0.5 }}>{cfg.icon} {cfg.name} ({previewDates().length} row{previewDates().length !== 1 ? 's' : ''})</button>); })}
          </div>
          <div style={{ fontSize: 11, color: '#6d28d9', marginTop: 7 }}>Go to Buffer → Channel → Settings → Bulk Upload.</div>
        </div>
      )}
    </div>
  );
}

// ─── Main WizardPanel ─────────────────────────────────────────────────────────
export default function WizardPanel({
  wizardStep, setWizardStep,
  wizardContent, setWizardContent,
  wizardImage, setWizardImage,
  wizardSchedule, setWizardSchedule,
  wizardDate, setWizardDate,
  wizardPostType, setWizardPostType,
  wizardSel, setWizardSel,
  wizardSendStatus,
  wizardPosting, wizardDone,
  schedTimes, setSchedTimes,
  schedPattern, setSchedPattern,
  schedStart, setSchedStart,
  wizardReset, wizardSend,
  setMainTab,
  CONNECTED_CHANNELS, ALL_PLATFORMS,
  isLiConnected, bskyConnected,
}) {
  function wizardSelectPostType(typeId) {
    setWizardPostType(typeId);
    const r = ROUTER_MAP[typeId] || [];
    const av = new Set(CONNECTED_CHANNELS.map(c => c.id));
    const nx = new Set(r.filter(id => av.has(id)));
    if (r.includes('bs') && bskyConnected) nx.add('bs');
    setWizardSel(nx.size > 0 ? nx : new Set(r));
  }

  function wizardToggleSel(id) {
    setWizardSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function wizardCanAdvance(step) {
    if (step === 1) return wizardContent.trim().length > 0;
    if (step === 2) return wizardSel.size > 0;
    if (step === 3) {
      if (wizardSel.has('bs') && wizardContent.length > 300) return false;
      if (wizardSchedule === 'scheduled' && !wizardDate) return false;
      return true;
    }
    return true;
  }

  const canAdvance = wizardCanAdvance(wizardStep);

  return (
    <div>
      <StepBar wizardStep={wizardStep} setWizardStep={setWizardStep} />

      {wizardStep === 1 && (
        <Step1
          wizardContent={wizardContent}
          setWizardContent={setWizardContent}
          wizardImage={wizardImage}
          setWizardImage={setWizardImage}
        />
      )}
      {wizardStep === 2 && (
        <Step2
          wizardContent={wizardContent}
          wizardPostType={wizardPostType}
          wizardSel={wizardSel}
          wizardSelectPostType={wizardSelectPostType}
          wizardToggleSel={wizardToggleSel}
          CONNECTED_CHANNELS={CONNECTED_CHANNELS}
        />
      )}
      {wizardStep === 3 && (
        <Step3
          wizardContent={wizardContent}
          wizardSel={wizardSel}
          wizardSchedule={wizardSchedule}
          setWizardSchedule={setWizardSchedule}
          wizardDate={wizardDate}
          setWizardDate={setWizardDate}
          CONNECTED_CHANNELS={CONNECTED_CHANNELS}
          ALL_PLATFORMS={ALL_PLATFORMS}
          isLiConnected={isLiConnected}
          bskyConnected={bskyConnected}
        />
      )}
      {wizardStep === 4 && (
        <Step4
          wizardPosting={wizardPosting}
          wizardDone={wizardDone}
          wizardSel={wizardSel}
          wizardSendStatus={wizardSendStatus}
          wizardSchedule={wizardSchedule}
          wizardDate={wizardDate}
          wizardContent={wizardContent}
          wizardImage={wizardImage}
          wizardSend={wizardSend}
          wizardReset={wizardReset}
          setWizardStep={setWizardStep}
          setMainTab={setMainTab}
          CONNECTED_CHANNELS={CONNECTED_CHANNELS}
          ALL_PLATFORMS={ALL_PLATFORMS}
        />
      )}
      {wizardStep === 5 && (
        <Step5
          wizardSel={wizardSel}
          wizardContent={wizardContent}
          wizardImage={wizardImage}
          schedTimes={schedTimes}
          setSchedTimes={setSchedTimes}
          schedPattern={schedPattern}
          setSchedPattern={setSchedPattern}
          schedStart={schedStart}
          setSchedStart={setSchedStart}
        />
      )}

      {!(wizardStep === 4 && (wizardPosting || wizardDone)) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }}>
          <button onClick={() => setWizardStep(s => Math.max(1, s - 1))} disabled={wizardStep === 1} style={{ padding: '7px 16px', fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 8, background: '#fff', cursor: wizardStep === 1 ? 'not-allowed' : 'pointer', color: wizardStep === 1 ? '#ccc' : C.label, opacity: wizardStep === 1 ? 0.5 : 1 }}>← Back</button>
          <div style={{ fontSize: 11, color: C.muted }}>Step {wizardStep} of 5</div>
          {wizardStep < 4
            ? <button onClick={() => { if (canAdvance) setWizardStep(s => Math.min(5, s + 1)); }} disabled={!canAdvance} style={{ padding: '7px 18px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, background: canAdvance ? C.navy : '#e0e0e0', color: canAdvance ? '#fff' : '#999', cursor: canAdvance ? 'pointer' : 'not-allowed', transition: 'all .15s' }}>Next →</button>
            : wizardStep === 4 ? (!wizardPosting && !wizardDone && <button onClick={wizardSend} style={{ padding: '7px 18px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, background: GREEN, color: '#fff', cursor: 'pointer' }}>⚡ Publish</button>) : null
          }
        </div>
      )}
    </div>
  );
}
