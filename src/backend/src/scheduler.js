const cron = require("node-cron");
const { v4: uuid } = require("uuid");
const { db } = require("./db");
const linkedin = require("./services/linkedin");
const youtube = require("./services/youtube");

async function publishPost(post) {
  const tokenRow = await db.get("SELECT * FROM oauth_tokens WHERE platform = ? AND user_id = ?", [post.platform, post.user_id]);
  if (!tokenRow) throw new Error(`No token for ${post.platform}/${post.user_id}`);

  let result;
  if (post.platform === "linkedin") {
    const scopeParts = (tokenRow.scope || "").split("|");
    const authorUrn = scopeParts[1] || `urn:li:person:${post.user_id}`;
    result = await linkedin.postContent({ accessToken: tokenRow.access_token, authorUrn, text: post.content, mediaUrl: post.media_url, mediaType: post.media_type });
  }
  if (post.platform === "youtube") {
    const authClient = youtube.buildAuthClient(tokenRow);
    result = await youtube.postCommunityPost({ authClient, text: post.content });
  }

  await db.run("UPDATE scheduled_posts SET status = 'posted', post_id = ?, updated_at = ? WHERE id = ?", [result?.id || "posted", Date.now(), post.id]);
  await db.run("INSERT INTO post_log (id, post_id, platform, action, detail, logged_at) VALUES (?, ?, ?, ?, ?, ?)", [uuid(), post.id, post.platform, "posted", JSON.stringify(result), Date.now()]);
  console.log(`✅ Posted [${post.platform}] ${post.id}`);
  return result;
}

async function markFailed(post, error) {
  await db.run("UPDATE scheduled_posts SET status = 'failed', error = ?, updated_at = ? WHERE id = ?", [error.message, Date.now(), post.id]);
  console.error(`❌ Failed [${post.platform}] ${post.id}: ${error.message}`);
}

function startScheduler() {
  cron.schedule("* * * * *", async () => {
    const due = await db.all("SELECT * FROM scheduled_posts WHERE status = 'pending' AND scheduled_at <= ?", [Date.now() + 5000]);
    if (!due.length) return;
    for (const post of due) {
      await db.run("UPDATE scheduled_posts SET status = 'publishing', updated_at = ? WHERE id = ? AND status = 'pending'", [Date.now(), post.id]);
    }
    const locked = await db.all(`SELECT * FROM scheduled_posts WHERE status = 'publishing' AND id IN (${due.map(() => "?").join(",")})`, due.map(p => p.id));
    for (const post of locked) {
      try { await publishPost(post); } catch (err) { await markFailed(post, err); }
    }
  });
  console.log("⏰ Scheduler started");
}

module.exports = { startScheduler, publishPost };
