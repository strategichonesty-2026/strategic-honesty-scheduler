// In-memory job store.
// Interface is DB-ready — swap Map for Postgres queries without changing routes.

const jobs = new Map();

function create({ type, prompt, settings, contentIdeaId, userId }) {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const job = {
    id,
    type,           // 'image' | 'video'
    status: "pending", // pending | running | complete | failed
    prompt,
    settings: settings || {},
    contentIdeaId: contentIdeaId || null,
    userId: userId || null,
    outputUrl: null,
    replicateId: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(id, job);
  return job;
}

function update(id, fields) {
  const job = jobs.get(id);
  if (!job) return null;
  const updated = { ...job, ...fields, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
}

function get(id) {
  return jobs.get(id) || null;
}

function listByUser(userId) {
  return [...jobs.values()]
    .filter((j) => j.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = { create, update, get, listByUser };
