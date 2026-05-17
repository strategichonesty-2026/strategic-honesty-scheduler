const express = require("express");
const { v4: uuid } = require("uuid");
const { db } = require("../db");
const { publishPost } = require("../scheduler");

const router = express.Router();

router.post("/", async (req, res) => {
  const { platform, userId, content, mediaUrl, mediaType, scheduledAt } = req.body;
  if (!platform || !userId || !content || !scheduledAt) return res.status(400).json({ error: "platform, userId, content, scheduledAt required" });
  if (!["linkedin", "youtube"].includes(platform)) return res.status(400).json({ error: "platform must be linkedin or youtube" });
  const scheduledMs = new Date(scheduledAt).getTime();
  if (isNaN(scheduledMs) || scheduledMs < Date.now()) return res.status(400).json({ error: "scheduledAt must be a future ISO datetime" });
  const token = await db.get("SELECT id FROM oauth_tokens WHERE platform = ? AND user_id = ?", [platform, userId]);
  if (!token) return res.status(403).json({ error: `No ${platform} connection found. Connect first.` });
  const id = uuid();
  await db.run("INSERT INTO scheduled_posts (id, platform, user_id, content, media_url, media_type, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, platform, userId, content, mediaUrl || null, mediaType || null, scheduledMs]);
  const post = await db.get("SELECT * FROM scheduled_posts WHERE id = ?", [id]);
  res.status(201).json({ success: true, post });
});

router.get("/", async (req, res) => {
  const { userId, platform, status } = req.query;
  let sql = "SELECT * FROM scheduled_posts WHERE 1=1";
  const params = [];
  if (userId) { sql += " AND user_id = ?"; params.push(userId); }
  if (platform) { sql += " AND platform = ?"; params.push(platform); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  sql += " ORDER BY scheduled_at ASC";
  const posts = await db.all(sql, params);
  res.json({ posts, count: posts.length });
});

router.get("/:id", async (req, res) => {
  const post = await db.get("SELECT * FROM scheduled_posts WHERE id = ?", [req.params.id]);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ post });
});

router.patch("/:id", async (req, res) => {
  const { content, scheduledAt } = req.body;
  const post = await db.get("SELECT * FROM scheduled_posts WHERE id = ?", [req.params.id]);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.status !== "pending") return res.status(400).json({ error: "Can only edit pending posts" });
  const updates = []; const params = [];
  if (content) { updates.push("content = ?"); params.push(content); }
  if (scheduledAt) { const ms = new Date(scheduledAt).getTime(); if (isNaN(ms) || ms < Date.now()) return res.status(400).json({ error: "Invalid future datetime" }); updates.push("scheduled_at = ?"); params.push(ms); }
  if (!updates.length) return res.status(400).json({ error: "Nothing to update" });
  updates.push("updated_at = ?"); params.push(Date.now(), req.params.id);
  await db.run(`UPDATE scheduled_posts SET ${updates.join(", ")} WHERE id = ?`, params);
  res.json({ success: true, post: await db.get("SELECT * FROM scheduled_posts WHERE id = ?", [req.params.id]) });
});

router.delete("/:id", async (req, res) => {
  const post = await db.get("SELECT * FROM scheduled_posts WHERE id = ?", [req.params.id]);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.status === "posted") return res.status(400).json({ error: "Cannot delete a posted post" });
  await db.run("DELETE FROM scheduled_posts WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

router.post("/:id/publish", async (req, res) => {
  const post = await db.get("SELECT * FROM scheduled_posts WHERE id = ?", [req.params.id]);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.status === "posted") return res.status(400).json({ error: "Already posted" });
  try { res.json({ success: true, result: await publishPost(post) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
