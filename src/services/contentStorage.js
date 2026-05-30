/**
 * contentStorage.js — Save/load generated content from Railway Postgres
 * Replaces localStorage for findings and ideas
 */

const API = import.meta.env.VITE_MEDIA_STUDIO_API ||
  'https://strategic-honesty-media-studio-production.up.railway.app';

export async function saveContent(type, items) {
  if (!items?.length) return;
  try {
    await fetch(`${API}/api/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, items }),
    });
  } catch (e) {
    console.warn('[contentStorage] save failed, falling back to localStorage', e.message);
    localStorage.setItem(`sh_ci_${type}`, JSON.stringify(items));
  }
}

export async function loadContent(type) {
  try {
    const res = await fetch(`${API}/api/content?type=${type}`);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    console.warn('[contentStorage] load failed, falling back to localStorage', e.message);
    try { return JSON.parse(localStorage.getItem(`sh_ci_${type}`) || '[]'); }
    catch { return []; }
  }
}

export async function runCleanup() {
  try {
    await fetch(`${API}/api/content/cleanup`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[contentStorage] cleanup failed', e.message);
  }
}
