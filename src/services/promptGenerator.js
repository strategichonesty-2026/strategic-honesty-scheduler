/**
 * promptGenerator.js
 * Calls Claude API to generate image + video prompts from post text.
 * Keep this file under 150 lines.
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are a creative director for a leadership thought-leadership brand called Strategic Honesty.
Brand aesthetic: dark navy + gold, intellectual editorial, warm and mentor-toned.
Author voice: "Be Good. Do Good. Do Well."

When given a social media post, return ONLY a JSON object with exactly these keys:
{
  "imagePrompt": "A detailed image generation prompt (2-3 sentences, no people's faces, focus on symbolic/conceptual visuals)",
  "videoPrompt": "A detailed short-form video concept prompt (2-3 sentences, describes scene, motion, mood, text overlays)"
}

No preamble. No markdown. Pure JSON only.`;

/**
 * Generate image + video prompts from post text via Claude.
 * @param {string} postText - The social media post content
 * @param {string} platform - e.g. "tiktok", "linkedin"
 * @param {string} contentType - e.g. "short_video", "image_post"
 * @returns {Promise<{imagePrompt: string, videoPrompt: string}>}
 */
export async function generatePrompts(postText, platform, contentType) {
  const userMessage = `Platform: ${platform}
Content type: ${contentType}

Post text:
${postText}

Generate image and video prompts for this content.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-ipc": "true" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content?.find((b) => b.type === "text")?.text || "";

  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse Claude response as JSON: " + rawText.slice(0, 200));
  }
}

/**
 * Build a queue item payload from a scheduler post + generated prompts.
 * @param {object} post - Scheduler approved post object
 * @param {object} prompts - { imagePrompt, videoPrompt }
 * @returns {object} Queue item ready to POST to Media Studio
 */
export function buildQueueItem(post, prompts) {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: post.title || post.text?.slice(0, 60) + "...",
    platform: post.platform || "tiktok",
    contentType: post.contentType || "short_video",
    sourceText: post.text || post.content || "",
    imagePrompt: prompts.imagePrompt || "",
    videoPrompt: prompts.videoPrompt || "",
    status: "pending",
    createdAt: new Date().toISOString(),
    schedulerPostId: post.id || null,
  };
}
