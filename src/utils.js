import { BUFFER_PLATFORMS, BRAND_SYSTEM } from './constants';

export function getUserId() {
  let id = localStorage.getItem('sh_user_id');
  if (!id) { id = 'user_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('sh_user_id', id); }
  return id;
}

export async function bskyCreateSession(identifier, appPassword) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password: appPassword })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Login failed'); }
  return res.json();
}

export async function bskyPost(accessJwt, did, text) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessJwt}` },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.feed.post', record: { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString() } })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Post failed'); }
  return res.json();
}

export function computeScheduleDates(pattern, startDate) {
  const base = new Date(startDate);
  if (pattern === 'once') return [new Date(base)];
  if (pattern === 'weekly4') return Array.from({ length: 4 }, (_, i) => new Date(base.getTime() + i * 7 * 24 * 60 * 60 * 1000));
  if (pattern === 'biweekly4') return Array.from({ length: 4 }, (_, i) => new Date(base.getTime() + i * 14 * 24 * 60 * 60 * 1000));
  if (pattern === 'monthly3') return Array.from({ length: 3 }, (_, i) => { const d = new Date(base); d.setMonth(d.getMonth() + i); return d; });
  return [new Date(base)];
}

export function generateScheduledCSV(platformId, content, imageUrl, schedTimes, schedPattern, schedStart) {
  const cfg = BUFFER_PLATFORMS[platformId]; if (!cfg) return null;
  const timeStr = schedTimes[platformId] || cfg.time;
  const dates = computeScheduleDates(schedPattern, schedStart);
  const escape = v => `"${(v || '').replace(/"/g, '""')}"`;
  const header = 'Text,Image URL,Tags,Posting Time';
  const rows = dates.map(d => { const ymd = d.toISOString().split('T')[0]; return [escape(content), escape(imageUrl || ''), '""', escape(`${ymd} ${timeStr}`)].join(','); });
  return `${header}\n${rows.join('\n')}`;
}

export function downloadScheduledCSV(platformId, content, imageUrl, schedTimes, schedPattern, schedStart) {
  const cfg = BUFFER_PLATFORMS[platformId]; if (!cfg) return;
  const csv = generateScheduledCSV(platformId, content, imageUrl, schedTimes, schedPattern, schedStart);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
  a.download = `Buffer_${cfg.name}_${schedPattern}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export function downloadCSV(platformId, content, imageUrl, scheduleDate) {
  const cfg = BUFFER_PLATFORMS[platformId]; if (!cfg) return;
  const escape = v => `"${(v || '').replace(/"/g, '""')}"`;
  const postingDate = scheduleDate ? scheduleDate.split('T')[0] : new Date().toISOString().split('T')[0];
  const csv = `Text,Image URL,Tags,Posting Time\n${[escape(content), escape(imageUrl || ''), '""', escape(`${postingDate} ${cfg.time}`)].join(',')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
  a.download = `Buffer_${cfg.name}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export async function ciCallClaude(prompt, onChunk, maxTokens = 1100) {
  const res = await fetch('https://sh-claude-proxy.strategichonesty.workers.dev/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      stream: false,
      system: BRAND_SYSTEM,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  if (onChunk) onChunk(text);
  return text;
}

export const logColor = t => t === 'ok' ? '#16a34a' : t === 'err' ? '#dc2626' : t === 'warn' ? '#d97706' : '#185fa5';
export const statusDot = s => ({ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: s === 'active' ? '#22c55e' : s === 'warning' ? '#f59e0b' : '#ef4444' });
