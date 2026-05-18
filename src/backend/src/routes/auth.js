const express = require("express");
const { v4: uuid } = require("uuid");
const { db } = require("../db");
const linkedin = require("../services/linkedin");
const youtube = require("../services/youtube");

const router = express.Router();

async function upsertToken(platform, userId, tokenData) {
  const existing = await db.get("SELECT id FROM oauth_tokens WHERE platform = ? AND user_id = ?", [platform, userId]);
  if (existing) {
    await db.run("UPDATE oauth_tokens SET access_token = ?, refresh_token = COALESCE(?, refresh_token), expires_at = ?, scope = ?, raw = ?, updated_at = ? WHERE platform = ? AND user_id = ?", [tokenData.access_token, tokenData.refresh_token || null, tokenData.expires_at || null, tokenData.scope || null, tokenData.raw, Date.now(), platform, userId]);
  } else {
    await db.run("INSERT INTO oauth_tokens (id, platform, user_id, access_token, refresh_token, expires_at, scope, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [uuid(), platform, userId, tokenData.access_token, tokenData.refresh_token || null, tokenData.expires_at || null, tokenData.scope || null, tokenData.raw]);
  }
}

router.get("/linkedin/connect", (req, res) => {
  const userId = req.query.userId || "default";
  const state = uuid();
  // Store state in DB instead of memory
  db.run("INSERT INTO post_log (id, post_id, platform, action, detail, logged_at) VALUES (?, ?, ?, ?, ?, ?)",
    [state, userId, 'linkedin', 'oauth_state', userId, Date.now()]);
  res.redirect(linkedin.getAuthUrl(state));
});

router.get("/linkedin/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${process.env.FRONTEND_URL}?auth=error&platform=linkedin&reason=${error}`);
  // Look up state from DB
  const stateRow = await db.get("SELECT * FROM post_log WHERE id = ? AND action = 'oauth_state'", [state]);
  if (!stateRow) return res.redirect(`${process.env.FRONTEND_URL}?auth=error&platform=linkedin&reason=invalid_state`);
  await db.run("DELETE FROM post_log WHERE id = ?", [state]);
  try {
    const tokens = await linkedin.exchangeCode(code);
    const profile = await linkedin.getProfile(tokens.access_token);
    await upsertToken("linkedin", profile.sub, { ...tokens, scope: `${tokens.scope}|urn:li:person:${profile.sub}` });
    const redirectUrl = `${process.env.FRONTEND_URL}?auth=success&platform=linkedin&userId=${profile.sub}&name=${encodeURIComponent(profile.name)}`;
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${redirectUrl}"><title>Redirecting...</title></head><body><p>LinkedIn connected! <a href="${redirectUrl}">Click here if not redirected</a></p></body></html>`);
  } catch (err) {
    console.error("LinkedIn callback error:", err.message);
    res.redirect(`${process.env.FRONTEND_URL}?auth=error&platform=linkedin&reason=token_exchange_failed`);
  }
});

router.get("/youtube/connect", (req, res) => {
  const userId = req.query.userId || "default";
  const state = uuid();
  db.run("INSERT INTO post_log (id, post_id, platform, action, detail, logged_at) VALUES (?, ?, ?, ?, ?, ?)",
    [state, userId, 'youtube', 'oauth_state', userId, Date.now()]);
  res.redirect(youtube.getAuthUrl(state));
});

router.get("/youtube/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${process.env.FRONTEND_URL}?auth=error&platform=youtube&reason=${error}`);
  const stateRow = await db.get("SELECT * FROM post_log WHERE id = ? AND action = 'oauth_state'", [state]);
  if (!stateRow) return res.redirect(`${process.env.FRONTEND_URL}?auth=error&platform=youtube&reason=invalid_state`);
  const storedUserId = stateRow.post_id;
  await db.run("DELETE FROM post_log WHERE id = ?", [state]);
  try {
    const tokens = await youtube.exchangeCode(code);
    const authClient = youtube.buildAuthClient({ raw: tokens.raw });
    const channelInfo = await youtube.getChannelInfo(authClient);
    const userId = channelInfo?.id || storedUserId;
    await upsertToken("youtube", userId, tokens);
    const redirectUrl = `${process.env.FRONTEND_URL}?auth=success&platform=youtube&userId=${userId}&name=${encodeURIComponent(channelInfo?.title || "YouTube Channel")}`;
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${redirectUrl}"><title>Redirecting...</title></head><body><p>YouTube connected! <a href="${redirectUrl}">Click here if not redirected</a></p></body></html>`);
  } catch (err) {
    console.error("YouTube callback error:", err.message);
    res.redirect(`${process.env.FRONTEND_URL}?auth=error&platform=youtube&reason=${encodeURIComponent(err.message)}`);
  }
});

router.get("/status", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const tokens = await db.all("SELECT platform, expires_at, updated_at FROM oauth_tokens WHERE user_id = ?", [userId]);
  const status = {};
  for (const t of tokens) status[t.platform] = { connected: true, expiresAt: t.expires_at, isExpired: t.expires_at ? Date.now() > t.expires_at : false };
  res.json({ userId, connections: status });
});

router.delete("/disconnect", async (req, res) => {
  const { userId, platform } = req.body;
  if (!userId || !platform) return res.status(400).json({ error: "userId and platform required" });
  await db.run("DELETE FROM oauth_tokens WHERE user_id = ? AND platform = ?", [userId, platform]);
  res.json({ success: true });
});

module.exports = router;
